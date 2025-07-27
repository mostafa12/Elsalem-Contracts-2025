frappe.ui.form.on('Finishing Contract', {
    refresh: function(frm) {
        // Only show button after submit
        if (frm.doc.docstatus === 1) {
            frm.add_custom_button(__('Sales Invoice'), function() {
                // Open new Sales Invoice with customer pre-filled
                frappe.new_doc('Sales Invoice', {
                    customer: frm.doc.customer
                });
            }, __('Create'));
        }
    }
});








// // Copyright (c) 2025, hossam and contributors
// // For license information, please see license.txt
//
// frappe.ui.form.on('Finishing Contract', {
// 	// refresh: function(frm) {
//
// 	// }
// });


// Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
// License: GNU General Public License v3. See license.txt
//
// {% include 'erpnext/selling/sales_common.js' %}
//
// frappe.ui.form.on("Finishing Contract", {
// 	setup: function(frm) {
// 		frm.custom_make_buttons = {
// 			'Delivery Note': 'Delivery Note',
// 			'Pick List': 'Pick List',
// 			'Sales Invoice': 'Sales Invoice',
// 			'Material Request': 'Material Request',
// 			'Purchase Order': 'Purchase Order',
// 			'Project': 'Project',
// 			'Payment Entry': "Payment",
// 			'Work Order': "Work Order"
// 		}
// 		frm.add_fetch('customer', 'tax_id', 'tax_id');
//
// 		// formatter for material request item
// 		frm.set_indicator_formatter('item_code',
// 			function(doc) { return (doc.stock_qty<=doc.delivered_qty) ? "green" : "orange" })
//
// 		frm.set_query('company_address', function(doc) {
// 			if(!doc.company) {
// 				frappe.throw(__('Please set Company'));
// 			}
//
// 			return {
// 				query: 'frappe.contacts.doctype.address.address.address_query',
// 				filters: {
// 					link_doctype: 'Company',
// 					link_name: doc.company
// 				}
// 			};
// 		})
//
// 		frm.set_query("bom_no", "items", function(doc, cdt, cdn) {
// 			var row = locals[cdt][cdn];
// 			return {
// 				filters: {
// 					"item": row.item_code
// 				}
// 			}
// 		});
//
// 		frm.set_df_property('packed_items', 'cannot_add_rows', true);
// 		frm.set_df_property('packed_items', 'cannot_delete_rows', true);
// 	},
// 	refresh: function(frm) {
// 		if(frm.doc.docstatus === 1 && frm.doc.status !== 'Closed'
// 			&& flt(frm.doc.per_delivered, 6) < 100 && flt(frm.doc.per_billed, 6) < 100) {
// 			frm.add_custom_button(__('Update Items'), () => {
// 				erpnext.utils.update_child_items({
// 					frm: frm,
// 					child_docname: "items",
// 					child_doctype: "Sales Order Detail",
// 					cannot_add_row: false,
// 				})
// 			});
// 		}
// 	},
// 	onload: function(frm) {
// 		if (!frm.doc.transaction_date){
// 			frm.set_value('transaction_date', frappe.datetime.get_today())
// 		}
// 		erpnext.queries.setup_queries(frm, "Warehouse", function() {
// 			return {
// 				filters: [
// 					["Warehouse", "company", "in", ["", cstr(frm.doc.company)]],
// 				]
// 			};
// 		});
//
// 		frm.set_query('project', function(doc, cdt, cdn) {
// 			return {
// 				query: "erpnext.controllers.queries.get_project_name",
// 				filters: {
// 					'customer': doc.customer
// 				}
// 			}
// 		});
//
// 		frm.set_query('warehouse', 'items', function(doc, cdt, cdn) {
// 			let row  = locals[cdt][cdn];
// 			let query = {
// 				filters: [
// 					["Warehouse", "company", "in", ["", cstr(frm.doc.company)]],
// 				]
// 			};
// 			if (row.item_code) {
// 				query.query = "erpnext.controllers.queries.warehouse_query";
// 				query.filters.push(["Bin", "item_code", "=", row.item_code]);
// 			}
// 			return query;
// 		});
//
// 		// On cancel and amending a sales order with advance payment, reset advance paid amount
// 		if (frm.is_new()) {
// 			frm.set_value("advance_paid", 0)
// 		}
//
// 		frm.ignore_doctypes_on_cancel_all = ['Purchase Order'];
// 	},
//
// 	delivery_date: function(frm) {
// 		$.each(frm.doc.items || [], function(i, d) {
// 			if(!d.delivery_date) d.delivery_date = frm.doc.delivery_date;
// 		});
// 		refresh_field("items");
// 	}
// });
//
// frappe.ui.form.on("Sales Order Item", {
// 	item_code: function(frm,cdt,cdn) {
// 		var row = locals[cdt][cdn];
// 		if (frm.doc.delivery_date) {
// 			row.delivery_date = frm.doc.delivery_date;
// 			refresh_field("delivery_date", cdn, "items");
// 		} else {
// 			frm.script_manager.copy_from_first_row("items", row, ["delivery_date"]);
// 		}
// 	},
// 	delivery_date: function(frm, cdt, cdn) {
// 		if(!frm.doc.delivery_date) {
// 			erpnext.utils.copy_value_in_all_rows(frm.doc, cdt, cdn, "items", "delivery_date");
// 		}
// 	}
// });
//
// erpnext.selling.SalesOrderController = erpnext.selling.SellingController.extend({
// 	onload: function(doc, dt, dn) {
// 		this._super();
// 	},
//
// 	refresh: function(doc, dt, dn) {
// 		var me = this;
// 		this._super();
// 		let allow_delivery = false;
//
// 		if (doc.docstatus==1) {
//
// 			if(this.frm.has_perm("submit")) {
// 				if(doc.status === 'On Hold') {
// 				   // un-hold
// 				   this.frm.add_custom_button(__('Resume'), function() {
// 					   me.frm.cscript.update_status('Resume', 'Draft')
// 				   }, __("Status"));
//
// 				   if(flt(doc.per_delivered, 6) < 100 || flt(doc.per_billed) < 100) {
// 					   // close
// 					   this.frm.add_custom_button(__('Close'), () => this.close_sales_order(), __("Status"))
// 				   }
// 				}
// 			   	else if(doc.status === 'Closed') {
// 				   // un-close
// 				   this.frm.add_custom_button(__('Re-open'), function() {
// 					   me.frm.cscript.update_status('Re-open', 'Draft')
// 				   }, __("Status"));
// 			   }
// 			}
// 			if(doc.status !== 'Closed') {
// 				if(doc.status !== 'On Hold') {
// 					allow_delivery = this.frm.doc.items.some(item => item.delivered_by_supplier === 0 && item.qty > flt(item.delivered_qty))
// 						&& !this.frm.doc.skip_delivery_note
//
// 					if (this.frm.has_perm("submit")) {
// 						if(flt(doc.per_delivered, 6) < 100 || flt(doc.per_billed) < 100) {
// 							// hold
// 							this.frm.add_custom_button(__('Hold'), () => this.hold_sales_order(), __("Status"))
// 							// close
// 							this.frm.add_custom_button(__('Close'), () => this.close_sales_order(), __("Status"))
// 						}
// 					}
//
// 					if (flt(doc.per_picked, 6) < 100 && flt(doc.per_delivered, 6) < 100) {
// 						this.frm.add_custom_button(__('Pick List'), () => this.create_pick_list(), __('Create'));
// 					}
//
// 					const order_is_a_sale = ["Sales", "Shopping Cart"].indexOf(doc.order_type) !== -1;
// 					const order_is_maintenance = ["Maintenance"].indexOf(doc.order_type) !== -1;
// 					// order type has been customised then show all the action buttons
// 					const order_is_a_custom_sale = ["Sales", "Shopping Cart", "Maintenance"].indexOf(doc.order_type) === -1;
//
// 					// delivery note
// 					if(flt(doc.per_delivered, 6) < 100 && (order_is_a_sale || order_is_a_custom_sale) && allow_delivery) {
// 						this.frm.add_custom_button(__('Delivery Note'), () => this.make_delivery_note_based_on_delivery_date(), __('Create'));
// 						this.frm.add_custom_button(__('Work Order'), () => this.make_work_order(), __('Create'));
// 					}
//
// 					// sales invoice
// 					if(flt(doc.per_billed, 6) < 100) {
// 						this.frm.add_custom_button(__('Sales Invoice'), () => me.make_sales_invoice(), __('Create'));
// 					}
//
// 					// material request
// 					if(!doc.order_type || (order_is_a_sale || order_is_a_custom_sale) && flt(doc.per_delivered, 6) < 100) {
// 						this.frm.add_custom_button(__('Material Request'), () => this.make_material_request(), __('Create'));
// 						this.frm.add_custom_button(__('Request for Raw Materials'), () => this.make_raw_material_request(), __('Create'));
// 					}
//
// 					// Make Purchase Order
// 					if (!this.frm.doc.is_internal_customer) {
// 						this.frm.add_custom_button(__('Purchase Order'), () => this.make_purchase_order(), __('Create'));
// 					}
//
// 					// maintenance
// 					if(flt(doc.per_delivered, 2) < 100 && (order_is_maintenance || order_is_a_custom_sale)) {
// 						this.frm.add_custom_button(__('Maintenance Visit'), () => this.make_maintenance_visit(), __('Create'));
// 						this.frm.add_custom_button(__('Maintenance Schedule'), () => this.make_maintenance_schedule(), __('Create'));
// 					}
//
// 					// project
// 					if(flt(doc.per_delivered, 2) < 100) {
// 							this.frm.add_custom_button(__('Project'), () => this.make_project(), __('Create'));
// 					}
//
// 					if(!doc.auto_repeat) {
// 						this.frm.add_custom_button(__('Subscription'), function() {
// 							erpnext.utils.make_subscription(doc.doctype, doc.name)
// 						}, __('Create'))
// 					}
//
// 					if (doc.docstatus === 1 && !doc.inter_company_order_reference) {
// 						let me = this;
// 						let internal = me.frm.doc.is_internal_customer;
// 						if (internal) {
// 							let button_label = (me.frm.doc.company === me.frm.doc.represents_company) ? "Internal Purchase Order" :
// 								"Inter Company Purchase Order";
//
// 							me.frm.add_custom_button(button_label, function() {
// 								me.make_inter_company_order();
// 							}, __('Create'));
// 						}
// 					}
// 				}
// 				// payment request
// 				if(flt(doc.per_billed, precision('per_billed', doc)) < 100 + frappe.boot.sysdefaults.over_billing_allowance) {
// 					this.frm.add_custom_button(__('Payment Request'), () => this.make_payment_request(), __('Create'));
// 					this.frm.add_custom_button(__('Payment'), () => this.make_payment_entry(), __('Create'));
// 				}
// 				this.frm.page.set_inner_btn_group_as_primary(__('Create'));
// 			}
// 		}
//
// 		if (this.frm.doc.docstatus===0) {
// 			this.frm.add_custom_button(__('Quotation'),
// 				function() {
// 					erpnext.utils.map_current_doc({
// 						method: "erpnext.selling.doctype.quotation.quotation.make_sales_order",
// 						source_doctype: "Quotation",
// 						target: me.frm,
// 						setters: [
// 							{
// 								label: "Customer",
// 								fieldname: "party_name",
// 								fieldtype: "Link",
// 								options: "Customer",
// 								default: me.frm.doc.customer || undefined
// 							}
// 						],
// 						get_query_filters: {
// 							company: me.frm.doc.company,
// 							docstatus: 1,
// 							status: ["!=", "Lost"]
// 						}
// 					})
// 				}, __("Get Items From"));
// 		}
//
// 		this.order_type(doc);
// 	},
//
// 	create_pick_list() {
// 		frappe.model.open_mapped_doc({
// 			method: "erpnext.selling.doctype.sales_order.sales_order.create_pick_list",
// 			frm: this.frm
// 		})
// 	},
//
// 	make_work_order() {
// 		var me = this;
// 		me.frm.call({
// 			method: "erpnext.selling.doctype.sales_order.sales_order.get_work_order_items",
// 			args: {
// 				sales_order: this.frm.docname,
// 			},
// 			freeze: true,
// 			callback: function(r) {
// 				if(!r.message) {
// 					frappe.msgprint({
// 						title: __('Work Order not created'),
// 						message: __('No Items with Bill of Materials to Manufacture'),
// 						indicator: 'orange'
// 					});
// 					return;
// 				}
// 				else {
// 					const fields = [{
// 						label: 'Items',
// 						fieldtype: 'Table',
// 						fieldname: 'items',
// 						description: __('Select BOM and Qty for Production'),
// 						fields: [{
// 							fieldtype: 'Read Only',
// 							fieldname: 'item_code',
// 							label: __('Item Code'),
// 							in_list_view: 1
// 						}, {
// 							fieldtype: 'Link',
// 							fieldname: 'bom',
// 							options: 'BOM',
// 							reqd: 1,
// 							label: __('Select BOM'),
// 							in_list_view: 1,
// 							get_query: function (doc) {
// 								return { filters: { item: doc.item_code } };
// 							}
// 						}, {
// 							fieldtype: 'Float',
// 							fieldname: 'pending_qty',
// 							reqd: 1,
// 							label: __('Qty'),
// 							in_list_view: 1
// 						}, {
// 							fieldtype: 'Data',
// 							fieldname: 'sales_order_item',
// 							reqd: 1,
// 							label: __('Sales Order Item'),
// 							hidden: 1
// 						}],
// 						data: r.message,
// 						get_data: () => {
// 							return r.message
// 						}
// 					}]
// 					var d = new frappe.ui.Dialog({
// 						title: __('Select Items to Manufacture'),
// 						fields: fields,
// 						primary_action: function() {
// 							var data = {items: d.fields_dict.items.grid.get_selected_children()};
// 							me.frm.call({
// 								method: 'make_work_orders',
// 								args: {
// 									items: data,
// 									company: me.frm.doc.company,
// 									sales_order: me.frm.docname,
// 									project: me.frm.project
// 								},
// 								freeze: true,
// 								callback: function(r) {
// 									if(r.message) {
// 										frappe.msgprint({
// 											message: __('Work Orders Created: {0}', [r.message.map(function(d) {
// 													return repl('<a href="/app/work-order/%(name)s">%(name)s</a>', {name:d})
// 												}).join(', ')]),
// 											indicator: 'green'
// 										})
// 									}
// 									d.hide();
// 								}
// 							});
// 						},
// 						primary_action_label: __('Create')
// 					});
// 					d.show();
// 				}
// 			}
// 		});
// 	},
//
// 	order_type: function() {
// 		this.toggle_delivery_date();
// 	},
//
// 	tc_name: function() {
// 		this.get_terms();
// 	},
//
// 	make_material_request: function() {
// 		frappe.model.open_mapped_doc({
// 			method: "erpnext.selling.doctype.sales_order.sales_order.make_material_request",
// 			frm: this.frm
// 		})
// 	},
//
// 	skip_delivery_note: function() {
// 		this.toggle_delivery_date();
// 	},
//
// 	toggle_delivery_date: function() {
// 		this.frm.fields_dict.items.grid.toggle_reqd("delivery_date",
// 			(this.frm.doc.order_type == "Sales" && !this.frm.doc.skip_delivery_note));
// 	},
//
// 	make_raw_material_request: function() {
// 		var me = this;
// 		this.frm.call({
// 			method: "erpnext.selling.doctype.sales_order.sales_order.get_work_order_items",
// 			args: {
// 				sales_order: this.frm.docname,
// 				for_raw_material_request: 1
// 			},
// 			callback: function(r) {
// 				if(!r.message) {
// 					frappe.msgprint({
// 						message: __('No Items with Bill of Materials.'),
// 						indicator: 'orange'
// 					});
// 					return;
// 				}
// 				else {
// 					me.make_raw_material_request_dialog(r);
// 				}
// 			}
// 		});
// 	},
//
// 	make_raw_material_request_dialog: function(r) {
// 		var me = this;
// 		var fields = [
// 			{fieldtype:'Check', fieldname:'include_exploded_items',
// 				label: __('Include Exploded Items')},
// 			{fieldtype:'Check', fieldname:'ignore_existing_ordered_qty',
// 				label: __('Ignore Existing Ordered Qty')},
// 			{
// 				fieldtype:'Table', fieldname: 'items',
// 				description: __('Select BOM, Qty and For Warehouse'),
// 				fields: [
// 					{fieldtype:'Read Only', fieldname:'item_code',
// 						label: __('Item Code'), in_list_view:1},
// 					{fieldtype:'Link', fieldname:'warehouse', options: 'Warehouse',
// 						label: __('For Warehouse'), in_list_view:1},
// 					{fieldtype:'Link', fieldname:'bom', options: 'BOM', reqd: 1,
// 						label: __('BOM'), in_list_view:1, get_query: function(doc) {
// 							return {filters: {item: doc.item_code}};
// 						}
// 					},
// 					{fieldtype:'Float', fieldname:'required_qty', reqd: 1,
// 						label: __('Qty'), in_list_view:1},
// 				],
// 				data: r.message,
// 				get_data: function() {
// 					return r.message
// 				}
// 			}
// 		]
// 		var d = new frappe.ui.Dialog({
// 			title: __("Items for Raw Material Request"),
// 			fields: fields,
// 			primary_action: function() {
// 				var data = d.get_values();
// 				me.frm.call({
// 					method: 'erpnext.selling.doctype.sales_order.sales_order.make_raw_material_request',
// 					args: {
// 						items: data,
// 						company: me.frm.doc.company,
// 						sales_order: me.frm.docname,
// 						project: me.frm.project
// 					},
// 					freeze: true,
// 					callback: function(r) {
// 						if(r.message) {
// 							frappe.msgprint(__('Material Request {0} submitted.',
// 							['<a href="/app/material-request/'+r.message.name+'">' + r.message.name+ '</a>']));
// 						}
// 						d.hide();
// 						me.frm.reload_doc();
// 					}
// 				});
// 			},
// 			primary_action_label: __('Create')
// 		});
// 		d.show();
// 	},
//
// 	make_delivery_note_based_on_delivery_date: function() {
// 		var me = this;
//
// 		var delivery_dates = this.frm.doc.items.map(i => i.delivery_date);
// 		delivery_dates = [ ...new Set(delivery_dates) ];
//
// 		var item_grid = this.frm.fields_dict["items"].grid;
// 		if(!item_grid.get_selected().length && delivery_dates.length > 1) {
// 			var dialog = new frappe.ui.Dialog({
// 				title: __("Select Items based on Delivery Date"),
// 				fields: [{fieldtype: "HTML", fieldname: "dates_html"}]
// 			});
//
// 			var html = $(`
// 				<div style="border: 1px solid #d1d8dd">
// 					<div class="list-item list-item--head">
// 						<div class="list-item__content list-item__content--flex-2">
// 							${__('Delivery Date')}
// 						</div>
// 					</div>
// 					${delivery_dates.map(date => `
// 						<div class="list-item">
// 							<div class="list-item__content list-item__content--flex-2">
// 								<label>
// 								<input type="checkbox" data-date="${date}" checked="checked"/>
// 								${frappe.datetime.str_to_user(date)}
// 								</label>
// 							</div>
// 						</div>
// 					`).join("")}
// 				</div>
// 			`);
//
// 			var wrapper = dialog.fields_dict.dates_html.$wrapper;
// 			wrapper.html(html);
//
// 			dialog.set_primary_action(__("Select"), function() {
// 				var dates = wrapper.find('input[type=checkbox]:checked')
// 					.map((i, el) => $(el).attr('data-date')).toArray();
//
// 				if(!dates) return;
//
// 				me.make_delivery_note(dates);
// 				dialog.hide();
// 			});
// 			dialog.show();
// 		} else {
// 			this.make_delivery_note();
// 		}
// 	},
//
// 	make_delivery_note: function(delivery_dates) {
// 		frappe.model.open_mapped_doc({
// 			method: "erpnext.selling.doctype.sales_order.sales_order.make_delivery_note",
// 			frm: this.frm,
// 			args: {
// 				delivery_dates
// 			}
// 		})
// 	},
//
// 	make_sales_invoice: function() {
// 		frappe.model.open_mapped_doc({
// 			method: "erpnext.selling.doctype.sales_order.sales_order.make_sales_invoice",
// 			frm: this.frm
// 		})
// 	},
//
// 	make_maintenance_schedule: function() {
// 		frappe.model.open_mapped_doc({
// 			method: "erpnext.selling.doctype.sales_order.sales_order.make_maintenance_schedule",
// 			frm: this.frm
// 		})
// 	},
//
// 	make_project: function() {
// 		frappe.model.open_mapped_doc({
// 			method: "erpnext.selling.doctype.sales_order.sales_order.make_project",
// 			frm: this.frm
// 		})
// 	},
//
// 	make_inter_company_order: function() {
// 		frappe.model.open_mapped_doc({
// 			method: "erpnext.selling.doctype.sales_order.sales_order.make_inter_company_purchase_order",
// 			frm: this.frm
// 		});
// 	},
//
// 	make_maintenance_visit: function() {
// 		frappe.model.open_mapped_doc({
// 			method: "erpnext.selling.doctype.sales_order.sales_order.make_maintenance_visit",
// 			frm: this.frm
// 		})
// 	},
//
// 	make_purchase_order: function(){
// 		let pending_items = this.frm.doc.items.some((item) =>{
// 			let pending_qty = flt(item.stock_qty) - flt(item.ordered_qty);
// 			return pending_qty > 0;
// 		})
// 		if(!pending_items){
// 			frappe.throw({message: __("Purchase Order already created for all Sales Order items"), title: __("Note")});
// 		}
//
// 		var me = this;
// 		var dialog = new frappe.ui.Dialog({
// 			title: __("Select Items"),
// 			size: "large",
// 			fields: [
// 				{
// 					"fieldtype": "Check",
// 					"label": __("Against Default Supplier"),
// 					"fieldname": "against_default_supplier",
// 					"default": 0
// 				},
// 				{
// 					fieldname: 'items_for_po', fieldtype: 'Table', label: 'Select Items',
// 					fields: [
// 						{
// 							fieldtype:'Data',
// 							fieldname:'item_code',
// 							label: __('Item'),
// 							read_only:1,
// 							in_list_view:1
// 						},
// 						{
// 							fieldtype:'Data',
// 							fieldname:'item_name',
// 							label: __('Item name'),
// 							read_only:1,
// 							in_list_view:1
// 						},
// 						{
// 							fieldtype:'Float',
// 							fieldname:'pending_qty',
// 							label: __('Pending Qty'),
// 							read_only: 1,
// 							in_list_view:1
// 						},
// 						{
// 							fieldtype:'Link',
// 							read_only:1,
// 							fieldname:'uom',
// 							label: __('UOM'),
// 							in_list_view:1,
// 						},
// 						{
// 							fieldtype:'Data',
// 							fieldname:'supplier',
// 							label: __('Supplier'),
// 							read_only:1,
// 							in_list_view:1
// 						},
// 					]
// 				}
// 			],
// 			primary_action_label: 'Create Purchase Order',
// 			primary_action (args) {
// 				if (!args) return;
//
// 				let selected_items = dialog.fields_dict.items_for_po.grid.get_selected_children();
// 				if(selected_items.length == 0) {
// 					frappe.throw({message: 'Please select Items from the Table', title: __('Items Required'), indicator:'blue'})
// 				}
//
// 				dialog.hide();
//
// 				var method = args.against_default_supplier ? "make_purchase_order_for_default_supplier" : "make_purchase_order"
// 				return frappe.call({
// 					method: "erpnext.selling.doctype.sales_order.sales_order." + method,
// 					freeze: true,
// 					freeze_message: __("Creating Purchase Order ..."),
// 					args: {
// 						"source_name": me.frm.doc.name,
// 						"selected_items": selected_items
// 					},
// 					freeze: true,
// 					callback: function(r) {
// 						if(!r.exc) {
// 							if (!args.against_default_supplier) {
// 								frappe.model.sync(r.message);
// 								frappe.set_route("Form", r.message.doctype, r.message.name);
// 							}
// 							else {
// 								frappe.route_options = {
// 									"sales_order": me.frm.doc.name
// 								}
// 								frappe.set_route("List", "Purchase Order");
// 							}
// 						}
// 					}
// 				})
// 			}
// 		});
//
// 		dialog.fields_dict["against_default_supplier"].df.onchange = () => set_po_items_data(dialog);
//
// 		function set_po_items_data (dialog) {
// 			var against_default_supplier = dialog.get_value("against_default_supplier");
// 			var items_for_po = dialog.get_value("items_for_po");
//
// 			if (against_default_supplier) {
// 				let items_with_supplier = items_for_po.filter((item) => item.supplier)
//
// 				dialog.fields_dict["items_for_po"].df.data = items_with_supplier;
// 				dialog.get_field("items_for_po").refresh();
// 			} else {
// 				let po_items = [];
// 				me.frm.doc.items.forEach(d => {
// 					let ordered_qty = me.get_ordered_qty(d, me.frm.doc);
// 					let pending_qty = (flt(d.stock_qty) - ordered_qty) / flt(d.conversion_factor);
// 					if (pending_qty > 0) {
// 						po_items.push({
// 							"doctype": "Sales Order Item",
// 							"name": d.name,
// 							"item_name": d.item_name,
// 							"item_code": d.item_code,
// 							"pending_qty": pending_qty,
// 							"uom": d.uom,
// 							"supplier": d.supplier
// 						});
// 					}
// 				});
//
// 				dialog.fields_dict["items_for_po"].df.data = po_items;
// 				dialog.get_field("items_for_po").refresh();
// 			}
// 		}
//
// 		set_po_items_data(dialog);
// 		dialog.get_field("items_for_po").grid.only_sortable();
// 		dialog.get_field("items_for_po").refresh();
// 		dialog.wrapper.find('.grid-heading-row .grid-row-check').click();
// 		dialog.show();
// 	},
//
// 	get_ordered_qty: function(item, so) {
// 		let ordered_qty = item.ordered_qty;
// 		if (so.packed_items && so.packed_items.length) {
// 			// calculate ordered qty based on packed items in case of product bundle
// 			let packed_items = so.packed_items.filter(
// 				(pi) => pi.parent_detail_docname == item.name
// 			);
// 			if (packed_items && packed_items.length) {
// 				ordered_qty = packed_items.reduce(
// 					(sum, pi) => sum + flt(pi.ordered_qty),
// 					0
// 				);
// 				ordered_qty = ordered_qty / packed_items.length;
// 			}
// 		}
// 		return ordered_qty;
// 	},
//
// 	hold_sales_order: function(){
// 		var me = this;
// 		var d = new frappe.ui.Dialog({
// 			title: __('Reason for Hold'),
// 			fields: [
// 				{
// 					"fieldname": "reason_for_hold",
// 					"fieldtype": "Text",
// 					"reqd": 1,
// 				}
// 			],
// 			primary_action: function() {
// 				var data = d.get_values();
// 				frappe.call({
// 					method: "frappe.desk.form.utils.add_comment",
// 					args: {
// 						reference_doctype: me.frm.doctype,
// 						reference_name: me.frm.docname,
// 						content: __('Reason for hold: ')+data.reason_for_hold,
// 						comment_email: frappe.session.user,
// 						comment_by: frappe.session.user_fullname
// 					},
// 					callback: function(r) {
// 						if(!r.exc) {
// 							me.update_status('Hold', 'On Hold')
// 							d.hide();
// 						}
// 					}
// 				});
// 			}
// 		});
// 		d.show();
// 	},
// 	close_sales_order: function(){
// 		this.frm.cscript.update_status("Close", "Closed")
// 	},
// 	update_status: function(label, status){
// 		var doc = this.frm.doc;
// 		var me = this;
// 		frappe.ui.form.is_saving = true;
// 		frappe.call({
// 			method: "erpnext.selling.doctype.sales_order.sales_order.update_status",
// 			args: {status: status, name: doc.name},
// 			callback: function(r){
// 				me.frm.reload_doc();
// 			},
// 			always: function() {
// 				frappe.ui.form.is_saving = false;
// 			}
// 		});
// 	}
// });
// $.extend(cur_frm.cscript, new erpnext.selling.SalesOrderController({frm: cur_frm}));


