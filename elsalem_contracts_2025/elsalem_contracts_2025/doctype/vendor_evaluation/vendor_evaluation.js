// Copyright (c) 2025, hossam and contributors
// For license information, please see license.txt

frappe.ui.form.on('Vendor Evaluation', {
    // Triggered on form load
    onload: function(frm) {
        // Only trigger on new unsaved documents
        if (frm.is_new() && frm.doc.__islocal && (!frm.doc.purchase_order_vendor_evaluation || frm.doc.purchase_order_vendor_evaluation.length === 0)) {

            // Default criteria and goals
            const criteria_list = [
                "جودة الصنف أو الخدمة",
                "التسهيلات",
                "مدة التوريد",
                "الالتزام بتوريد مستندات الصنف",
                "الالتزام بتطبيق نظام إدارة الجودة والبيئة والسلامة"
            ];
            const goals_list = [50, 10, 15, 15, 10];

            // Clear existing evaluation rows
            frm.clear_table('purchase_order_vendor_evaluation');

            // Add default evaluation rows
            for (let i = 0; i < criteria_list.length; i++) {
                let row = frm.add_child('purchase_order_vendor_evaluation');
                row.supplier_scorecard_criteria = criteria_list[i];
                row.goals = goals_list[i];
                row.score = 0;  // Default score
            }

            frm.refresh_field('purchase_order_vendor_evaluation');
        }
    },

    // Triggered before form is saved
    validate: function(frm) {
        let total_score = 0;
        let total_goals = 0;

        // Calculate total score and total goals
        frm.doc.purchase_order_vendor_evaluation.forEach(row => {
            total_score += parseFloat(row.score || 0);
            total_goals += parseFloat(row.goals || 0);
        });

        frm.set_value('total_supplier_score_', total_score);

        // Ensure total goals = 100
        if (total_goals !== 100) {
            frappe.throw(__('Total Goals must equal 100. Currently it is: ' + total_goals));
        }
    }
});

// Handle live update of scores/goals in child table
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

// Helper function: update total_supplier_score live
function update_total_supplier_score(frm) {
    let total_score = 0;
    frm.doc.purchase_order_vendor_evaluation.forEach(row => {
        total_score += parseFloat(row.score || 0);
    });
    frm.set_value('total_supplier_score_', total_score);
}