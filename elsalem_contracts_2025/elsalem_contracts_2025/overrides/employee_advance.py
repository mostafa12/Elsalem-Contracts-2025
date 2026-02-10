import frappe
from frappe.utils import flt
from frappe import _

from erpnext.accounts.utils import get_balance_on


def validate(doc, method):
    set_employee_advance_balance(doc)
    validate_advance_amount(doc)


def set_employee_advance_balance(doc):
    doc.custom_party_balance = get_employee_advance_balance(doc.employee, doc.posting_date, doc.company, doc.advance_account)


def validate_advance_amount(doc):
    # Advance Amount" <= "Custodies Limit" - "Party Balance" 
    custodies_limit = frappe.db.get_value("Employee", doc.employee, "custodies_limit")
    available_balance = custodies_limit - doc.custom_party_balance
    if doc.advance_amount > available_balance:
        frappe.throw(_(f"Advance amount cannot be greater than available balance: {available_balance}"))


@frappe.whitelist()
def get_employee_advance_balance(employee, posting_date, company, advance_account=None):
    # Balance = SUM(Employee Advance.advance_amount) - SUM(Custom Expense Claim.total_debit_amount)
    # advance_rows = frappe.db.sql(
    #     """
    #     SELECT SUM(advance_amount) as total
    #     FROM `tabEmployee Advance`
    #     WHERE employee = %s AND posting_date <= %s AND company = %s AND docstatus = 1
    #     """,
    #     (employee, posting_date, company),
    #     as_dict=True,
    # )
    # expense_rows = frappe.db.sql(
    #     """
    #     SELECT SUM(total_debit_amount) as total
    #     FROM `tabCustom Expense Claim`
    #     WHERE employee = %s AND posting_date <= %s AND company = %s AND docstatus = 1
    #     """,
    #     (employee, posting_date, company),
    #     as_dict=True,
    # )
    # advance_total = flt(advance_rows[0].get("total")) if advance_rows else 0
    # expense_total = flt(expense_rows[0].get("total")) if expense_rows else 0
    # return advance_total - expense_total

    return get_balance_on(
        party_type="Employee",
        party=employee,
        date=posting_date,
        company=company,
        account=advance_account,
        # start_date=posting_date
    )