// hossam add this code


frappe.ui.form.on('Finishing Contract Item', {
    items_add(frm, cdt, cdn) {
        initialize_new_item(frm, cdt, cdn);
    },

    business_statement_doctype(frm, cdt, cdn) {
        handle_doctype_change(frm, cdt, cdn);
    },

    current_qty(frm, cdt, cdn) {
        calculate_item_totals(frm, cdt, cdn);
    },

    rate(frm, cdt, cdn) {
        calculate_item_totals(frm, cdt, cdn);
    },

    business_statement_num(frm, cdt, cdn) {
        handle_item_selection(frm, cdt, cdn);
    },

    uom(frm, cdt, cdn) {
        handle_uom_change(frm, cdt, cdn);
    },

    is_group_(frm, cdt, cdn) {
        handle_group_toggle(frm, cdt, cdn);
    }
});

// === MAIN FUNCTIONS ===

function validate_and_calculate_items(frm) {
    let total_of_items = 0;
    let total_quantity = 0;
    const errors = [];

    (frm.doc.items || []).forEach(function(item, idx) {
        if (item.is_group_ || item.business_statement_doctype === "Item Group") return;

        const validation_errors = validate_item_fields(item, idx);
        if (validation_errors.length > 0) {
            errors.push(`Row ${idx + 1}: ${validation_errors.join(", ")}`);
            return;
        }

        const calculation_result = calculate_item_values(item);
        if (!calculation_result.success) {
            errors.push(`Row ${idx + 1}: ${calculation_result.error}`);
            return;
        }

        Object.assign(item, calculation_result.values);
        total_of_items += calculation_result.values.total;
        total_quantity += calculation_result.values.current_qty;
    });

    if (errors.length > 0) {
        frappe.throw(`Validation errors found:<br><b>${errors.join("<br>")}</b>`);
    }

    frm.set_value("total_of_items", total_of_items);
    frm.set_value("total_quantity", total_quantity);
    frm.refresh_field("items");
}

