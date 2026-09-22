# CampusEats — Assignment 5
## HTTP Methods & Headers

### Team ID

`[ENTER TEAM ID]`

### Team Members

| Name | Roll No |
|---|---|
| Akshay Kumar | 20251651012 |
| Sundram Tripathi | 20251651091 |
| Abhinav Kumar Chandravanshi | 20251651004 |
| Ankit Kumar | 20251651022 |

---

# Part A — Methods & the Message

## A1 — CampusEats Method Map

The Assignment 4 Catalog Service is the base service. Assignment 5 audits the existing endpoints and keeps action verbs out of resource URLs.

| Action | Method | URL |
|---|---|---|
| Create menu item | POST | `/menu-items` |
| List/filter/sort/paginate menu items | GET | `/menu-items?category=...&sort=...&order=...&page=...&limit=...` |
| Read one menu item | GET | `/menu-items/{id}` |
| Change availability | POST | `/menu-items/{id}/availability` |
| Request payment through Payment Service | POST | `/catalog-payments` |
| Discover methods for menu items | OPTIONS | `/menu-items` |

The availability operation is non-CRUD, so it is represented as a POST to a sub-resource rather than a verb-based URL such as `/setAvailability`.

## A2 — Non-CRUD Actions

The following action:

```text
Change menu item availability
```

is represented as:

```http
POST /menu-items/{id}/availability
```

rather than:

```http
POST /setAvailability
```

This keeps the URL resource-oriented.

## A3 — Safe and Idempotent

| Endpoint | Safe? | Idempotent / retry-safe? | Reason |
|---|---:|---:|---|
| GET `/menu-items` | Yes | Yes | Read-only operation |
| GET `/menu-items/{id}` | Yes | Yes | Read-only operation |
| POST `/menu-items` | No | Not naturally; made retry-safe with `Idempotency-Key` | Repeating a create could create duplicates |
| POST `/menu-items/{id}/availability` | No | Protected against stale writes with `If-Match` | It changes resource state |
| POST `/catalog-payments` | No | Made retry-safe with `Idempotency-Key` | Duplicate payment processing could cause real damage |
| OPTIONS | Yes | Yes | Does not change application state |

No GET endpoint changes application state.

## A4 — Reads Take Query Parameters

The list endpoint remains a pure GET and accepts:

```http
GET /menu-items?category=Fast%20Food&sort=price&order=desc&page=1&limit=10
```

The query parameters control filtering, sorting and pagination without changing server state.

## A5 — OPTIONS + Allow

`OPTIONS /menu-items` returns:

```text
Allow: GET, POST, OPTIONS
```

The response also includes CORS preflight headers.

The current Assignment 4 service does not contain PUT or DELETE endpoints, so `X-HTTP-Method-Override` is not needed for an existing endpoint. If a future constrained client needs to tunnel a supported PUT or DELETE operation, the documented fallback can be:

```text
X-HTTP-Method-Override: PUT
```

or:

```text
X-HTTP-Method-Override: DELETE
```

The override should only be accepted where the target method is actually supported.

## A6 — One Complete HTTP Exchange

### Request

```http
POST /menu-items HTTP/1.1
Host: 127.0.0.1:5000
Authorization: Bearer campuseats-demo-token
Accept: application/json
Content-Type: application/json
Idempotency-Key: a5-create-001

{
  "name": "Veg Burger",
  "category": "Fast Food",
  "price": 80,
  "available": true
}
```

### Response

```http
HTTP/1.1 201 Created
Content-Type: application/json
Location: /menu-items/1
ETag: "862e3523c09c7a32"
Cache-Control: no-store
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 19
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains

{
  "id": "1",
  "name": "Veg Burger",
  "category": "Fast Food",
  "price": 80.0,
  "available": true
}
```

---

# Part B — Headers

## B1 — Content-Type and Negotiation

Requests containing JSON use:

```text
Content-Type: application/json
```

Clients request JSON using:

```text
Accept: application/json
```

If an unsupported type is requested, for example:

```text
Accept: application/xml
```

the service returns:

```text
406 Not Acceptable
```

API response bodies use `application/json`.

## B2 — Correct Status + Location

For three representative endpoints:

| Endpoint | Method | Success | Important response header | Why |
|---|---|---:|---|---|
| `/menu-items` | POST | 201 Created | `Location` | Identifies the newly created resource |
| `/menu-items/{id}` | GET | 200 OK | `ETag` | Identifies the current representation version |
| `/menu-items/{id}/availability` | POST | 200 OK | `ETag` | Provides the new version after an update |

Other required status handling includes 400, 404, 409, 422, 401, 406, 412, 429 and 304 where applicable.

## B3 — Authorization

Protected endpoints require:

```text
Authorization: Bearer campuseats-demo-token
```

A missing or invalid token returns:

