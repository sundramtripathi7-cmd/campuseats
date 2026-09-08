from flask import jsonify


TITLES = {
    "invalid-request": "Invalid request",
    "card-declined": "Card declined",
    "payment-not-found": "Payment not found",
    "not-refundable": "Not refundable"
}


def problem(status, code, detail="", errors=None):
    body = {
        "type": f"/errors/{code}",
        "title": TITLES[code],
        "status": status,
        "detail": detail
    }

    if errors:
        body["errors"] = errors

    return jsonify(body), status