function validate_item_fields(item) {
    const missing = [];
    if (!item.uom) missing.push("UOM");
    if (!item.default_uom) missing.push("Default UOM");
    if (!is_valid_number(item.current_qty)) missing.push("Current Qty");
    if (!is_valid_number(item.rate)) missing.push("Rate");
    return missing;
}

function calculate_item_values(item) {
    try {
        const previous_qty = parseFloat(item.previous_qty || 0);
        const current_qty = parseFloat(item.current_qty || 0);
        const rate = parseFloat(item.rate || 0);
        const total_qty = current_qty + previous_qty;
        const total = total_qty * rate;

        if (!isFinite(total) || !isFinite(total_qty)) {
            return { success: false, error: "Invalid calculation result" };
        }

        return {
            success: true,
            values: {
                total_qty: total_qty,
                total: total,
                current_qty: current_qty
            }
        };
    } catch (e) {
        return { success: false, error: "Calculation error: " + e.message };
    }
}

function validate_accounts(frm) {
    const missing_accounts = [];

    (frm.doc.items || []).forEach((item, idx) => {
        if (!item.account || item.account === '') {
            missing_accounts.push(`Row ${idx + 1} (${item.business_statement_num || 'Unknown Item'})`);
        }
    });

    if (missing_accounts.length > 0) {
        frappe.throw(`Missing accounts for:<br><b>${missing_accounts.join("<br>")}</b>`);
    }
}

