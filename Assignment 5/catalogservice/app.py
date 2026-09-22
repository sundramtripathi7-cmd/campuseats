import hashlib
import json
import os
import time
from functools import wraps

from flask import Flask, request, jsonify, make_response

from models import validate_menu_item, validate_availability
from payments_client import create_payment
from store import (
    create_item,
    get_item,
    list_items,
    update_availability,
    get_idempotency_result,
    save_idempotency_result,
)
from errors import problem


app = Flask(__name__)

# ============================================================
# CONFIGURATION
# ============================================================

EXPECTED_TOKEN = os.getenv(
    "CAMPUSEATS_TOKEN",
    "campuseats-demo-token"
)

RATE_LIMIT = int(os.getenv("RATE_LIMIT", "20"))
RATE_WINDOW_SECONDS = 60

rate_state = {}


# ============================================================
# ETag
# ============================================================

def etag_for(resource):
    """
    Generate a stable ETag from the resource representation.
    """
    payload = json.dumps(
        resource,
        sort_keys=True,
        separators=(",", ":")
    )

    digest = hashlib.sha256(
        payload.encode("utf-8")
    ).hexdigest()

    return f'"{digest[:16]}"'


def etag_matches(if_none_match, current_etag):
    """
    Check If-None-Match according to normal HTTP ETag semantics.

    Supports:
    - exact ETag
    - multiple ETags
    - wildcard *
    - weak ETags such as W/"..."
    """

    if not if_none_match:
        return False

    value = if_none_match.strip()

    if value == "*":
        return True

    current = current_etag.strip()

    for candidate in value.split(","):
        candidate = candidate.strip()

        # Remove weak validator prefix.
        if candidate.startswith("W/"):
            candidate = candidate[2:].strip()

        if candidate == current:
            return True

    return False


# ============================================================
# Content Negotiation
# ============================================================

def accepts_json():
    accept = request.headers.get("Accept", "*/*")

    accepted = [
        part.split(";", 1)[0].strip().lower()
        for part in accept.split(",")
    ]

    return (
        "*/*" in accepted
        or "application/json" in accepted
    )


def require_json_accept():
    if not accepts_json():
        return problem(
            406,
            "Not Acceptable",
            "Only application/json responses are supported",
            "https://campuseats.example/problems/406",
        )

    return None


# ============================================================
# Authentication
# ============================================================

def require_auth():
    authorization = request.headers.get(
        "Authorization",
        ""
    )

    expected = f"Bearer {EXPECTED_TOKEN}"

    if authorization != expected:
        return problem(
            401,
            "Unauthorized",
            "Authorization: Bearer <token> is required",
            "https://campuseats.example/problems/401",
        )

    return None


def auth_protected(view):
    @wraps(view)
    def wrapped(*args, **kwargs):

        accept_error = require_json_accept()

        if accept_error:
            return accept_error

        auth_error = require_auth()

        if auth_error:
            return auth_error

        return view(*args, **kwargs)

    return wrapped


# ============================================================
# Rate Limiting
# ============================================================

def client_id():
    return request.remote_addr or "unknown"


def rate_limit_response():

    now = time.monotonic()

    state = rate_state.get(client_id())

    if (
        state is None
        or now - state["start"] >= RATE_WINDOW_SECONDS
    ):
        state = {
            "start": now,
            "count": 0
        }

        rate_state[client_id()] = state

    if state["count"] >= RATE_LIMIT:

        response = problem(
            429,
            "Too Many Requests",
            "Per-client request limit exceeded",
            "https://campuseats.example/problems/429",
        )

        response.headers["Retry-After"] = str(
            max(
                1,
                int(
                    RATE_WINDOW_SECONDS
                    - (now - state["start"])
                )
            )
        )

        return response

    state["count"] += 1

    return None


# ============================================================
# OPTIONS / Allow
# ============================================================

def allow_for_path():

    path = request.path.rstrip("/") or "/"

    if path == "/menu-items":
        return "GET, POST, OPTIONS"

    if (
        path.startswith("/menu-items/")
        and path.endswith("/availability")
    ):
        return "POST, OPTIONS"

    if path.startswith("/menu-items/"):
        return "GET, OPTIONS"

    if path == "/catalog-payments":
        return "POST, OPTIONS"

    return "OPTIONS"


