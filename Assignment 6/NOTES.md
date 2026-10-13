# CampusEats — Assignment 6
## Honest responses: status codes, errors and validation

### Team members
| Name | Roll No |
|---|---|
| Akshay Kumar | 20251651012 |
| Sundram Tripathi | 20251651091 |
| Abhinav Kumar Chandravanshi | 20251651004 |
| Ankit Kumar | 20251651022 |

## Implementation note
The supplied A5 project contains a Catalog Service, not an existing `/orders` resource. To avoid breaking A1–A5, this submission adds an independently runnable CampusEats Orders Service under `orderservice/`. It follows the existing project’s Flask/Bearer-token conventions. Orders and menu data are in-memory demo data; restart clears them. Payment outcomes are simulated using a request header for reproducible testing.

## Part A — Status map
- `GET /orders` → **200**; listing is successful. Invalid/missing token → **401**; unsupported `Accept` → **406**; exhausted rate budget → **429** with `Retry-After`.
- `POST /orders` → **201 Created** and `Location: /orders/{id}`; the new resource is addressable. Invalid fields or empty items → **422**; unknown menu item/unavailable item → **409**; missing/invalid auth → **401**; unsupported `Accept` → **406**; rate limit → **429**.
- `GET /orders/{id}` → **200**; unknown order → **404**; auth/negotiation/rate-limit failures → **401/406/429**.
- `PATCH /orders/{id}` → **200**; unknown order → **404**; invalid state transition → **409**; payment declined → **402**; transient payment service outage → **503** plus `Retry-After`; malformed/invalid input should be rejected rather than applied.
- `DELETE /orders/{id}` → **204 No Content** for deletion of a created/cancelled order; unknown order → **404**; deleting an order in a non-deletable state → **409**.
- No failure is represented as `200 {"ok": false}`. HTTP status communicates the result.

## Part B — Stable Problem Details type catalogue
| `type` | Trigger |
|---|---|
| `validation-error` | Empty cart, invalid/missing quantity, missing address, unknown menu item ID in submitted items |
| `item-unavailable` | Requested menu item cannot be ordered |
| `payment-declined` | Payment provider declines the simulated payment |
| `payment-service-unavailable` | Temporary payment provider outage |
| `order-not-found` | Requested order ID does not exist |
| `illegal-transition` | Requested order status transition is not allowed |
| `unauthorized` | Missing/invalid bearer token |
| `not-acceptable` | No supported response representation matches `Accept` |
| `rate-limited` | Per-client request limit exceeded |

All errors are routed through `problem()` in `errors.py` and use `application/problem+json; charset=utf-8`. Internal exception details are not sent to clients.

## Part C — Validation and formats
`POST /orders` requires a JSON object with:
- `items`: non-empty array;
- each item: `menuItemId` for a known menu item and `qty` as an integer ≥ 1;
- `address`: non-empty string.

All detected field errors are returned together with status **422**, using `errors[]` entries with `field` and `message`. JSON is the default response format. `Accept: application/xml` returns XML for successful order representations; unsupported types return **406**. All response bodies have an explicit Content-Type and UTF-8 charset where applicable.

Example field-level 422 body:
```json
{
  "type": "validation-error",
  "title": "Validation Failed",
  "status": 422,
  "detail": "One or more fields are invalid",
  "errors": [
    {"field": "items[0].qty", "message": "must be an integer greater than or equal to 1"},
    {"field": "address", "message": "is required and must be a non-empty string"}
  ]
}
```

## Part D — Retry safety
- `GET /orders` and `GET /orders/{id}` are safe and naturally retryable; successful reads return **200**.
- `POST /orders` is not naturally idempotent. Supply the same `Idempotency-Key` when retrying a create; the service returns the original order response rather than creating a duplicate.
- `PATCH /orders/{id}` changes state; do not blindly retry after an ambiguous network failure unless the caller first reads the order state and checks whether the transition already happened.
- `DELETE /orders/{id}` is state-changing. A second attempt after deletion returns **404**, so clients should treat a confirmed 204 as success and reconcile an ambiguous timeout with GET.
- `429` and `503` include `Retry-After` and may be retried after that delay when the operation is safe/idempotent or protected by an idempotency key. Do not retry unchanged 4xx requests; fix the request first.

## Example Problem Details body and fields
```json
{
  "type": "order-not-found",
  "title": "Order Not Found",
  "status": 404,
  "detail": "No order exists with this id"
}
```
`type` is the stable machine-readable category; `title` is a short human-readable summary; `status` repeats the HTTP status; `detail` explains this particular occurrence. Validation failures add `errors[]`.

## Internal errors
Risky payment work is mapped to a clean `503` response and `Retry-After: 5`; the client does not receive stack traces, file paths, credentials, database messages, or exception internals. Payment decline is a separate `402` and is not automatically retryable.

## Assignment 5 regression note
The original Assignment 5 source and tests remain unchanged in `../Assignment 5/catalogservice/`. Run its tests separately with that folder as the working directory. Assignment 6 has its own regression tests under `orderservice/tests/`.
