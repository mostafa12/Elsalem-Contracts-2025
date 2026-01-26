# Copyright (c) 2025, hossam and contributors
# For license information, please see license.txt
import frappe
from frappe.model.document import Document
from frappe.utils import nowdate

class FinishingContract(Document):
    def validate(self):
        # Initialize a variable to hold the total quantity from all child rows
        total_qty = 0

        # Initialize a variable to hold the total amount from all child rows
        total_amount = 0

        # Loop through each row in the child table named 'items'
        for row in self.items:
            # Add the value of 'current_qty' to total_qty
            # Use 'or 0' in case the field is None to avoid TypeError
            total_qty += row.current_qty or 0

            # Add the value of 'total' from the child row to total_amount
            total_amount += row.total or 0

        # Set the total_qty field in the parent doctype
        self.total_qty = total_qty

        # Set the 'base_total' field in the parent with the sum of totals
        self.base_total = total_amount

        # Set the 'total' field in the parent with the same total amount
        self.total = total_amount


# ✅ This must be outside the class
# @frappe.whitelist()
# def get_total_actual_cost(finishing_contract, cost_center, from_date):
#     to_date = nowdate()
#
#     gl_entries = frappe.db.sql("""
#         SELECT debit
#         FROM `tabGL Entry`
#         WHERE cost_center = %s
#         AND posting_date BETWEEN %s AND %s
#     """, (cost_center, from_date, to_date), as_dict=True)
#
#     # Sum of only debit values
#     total_cost = sum([d.get("debit", 0) for d in gl_entries])
#
#     return total_cost
#

# =========================================

