from flask import Flask, request, jsonify

import store
import gateway

from errors import problem


app = Flask(__name__)

SUPPORTED = {"INR"}


def validate(body):
    errors = []

    if not isinstance(body.get("orderId"), int):
        errors.append(["orderId", "required integer"])

    if not body.get("cardToken"):
        errors.append(["cardToken", "required"])

    amount = body.get("amount")

    if not isinstance(amount, int) or amount <= 0:
        errors.append(["amount", "positive integer, in paise"])

    if body.get("currency") not in SUPPORTED:
        errors.append(["currency", "not supported"])

    return errors


@app.post("/payments")
def create_payment():
    body = request.get_json(silent=True) or {}

    errors = validate(body)

    if errors:
        return problem(
            400,
            "invalid-request",
            "Request validation failed",
            errors
        )

    key = request.headers.get("Idempotency-Key")

    if key:
        previous = store.find_by_key(key)

        if previous:
            return jsonify(previous.as_json()), 201

    result = gateway.charge(
        body["cardToken"],
        body["amount"]
    )

    if result.declined:
        return problem(
            422,
            "card-declined",
            result.reason
        )

    payment = store.create(
        order_id=body["orderId"],
        card_token=body["cardToken"],
        amount=body["amount"],
        currency=body["currency"],
        status="captured",
        txn_id=result.txn_id,
        key=key
    )

    response = jsonify(payment.as_json())
    response.status_code = 201
    response.headers["Location"] = f"/payments/{payment.id}"

    return response


@app.get("/payments/<int:payment_id>")
def get_payment(payment_id):
    payment = store.find(payment_id)

    if payment is None:
        return problem(
            404,
            "payment-not-found",
            "Payment not found"
        )

    return jsonify(payment.as_json()), 200


@app.get("/payments")
def list_payments():
    order_id = request.args.get("order")

    if order_id is None:
        return problem(
            400,
            "invalid-request",
            "order query parameter is required"
        )

    try:
        order_id = int(order_id)
    except ValueError:
        return problem(
            400,
            "invalid-request",
            "order must be an integer"
        )

    payments = store.find_by_order(order_id)

    return jsonify([
        payment.as_json()
        for payment in payments
    ]), 200


@app.post("/payments/<int:payment_id>/refund")
def refund_payment(payment_id):
    payment = store.find(payment_id)

    if payment is None:
        return problem(
            404,
            "payment-not-found",
            "Payment not found"
        )

    if payment.status != "captured":
        return problem(
            409,
            "not-refundable",
            "Payment is not refundable"
        )

    payment.status = "refund_pending"

    return jsonify(payment.as_json()), 202


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=8080,
        debug=True
    )