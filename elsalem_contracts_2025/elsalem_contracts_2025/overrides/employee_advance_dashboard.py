def get_data(data):
	return {
		"fieldname": "employee_advance",
		"non_standard_fieldnames": {
			"Payment Entry": "reference_name",
			"Journal Entry": "reference_name",
		},
		"transactions": [{"items": ["Expense Claim"]}, {"items": ["Payment Entry", "Journal Entry"]}, {"items": ["Custom Expense Claim"]}],
	}