```text
401 Unauthorized
```

This assignment uses header handling only; no real authentication/token service is implemented.

## B4 — Cache a Read

The single-item GET returns an ETag:

```text
ETag: "862e3523c09c7a32"
Cache-Control: private, max-age=60
```

The ETag is calculated from the current representation. When the resource changes, the ETag changes.

## B5 — Rate-Limit Signalling

The service maintains a per-client budget.

Example:

```text
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 19
```

After the budget is exhausted:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 12
```

The budget is tracked per client rather than globally.

## B6 — CORS

Responses include:

```text
Access-Control-Allow-Origin
```

An OPTIONS preflight returns:

```text
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, Accept, Idempotency-Key, If-Match, If-None-Match
```

This permits a browser application on another origin to call the permitted API endpoints.

## B7 — Security and General Headers

The service adds:

```text
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

The service should be served over HTTPS in production.

---

# Part C — Caching & Safe Retries

## C1 — Conditional GET → 304

Initial read:

```http
GET /menu-items/1 HTTP/1.1
Host: 127.0.0.1:5000
Authorization: Bearer campuseats-demo-token
Accept: application/json
```

Response:

```http
HTTP/1.1 200 OK
ETag: "862e3523c09c7a32"
Cache-Control: private, max-age=60
```

Conditional read:

```http
GET /menu-items/1 HTTP/1.1
Host: 127.0.0.1:5000
Authorization: Bearer campuseats-demo-token
Accept: application/json
If-None-Match: "862e3523c09c7a32"
```

Response:

```http
HTTP/1.1 304 Not Modified
ETag: "862e3523c09c7a32"
```

There is no response body.

This saves bandwidth because the client already has the current representation.

## C2 — Conditional Write → 412

Suppose the client reads:

```text
ETag: "old-version"
```

Another update changes the resource and creates a new ETag.

The first client then sends:

```http
If-Match: "old-version"
```

The service returns:

```http
HTTP/1.1 412 Precondition Failed
```

This prevents an outdated client from overwriting a newer version.

## C3 — Idempotency-Key

For menu-item creation:

```http
POST /menu-items HTTP/1.1
Idempotency-Key: create-001
```

The server stores the result against the key.

Repeating the same request with the same key returns the original result without creating another menu item.

The payment integration also forwards the same idempotency key to the Payment Service.

A duplicate payment is the endpoint where duplicate work could cause real financial damage.

## C4 — Safe-Retry Plan

| Risky endpoint | Mechanism | Why |
|---|---|---|
| POST `/menu-items` | `Idempotency-Key` | Prevents duplicate menu-item creation |
| GET `/menu-items/{id}` | `If-None-Match` | Avoids retransmitting unchanged data |
| POST `/menu-items/{id}/availability` | `If-Match` | Prevents stale clients from overwriting newer data |
| POST `/catalog-payments` | `Idempotency-Key` | Prevents duplicate payment processing |
| GET `/menu-items` | None required | Already safe and read-only |

---

# Part D — Headers Table

| Endpoint | Request headers | Response headers |
|---|---|---|
| POST `/menu-items` | Authorization, Accept, Content-Type, Idempotency-Key | Location, ETag, Cache-Control, X-RateLimit-Limit, X-RateLimit-Remaining, security headers |
| GET `/menu-items` | Authorization, Accept | Cache-Control, X-RateLimit-Limit, X-RateLimit-Remaining, security headers |
| GET `/menu-items/{id}` | Authorization, Accept, If-None-Match | ETag, Cache-Control, rate-limit/security headers |
| POST `/menu-items/{id}/availability` | Authorization, Accept, Content-Type, If-Match | ETag, Cache-Control, rate-limit/security headers |
| POST `/catalog-payments` | Authorization, Accept, Content-Type, Idempotency-Key | Downstream Location when supplied, rate-limit/security headers |
| OPTIONS `/menu-items` | Origin, Access-Control-Request-Method, Access-Control-Request-Headers | Allow, Access-Control-Allow-Origin, Access-Control-Allow-Methods, Access-Control-Allow-Headers |

---

# NOTES.md — Required Eight Answers

## 1. Three endpoints: method, success status and most important response header

### Create menu item

```text
POST /menu-items
Success: 201 Created
Important header: Location
```

`Location` tells the client where the newly created menu item can be retrieved.

### Read one menu item

```text
GET /menu-items/{id}
Success: 200 OK
Important header: ETag
```

`ETag` identifies the current representation version and enables conditional GET requests.

### Change availability

```text
POST /menu-items/{id}/availability
Success: 200 OK
Important header: ETag
```

The returned ETag identifies the new representation version so another client cannot unknowingly update an old version.

---

## 2. Which endpoints are safe and which are idempotent?

The GET endpoints are safe because they do not modify server state.

```text
GET /menu-items
GET /menu-items/{id}
```

