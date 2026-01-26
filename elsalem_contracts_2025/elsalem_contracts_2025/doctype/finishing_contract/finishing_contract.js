frappe.ui.form.on('Finishing Contract', {
    refresh: function (frm) {
        // Only show button after submit
        if (frm.doc.docstatus === 1) {
            // Check if this is a supervision or supply & supervision contract
            const is_supervision_contract = frm.doc.custom_contract_type &&
                (frm.doc.custom_contract_type === 'عقد إشراف' ||
                    frm.doc.custom_contract_type === 'عقد توريد واشراف');

            // Check if selling items exist
            const has_selling_items = frm.doc.custom_selling_items && frm.doc.custom_selling_items.length > 0;

            // Add Sales Invoice button for supervision contracts with selling items
            if (is_supervision_contract && has_selling_items) {
                frm.add_custom_button(__('Add Sales Invoice'), function () {
                    frappe.call({
                        method: "elsalem_contracts_2025.elsalem_contracts_2025.doctype.finishing_contract.finishing_contract.make_sales_invoice",
                        args: {
                            source_name: frm.doc.name
                        },
                        callback: function (r) {
                            if (r.message) {
                                frappe.model.sync(r.message);
                                frappe.set_route("Form", r.message.doctype, r.message.name);
                            }
                        }
                    });
                }, __('Create'));

                // Add Delivery Note button for supervision contracts with selling items
                frm.add_custom_button(__('Add Delivery Note'), function () {
                    frappe.call({
                        method: "elsalem_contracts_2025.elsalem_contracts_2025.doctype.finishing_contract.finishing_contract.make_delivery_note",
                        args: {
                            source_name: frm.doc.name
                        },
                        callback: function (r) {
                            if (r.message) {
                                frappe.model.sync(r.message);
                                frappe.set_route("Form", r.message.doctype, r.message.name);
                            }
                        }
                    });
                }, __('Create'));
            }

            // Original Sales Invoice button (for non-supervision contracts)
            if (!is_supervision_contract) {
                frm.add_custom_button(__('Sales Invoice'), function () {
                    try {
                        frappe.new_doc('Sales Invoice', {
                            customer: frm.doc.customer
                        });
                    } catch (e) {
                        console.error("Error creating Sales Invoice:", e);
                        frappe.show_alert({
                            message: __("Error creating Sales Invoice"),
                            indicator: "red"
                        });
                    }
                }, __('Create'));
            }

            // Open new Material Request
            frm.add_custom_button(__('Material Request'), function () {
                try {
                    frappe.new_doc('Material Request');
                } catch (e) {
                    console.error("Error creating Material Request:", e);
                    frappe.show_alert({
                        message: __("Error creating Material Request"),
                        indicator: "red"
                    });
                }
            }, __('Create'));
        }

        // 2. Calculations: Percentage Of Dry Cost
        calculate_percentage(frm);

        // 3. Filters: Apply the account filter when the form loads
        frm.trigger('set_account_filter');

        // add custom button to view total payments by cost center
        if (frm.doc.cost_center) {
            frm.add_custom_button(__('Actual Cost'), function () {
                const filters = {
                    from_date: frm.doc.transaction_date,
                    to_date: frappe.datetime.get_today(),
                    cost_center: frm.doc.cost_center,
                    company: frm.doc.company
                };
                frappe.set_route("query-report", "Finishing Contract Payment Transactions", filters);
            }, __('View'));
        }
    },

    company: function (frm) {
        // Re-apply the filter if the Company field changes
        frm.trigger('set_account_filter');
    },

    // Custom trigger to set the account filter
    set_account_filter: function (frm) {
        if (frm.doc.company) {
            frm.set_query('custom_account', function () {
                return {
                    filters: {
                        'company': frm.doc.company,
                        'is_group': 1 // Optional: Show only transaction accounts
                    }
                };
            });
        }
    },

    // Trigger calculation when total_actual_cost changes
    total_actual_cost: function (frm) {
        calculate_percentage(frm);
    },

    // Trigger calculation when total changes
    total: function (frm) {
        calculate_percentage(frm);
    },

    // Button action to calculate cost from server
    view_total_actual_cost: function (frm) {
        if (!frm.doc.cost_center) {
            frappe.msgprint({
                title: __('Missing Data'),
                indicator: 'red',
                message: __('Please select a cost center first')
            });
            return;
        }

        frappe.call({
            method: "custom_reports.custom_reports.report.finishing_contract_payment_transactions.finishing_contract_payment_transactions.get_payments_by_cost_center",
            args: {
                cost_center: frm.doc.cost_center,
                company: frm.doc.company,
                from_date: frm.doc.transaction_date,
                to_date: frappe.datetime.get_today()
            },
            callback: function (r) {
                if (r.message) {
                    frm.set_value('total_actual_cost', r.message);
                }
            }
        });
    }

});