function setup_business_statement_query(frm) {
    if (frm.business_statement_query_setup) return;

    frappe.meta.get_docfield("Contracts Item", "business_statement_num", frm.doc.name).get_query = function(doc, cdt, cdn) {
        const row = locals[cdt][cdn];
        const filters = {};

        if (row.business_statement_doctype === "Item") {
            const last_group = find_last_group_above_row(doc, cdn);
            if (last_group?.business_statement_num) {
                filters['item_group'] = last_group.business_statement_num;
            }
        }

        return {
            doctype: row.business_statement_doctype,
            filters: filters
        };
    };

    frm.business_statement_query_setup = true;
}

function find_last_group_above_row(doc, cdn) {
    const items = doc.items || [];
    const current_index = items.findIndex(item => item.name === cdn);
    if (current_index < 0) return null;

    for (let i = current_index; i >= 0; i--) {
        if (items[i].is_group_) return items[i];
    }

    return null;
}

function update_group_numbers(frm) {
    if (!frm.doc.items?.length) return;

    let current_group_level = 0;
    let current_group_index = 0;
    let has_changes = false;

    frm.doc.items.forEach(row => {
        let new_group_value = null;

        if (row.is_group_) {
            current_group_level++;
            current_group_index = 0;
            new_group_value = current_group_level.toString();
        } else if (current_group_level > 0) {
            current_group_index++;
            new_group_value = `${current_group_level}\\${current_group_index}`;
        }

        if (row.group !== new_group_value) {
            row.group = new_group_value;
            has_changes = true;
        }
    });

    if (has_changes) frm.refresh_field('items');
}

