// Copyright (c) 2025, elsalem and contributors
// For license information, please see license.txt

frappe.ui.form.on('Custom Expense Claim', {
    refresh: function (frm) {
        // Add custom button to view Journal Entry if it exists
        if (frm.doc.journal_entry && frm.doc.docstatus === 1) {
            frm.add_custom_button(__('View Journal Entry'), function () {
                frappe.set_route('Form', 'Journal Entry', frm.doc.journal_entry);
            });
        }

        // Set company default if not set
        if (!frm.doc.company && frappe.defaults.get_user_default('Company')) {
            frm.set_value('company', frappe.defaults.get_user_default('Company'));
        }

        // Apply filters
        set_filters(frm);

        frm.ignore_doctypes_on_cancel_all = [
            "Journal Entry"
        ];
    },

    company: function (frm) {
        // Update filters when company changes
        set_filters(frm);
    },

    employee: function (frm) {
        // When employee changes, set default party only for new rows if they're empty
        if (frm.doc.employee && frm.doc.accounting_entries) {
            frm.doc.accounting_entries.forEach(function (row) {
                // Only set if party is not already set
                if (!row.party) {
                    frappe.model.set_value(row.doctype, row.name, 'party_type', 'Employee');
                    frappe.model.set_value(row.doctype, row.name, 'party', frm.doc.employee);
                }
            });
        }
    },

    before_save: function (frm) {
        // Calculate total before saving
        calculate_total(frm);
    }
});

frappe.ui.form.on('Custom Expense Accounting Entry', {
    accounting_entries_add: function (frm, cdt, cdn) {
        // Set default party type and party when new row is added (only if employee exists)
        let row = locals[cdt][cdn];
        if (frm.doc.employee && !row.party) {
            frappe.model.set_value(cdt, cdn, 'party_type', 'Employee');
            frappe.model.set_value(cdt, cdn, 'party', frm.doc.employee);
        }

        // Set default cost center if available
        if (frm.doc.cost_center && !row.cost_center) {
            frappe.model.set_value(cdt, cdn, 'cost_center', frm.doc.cost_center);
        }

        // Apply filters to the new row
        set_child_filters(frm, cdt, cdn);
    },

    debit: function (frm) {
        // Recalculate total when debit amount changes
        calculate_total(frm);
    },

    accounting_entries_remove: function (frm) {
        // Recalculate total when row is removed
        calculate_total(frm);
    }
});

function set_filters(frm) {
    // Filter Cost Center by company
    if (frm.doc.company) {
        frm.set_query('cost_center', function () {
            return {
                filters: {
                    'company': frm.doc.company,
                    'is_group': 0
                }
            };
        });

        // Filter Payable Account by company
        frm.set_query('payable_account', function () {
            return {
                filters: {
                    'company': frm.doc.company,
                    'account_type': ['in', ['Payable', 'Creditors', 'Receivable']]
                }
            };
        });
    }

    // Set filters for child table
    if (frm.fields_dict.accounting_entries && frm.fields_dict.accounting_entries.grid) {
        frm.fields_dict.accounting_entries.grid.get_field('account').get_query = function (doc, cdt, cdn) {
            return {
                filters: {
                    'company': frm.doc.company,
                    'is_group': 0
                }
            };
        };

        frm.fields_dict.accounting_entries.grid.get_field('cost_center').get_query = function (doc, cdt, cdn) {
            return {
                filters: {
                    'company': frm.doc.company,
                    'is_group': 0
                }
            };
        };

        frm.fields_dict.accounting_entries.grid.get_field('project').get_query = function (doc, cdt, cdn) {
            return {
                filters: {
                    'company': frm.doc.company
                }
            };
        };
    }

    // Refresh grid to apply filters
    if (frm.fields_dict.accounting_entries) {
        frm.fields_dict.accounting_entries.grid.refresh();
    }
}

function set_child_filters(frm, cdt, cdn) {
    // This function is called when a new row is added
    // Filters are already set globally via set_filters()
    // But we can refresh the specific row if needed
    if (frm.fields_dict.accounting_entries) {
        frm.fields_dict.accounting_entries.grid.refresh();
    }
}

function calculate_total(frm) {
    let total = 0;
    frm.doc.accounting_entries.forEach(function (row) {
        total += flt(row.debit);
    });
    frm.set_value('total_debit_amount', total);
}