// ==========================================
// CHILD TABLE EVENTS: Finishing Contract Item
// ==========================================
frappe.ui.form.on('Finishing Contract Item', {
    items_add(frm, cdt, cdn) {
        initialize_new_item(frm, cdt, cdn);
    },

    business_statement_doctype(frm, cdt, cdn) {
        handle_doctype_change(frm, cdt, cdn);
    },

    current_qty(frm, cdt, cdn) {
        calculate_item_totals(frm, cdt, cdn);
    },

    rate(frm, cdt, cdn) {
        calculate_item_totals(frm, cdt, cdn);
    },

    business_statement_num(frm, cdt, cdn) {
        handle_item_selection(frm, cdt, cdn);
        // Clear business_statement if is_group_ checked and Item Group selected
        const row = frappe.get_doc(cdt, cdn);
        if (row.is_group_ && row.business_statement_doctype === "Item Group") {
            frappe.model.set_value(cdt, cdn, "business_statement", null);
        }
    },

    uom(frm, cdt, cdn) {
        handle_uom_change(frm, cdt, cdn);
    },

    is_group_(frm, cdt, cdn) {
        handle_group_toggle(frm, cdt, cdn);
        // Clear business_statement if is_group_ checked and Item Group selected
        const row = frappe.get_doc(cdt, cdn);
        if (row.is_group_ && row.business_statement_doctype === "Item Group") {
            frappe.model.set_value(cdt, cdn, "business_statement", null);
        }
    }
});

// ==========================================
// MAIN HELPER FUNCTIONS
// ==========================================

// 1. Percentage Calculation
function calculate_percentage(frm) {
    // Get values, defaulting to 0 if they are null/undefined
    let actual_cost = frm.doc.total_actual_cost || 0;
    let total_val = frm.doc.total || 0;

    // LOGIC: Only divide if the denominator (total) is greater than 0
    if (total_val > 0) {
        let percentage = (actual_cost / total_val) * 100;
        frm.set_value('custom_percentage_of_dry_cost', percentage);
    } else {
        // If total is 0 or NULL, set percentage to 0 to avoid error
        frm.set_value('custom_percentage_of_dry_cost', 0);
    }
}

// 2. Validate and Calculate Items
function validate_and_calculate_items(frm) {
    let total_of_items = 0;
    let total_quantity = 0;
    const errors = [];

    (frm.doc.items || []).forEach(function (item, idx) {
        if (item.is_group_ || item.business_statement_doctype === "Item Group") return;

        const validation_errors = validate_item_fields(item, idx);
        if (validation_errors.length > 0) {
            errors.push(`Row ${idx + 1}: ${validation_errors.join(", ")}`);
            return;
        }

        const calculation_result = calculate_item_values(item);
        if (!calculation_result.success) {
            errors.push(`Row ${idx + 1}: ${calculation_result.error}`);
            return;
        }

        Object.assign(item, calculation_result.values);
        total_of_items += calculation_result.values.total;
        total_quantity += calculation_result.values.current_qty;
    });

    if (errors.length > 0) {
        frappe.throw(`Validation errors found:<br><b>${errors.join("<br>")}</b>`);
    }

    frm.set_value("total_of_items", total_of_items);
    frm.set_value("total_quantity", total_quantity);
    frm.refresh_field("items");
}

function validate_item_fields(item) {
    const missing = [];
    if (!item.uom) missing.push("UOM");
    if (!item.default_uom) missing.push("Default UOM");
    if (!is_valid_number(item.current_qty)) missing.push("Current Qty");
    if (!is_valid_number(item.rate)) missing.push("Rate");
    return missing;
}

function calculate_item_values(item) {
    try {
        const previous_qty = parseFloat(item.previous_qty || 0);
        const current_qty = parseFloat(item.current_qty || 0);
        const rate = parseFloat(item.rate || 0);
        const total_qty = current_qty + previous_qty;
        const total = total_qty * rate;

        if (!isFinite(total) || !isFinite(total_qty)) {
            return { success: false, error: "Invalid calculation result" };
        }

        return {
            success: true,
            values: {
                total_qty: total_qty,
                total: total,
                current_qty: current_qty
            }
        };
    } catch (e) {
        return { success: false, error: "Calculation error: " + e.message };
    }
}

function validate_accounts(frm) {
    const missing_accounts = [];
    (frm.doc.items || []).forEach((item, idx) => {
        if (!item.account || item.account === '') {
            missing_accounts.push(`Row ${idx + 1} (${item.business_statement_num || 'Unknown Item'})`);
        }
    });

    if (missing_accounts.length > 0) {
        frappe.throw(`Missing accounts for:<br><b>${missing_accounts.join("<br>")}</b>`);
    }
}