function add_custom_buttons(frm) {
    if (frm.doc.docstatus === 1) {
        frm.add_custom_button('Subcontract', () => {
            frappe.model.open_mapped_doc({
                method: "frontline_subcontract.frontline_subcontract.doctype.contracts.contracts.make_subcontract",
                frm: frm
            });
        }, 'Create');
    }
}

// === ITEM EVENT HANDLERS ===

function initialize_new_item(frm, cdt, cdn) {
    const row = locals[cdt][cdn];
    row.project = frm.doc.project;
    row.cost_center = frm.doc.cost_center;
    frappe.model.set_value(cdt, cdn, "business_statement_doctype", "Item");
    set_business_statement_query(frm, cdt, cdn);
    update_group_numbers(frm);
}

function handle_doctype_change(frm, cdt, cdn) {
    set_business_statement_query(frm, cdt, cdn);
    update_group_numbers(frm);
}

function calculate_item_totals(frm, cdt, cdn) {
    const row = frappe.get_doc(cdt, cdn);

    if (is_valid_number(row.current_qty) && is_valid_number(row.previous_qty)) {
        row.total_qty = parseFloat(row.current_qty) + parseFloat(row.previous_qty || 0);
    }

    if (is_valid_number(row.rate) && is_valid_number(row.total_qty)) {
        row.total = parseFloat(row.rate) * parseFloat(row.total_qty);
    }

    frm.refresh_field('items');
}

