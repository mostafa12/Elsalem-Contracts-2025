# import frappe
#
# def execute():
#     docfield = frappe.get_doc("DocField", {
#         "parent": "Material Request",
#         "fieldname": "material_request_type"
#     })
#
#     options = (docfield.options or "").split("\n")
#
#     if "Issue & Purchase" not in options:
#         options.append("Issue & Purchase")
#         docfield.options = "\n".join(options)
#         docfield.save()
#         frappe.db.commit()


import frappe

def execute():
    # Get the DocField of material_request_type in Material Request
    docfield = frappe.db.get_value(
        "DocField",
        {"parent": "Material Request", "fieldname": "material_request_type"},
        ["name"],
    )
    if not docfield:
        frappe.msgprint("DocField not found.")
        return

    docfield_doc = frappe.get_doc("DocField", docfield)

    # Split existing options into list
    options = (docfield_doc.options or "").split("\n")

    # Add new option if not already present
    if "Issue & Purchase" not in options:
        options.append("Issue & Purchase")
        docfield_doc.options = "\n".join(options)
        docfield_doc.save()
        frappe.clear_cache(doctype="Material Request")
        frappe.msgprint("✅ Option 'Issue & Purchase' added successfully.")
    else:
        frappe.msgprint("⚠️ Option already exists.")