function setup_business_statement_query(frm) {
    if (frm.business_statement_query_setup) return;

    frappe.meta.get_docfield("Finishing Contract Item", "business_statement_num", frm.doc.name).get_query = function (doc, cdt, cdn) {
        const row = locals[cdt][cdn];
        const filters = {};

        if (row.business_statement_doctype === "Item") {
            const last_group = find_last_group_above_row(doc, cdn);
            if (last_group?.business_statement_num) {
                filters['item_group'] = last_group.business_statement_num;
            }
        }

        return {
            doctype: row.business_statement_doctype,
            filters: filters
        };
    };

    frm.business_statement_query_setup = true;
}

function find_last_group_above_row(doc, cdn) {
    const items = doc.items || [];
    const current_index = items.findIndex(item => item.name === cdn);
    if (current_index < 0) return null;

    for (let i = current_index; i >= 0; i--) {
        if (items[i].is_group_) return items[i];
    }
    return null;
}

function update_group_numbers(frm) {
    if (!frm.doc.items?.length) return;

    let current_group_level = 0;
    let current_group_index = 0;
    let has_changes = false;

    frm.doc.items.forEach(row => {
        let new_group_value = null;

        if (row.is_group_) {
            current_group_level++;
            current_group_index = 0;
            new_group_value = current_group_level.toString();
        } else if (current_group_level > 0) {
            current_group_index++;
            new_group_value = `${current_group_level}\\${current_group_index}`;
        }

        if (row.group !== new_group_value) {
            row.group = new_group_value;
            has_changes = true;
        }
    });

    if (has_changes) frm.refresh_field('items');
}

function add_custom_buttons(frm) {
    if (frm.doc.docstatus === 1) {
        frm.add_custom_button('Subcontract', () => {
            frappe.model.open_mapped_doc({
                method: "frontline_subcontract.frontline_subcontract.doctype.contracts.contracts.make_subcontract",
                frm: frm
            });
        }, 'Create');
    }
}

// === ITEM EVENT HANDLERS ===

function initialize_new_item(frm, cdt, cdn) {
    const row = locals[cdt][cdn];
    row.project = frm.doc.project;
    row.cost_center = frm.doc.cost_center;
    frappe.model.set_value(cdt, cdn, "business_statement_doctype", "Item");
    set_business_statement_query(frm, cdt, cdn);
    update_group_numbers(frm);
}

function handle_doctype_change(frm, cdt, cdn) {
    set_business_statement_query(frm, cdt, cdn);
    update_group_numbers(frm);
}

function calculate_item_totals(frm, cdt, cdn) {
    const row = frappe.get_doc(cdt, cdn);

    if (is_valid_number(row.current_qty) && is_valid_number(row.previous_qty)) {
        row.total_qty = parseFloat(row.current_qty) + parseFloat(row.previous_qty || 0);
    }

    if (is_valid_number(row.rate) && is_valid_number(row.total_qty)) {
        row.total = parseFloat(row.rate) * parseFloat(row.total_qty);
    }

    frm.refresh_field('items');
}

function handle_item_selection(frm, cdt, cdn) {
    const row = frappe.get_doc(cdt, cdn);

    if (!row.business_statement_num || row.business_statement_doctype !== "Item") {
        row.uom = null;
        frm.refresh_field('items');
        return;
    }

    // Use frappe.db.get_value to safely get stock UOM
    frappe.db.get_value("Item", row.business_statement_num, "stock_uom")
        .then(r => {
            if (r.message && r.message.stock_uom) {
                row.uom = r.message.stock_uom;
                row.default_uom = r.message.stock_uom;
                frm.refresh_field('items');
            }
        })
        .catch(err => {
            console.error("Error fetching stock UOM:", err);
            frappe.show_alert({
                message: __("Error fetching item UOM"),
                indicator: "red"
            });
        });
}

function handle_uom_change(frm, cdt, cdn) {
    const row = frappe.get_doc(cdt, cdn);

    if (row.uom === row.default_uom || row.business_statement_doctype !== "Item") return;

    // First check if the item exists
    frappe.db.get_value("Item", row.business_statement_num, "name")
        .then(r => {
            if (r.message && r.message.name) {
                // Get UOM conversion data using frappe.db.get_list
                return frappe.db.get_list("UOM Conversion Detail", {
                    filters: {
                        parent: row.business_statement_num,
                        uom: row.uom
                    },
                    fields: ["conversion_factor"],
                    limit: 1
                });
            }
        })
        .then(uom_data => {
            if (uom_data && uom_data.length > 0) {
                row.conversion_factor = uom_data[0].conversion_factor;
                frm.refresh_field('items');
            } else {
                // Fallback: try to get from UOM master
                return frappe.db.get_value("UOM", row.uom, "conversion_factor");
            }
        })
        .then(fallback_data => {
            if (fallback_data && fallback_data.message && fallback_data.message.conversion_factor) {
                row.conversion_factor = fallback_data.message.conversion_factor;
                frm.refresh_field('items');
            }
        })
        .catch(err => {
            console.error("Error fetching UOM conversion:", err);
            frappe.show_alert({
                message: __("Error fetching UOM conversion factor"),
                indicator: "orange"
            });
        });
}