function handle_item_selection(frm, cdt, cdn) {
    const row = frappe.get_doc(cdt, cdn);

    if (!row.business_statement_num || row.business_statement_doctype !== "Item") {
        row.uom = null;
        frm.refresh_field('items');
        return;
    }

    frappe.call({
        method: "frontline_subcontract.frontline_subcontract.doctype.contracts.contracts.get_stock_uom_from_item",
        args: { item_code: row.business_statement_num },
        callback: function (r) {
            if (r.message) {
                row.uom = r.message;
                row.default_uom = r.message;
                frm.refresh_field('items');
            }
        }
    });
}

function handle_uom_change(frm, cdt, cdn) {
    const row = frappe.get_doc(cdt, cdn);

    if (row.uom === row.default_uom || row.business_statement_doctype !== "Item") return;

    frappe.call({
        method: "frappe.client.get",
        args: {
            doctype: "Item",
            name: row.business_statement_num
        },
        callback: function (r) {
            if (r.message?.uoms) {
                const uom_data = r.message.uoms.find(u => u.uom === row.uom);
                if (uom_data) {
                    row.conversion_factor = uom_data.conversion_factor;
                    frm.refresh_field('items');
                }
            }
        }
    });
}

function handle_group_toggle(frm, cdt, cdn) {
    const row = locals[cdt][cdn];
    const row_index = frm.doc.items.findIndex(r => r.name === row.name);

    if (row.is_group_) {
        frappe.model.set_value(cdt, cdn, "business_statement_doctype", "Item Group");

        // ✅ تعيين استعلام business_statement_num لهذا الصف فقط
        frm.fields_dict["items"].grid.get_field("business_statement_num").get_query = function(doc, cdt_inner, cdn_inner) {
            if (cdn_inner === cdn) {
                return {
                    doctype: "Item Group",
                    filters: {}
                };
            }
        };

        reset_following_rows(frm, row_index);
    } else {
        frappe.model.set_value(cdt, cdn, "business_statement_doctype", "Item");

        // ✅ تعيين الاستعلام حسب آخر مجموعة عند الرجوع إلى "Item"
        set_business_statement_query(frm, cdt, cdn);
    }

    update_group_numbers(frm);
    frm.refresh_field('items');
}


