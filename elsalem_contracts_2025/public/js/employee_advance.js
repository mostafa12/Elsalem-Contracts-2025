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

        if (!frm.is_new()) {
            frm.trigger('make_dashboard');
        }
    },

    make_dashboard: function (frm) {
        if (frm.is_new()) {
            return;
        }

        frappe.call({
            method:
                'elsalem_contracts_2025.elsalem_contracts_2025.doctype.custom_expense_claim.custom_expense_claim.get_total_debit_for_employee_advance',
            args: {
                employee_advance: frm.doc.name,
            },
            callback: function (r) {
                if (!frm.doc || frm.is_new()) {
                    return;
                }
                console.log(r)
                const m = r.message || {};
                const currency = frm.doc.currency;
                render_debit_dashboard_section(
                    frm,
                    currency,
                    flt(m.total),
                );
            },
        });
    },

    employee: function (frm) {
        frappe.call({
            method: "elsalem_contracts_2025.elsalem_contracts_2025.overrides.employee_advance.get_employee_advance_balance",
            args: {
                employee: frm.doc.employee,
                posting_date: frm.doc.posting_date,
                company: frm.doc.company,
                advance_account: frm.doc.advance_account
            },
            callback: function (r) {
                frm.set_value("custom_party_balance", r.message);
            }
        });
    }
});


function render_debit_dashboard_section(frm, currency, total) {
    const section = frm.dashboard.add_section('', __('Expense Claim Summary'));
    const rows = $('<div></div>').appendTo(section);

    $(`<div class="row" style="margin-bottom: 10px;">
		<div class="col-sm-8 small"><strong>${__('Total Expense Claims')}</strong></div>
		<div class="col-sm-4 small text-right"><strong>${format_currency(total, currency)}</strong></div>
	</div>`).appendTo(rows);

    frm.dashboard.show();
}