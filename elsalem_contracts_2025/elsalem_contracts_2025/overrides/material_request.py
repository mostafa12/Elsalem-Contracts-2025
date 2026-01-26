"""
Material Request customizations for elsalem_contracts_2025
"""
import frappe
from frappe import _
from frappe.utils import nowdate


@frappe.whitelist()
def make_stock_entry_for_material_issue(source_name):
    """
    Create Stock Entry from Material Request with only items where request_type = 'Material Issue'
    
    Args:
        source_name: Name of the Material Request document
    
    Returns:
        Stock Entry document (dict)
    """
    # Get the Material Request document
    material_request = frappe.get_doc("Material Request", source_name)
    
    # Validate that the Material Request is submitted
    if material_request.docstatus != 1:
        frappe.throw(_("Material Request must be submitted before creating Stock Entry"))
    
    # Validate Material Request Type
    if material_request.material_request_type != "Issue & Purchase":
        frappe.throw(_("This function only works for Material Request Type 'Issue & Purchase'"))
    
    # Filter items where request_type = "Material Issue"
    filtered_items = [
        item for item in material_request.items 
        if item.get("request_type") == "Material Issue"
    ]
    
    # Check if there are any items to process
    if not filtered_items:
        frappe.msgprint(_("No items with 'Material Issue' request type found in this Material Request"))
        return None
    
    # Create new Stock Entry document
    stock_entry = frappe.new_doc("Stock Entry")
    stock_entry.stock_entry_type = "Material Issue"
    stock_entry.purpose = "Material Issue"
    stock_entry.company = material_request.company
    stock_entry.posting_date = nowdate()
    
    # Set warehouse from Material Request
    if material_request.set_warehouse:
        stock_entry.from_warehouse = material_request.set_warehouse
    
    # Transfer custom reason field if it exists
    if hasattr(material_request, "custom_reason") and material_request.custom_reason:
        stock_entry.custom_reason = material_request.custom_reason
    
    # Set Material Request reference
    stock_entry.material_request = material_request.name
    
    # Add filtered items to Stock Entry
    for mr_item in filtered_items:
        se_item = stock_entry.append("items", {})
        se_item.item_code = mr_item.item_code
        se_item.item_name = mr_item.item_name
        se_item.description = mr_item.description
        se_item.uom = mr_item.uom
        se_item.stock_uom = mr_item.stock_uom
        se_item.conversion_factor = mr_item.conversion_factor or 1
        se_item.qty = mr_item.qty
        
        # Set warehouse
        if material_request.set_warehouse:
            se_item.s_warehouse = material_request.set_warehouse
        
        # Set material request item reference
        se_item.material_request = material_request.name
        se_item.material_request_item = mr_item.name
        
        # Copy cost center and project if available
        if mr_item.cost_center:
            se_item.cost_center = mr_item.cost_center
        elif material_request.cost_center:
            se_item.cost_center = material_request.cost_center
            
        if mr_item.project:
            se_item.project = mr_item.project
    
    # Return the Stock Entry as dict
    return stock_entry.as_dict()