// === UTILITIES ===

function is_valid_number(value) {
    return value !== undefined && value !== null && !isNaN(parseFloat(value)) && isFinite(value);
}

function propagate_field_to_items(frm, field_name, value) {
    if (frm.is_new() && frm.doc.items?.length > 0) {
        frm.doc.items[0][field_name] = value;
    }
}

function handle_payment_terms_change(frm) {
    frm.call('remove_all_records_on_change').then(() => {
        if (frm.doc.payment_terms_template) {
            frm.call('get_payment_terms_template_child', {
                docname: frm.doc.payment_terms_template
            });
        }
    });
}

function handle_contract_type_change(frm) {
    if (frm.doc.contract_type === 'Contract Supplement') {
        frm.set_value('naming_series', 'CS-.YYYY.-');
    }
}

function fetch_related_contract_data(frm) {
    if (!frm.doc.related_contract) return;

    frappe.db.get_doc('Contracts', frm.doc.related_contract).then(doc => {
        const fields_to_copy = [
            'contractor', 'cost_center', 'phone', 'project',
            'address', 'company', 'commercial_record', 'tax_id_number'
        ];

        const values = {};
        fields_to_copy.forEach(field => values[field] = doc[field]);
        frm.set_value(values);
    }).catch(err => {
        frappe.show_alert({
            message: `Error fetching related contract: ${err.message}`,
            indicator: 'red'
        });
    });
}

function reset_following_rows(frm, from_index) {
    for (let i = from_index + 1; i < frm.doc.items.length; i++) {
        const child = frm.doc.items[i];
        child.business_statement_doctype = "Item";
        child.is_group_ = 0;
        child.business_statement_num = null;
    }
}

function set_business_statement_query(frm, cdt, cdn) {
    const row = locals[cdt][cdn];

    frm.fields_dict["items"].grid.get_field("business_statement_num").get_query = function(doc, cdt_inner, cdn_inner) {
        if (cdn_inner !== cdn) return;  // فقط نفذ للصف الحالي

        if (row.is_group_) {
            return {
                doctype: "Item Group",
                filters: {}
            };
        } else {
            // فلترة العناصر بناءً على آخر مجموعة أعلاها
            const last_group = find_last_group_above_row(frm.doc, row.name);
            let filters = {};

            if (last_group?.business_statement_num) {
                filters["item_group"] = last_group.business_statement_num;
            }

            return {
                doctype: "Item",
                filters: filters
            };
        }
    };
}
