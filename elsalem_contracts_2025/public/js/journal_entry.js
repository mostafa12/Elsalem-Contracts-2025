frappe.ui.form.on("Journal Entry", {
    refresh: function (frm) {
        frm.ignore_doctypes_on_cancel_all = [
            "Custom Expense Claim"
        ];
    }
});