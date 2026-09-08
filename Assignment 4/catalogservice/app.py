from flask import Flask, request, jsonify
from payments_client import create_payment
from models import validate_menu_item

from store import (
    create_item,
    get_item,
    list_items,
    update_availability,
    get_idempotency_result,
    save_idempotency_result
)
from errors import problem


app = Flask(__name__)


@app.post("/menu-items")
def create_menu_item():
    idempotency_key = request.headers.get("Idempotency-Key")

    if not idempotency_key:
        return problem(
            400,
            "Bad Request",
            "Idempotency-Key header is required"
        )

    previous_result = get_idempotency_result(idempotency_key)

    if previous_result is not None:
        response = jsonify(previous_result["body"])
        response.status_code = previous_result["status"]

        if "location" in previous_result:
            response.headers["Location"] = previous_result["location"]

        return response

    data = request.get_json(silent=True)

    try:
        item = validate_menu_item(data)
    except ValueError as error:
        return problem(
            400,
            "Bad Request",
            str(error)
        )

    created_item = create_item(item)

    location = f"/menu-items/{created_item['id']}"

    save_idempotency_result(
        idempotency_key,
        {
            "body": created_item,
            "status": 201,
            "location": location
        }
    )

    response = jsonify(created_item)
    response.status_code = 201
    response.headers["Location"] = location

    return response

@app.get("/menu-items/<item_id>")
def get_menu_item(item_id):
    item = get_item(item_id)

    if item is None:
        return problem(
            404,
            "Not Found",
            "Menu item not found"
        )

    return jsonify(item), 200


@app.get("/menu-items")
def get_menu_items():
    category = request.args.get("category")

    items = list_items(category)

    return jsonify(items), 200


@app.post("/menu-items/<item_id>/availability")
def change_availability(item_id):
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return problem(
            400,
            "Bad Request",
            "Request body must be a JSON object"
        )

    if "available" not in data:
        return problem(
            400,
            "Bad Request",
            "available is required"
        )

    if not isinstance(data["available"], bool):
        return problem(
            400,
            "Bad Request",
            "available must be a boolean"
        )

    item = get_item(item_id)

    if item is None:
        return problem(
            404,
            "Not Found",
            "Menu item not found"
        )

    if item["available"] == data["available"]:
        return problem(
            409,
            "Conflict",
            "Menu item is already in the requested availability state"
        )

    updated_item = update_availability(
        item_id,
        data["available"]
    )

    return jsonify(updated_item), 200
@app.post("/catalog-payments")
def catalog_payment():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return problem(
            400,
            "Bad Request",
            "Request body must be a JSON object"
        )

    required = ["orderId", "cardToken", "amount", "currency"]

    for field in required:
        if field not in data:
            return problem(
                400,
                "Bad Request",
                f"{field} is required"
            )

    idempotency_key = request.headers.get("Idempotency-Key")

    if not idempotency_key:
        return problem(
            400,
            "Bad Request",
            "Idempotency-Key header is required"
        )

    payment_response = create_payment(
        data,
        idempotency_key
    )

    if payment_response is None:
        return problem(
            503,
            "Service Unavailable",
            "Payment Service is unavailable"
        )

    return (
        payment_response.content,
        payment_response.status_code,
        list(payment_response.headers.items())
    )

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)