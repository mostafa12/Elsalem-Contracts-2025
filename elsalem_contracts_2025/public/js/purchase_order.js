// frappe.ui.form.on('Purchase Order', {
//     refresh: function(frm) {
//         // Only show the button after submit
//         if (frm.doc.docstatus === 1) {
//             frm.add_custom_button(__('Vendor Evaluation'), function() {
//                 // Create new Vendor Evaluation and pass values
//                 frappe.new_doc('Vendor Evaluation', {
//                     purchase_order: frm.doc.name,
//                     supplier: frm.doc.supplier
//                 });
//             }, __('Create'));
//         }
//     }
// });


frappe.ui.form.on('Purchase Order', {

    // --- onload: populate vendor evaluation table on new PO ---
    onload: function(frm) {
        if (frm.is_new() && frm.doc.__islocal && (!frm.doc.purchase_order_vendor_evaluation || frm.doc.purchase_order_vendor_evaluation.length === 0)) {

            const criteria_list = [
                "جودة الصنف أو الخدمة",
                "التسهيلات",
                "مدة التوريد",
                "الالتزام بتوريد مستندات الصنف",
                "الالتزام بتطبيق نظام إدارة الجودة والبيئة والسلامة"
            ];
            const goals_list = [50, 10, 15, 15, 10];

            frm.clear_table('purchase_order_vendor_evaluation');

            for (let i = 0; i < criteria_list.length; i++) {
                let row = frm.add_child('purchase_order_vendor_evaluation');
                row.supplier_scorecard_criteria = criteria_list[i];
                row.goals = goals_list[i];
                row.score = 0;
            }

            frm.refresh_field('purchase_order_vendor_evaluation');
        }
    },

    // --- validate: check goals = 100 and calculate total score ---
    validate(frm) {
        let total_score = 0;
        let total_goals = 0;

        frm.doc.purchase_order_vendor_evaluation.forEach(row => {
            total_score += parseFloat(row.score || 0);
            total_goals += parseFloat(row.goals || 0);
        });

        frm.set_value('total_supplier_score', total_score);

        if (total_goals !== 100) {
            frappe.throw(__('Total Goals must equal 100. Currently it is: ' + total_goals));
        }
    },

    // --- material_request change event ---
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

                    if (mr && mr.supplier) {
                        frm.set_value("supplier", mr.supplier);
                    }

                    if (mr && Array.isArray(mr.items)) {
                        frm.clear_table('items');

                        mr.items.forEach(function(row) {
                            if (row.request_type === 'Purchasing') {
                                var child = frm.add_child('items');
                                child.item_code = row.item_code;
                                child.qty = row.qty;
                                child.schedule_date = row.schedule_date;
                                child.warehouse = row.warehouse;
                            }
                        });

                        frm.refresh_field('items');

                        frm.doc.items.forEach(function(row) {
                            frm.script_manager.trigger('item_code', row.doctype, row.name);
                        });

                        frappe.msgprint("Only 'Purchasing' items loaded from Material Request.");
                    }
                }
            });
        }
    },

    // --- refresh: show Vendor Evaluation button after submit ---
    refresh: function(frm) {
        if (frm.doc.docstatus === 1) {
            frm.add_custom_button(__('Vendor Evaluation'), function() {
                frappe.new_doc('Vendor Evaluation', {
                    purchase_order: frm.doc.name,
                    supplier: frm.doc.supplier
                });
            }, __('Create'));
        }
    }

});

// --- Child table events: live update of score/goal ---
frappe.ui.form.on('Purchase Order Vendor Evaluation', {
    score: function(frm) {
        update_total_supplier_score(frm);
    },
    goals: function(frm) {
        update_total_supplier_score(frm);
    },
    purchase_order_vendor_evaluation_remove: function(frm) {
        update_total_supplier_score(frm);
    }
});

// --- Helper function ---
function update_total_supplier_score(frm) {
    let total_score = 0;
    frm.doc.purchase_order_vendor_evaluation.forEach(row => {
        total_score += parseFloat(row.score || 0);
    });
    frm.set_value('total_supplier_score', total_score);
}
