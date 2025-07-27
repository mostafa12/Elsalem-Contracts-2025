frappe.ui.form.on('Purchase Order', {
    refresh: function(frm) {
        // Only show the button after submit
        if (frm.doc.docstatus === 1) {
            frm.add_custom_button(__('Vendor Evaluation'), function() {
                // Create new Vendor Evaluation and pass values
                frappe.new_doc('Vendor Evaluation', {
                    purchase_order: frm.doc.name,
                    supplier: frm.doc.supplier
                });
            }, __('Create'));
        }
    }
});