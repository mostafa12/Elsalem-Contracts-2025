# Copyright (c) 2025, elsalem and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import flt, nowdate

from elsalem_contracts_2025.elsalem_contracts_2025.overrides.employee_advance import get_employee_advance_balance


class CustomExpenseClaim(Document):
	def validate(self):
		"""Validate the document before saving"""
		self.set_party_details()
		self.calculate_total_debit_amount()
		self.validate_debit_amounts()
	
	def set_party_details(self):
		"""Set default party type and party in child table rows if not already set"""
		# Don't force Employee if user has selected a different party type
		for entry in self.accounting_entries:
			# Only set default if party is not set
			if not entry.party_type and self.employee:
				entry.party_type = "Employee"
			if not entry.party and self.employee and entry.party_type == "Employee":
				entry.party = self.employee
	
	def calculate_total_debit_amount(self):
		"""Calculate total debit amount from accounting entries"""
		total = 0
		for entry in self.accounting_entries:
			total += flt(entry.debit)
		self.total_debit_amount = total
	
	def validate_debit_amounts(self):
		"""Validate that all debit amounts are greater than 0"""
		for entry in self.accounting_entries:
			if flt(entry.debit) <= 0:
				frappe.throw(_("Row #{0}: Debit amount must be greater than 0").format(entry.idx))

	def check_employee_advance_balance(self):
		employee_balance = get_employee_advance_balance(self.employee, self.posting_date, self.company)
		allow_over_balance_limit = frappe.db.get_value("Employee", self.employee, "allow_over_balance_limit")

		if flt(self.total_debit_amount) > flt(employee_balance) and not allow_over_balance_limit:
			frappe.throw(_(f"Total debit amount cannot be greater than employee balance: {employee_balance}"))

	def before_submit(self):
		self.check_employee_advance_balance()
	
	def on_submit(self):
		"""Create Journal Entry on submit"""
		self.create_journal_entry()
	
	def on_cancel(self):
		"""Cancel and delete linked Journal Entry on cancellation"""
		self.ignore_linked_doctypes = ("Journal Entry")
		journal_entry = self.journal_entry
		self.db_set("journal_entry", None)
		self.reload()

		if journal_entry:
			je = frappe.get_doc("Journal Entry", journal_entry)
			if je.docstatus == 1:
				je.cancel()
			else:
				je.delete()
	
	def create_journal_entry(self):
		"""Create Journal Entry with debit entries from child table and credit to payable account"""
		if self.journal_entry:
			frappe.throw(_("Journal Entry already created for this document"))
		
		if not self.payable_account:
			frappe.throw(_("Payable Account is mandatory"))
		
		# Create Journal Entry
		je = frappe.new_doc("Journal Entry")
		je.voucher_type = "Journal Entry"
		je.posting_date = self.posting_date or nowdate()
		je.company = self.company
		je.user_remark = self.remarks or f"Against Custom Expense Claim {self.name}"
		
		# Add debit entries from accounting_entries child table
		for entry in self.accounting_entries:
			je_row = {
				"account": entry.account,
				"debit_in_account_currency": flt(entry.debit),
				"debit": flt(entry.debit),
				"cost_center": entry.cost_center or self.cost_center,
				"project": entry.project,
				"user_remark": entry.user_remark
			}
			# Only add party if party_type is set
			if entry.party_type:
				je_row["party_type"] = entry.party_type
				je_row["party"] = entry.party

			if entry.purchase_invoice and entry.party_type == "Supplier":
				je_row["reference_type"] = "Purchase Invoice"
				je_row["reference_name"] = entry.purchase_invoice

			je.append("accounts", je_row)
		
		# Add credit entry to payable account
		je.append("accounts", {
			"account": self.payable_account,
			"credit_in_account_currency": flt(self.total_debit_amount),
			"credit": flt(self.total_debit_amount),
			"party_type": "Employee",
			"party": self.employee,
			"cost_center": self.cost_center,
			"user_remark": f"Expense claim {self.name}"
		})
		
		# Save Journal Entry as draft (do not submit)
		je.flags.ignore_permissions = True
		je.insert()
		
		# Link Journal Entry to this document
		self.db_set("journal_entry", je.name)
		
		frappe.msgprint(_("Journal Entry {0} created successfully (Draft)").format(
			f'<a href="/app/journal-entry/{je.name}">{je.name}</a>'
		))