# ============================================================
# Before Request
# ============================================================

@app.before_request
def before_request():

    # OPTIONS is used for CORS preflight.
    if request.method == "OPTIONS":

        response = make_response("", 204)

        allow = allow_for_path()

        response.headers["Allow"] = allow

        response.headers["Access-Control-Allow-Origin"] = (
            request.headers.get(
                "Origin",
                "http://localhost:3000"
            )
        )

        response.headers["Access-Control-Allow-Methods"] = allow

        response.headers["Access-Control-Allow-Headers"] = (
            request.headers.get(
                "Access-Control-Request-Headers",
                (
                    "Authorization, Content-Type, Accept, "
                    "Idempotency-Key, If-Match, If-None-Match"
                )
            )
        )

        response.headers["Access-Control-Max-Age"] = "600"

        return response

    return rate_limit_response()


# ============================================================
# Common Response Headers
# ============================================================

@app.after_request
def add_common_headers(response):

    response.headers["Access-Control-Allow-Origin"] = (
        request.headers.get(
            "Origin",
            "http://localhost:3000"
        )
    )

    response.headers["X-Content-Type-Options"] = "nosniff"

    response.headers["Strict-Transport-Security"] = (
        "max-age=31536000; includeSubDomains"
    )

    state = rate_state.get(client_id())

    if state:

        remaining = max(
            0,
            RATE_LIMIT - state["count"]
        )

        response.headers["X-RateLimit-Limit"] = str(
            RATE_LIMIT
        )

        response.headers["X-RateLimit-Remaining"] = str(
            remaining
        )

    return response


# ============================================================
# CREATE MENU ITEM
# POST /menu-items
# ============================================================

@app.post("/menu-items")
@auth_protected
def create_menu_item():

    idempotency_key = request.headers.get(
        "Idempotency-Key"
    )

    if not idempotency_key:

        return problem(
            400,
            "Bad Request",
            "Idempotency-Key header is required",
        )

    key = f"menu-item-create:{idempotency_key}"

    previous_result = get_idempotency_result(key)

    if previous_result is not None:

        response = jsonify(
            previous_result["body"]
        )

        response.status_code = previous_result["status"]

        response.headers["Location"] = (
            previous_result["location"]
        )

        response.headers["ETag"] = (
            previous_result["etag"]
        )

        response.headers["Cache-Control"] = "no-store"

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

    location = (
        f"/menu-items/{created_item['id']}"
    )

    etag = etag_for(created_item)

    save_idempotency_result(
        key,
        {
            "body": created_item,
            "status": 201,
            "location": location,
            "etag": etag,
        },
    )

    response = jsonify(created_item)

    response.status_code = 201

    response.headers["Location"] = location

    response.headers["ETag"] = etag

    response.headers["Cache-Control"] = "no-store"

    return response


# ============================================================
# GET SINGLE MENU ITEM
# GET /menu-items/<id>
# ============================================================

@app.get("/menu-items/<item_id>")
@auth_protected
def get_menu_item(item_id):

    item = get_item(item_id)

    if item is None:

        return problem(
            404,
            "Not Found",
            "Menu item not found"
        )

    etag = etag_for(item)

    # --------------------------------------------------------
    # Conditional GET
    # --------------------------------------------------------

    if_none_match = request.headers.get(
        "If-None-Match"
    )

    if etag_matches(
        if_none_match,
        etag
    ):

        response = make_response("", 304)

        response.headers["ETag"] = etag

        response.headers["Cache-Control"] = (
            "private, max-age=60"
        )

        return response

    # --------------------------------------------------------
    # Normal 200 response
    # --------------------------------------------------------

    response = jsonify(item)

    response.status_code = 200

    response.headers["ETag"] = etag

    response.headers["Cache-Control"] = (
        "private, max-age=60"
    )

    return response


# ============================================================
# GET MENU ITEMS
# GET /menu-items
# ============================================================

