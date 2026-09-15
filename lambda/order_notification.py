import json
import os
import re

import boto3


sns = boto3.client("sns")
EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def handler(event, _context):
    body = event.get("body", event)
    if isinstance(body, str):
        body = json.loads(body)

    customer_email = str(body.get("customerEmail", "")).strip()
    if not EMAIL_PATTERN.match(customer_email):
        return response(400, {"error": "A valid customerEmail is required"})

    invoice_id = body.get("id", "unknown")
    total_amount = body.get("totalAmount", 0)
    line_items = body.get("lineItems", [])
    item_summary = ", ".join(
        f"{item.get('productName', 'Product')} x{item.get('quantity', 1)}"
        for item in line_items
    )
    message = (
        f"Invoice {invoice_id} created for {customer_email}.\n"
        f"Items: {item_summary}\n"
        f"Total: INR {total_amount}"
    )

    sns.publish(
        TopicArn=os.environ["ORDER_TOPIC_ARN"],
        Subject=f"Invoice {invoice_id}",
        Message=message,
        MessageAttributes={
            "customerEmail": {
                "DataType": "String",
                "StringValue": customer_email,
            }
        },
    )
    return response(202, {"message": "Order notification published"})


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body),
    }