@frappe.whitelist()
def get_total_actual_cost(finishing_contract=None, company=None, cost_center=None, account=None, from_date=None):
    """
    Calculate total actual cost from GL Entry including sub-accounts
    """
    from frappe.utils import nowdate

    # Default to today's date
    to_date = nowdate()

    # Validation: Check if required fields are provided
    if not account:
        frappe.msgprint(f"لا يمكن حساب التكلفة: لم يتم تحديد الحساب (custom_account)")
        return 0.0

    if not cost_center:
        frappe.msgprint(f"لا يمكن حساب التكلفة: لم يتم تحديد مركز التكلفة (cost_center)")
        return 0.0

    if not company:
        frappe.msgprint(f"لا يمكن حساب التكلفة: لم يتم تحديد الشركة (company)")
        return 0.0

    # Get all child accounts using the SAME function as the report
    def get_accounts_with_children(parent_account, company=None):
        """
        Get the parent account and all its child accounts recursively
        Optionally filter by company
        """
        if not parent_account:
            return []

        # Build query with optional company filter
        company_condition = ""
        params = {"parent_account": parent_account}

        if company:
            company_condition = "AND company = %(company)s"
            params["company"] = company

        # Get all descendant accounts using lft and rgt (nested set model)
        descendants = frappe.db.sql(f"""
            SELECT name
            FROM `tabAccount`
            WHERE lft >= (SELECT lft FROM `tabAccount` WHERE name = %(parent_account)s)
            AND rgt <= (SELECT rgt FROM `tabAccount` WHERE name = %(parent_account)s)
            {company_condition}
            AND docstatus < 2
            ORDER BY lft
        """, params, as_dict=1)

        if descendants:
            return [d.name for d in descendants]

        return [parent_account]

    # Get all child accounts under the selected account (filtered by company)
    child_accounts = get_accounts_with_children(account, company)

    frappe.logger().info(f"Parent Account: {account}")
    frappe.logger().info(f"All accounts (including sub-accounts): {child_accounts}")

    # Build conditions - EXACTLY like the report
    conditions = []
    params = {}

    # Base conditions - SAME as report
    conditions.append("gl.docstatus = 1")
    conditions.append("gl.is_cancelled = 0")
    conditions.append("gl.debit_in_account_currency > 0")

    # Date filters
    if from_date:
        conditions.append("gl.posting_date >= %(from_date)s")
        params["from_date"] = from_date
    else:
        conditions.append("gl.posting_date >= '2025-01-01'")

    if to_date:
        conditions.append("gl.posting_date <= %(to_date)s")
        params["to_date"] = to_date

    # Company filter
    if company:
        conditions.append("gl.company = %(company)s")
        params["company"] = company

    # Cost Center filter
    if cost_center:
        conditions.append("gl.cost_center = %(cost_center)s")
        params["cost_center"] = cost_center

    # Account filter with sub-accounts
    if child_accounts:
        conditions.append("gl.account IN %(accounts)s")
        params["accounts"] = child_accounts

    # Build WHERE clause
    where_clause = " AND ".join(conditions)

    # Build SQL query - EXACTLY like the report (without report_type filter)
    sql_query = f"""
        SELECT
            gl.account,
            gl.debit_in_account_currency
        FROM
            `tabGL Entry` gl
        INNER JOIN
            `tabAccount` acc ON gl.account = acc.name
        WHERE
            {where_clause}
        ORDER BY
            gl.posting_date DESC, gl.creation DESC
    """

    # Log query for debugging
    frappe.logger().debug(f"SQL Query: {sql_query}")
    frappe.logger().debug(f"Query params: {params}")

    # Execute query
    gl_entries = frappe.db.sql(sql_query, params, as_dict=True)

    # Calculate total
    total_cost = sum([d.get("debit_in_account_currency", 0) for d in gl_entries])

    # Show message if no data found
    if not gl_entries or total_cost == 0:
        date_range = f"من {from_date if from_date else '2025-01-01'} إلى {to_date}"
        frappe.msgprint(
            f"""<div dir='rtl'>
            <b>لم يتم العثور على قيود محاسبية</b><br><br>
            <b>الشركة:</b> {company}<br>
            <b>مركز التكلفة:</b> {cost_center}<br>
            <b>الحساب:</b> {account}<br>
            <b>الحسابات الفرعية:</b> {', '.join(child_accounts)}<br>
            <b>الفترة:</b> {date_range}<br><br>
            <i>تأكد من وجود قيود محاسبية مدينة لهذا الحساب ومركز التكلفة في الفترة المحددة</i>
            </div>""",
            title="تنبيه",
            indicator="orange"
        )
    else:
        frappe.logger().info(f"Total entries found: {len(gl_entries)}")
        frappe.logger().info(f"Accounts with data: {set([d.account for d in gl_entries])}")
        frappe.logger().info(
            f"Total Actual Cost: {total_cost} for account: {account} (including sub-accounts), cost_center: {cost_center}")

    return total_cost


# =========================================
# Finishing Contract - Sales Invoice Creation
# =========================================

@frappe.whitelist()
def make_sales_invoice(source_name):
    """
    Create Sales Invoice from Finishing Contract using custom_selling_items
    
    Args:
        source_name: Name of the Finishing Contract document
    
    Returns:
        Sales Invoice document (dict)
    """
    # Get the Finishing Contract document
    finishing_contract = frappe.get_doc("Finishing Contract", source_name)
    
    # Validate that the Finishing Contract is submitted
    if finishing_contract.docstatus != 1:
        frappe.throw("Finishing Contract must be submitted before creating Sales Invoice")
    
    # Check if selling items exist
    if not finishing_contract.get("custom_selling_items"):
        frappe.msgprint("No selling items found in this Finishing Contract")
        return None
    
    # Create new Sales Invoice
    sales_invoice = frappe.new_doc("Sales Invoice")
    sales_invoice.customer = finishing_contract.customer
    sales_invoice.company = finishing_contract.company
    sales_invoice.posting_date = frappe.utils.nowdate()
    
    # Set cost center and project if available
    if finishing_contract.cost_center:
        sales_invoice.cost_center = finishing_contract.cost_center
    if finishing_contract.project:
        sales_invoice.project = finishing_contract.project
    
    # Set currency and price list from Finishing Contract
    if finishing_contract.currency:
        sales_invoice.currency = finishing_contract.currency
    if finishing_contract.selling_price_list:
        sales_invoice.selling_price_list = finishing_contract.selling_price_list
    
    # Add items from custom_selling_items table
    for selling_item in finishing_contract.custom_selling_items:
        si_item = sales_invoice.append("items", {})
        si_item.item_code = selling_item.item_code
        si_item.item_name = selling_item.item_name
        si_item.description = selling_item.description
        si_item.qty = selling_item.qty
        si_item.uom = selling_item.uom
        si_item.rate = selling_item.rate
        
        # Set warehouse if available
        if selling_item.warehouse:
            si_item.warehouse = selling_item.warehouse
        elif finishing_contract.set_warehouse:
            si_item.warehouse = finishing_contract.set_warehouse
        
        # Set cost center and project for item
        if selling_item.cost_center:
            si_item.cost_center = selling_item.cost_center
        elif finishing_contract.cost_center:
            si_item.cost_center = finishing_contract.cost_center
            
        if selling_item.project:
            si_item.project = selling_item.project
        elif finishing_contract.project:
            si_item.project = finishing_contract.project
    
    # Return as dict
    return sales_invoice.as_dict()


