from . import __version__ as app_version

app_name = "elsalem_contracts_2025"
app_title = "Elsalem Contracts 2025"
app_publisher = "hossam"
app_description = "Elsalem Contracts 2025"
app_icon = "octicon octicon-file-directory"
app_color = "grey"
app_email = "hossam.2030@gmail.com"
app_license = "MIT"


doctype_js = {
    "Purchase Order": "public/js/purchase_order.js"
}


doctype_list = ["Issue"]

fixtures = [
    {"doctype": "Custom Field", "filters": [["dt", "in", doctype_list]]},
    {"doctype": "Client Script", "filters": [["dt", "in", doctype_list]]},
    {"doctype": "Server Script", "filters": [["reference_doctype", "in", doctype_list]]},
    {"doctype": "Property Setter", "filters": [["doc_type", "in", doctype_list]]},
    {"doctype": "Custom DocPerm", "filters": [["parent", "in", doctype_list]]},
    {"doctype": "Print Format", "filters": [["doc_type", "in", doctype_list]]},
    {"doctype": "Notification", "filters": [["document_type", "in", doctype_list]]},
    {"doctype": "Workflow", "filters": [["document_type", "in", doctype_list]]},
    {"doctype": "Workflow Action"},
    {"doctype": "Workflow State"},
    {"doctype": "Custom Role"},
    {"doctype": "User Permission"},
    {"doctype": "Translation"},
    {"doctype": "Dashboard", "filters": [["is_standard", "=", 0]]},
    {"doctype": "Dashboard Chart", "filters": [["is_standard", "=", 0]]},
    {"doctype": "Number Card", "filters": [["is_standard", "=", 0]]},
    {"doctype": "Report", "filters": [["is_standard", "=", "No"]]},
    {"doctype": "Page", "filters": [["module", "=", "Custom App"]]},
    {"doctype": "Module Onboarding", "filters": [["module", "=", "Custom App"]]}
]


# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/elsalem_contracts_2025/css/elsalem_contracts_2025.css"
# app_include_js = "/assets/elsalem_contracts_2025/js/elsalem_contracts_2025.js"

# include js, css files in header of web template
# web_include_css = "/assets/elsalem_contracts_2025/css/elsalem_contracts_2025.css"
# web_include_js = "/assets/elsalem_contracts_2025/js/elsalem_contracts_2025.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "elsalem_contracts_2025/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
#	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Installation
# ------------

# before_install = "elsalem_contracts_2025.install.before_install"
# after_install = "elsalem_contracts_2025.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "elsalem_contracts_2025.uninstall.before_uninstall"
# after_uninstall = "elsalem_contracts_2025.uninstall.after_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "elsalem_contracts_2025.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
#	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
#	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
#	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
#	"*": {
#		"on_update": "method",
#		"on_cancel": "method",
#		"on_trash": "method"
#	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
#	"all": [
#		"elsalem_contracts_2025.tasks.all"
#	],
#	"daily": [
#		"elsalem_contracts_2025.tasks.daily"
#	],
#	"hourly": [
#		"elsalem_contracts_2025.tasks.hourly"
#	],
#	"weekly": [
#		"elsalem_contracts_2025.tasks.weekly"
#	]
#	"monthly": [
#		"elsalem_contracts_2025.tasks.monthly"
#	]
# }

# Testing
# -------

# before_tests = "elsalem_contracts_2025.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
#	"frappe.desk.doctype.event.event.get_events": "elsalem_contracts_2025.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
#	"Task": "elsalem_contracts_2025.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Request Events
# ----------------
# before_request = ["elsalem_contracts_2025.utils.before_request"]
# after_request = ["elsalem_contracts_2025.utils.after_request"]

# Job Events
# ----------
# before_job = ["elsalem_contracts_2025.utils.before_job"]
# after_job = ["elsalem_contracts_2025.utils.after_job"]

# User Data Protection
# --------------------

user_data_fields = [
	{
		"doctype": "{doctype_1}",
		"filter_by": "{filter_by}",
		"redact_fields": ["{field_1}", "{field_2}"],
		"partial": 1,
	},
	{
		"doctype": "{doctype_2}",
		"filter_by": "{filter_by}",
		"partial": 1,
	},
	{
		"doctype": "{doctype_3}",
		"strict": False,
	},
	{
		"doctype": "{doctype_4}"
	}
]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
#	"elsalem_contracts_2025.auth.validate"
# ]