They are also naturally idempotent.

The menu-item creation and payment POST operations are not safe and are not naturally idempotent. They are made retry-safe using `Idempotency-Key`.

```text
POST /menu-items
POST /catalog-payments
```

The availability operation changes state, so it is not safe. It uses `If-Match` to make retries conditional on the resource version and to prevent stale writes.

The endpoint that is neither safe nor naturally idempotent is:

```text
POST /menu-items
```

A duplicate create could produce duplicate menu items. The `Idempotency-Key` stores the first result and makes a repeated request return that same result instead of doing duplicate work.

---

## 3. ETag, 304 and 412

Example ETag:

```text
ETag: "862e3523c09c7a32"
```

Conditional GET:

```http
GET /menu-items/1 HTTP/1.1
Host: 127.0.0.1:5000
Authorization: Bearer campuseats-demo-token
Accept: application/json
If-None-Match: "862e3523c09c7a32"
```

Response:

```http
HTTP/1.1 304 Not Modified
ETag: "862e3523c09c7a32"
```

The 304 saves bandwidth by avoiding retransmission of an unchanged representation.

For a conditional write, the client sends:

```http
If-Match: "old-etag"
```

If the resource has changed and the current ETag is different:

```http
HTTP/1.1 412 Precondition Failed
```

The 412 prevents an outdated client from overwriting a newer resource version.

---

## 4. 422 vs 400

A `400 Bad Request` is triggered by an invalid request shape. For example:

```http
POST /menu-items HTTP/1.1
Authorization: Bearer campuseats-demo-token
Content-Type: application/json
Idempotency-Key: bad-001

{
  "name": "Veg Burger"
}
```

The required `category` and `price` fields are missing, so the service returns:

```http
HTTP/1.1 400 Bad Request
```

A `422 Unprocessable Content` is returned by the Payment Service for a syntactically valid payment request that the payment domain refuses.

Example:

```http
POST /catalog-payments HTTP/1.1
Authorization: Bearer campuseats-demo-token
Content-Type: application/json
Idempotency-Key: pay-001

{
  "orderId": 10,
  "cardToken": "tok_bad_001",
  "amount": 8000,
  "currency": "INR"
}
```

The Assignment 4 Payment Service gateway treats tokens beginning with `tok_bad` as declined, so the downstream service returns 422.

The difference is:

- **400:** malformed/invalid API request.
- **422:** request is structurally valid, but the domain refuses to perform it.

---

## 5. CORS

Suppose a browser page from another origin calls the API and the server log shows 200, but JavaScript cannot read the response.

The browser enforces CORS and blocks the webpage from accessing the response because the required CORS response permission is missing.

The important response header is:

```text
Access-Control-Allow-Origin
```

The API also answers the browser's OPTIONS preflight with headers such as:

```text
Access-Control-Allow-Origin: https://example-client.test
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, Accept, Idempotency-Key, If-Match, If-None-Match
```

---

## 6. Cache-Control: cache vs no-store

A single menu-item GET can use:

```text
Cache-Control: private, max-age=60
```

because the client can reuse the representation for a short time.

A create/payment response can use:

```text
Cache-Control: no-store
```

because operation responses may contain information that should not be retained by caches.

---

## 7. When would POST be appropriate for search?

The normal search/list operation is GET:

```http
GET /menu-items?category=Fast%20Food&sort=price&order=desc&page=1&limit=10
```

POST becomes reasonable when the search criteria are too large or structurally complex for practical query parameters, such as a deeply nested search/filter document.

Example:

```http
POST /menu-items/search
Content-Type: application/json

{
  "categories": ["Fast Food", "Indian"],
  "priceRange": {
    "min": 50,
    "max": 300
  },
  "dietary": ["vegetarian"],
  "location": {
    "campus": "Main",
    "radius": 5
  }
}
```

The trade-off is that POST loses some normal GET advantages, such as simple URL bookmarking/sharing and common GET caching behavior.

---

## 8. Location on 201 and 3xx

On a 201 response:

```http
HTTP/1.1 201 Created
Location: /menu-items/42
```

`Location` points to the newly created resource.

On a 3xx response:

```http
HTTP/1.1 301 Moved Permanently
Location: https://api.campuseats.example/menu-items/42
```

`Location` identifies the target URL to which the client should redirect/follow.

---

# Verification Checklist

The Assignment 5 submission requires:

- Updated service folder
- `openapi.yaml`
- Source files
- `tests/`
- `curl-transcript.txt`
- `NOTES.md`
- Successful create showing 201 + Location
- Same create repeated with the same Idempotency-Key
- Conditional GET showing 304
- Conditional write showing 412
- 400 failure
- 404 failure
- 401 failure
- OpenAPI validation output showing zero errors
- Tests passing
- All team members' names, Roll Nos. and Team ID included