# =========================================
# Finishing Contract - Delivery Note Creation
# =========================================

@frappe.whitelist()
def make_delivery_note(source_name):
    """
    Create Delivery Note from Finishing Contract using custom_selling_items
    
    Args:
        source_name: Name of the Finishing Contract document
    
    Returns:
        Delivery Note document (dict)
    """
    # Get the Finishing Contract document
    finishing_contract = frappe.get_doc("Finishing Contract", source_name)
    
    # Validate that the Finishing Contract is submitted
    if finishing_contract.docstatus != 1:
        frappe.throw("Finishing Contract must be submitted before creating Delivery Note")
    
    # Check if selling items exist
    if not finishing_contract.get("custom_selling_items"):
        frappe.msgprint("No selling items found in this Finishing Contract")
        return None
    
    # Create new Delivery Note
    delivery_note = frappe.new_doc("Delivery Note")
    delivery_note.customer = finishing_contract.customer
    delivery_note.company = finishing_contract.company
    delivery_note.posting_date = frappe.utils.nowdate()
    
    # Set cost center and project if available
    if finishing_contract.cost_center:
        delivery_note.cost_center = finishing_contract.cost_center
    if finishing_contract.project:
        delivery_note.project = finishing_contract.project
    
    # Set source warehouse from set_warehouse field
    if finishing_contract.set_warehouse:
        delivery_note.set_warehouse = finishing_contract.set_warehouse
    
    # Set currency and price list from Finishing Contract
    if finishing_contract.currency:
        delivery_note.currency = finishing_contract.currency
    if finishing_contract.selling_price_list:
        delivery_note.selling_price_list = finishing_contract.selling_price_list
    
    # Add items from custom_selling_items table
    for selling_item in finishing_contract.custom_selling_items:
        dn_item = delivery_note.append("items", {})
        dn_item.item_code = selling_item.item_code
        dn_item.item_name = selling_item.item_name
        dn_item.description = selling_item.description
        dn_item.qty = selling_item.qty
        dn_item.uom = selling_item.uom
        dn_item.rate = selling_item.rate
        
        # Set warehouse - prioritize item warehouse, then contract set_warehouse
        if selling_item.warehouse:
            dn_item.warehouse = selling_item.warehouse
        elif finishing_contract.set_warehouse:
            dn_item.warehouse = finishing_contract.set_warehouse
        
        # Set cost center and project for item
        if selling_item.cost_center:
            dn_item.cost_center = selling_item.cost_center
        elif finishing_contract.cost_center:
            dn_item.cost_center = finishing_contract.cost_center
            
        if selling_item.project:
            dn_item.project = selling_item.project
        elif finishing_contract.project:
            dn_item.project = finishing_contract.project
    
    # Return as dict
    return delivery_note.as_dict()