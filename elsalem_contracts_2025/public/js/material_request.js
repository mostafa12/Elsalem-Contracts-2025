frappe.ui.form.on('Material Request', {
    // فلترة الأقسام حسب الشركة
    company: function (frm) {
        set_department_filter(frm);
    },
    // عند تحميل النموذج
    onload: function (frm) {
        set_department_filter(frm);
    },
    // عند تغيير القسم، جلب المدير
    department: function (frm) {
        if (frm.doc.department) {
            frappe.db.get_doc('Department', frm.doc.department).then(function (dept_doc) {
                if (dept_doc.expense_approvers && dept_doc.expense_approvers.length > 0) {
                    frm.set_value("manager", dept_doc.expense_approvers[0].approver);
                }
            });
        }
    },
    // الأزرار المخصصة عند الحالة المطلوبة
    refresh: function (frm) {
        // Set query filter for set_warehouse field
        frm.set_query('set_warehouse', () => {
            return {
                filters: {
                    is_group: 0  // Show only warehouses that are NOT groups
                }
            };
        });
        if (frm.doc.docstatus === 1 && frm.doc.material_request_type === "Issue & Purchase") {
            // 1. Stock Entry (Material Issue) - Only items with request_type = "Material Issue"
            frm.add_custom_button(__('Stock Entry (Material Issue)'), function () {
                frappe.call({
                    method: "elsalem_contracts_2025.elsalem_contracts_2025.overrides.material_request.make_stock_entry_for_material_issue",
                    args: {
                        source_name: frm.doc.name
                    },
                    callback: function (r) {
                        if (r.message) {
                            // Open the Stock Entry in a new form
                            frappe.model.sync(r.message);
                            frappe.set_route("Form", r.message.doctype, r.message.name);
                        }
                    }
                });
            }, __('Create'));
            // 2. Purchase Order
            frm.add_custom_button(__('Purchase Order'), function () {
                frappe.new_doc('Purchase Order', {
                    material_request: frm.doc.name,
                    company: frm.doc.company
                });
            }, __('Create'));
            // 3. Request for Quotation
            frm.add_custom_button(__('Request for Quotation'), function () {
                frappe.new_doc('Request for Quotation', {
                    material_request: frm.doc.name,
                    company: frm.doc.company
                });
            }, __('Create'));
            // 4. Supplier Quotation
            frm.add_custom_button(__('Supplier Quotation'), function () {
                frappe.new_doc('Supplier Quotation', {
                    material_request: frm.doc.name,
                    company: frm.doc.company
                });
            }, __('Create'));
        }
    }
});

// دالة فلترة الأقسام حسب الشركة
function set_department_filter(frm) {
    frm.set_query("department", function () {
        return {
            filters: {
                company: frm.doc.company
            }
        };
    });
}