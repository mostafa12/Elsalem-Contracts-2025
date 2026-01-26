frappe.ui.form.on('Supplier Quotation', {
    before_save(frm) {
        console.log("Before Save Check...");
        // count Fixed Assets
        let count_fixed_asset = 0;
        frm.doc.items.forEach(function(item) {
            if (item.item_group === "Fixed Assets") {
                count_fixed_asset += 1;
            }
        });
        frm.set_value('is_fixed_asset', (count_fixed_asset === frm.doc.items.length) ? 1 : 0);
        // ensure mandatory fields
        frm.doc.items.forEach(row => {
            // ✅ Required By always set
            if (!row.schedule_date) {
                row.schedule_date = frm.doc.transaction_date || frappe.datetime.nowdate();
            }
            // ✅ Clear Material Request Item data
            if (row.material_request_item) {
                row.material_request_item = null;
            }
        });
    },
    material_request: function(frm) {
        if (frm.doc.material_request) {
            frappe.call({
                method: 'frappe.client.get',
                args: {
                    doctype: 'Material Request',
                    name: frm.doc.material_request
                },
                callback: function(response) {
                    var mr = response.message;
                    if (mr && mr.items) {
                        frm.clear_table('items');
                        mr.items.forEach(function(row) {
                            if (row.request_type === 'Purchasing') {
                                var child = frm.add_child('items');
                                child.item_code = row.item_code;
                                child.qty = row.qty;
                                child.schedule_date = row.schedule_date || frm.doc.transaction_date || frappe.datetime.nowdate();
                                child.material_request = mr.name;
                                child.warehouse = row.warehouse;
                                // material_request_item is intentionally not set
                            }
                        });
                        frm.refresh_field('items');
                        frm.doc.items.forEach(function(row) {
                            frm.script_manager.trigger('item_code', row.doctype, row.name);
                        });
                        console.log("Loaded MR Items:", mr.items);
                    }
                }
            });
        }
    }
});