import frappe

# ============================================
# 🔹 ERPNext Script Report: Material Request Status
# ============================================

def execute(filters=None):
    # If filters not provided, initialize empty dict
    if not filters:
        filters = {}

    # --------------------------------------------
    # Define report columns
    # --------------------------------------------
    columns = [
        {"label": "Material Request", "fieldname": "material_request", "fieldtype": "Link", "options": "Material Request", "width": 150},
        {"label": "MR Date", "fieldname": "mr_date", "fieldtype": "Date", "width": 100},
        {"label": "MR Item Code", "fieldname": "mr_item_code", "fieldtype": "Link", "options": "Item", "width": 120},
        {"label": "MR Item Name", "fieldname": "mr_item_name", "fieldtype": "Data", "width": 180},
        {"label": "Requested Qty", "fieldname": "requested_qty", "fieldtype": "Float", "width": 100},
        {"label": "Department", "fieldname": "department", "fieldtype": "Link", "options": "Department", "width": 150},
        {"label": "Request Type", "fieldname": "request_type", "fieldtype": "Data", "width": 120},
        {"label": "Purchase Order", "fieldname": "purchase_order", "fieldtype": "Link", "options": "Purchase Order", "width": 120},
        {"label": "PO Date", "fieldname": "po_date", "fieldtype": "Date", "width": 100},
        {"label": "PO Qty", "fieldname": "po_qty", "fieldtype": "Float", "width": 100},
        {"label": "PO Rate", "fieldname": "po_rate", "fieldtype": "Currency", "width": 100},
        {"label": "PO Amount", "fieldname": "po_amount", "fieldtype": "Currency", "width": 120},
        {"label": "Purchase Receipt", "fieldname": "purchase_receipt", "fieldtype": "Link", "options": "Purchase Receipt", "width": 120},
        {"label": "Receipt Date", "fieldname": "receipt_date", "fieldtype": "Date", "width": 100},
        {"label": "Received Qty", "fieldname": "received_qty", "fieldtype": "Float", "width": 100},
        {"label": "Received Rate", "fieldname": "received_rate", "fieldtype": "Currency", "width": 100},
        {"label": "Received Amount", "fieldname": "received_amount", "fieldtype": "Currency", "width": 120},
        {"label": "Purchase Invoice", "fieldname": "purchase_invoice", "fieldtype": "Link", "options": "Purchase Invoice", "width": 120},
        {"label": "Invoice Date", "fieldname": "invoice_date", "fieldtype": "Date", "width": 100},
        {"label": "Invoiced Qty", "fieldname": "invoiced_qty", "fieldtype": "Float", "width": 100},
        {"label": "Invoiced Rate", "fieldname": "invoiced_rate", "fieldtype": "Currency", "width": 100},
        {"label": "Invoiced Amount", "fieldname": "invoiced_amount", "fieldtype": "Currency", "width": 120},
        {"label": "Supplier", "fieldname": "supplier", "fieldtype": "Link", "options": "Supplier", "width": 150},
        {"label": "Stock Entry", "fieldname": "stock_entry", "fieldtype": "Link", "options": "Stock Entry", "width": 120},
        {"label": "Stock Entry Date", "fieldname": "stock_entry_date", "fieldtype": "Date", "width": 100},
        {"label": "Purpose", "fieldname": "purpose", "fieldtype": "Data", "width": 120},
        {"label": "Issued Qty", "fieldname": "issued_qty", "fieldtype": "Float", "width": 100},
        {"label": "Company", "fieldname": "company", "fieldtype": "Link", "options": "Company", "width": 150},
    ]

    # --------------------------------------------
    # Build dynamic WHERE conditions
    # --------------------------------------------
    conditions = []
    params = {}

    # Company filter - optional
    if filters.get("company"):
        conditions.append("mr.company = %(company)s")
        params["company"] = filters.get("company")

    # Date range filter - optional
    if filters.get("from_date"):
        conditions.append("mr.transaction_date >= %(from_date)s")
        params["from_date"] = filters.get("from_date")

    if filters.get("to_date"):
        conditions.append("mr.transaction_date <= %(to_date)s")
        params["to_date"] = filters.get("to_date")

    # Department filter - optional
    if filters.get("department"):
        conditions.append("mr.department = %(department)s")
        params["department"] = filters.get("department")

    # Build WHERE clause
    where_clause = " AND ".join(conditions) if conditions else "1=1"

    # Add the mandatory condition for related documents
    where_clause += " AND (po.name IS NOT NULL OR pr.name IS NOT NULL OR pi.name IS NOT NULL OR se.name IS NOT NULL)"

    # --------------------------------------------
    # SQL query execution with dynamic WHERE
    # --------------------------------------------
    query = f"""
        SELECT
            mr.name AS material_request,
            mr.transaction_date AS mr_date,
            mr_item.item_code AS mr_item_code,
            mr_item.item_name AS mr_item_name,
            mr_item.qty AS requested_qty,
            mr.department AS department,
            mr.material_request_type AS request_type,
            MIN(po.name) AS purchase_order,
            MIN(po.transaction_date) AS po_date,
            SUM(po_item.qty) AS po_qty,
            ROUND(AVG(po_item.rate), 2) AS po_rate,
            ROUND(SUM(po_item.amount), 2) AS po_amount,
            MIN(pr.name) AS purchase_receipt,
            MIN(pr.posting_date) AS receipt_date,
            SUM(pr_item.qty) AS received_qty,
            ROUND(AVG(pr_item.rate), 2) AS received_rate,
            ROUND(SUM(pr_item.amount), 2) AS received_amount,
            MIN(pi.name) AS purchase_invoice,
            MIN(pi.posting_date) AS invoice_date,
            SUM(pi_item.qty) AS invoiced_qty,
            ROUND(AVG(pi_item.rate), 2) AS invoiced_rate,
            ROUND(SUM(pi_item.amount), 2) AS invoiced_amount,
            MIN(pi.supplier) AS supplier,
            MIN(se.name) AS stock_entry,
            MIN(se.posting_date) AS stock_entry_date,
            MIN(se.purpose) AS purpose,
            SUM(se_item.qty) AS issued_qty,
            mr.company AS company
        FROM
            `tabMaterial Request Item` mr_item
            INNER JOIN `tabMaterial Request` mr 
                ON mr.name = mr_item.parent AND mr.docstatus != 2
            LEFT JOIN `tabPurchase Order Item` po_item 
                ON po_item.material_request = mr.name AND po_item.item_code = mr_item.item_code
            LEFT JOIN `tabPurchase Order` po 
                ON po.name = po_item.parent AND po.docstatus != 2
            LEFT JOIN `tabPurchase Receipt Item` pr_item 
                ON pr_item.purchase_order = po.name AND pr_item.item_code = mr_item.item_code
            LEFT JOIN `tabPurchase Receipt` pr 
                ON pr.name = pr_item.parent AND pr.docstatus != 2
            LEFT JOIN `tabPurchase Invoice Item` pi_item 
                ON (pi_item.purchase_receipt = pr.name OR pi_item.purchase_order = po.name)
                AND pi_item.item_code = mr_item.item_code
            LEFT JOIN `tabPurchase Invoice` pi 
                ON pi.name = pi_item.parent AND pi.docstatus != 2
            LEFT JOIN `tabStock Entry Detail` se_item 
                ON se_item.material_request = mr.name AND se_item.item_code = mr_item.item_code AND se_item.docstatus = 1
            LEFT JOIN `tabStock Entry` se 
                ON se.name = se_item.parent AND se.docstatus = 1
        WHERE
            {where_clause}
        GROUP BY
            mr_item.name, mr.name, mr.transaction_date, mr_item.item_code, mr_item.item_name,
            mr_item.qty, mr.material_request_type, mr.company, mr.department
        ORDER BY
            mr.transaction_date DESC, mr.name, mr_item.item_code
    """

    data = frappe.db.sql(query, params, as_dict=True)

    return columns, data