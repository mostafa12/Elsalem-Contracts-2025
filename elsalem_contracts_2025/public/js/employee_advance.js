frappe.ui.form.on("Employee Advance", {
    refresh: function (frm) {
        frm.set_query("employee", function () {
            return {
                filters: {
                    status: "Active",
                    allow_employee_advance: 1
                }
            }
        });
    },

    employee: function (frm) {
        frappe.call({
            method: "elsalem_contracts_2025.elsalem_contracts_2025.overrides.employee_advance.get_employee_advance_balance",
            args: {
                employee: frm.doc.employee,
                posting_date: frm.doc.posting_date,
                company: frm.doc.company
            },
            callback: function (r) {
                frm.set_value("custom_party_balance", r.message);
            }
        });
    }
});