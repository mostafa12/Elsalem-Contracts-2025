frappe.ui.form.on('Request for Quotation', {
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
                        // check if there are "Purchasing" items
                        var purchasing_items = mr.items.filter(function(row) {
                            return row.request_type === 'Purchasing';
                        });

                        // only clear and add if found items
                        if (purchasing_items.length > 0) {
                            frm.clear_table('items');

                            purchasing_items.forEach(function(row) {
                                var child = frm.add_child('items');
                                child.item_code = row.item_code;
                                child.qty = row.qty;
                                child.material_request = mr.name;
                                child.warehouse = row.warehouse;
                            });

                            frm.refresh_field('items');

                            // trigger item_code to recalculate dependent fields
                            frm.doc.items.forEach(function(row) {
                                frm.script_manager.trigger('item_code', row.doctype, row.name);
                            });
                        }
                    }
                }
            });
        }
    }
});








// frappe.ui.form.on('Request for Quotation', {
//     material_request: function(frm) {
//         if (frm.doc.material_request) {
//             frappe.call({
//                 method: 'frappe.client.get',
//                 args: {
//                     doctype: 'Material Request',
//                     name: frm.doc.material_request
//                 },
//                 callback: function(response) {
//                     var mr = response.message;
//                     // frm.set_value("supplier", mr.supplier);
//
//                     if (mr && mr.items) {
//                         frm.clear_table('items');
//
//                         mr.items.forEach(function(row) {
//                             if (row.request_type === 'Purchasing') {
//                                 var child = frm.add_child('items');
//                                 child.item_code = row.item_code;
//                                 child.qty = row.qty;
//                                 // child.material_request = row.material_request;
//                                 child.material_request = mr.name;
//                                 child.warehouse = row.warehouse;
//                             }
//                         });
//
//                         frm.refresh_field('items');
//
//                         // trigger item_code لحساب باقي القيم
//                         frm.doc.items.forEach(function(row) {
//                             frm.script_manager.trigger('item_code', row.doctype, row.name);
//                         });
//
//                         // frappe.msgprint("Only 'Purchasing' items loaded from Material Request.");
//                     }
//                 }
//             });
//         }
//     }
// });
