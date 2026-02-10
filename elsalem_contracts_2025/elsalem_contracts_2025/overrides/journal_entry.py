def before_cancel(self, method):
    self.ignore_linked_doctypes = (
        "GL Entry",
        "Stock Ledger Entry",
        "Payment Ledger Entry",
        "Repost Payment Ledger",
        "Repost Payment Ledger Items",
        "Repost Accounting Ledger",
        "Repost Accounting Ledger Items",
        "Unreconcile Payment",
        "Unreconcile Payment Entries",
        "Advance Payment Ledger Entry",
        "Tax Withholding Entry",
        "Custom Expense Claim",
    )


def on_cancel(self, method):
    """Ensure Custom Expense Claim stays in ignore_linked_doctypes after ERPNext's on_cancel overwrites it."""
    if self.ignore_linked_doctypes is not None:
        if "Custom Expense Claim" not in self.ignore_linked_doctypes:
            self.ignore_linked_doctypes = list(self.ignore_linked_doctypes) + ["Custom Expense Claim"]
    else:
        self.ignore_linked_doctypes = ["Custom Expense Claim"]