@app.get("/menu-items")
@auth_protected
def get_menu_items():

    category = request.args.get(
        "category"
    )

    sort_by = request.args.get(
        "sort",
        "id"
    ).lower()

    order = request.args.get(
        "order",
        "asc"
    ).lower()

    try:

        page = int(
            request.args.get(
                "page",
                "1"
            )
        )

        limit = int(
            request.args.get(
                "limit",
                "10"
            )
        )

    except ValueError:

        return problem(
            400,
            "Bad Request",
            "page and limit must be integers",
        )

    if page < 1 or limit < 1 or limit > 100:

        return problem(
            400,
            "Bad Request",
            (
                "page must be >= 1 and "
                "limit must be between 1 and 100"
            ),
        )

    if sort_by not in {
        "id",
        "name",
        "category",
        "price"
    }:

        return problem(
            400,
            "Bad Request",
            (
                "sort must be one of "
                "id, name, category, price"
            ),
        )

    if order not in {
        "asc",
        "desc"
    }:

        return problem(
            400,
            "Bad Request",
            "order must be asc or desc",
        )

    items = list_items(category)

    if sort_by == "id":

        key_func = lambda item: int(
            item["id"]
        )

    else:

        key_func = lambda item: item[
            sort_by
        ]

    items.sort(
        key=key_func,
        reverse=(order == "desc")
    )

    start = (page - 1) * limit

    end = start + limit

    response = jsonify(
        items[start:end]
    )

    response.status_code = 200

    response.headers["Cache-Control"] = (
        "private, max-age=30"
    )

    return response


# ============================================================
# CHANGE AVAILABILITY
# POST /menu-items/<id>/availability
# ============================================================

@app.post("/menu-items/<item_id>/availability")
@auth_protected
def change_availability(item_id):

    data = request.get_json(
        silent=True
    )

    try:

        validated = validate_availability(
            data
        )

    except ValueError as error:

        return problem(
            400,
            "Bad Request",
            str(error)
        )

    item = get_item(item_id)

    if item is None:

        return problem(
            404,
            "Not Found",
            "Menu item not found"
        )

    current_etag = etag_for(item)

    if_match = request.headers.get(
        "If-Match"
    )

    # --------------------------------------------------------
    # Conditional write
    # --------------------------------------------------------

    if (
        if_match
        and if_match != "*"
        and if_match != current_etag
    ):

        return problem(
            412,
            "Precondition Failed",
            (
                "Resource changed since "
                "the client last read it"
            ),
            "https://campuseats.example/problems/412",
        )

    # --------------------------------------------------------
    # State conflict
    # --------------------------------------------------------

    if (
        item["available"]
        == validated["available"]
    ):

        return problem(
            409,
            "Conflict",
            (
                "Menu item is already in "
                "the requested availability state"
            ),
        )

    updated_item = update_availability(
        item_id,
        validated["available"]
    )

    new_etag = etag_for(
        updated_item
    )

    response = jsonify(
        updated_item
    )

    response.status_code = 200

    response.headers["ETag"] = new_etag

    response.headers["Cache-Control"] = (
        "private, max-age=60"
    )

    return response


# ============================================================
# CATALOG PAYMENT
# POST /catalog-payments
# ============================================================

@app.post("/catalog-payments")
@auth_protected
def catalog_payment():

    data = request.get_json(
        silent=True
    )

    if not isinstance(data, dict):

        return problem(
            400,
            "Bad Request",
            "Request body must be a JSON object",
        )

    required = [
        "orderId",
        "cardToken",
        "amount",
        "currency"
    ]

    for field in required:

        if field not in data:

            return problem(
                400,
                "Bad Request",
                f"{field} is required"
            )

    idempotency_key = request.headers.get(
        "Idempotency-Key"
    )

    if not idempotency_key:

        return problem(
            400,
            "Bad Request",
            "Idempotency-Key header is required",
        )

    payment_response = create_payment(
        data,
        idempotency_key
    )

    if payment_response is None:

        return problem(
            503,
            "Service Unavailable",
            "Payment Service is unavailable",
        )

    response = make_response(
        payment_response.content,
        payment_response.status_code,
    )

    for name, value in payment_response.headers.items():

        if name.lower() in {
            "content-type",
            "location",
            "etag"
        }:

            response.headers[name] = value

    return response


# ============================================================
# START SERVER
# ============================================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )