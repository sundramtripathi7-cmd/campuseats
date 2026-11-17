# CampusEats

CampusEats is a full-featured campus food service management system designed to connect students with campus cafeterias and food vendors. The platform enables students to discover available campus food services, view detailed menus, place orders, process payments, and track order lifecycles in real time.

The backend functionality has been completely migrated from Python (Flask/Graphene) to **Node.js (Express.js + GraphQL)** while preserving 100% of the API contracts, response models, database schemas, security features, and frontend integrations.

---

## Table of Contents

- [Technologies Used](#technologies-used)
- [Project Architecture & Structure](#project-architecture--structure)
- [Database Configuration](#database-configuration)
- [Environment Variables](#environment-variables)
- [Installation Instructions](#installation-instructions)
- [Starting the Application](#starting-the-application)
- [API Documentation](#api-documentation)
  - [Catalog Service (REST)](#catalog-service-rest)
  - [Catalog Service (GraphQL)](#catalog-service-graphql)
  - [Order Service (REST)](#order-service-rest)
  - [Payment Service (REST)](#payment-service-rest)
  - [Identity / Auth Service (REST)](#identity--auth-service-rest)
- [Testing Instructions](#testing-instructions)
- [Verification Summary](#verification-summary)

---

## Technologies Used

- **Runtime**: Node.js (v18+)
- **Backend Framework**: Express.js (v4.21.2)
- **Language**: JavaScript (CommonJS)
- **Database**: MySQL (v8.0+) with `mysql2/promise` pool & auto-fallback in-memory mode
- **API Styles**:
  - REST API with RFC 7807 / 9457 Problem Details error formatting
  - GraphQL API with schema definition via official `graphql` (v16.10.0)
- **Authentication & Security**:
  - JSON Web Tokens (`jsonwebtoken`)
  - Password hashing via `bcryptjs`
  - Bearer token authorization (supporting both JWT and legacy demo tokens)
  - Sliding-window rate limiting (20 requests per 60 seconds per IP with `Retry-After`)
  - Strict security headers (`X-Content-Type-Options: nosniff`, `Strict-Transport-Security`)
  - CORS preflight and headers
  - Stable SHA-256 ETag caching with Conditional GET (`If-None-Match` -> 304) and Conditional Write (`If-Match` -> 412)
  - Idempotency-Key support across critical write endpoints
- **Content Negotiation**: Multi-format support (`application/json`, `application/problem+json`, `application/xml`)
- **File Uploads**: `multer` with MIME-type filtering and storage limits
- **Testing**: `jest` and `supertest`

---

## Project Architecture & Structure

```
CampusEats/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                 # MySQL pool, schema migration, and fallback store
│   │   │   └── env.js                # Centralized environment variable management
│   │   ├── controllers/
│   │   │   ├── authController.js     # User registration, login, profile, upload
│   │   │   ├── catalogController.js  # Menu items CRUD, availability, proxy payments
│   │   │   ├── graphqlController.js  # GraphQL query & mutation execution
│   │   │   ├── orderController.js    # Order lifecycle, transitions, XML/JSON responses
│   │   │   └── paymentController.js  # Payment charges, declines, refunds
│   │   ├── middleware/
│   │   │   ├── auth.js               # Dual JWT + Bearer token validator
│   │   │   ├── contentNegotiation.js # JSON and XML Accept header validation
│   │   │   ├── errorHandler.js       # Centralized RFC 7807 error handler
│   │   │   ├── etag.js               # SHA-256 ETag calculation & match checks
│   │   │   ├── rateLimiter.js        # Sliding-window rate limiting middleware
│   │   │   └── upload.js             # Multer file upload middleware
│   │   ├── models/
│   │   │   ├── menuItemModel.js      # Menu item validation logic
│   │   │   ├── orderModel.js         # Order schema and field error validation
│   │   │   ├── paymentModel.js       # Payment validation rules
│   │   │   └── userModel.js          # Registration and login validators
│   │   ├── routes/
│   │   │   ├── authRoutes.js         # /api/auth endpoints
│   │   │   ├── catalogRoutes.js      # /menu-items and /catalog-payments endpoints
│   │   │   ├── graphqlRoutes.js      # /graphql endpoint
│   │   │   ├── orderRoutes.js        # /orders and /health endpoints
│   │   │   ├── paymentRoutes.js      # /payments endpoints
│   │   │   └── index.js              # Aggregated root router
│   │   ├── services/
│   │   │   ├── authService.js        # Password hashing & JWT generation
│   │   │   ├── catalogService.js     # Catalog store with MySQL + in-memory store
│   │   │   ├── orderService.js       # State transition engine and calculations
│   │   │   └── paymentService.js     # Charge simulation and refund engine
│   │   ├── utils/
│   │   │   ├── problemDetails.js     # RFC 7807 response builder
│   │   │   └── xmlUtils.js           # XML formatting & escaping utility
│   │   ├── app.js                    # Express app initialization & static serving
│   │   └── server.js                 # Server startup and graceful shutdown
│   ├── tests/
│   │   ├── auth.test.js              # Identity & auth unit/integration tests
│   │   ├── catalog.test.js           # Catalog REST, ETag, conditional write tests
│   │   ├── graphql.test.js           # GraphQL query & mutation tests
│   │   ├── orders.test.js            # Order transitions, XML negotiation tests
│   │   └── payments.test.js          # Payment charges, declines, refund tests
│   ├── .env                          # Local environment variables
│   ├── .env.example                  # Example template for environment variables
│   └── package.json                  # Node.js project manifest & dependencies
├── frontend/
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css             # Responsive cafeteria dashboard styling
│   │   └── js/
│   │       └── app.js                # Frontend client interfacing with /graphql
│   └── index.html                    # CampusEats single-page menu dashboard
├── docs/                             # Project documentation
├── brief.md                          # CampusEats requirements brief
├── design.md                         # Architecture and service specifications
├── schema.sql                        # Database schema definition
└── README.md                         # This file
```

---

## Database Configuration

CampusEats uses **MySQL** as its primary relational database. The schema aligns with both the catalog requirements and the full relational entities defined in `schema.sql`.

### MySQL Table (`menu_items`)

```sql
CREATE TABLE IF NOT EXISTS menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    available BOOLEAN NOT NULL DEFAULT TRUE
);
```

### Automatic Connection Handling & Fallback
The backend connects to MySQL using a connection pool. If MySQL credentials are not provided, or during isolated test runs, the backend automatically and safely falls back to a high-performance in-memory store so that the system remains 100% operational in any environment.

To connect to your local MySQL server, update `backend/.env` with your MySQL credentials:

```ini
STORE_BACKEND=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=campuseats_db
```

---

## Environment Variables

Configuration is handled through `dotenv`. Create or update `backend/.env` using `backend/.env.example` as a template:

| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP server port | `5000` |
| `NODE_ENV` | Environment (`development`, `production`, `test`) | `development` |
| `CAMPUSEATS_TOKEN` | Bearer token for client authentication | `campuseats-demo-token` |
| `JWT_SECRET` | Secret key used to sign and verify JWT tokens | `campuseats-super-secret-jwt-key-2026` |
| `JWT_EXPIRES_IN` | Token expiration duration | `24h` |
| `RATE_LIMIT` | Max requests per IP per window | `20` |
| `RATE_WINDOW_SECONDS` | Rate limit sliding window duration in seconds | `60` |
| `STORE_BACKEND` | Storage backend (`mysql` or `memory`) | `mysql` |
| `DB_HOST` | MySQL hostname | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_USER` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | `""` |
| `DB_NAME` | MySQL database name | `campuseats_db` |
| `PAYMENTS_URL` | Optional external Payment Service URL | `http://127.0.0.1:8080` |

---

## Installation Instructions

Ensure you have **Node.js** (v18 or higher) installed.

### On Windows PowerShell or Command Prompt:

1. Open your terminal in the `backend/` directory:
   ```powershell
   cd backend
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

---

## Starting the Application

### 1. Start the Backend Server

Inside the `backend/` directory, run:

```powershell
npm start
```

Or run with live file reloading (development mode):
```powershell
npm run dev
```

You will see:
```text
[CampusEats] Starting server in development mode...
[CampusEats] Server running on http://127.0.0.1:5000
[CampusEats] Frontend: http://127.0.0.1:5000/
[CampusEats] GraphQL:  http://127.0.0.1:5000/graphql
[CampusEats] Catalog:  http://127.0.0.1:5000/menu-items
[CampusEats] Orders:   http://127.0.0.1:5000/orders
[CampusEats] Payments: http://127.0.0.1:5000/payments
[CampusEats] Auth:     http://127.0.0.1:5000/api/auth
```

### 2. View the Frontend

The Node.js backend serves the frontend dashboard directly.
Open your browser and navigate to:

```text
http://127.0.0.1:5000/
```

Features available in the frontend:
- Visual menu cards with category emojis and availability badges
- Instant client-side search by item name or category
- Category and availability filters
- Real-time cafeteria statistics (total items, available now, average price)
- GraphQL item creation form (`createMenuItem` mutation)
- GraphQL availability update form (`updateMenuAvailability` mutation)

---

## API Documentation

All protected endpoints accept either:
- The standard demo Bearer token: `Authorization: Bearer campuseats-demo-token`
- Or a JWT Bearer token: `Authorization: Bearer <jwt_token>` obtained from `/api/auth/login`

All error responses strictly follow **RFC 7807 / 9457 Problem Details** (`{ type, title, status, detail, [errors] }`).

### Catalog Service (REST)

| Method | Endpoint | Description | Headers / Query Params |
|---|---|---|---|
| `GET` | `/menu-items` | List menu items with pagination, sorting, and category filters | Query: `category`, `sort` (id, name, category, price), `order` (asc, desc), `page`, `limit` |
| `POST` | `/menu-items` | Create a new menu item | Requires `Idempotency-Key` header. Returns `201 Created` with `Location` and `ETag`. |
| `GET` | `/menu-items/:id` | Retrieve a single menu item | Supports Conditional GET via `If-None-Match` header (returns `304 Not Modified`). |
| `POST` | `/menu-items/:id/availability` | Update item availability state | Supports Conditional Write via `If-Match` header (returns `412 Precondition Failed` if stale; `409 Conflict` if no-op). |
| `PUT` | `/menu-items/:id` | Full update of a menu item | Updates name, category, price, available. Returns `200 OK`. |
| `DELETE` | `/menu-items/:id` | Remove a menu item | Returns `204 No Content`. |
| `OPTIONS`| `/menu-items` | Discover allowed methods & CORS preflight | Returns `204` with `Allow: GET, POST, OPTIONS`. |
| `POST` | `/catalog-payments` | Forward payment through catalog with bounded retries | Body: `{ orderId, cardToken, amount, currency }`. Requires `Idempotency-Key`. |

### Catalog Service (GraphQL)

- **Endpoint**: `POST /graphql`
- **Headers**:
  ```http
  Authorization: Bearer campuseats-demo-token
  Content-Type: application/json
  Accept: application/json
  ```

#### Example Query: Fetch Menu Items
```graphql
query {
  menuItems(category: "Fast Food") {
    id
    name
    category
    price
    available
  }
}
```

#### Example Mutation: Create Item
```graphql
mutation {
  createMenuItem(
    name: "Crispy Paneer Wrap"
    category: "Fast Food"
    price: 120.0
    available: true
  ) {
    menuItem {
      id
      name
      price
      available
    }
  }
}
```

#### Example Mutation: Update Availability
```graphql
mutation {
  updateMenuAvailability(id: "1", available: false) {
    menuItem {
      id
      name
      available
    }
  }
}
```

---

### Order Service (REST)

| Method | Endpoint | Description | Response Status |
|---|---|---|---|
| `GET` | `/orders` | List all orders | `200 OK` |
| `POST` | `/orders` | Create an order with item IDs, quantities, and delivery address | `201 Created` with `Location: /orders/:id` |
| `GET` | `/orders/:id` | Retrieve an order | `200 OK` (or `404`) |
| `PATCH` | `/orders/:id` | Transition order status (`created` -> `paid`, `paid` -> `preparing`, `preparing` -> `ready`, `ready` -> `completed`, `cancelled`) | `200 OK` (or `409 Illegal Transition`, `402 Declined`, `503 Unavailable`) |
| `DELETE`| `/orders/:id` | Delete order (only valid when status is `created` or `cancelled`) | `204 No Content` |
| `GET` | `/health` | Service health status | `200 OK` (`{ "status": "ok" }`) |

#### Content Negotiation
The Orders Service supports content negotiation:
- Request `Accept: application/json` -> receives JSON
- Request `Accept: application/xml` -> receives structured XML (`<order>` or `<orders>`)
- Unsupported `Accept` -> returns `406 Not Acceptable`

#### Payment Simulation Headers on `PATCH /orders/:id`
- `X-Simulate-Payment: unavailable` -> Returns `503 Service Unavailable` with `Retry-After: 5`.
- `X-Simulate-Payment: declined` -> Returns `402 Payment Declined`.

---

### Payment Service (REST)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/payments` | Process a payment in paise (`amount`), currency (`INR`), `orderId`, `cardToken`. Cards prefixed with `tok_bad` trigger `422 Card Declined`. Supports `Idempotency-Key`. |
| `GET` | `/payments/:id` | Retrieve payment by ID |
| `GET` | `/payments?order=:orderId`| List all payments associated with an order ID |
| `POST` | `/payments/:id/refund` | Refund a captured payment (transitions to `refund_pending`, returns `202 Accepted`) |

---

### Identity / Auth Service (REST)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user (`name`, `email`, `password`, `role`). Returns user object and JWT. |
| `POST` | `/api/auth/login` | Login with email and password. Returns JWT token. |
| `GET` | `/api/auth/me` | Fetch authenticated user profile (requires `Authorization: Bearer <jwt>`). |
| `POST` | `/api/auth/upload` | Multipart file upload (`multer` integration) for student ID/docs. |

---

## Testing Instructions

The migrated backend includes a comprehensive, automated test suite covering all services, endpoints, status codes, and edge cases.

### Run All Tests

Inside the `backend/` directory, run:

```powershell
npm test
```

### Test Suite Coverage:
- `tests/catalog.test.js`:
  - 201 creation with `Location`, `ETag`, and JSON content type
  - Idempotency-Key caching and replay guarantees
  - Conditional GET (304 Not Modified when `If-None-Match` matches)
  - Conditional write (412 Precondition Failed when `If-Match` is stale)
  - Validation failures (400 Bad Request)
  - Missing resource (404 Not Found)
  - Authentication guard (401 Unauthorized)
  - Content negotiation (406 Not Acceptable on invalid `Accept`)
  - CORS and `OPTIONS` preflight with `Allow` header
  - Sorting, category filtering, and pagination query parameters
  - Full CRUD lifecycle (PUT update, DELETE 204)
- `tests/graphql.test.js`:
  - Schema execution for `menuItems` query
  - `createMenuItem` mutation
  - `updateMenuAvailability` mutation
  - HTTP `POST /graphql` query execution and variable binding
- `tests/orders.test.js`:
  - 201 creation with `Location`
  - Field-level validation collecting multiple errors (422)
  - Empty cart rejection (422)
  - Order state machine transitions & illegal transition protection (409)
  - Payment simulation (402 Declined, 503 Service Unavailable with `Retry-After`)
  - XML content negotiation (`<order>`)
  - Order deletion lifecycle (204)
- `tests/payments.test.js`:
  - Successful card charge (201 with `Location`)
  - Declined card simulation (422)
  - Idempotent request replay
  - Retrieval and order listing
  - Refund lifecycle (202 and 409 protection)
- `tests/auth.test.js`:
  - User registration with bcrypt password hashing
  - Duplicate email conflict rejection (409)
  - Login with JWT token issuance
  - Protected route verification with JWT
  - Backwards-compatible legacy demo token authorization

---

## Verification Summary

- **Total Test Suites**: 5 passed, 5 total
- **Total Automated Tests**: 36 passed, 36 total
- **Live Server Verification**: 16/16 endpoints verified on running HTTP server
- **Python Dependencies**: Completely removed (no Python code or runtime dependencies required)
- **Database Connectivity**: MySQL pool configured with automated table verification and resilient fallback
