# Copyright (c) 2025, hossam and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class FinishingContractSellingItem(Document):
	def before_save(self):
		"""Calculate amount before saving"""
		if self.qty and self.rate:
			self.amount = self.qty * self.rate