function handle_group_toggle(frm, cdt, cdn) {
    const row = locals[cdt][cdn];
    const row_index = frm.doc.items.findIndex(r => r.name === row.name);

    if (row.is_group_) {
        frappe.model.set_value(cdt, cdn, "business_statement_doctype", "Item Group");

        frm.fields_dict["items"].grid.get_field("business_statement_num").get_query = function (doc, cdt_inner, cdn_inner) {
            if (cdn_inner === cdn) {
                return {
                    doctype: "Item Group",
                    filters: {}
                };
            }
        };
        reset_following_rows(frm, row_index);
    } else {
        frappe.model.set_value(cdt, cdn, "business_statement_doctype", "Item");
        set_business_statement_query(frm, cdt, cdn);
    }

    update_group_numbers(frm);
    frm.refresh_field('items');
}

function is_valid_number(value) {
    return value !== undefined && value !== null && !isNaN(parseFloat(value)) && isFinite(value);
}

function propagate_field_to_items(frm, field_name, value) {
    if (frm.is_new() && frm.doc.items?.length > 0) {
        frm.doc.items[0][field_name] = value;
    }
}

function handle_payment_terms_change(frm) {
    frm.call('remove_all_records_on_change').then(() => {
        if (frm.doc.payment_terms_template) {
            frm.call('get_payment_terms_template_child', {
                docname: frm.doc.payment_terms_template
            });
        }
    });
}

function handle_contract_type_change(frm) {
    if (frm.doc.contract_type === 'Contract Supplement') {
        frm.set_value('naming_series', 'CS-.YYYY.-');
    }
}

function fetch_related_contract_data(frm) {
    if (!frm.doc.related_contract) return;

    const fields_to_copy = [
        'contractor', 'cost_center', 'phone', 'project',
        'address', 'company', 'commercial_record', 'tax_id_number'
    ];

    frappe.db.get_value('Finishing Contract', frm.doc.related_contract, fields_to_copy)
        .then(r => {
            if (r.message) {
                const values = {};
                fields_to_copy.forEach(field => {
                    if (r.message[field]) {
                        values[field] = r.message[field];
                    }
                });
                frm.set_value(values);
            }
        })
        .catch(err => {
            console.error("Error fetching related contract:", err);
            frappe.show_alert({
                message: __("Error fetching related contract data"),
                indicator: 'red'
            });
        });
}

function reset_following_rows(frm, from_index) {
    for (let i = from_index + 1; i < frm.doc.items.length; i++) {
        const child = frm.doc.items[i];
        child.business_statement_doctype = "Item";
        child.is_group_ = 0;
        child.business_statement_num = null;
    }
}

function set_business_statement_query(frm, cdt, cdn) {
    const row = locals[cdt][cdn];
    frm.fields_dict["items"].grid.get_field("business_statement_num").get_query = function (doc, cdt_inner, cdn_inner) {
        if (cdn_inner !== cdn) return;

        if (row.is_group_) {
            return {
                doctype: "Item Group",
                filters: {}
            };
        } else {
            const last_group = find_last_group_above_row(frm.doc, row.name);
            let filters = {};

            if (last_group?.business_statement_num) {
                filters["item_group"] = last_group.business_statement_num;
            }

            return {
                doctype: "Item",
                filters: filters
            };
        }
    };
}

function validate_item_link_safe(frm, item_code, callback) {
    if (!item_code) {
        callback(null);
        return;
    }

    frappe.db.get_value("Item", item_code, ["name", "stock_uom", "item_name"])
        .then(r => {
            if (r.message && r.message.name) {
                callback(r.message);
            } else {
                callback(null);
            }
        })
        .catch(err => {
            console.error("Error validating item:", err);
            callback(null);
        });
}

function validate_item_group_link_safe(frm, group_code, callback) {
    if (!group_code) {
        callback(null);
        return;
    }

    frappe.db.get_value("Item Group", group_code, ["name", "item_group_name"])
        .then(r => {
            if (r.message && r.message.name) {
                callback(r.message);
            } else {
                callback(null);
            }
        })
        .catch(err => {
            console.error("Error validating item group:", err);
            callback(null);
        });
}