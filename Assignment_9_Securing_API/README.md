# CampusEats — Assignment 9: Securing the API

This folder contains the complete, self-contained implementation for **Assignment 9: Securing the API** using **Node.js**, **Express.js**, **JSON Web Tokens (JWT)**, and **bcryptjs**.

---

## 1. Overview & Technology Stack

Assignment 9 secures the CampusEats Menu REST API developed in Assignment 8 by introducing:
- **Password Hashing**: Passwords stored as irreversible salted hashes using `bcryptjs`.
- **Stateless Authentication**: Token-based authentication using **JSON Web Tokens (`jsonwebtoken`)**.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions allowing customers to view the menu, while restricting creation and management to restaurant partners and administrators.
- **Environment Configuration**: Secrets and port numbers managed via `dotenv`.

---

## 2. Demo User Accounts

The system is pre-configured with three demo user accounts having different roles. **No plain-text passwords are ever stored in the database or user store.**

| Username | Password | Role | Permissions |
|---|---|---|---|
| `customer` | `customer123` | `customer` | **Read-Only**: Can view all menu items (`GET /items`, `GET /items/:id`). Attempting to add items returns **403 Forbidden**. |
| `restaurant` | `restaurant123` | `restaurant` | **Read + Write**: Can view items and create new menu items (`POST /items`). |
| `admin` | `admin123` | `admin` | **Full Access**: Can perform all operations across the system. |

---

## 3. Security Architecture & Middleware

### 1. Password Hashing with `bcryptjs`
When users are initialized or authenticate:
- Passwords are encrypted using `bcrypt.hash(password, saltRounds)` with a cost factor of 10.
- During login (`POST /login`), the submitted password is verified against the hash using `bcrypt.compare(password, user.passwordHash)`.
- Plain-text passwords never touch application state or network logs.

### 2. Authentication Middleware (`authenticateToken`)
- Inspects the `Authorization` HTTP header for the `Bearer <token>` scheme.
- Verifies the cryptographic signature and expiration of the token using `jwt.verify(token, process.env.JWT_SECRET)`.
- If the token is missing or malformed -> Returns **`401 Unauthorized`**.
- If the token is invalid, tampered with, or expired -> Returns **`401 Unauthorized`**.
- If valid -> Decodes `{ id, username, role }` and attaches it to `req.user`.

### 3. Role-Based Authorization Middleware (`authorizeRoles`)
- Enforces access rules based on `req.user.role`.
- `POST /items` requires the user to have either the `restaurant` or `admin` role.
- If a user with the `customer` role attempts to call `POST /items`, the middleware rejects the request with **`403 Forbidden`**.

---

## 4. API Endpoints & Status Codes

| Method | Endpoint | Access Level | Success | Error Status Codes |
|---|---|---|---|---|
| `POST` | `/login` | Public | `200 OK` (returns JWT token & user profile) | `400 Bad Request` (missing fields)<br>`401 Unauthorized` (bad credentials) |
| `GET` | `/items` | Public | `200 OK` (list of all items) | — |
| `GET` | `/items/:id` | Public | `200 OK` (item details) | `404 Not Found` (item not found) |
| `POST` | `/items` | **Secured** (`restaurant`, `admin`) | `201 Created` (returns created item) | `401 Unauthorized` (no/invalid token)<br>`403 Forbidden` (customer role)<br>`422 Unprocessable Entity` (missing name) |
| `GET` | `/me` | **Secured** (any logged-in user) | `200 OK` (returns `{ user: req.user }`) | `401 Unauthorized` (no/invalid token) |

---

## 5. Installation & Startup Instructions (Windows)

### Prerequisites:
- Node.js (v18+)

### Steps:

1. Open PowerShell and navigate to the assignment directory:
   ```powershell
   cd Assignment_9_Securing_API
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Ensure `.env` exists (copied from `.env.example` if needed):
   ```powershell
   # If .env does not exist, run:
   Copy-Item .env.example .env
   ```

4. Start the secured server:
   ```powershell
   npm start
   ```

5. Output displayed in the terminal:
   ```text
   [CampusEats Assignment 9] Secured Server running on http://localhost:4000
   [CampusEats Assignment 9] Frontend: http://localhost:4000/
   [CampusEats Assignment 9] Login:    http://localhost:4000/login
   [CampusEats Assignment 9] Items:    http://localhost:4000/items
   ```

6. Open your web browser and visit:
   ```text
   http://localhost:4000/
   ```

---

## 6. Testing Instructions

### Option A: Automated Jest Tests
Run the comprehensive automated test suite testing all authentication flows, public routes, role permissions, and error codes:
```powershell
npm test
```

### Option B: Manual Testing using `curl` (Windows PowerShell)

#### Step 1: Log in as Customer
```powershell
curl -i -X POST http://localhost:4000/login `
  -H "Content-Type: application/json" `
  -d '{"username": "customer", "password": "customer123"}'
```
*Saves the returned token string for customer.*

#### Step 2: Log in as Restaurant
```powershell
curl -i -X POST http://localhost:4000/login `
  -H "Content-Type: application/json" `
  -d '{"username": "restaurant", "password": "restaurant123"}'
```
*Saves the returned token string for restaurant.*

#### Step 3: Fetch Menu Items Without Token (Public 200 OK)
```powershell
curl -i http://localhost:4000/items
```

#### Step 4: Attempt POST /items Without Token (Status 401 Unauthorized)
```powershell
curl -i -X POST http://localhost:4000/items `
  -H "Content-Type: application/json" `
  -d '{"name": "Paneer Roll", "price": 100}'
```
*Expected: HTTP 401 Unauthorized (`Access token is missing or malformed`)*

#### Step 5: Attempt POST /items as Customer (Status 403 Forbidden)
```powershell
# Replace <CUSTOMER_TOKEN> with the token obtained from Step 1
curl -i -X POST http://localhost:4000/items `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <CUSTOMER_TOKEN>" `
  -d '{"name": "Paneer Roll", "price": 100}'
```
*Expected: HTTP 403 Forbidden (`Access denied. Required role: restaurant or admin`)*

#### Step 6: Create Item as Restaurant (Status 201 Created)
```powershell
# Replace <RESTAURANT_TOKEN> with the token obtained from Step 2
curl -i -X POST http://localhost:4000/items `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <RESTAURANT_TOKEN>" `
  -d '{"name": "Paneer Tikka Roll", "category": "Rolls", "price": 120, "available": true}'
```
*Expected: HTTP 201 Created with JSON representation including `"createdBy": "restaurant"`.*

#### Step 7: Validation Failure as Restaurant: Missing Name (Status 422)
```powershell
curl -i -X POST http://localhost:4000/items `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer <RESTAURANT_TOKEN>" `
  -d '{"category": "Rolls", "price": 120}'
```
*Expected: HTTP 422 Unprocessable Entity (`name is required and cannot be empty`).*

---

## 7. Frontend Features
- **Session & Role Indicators**: Visual badge showing real-time authentication status (`GUEST`, `CUSTOMER`, `RESTAURANT`, `ADMIN`).
- **1-Click Fast Logins**: Instant buttons to log in as Customer, Restaurant, or Admin without typing.
- **Manual Credentials Form**: For testing invalid credentials and verifying `401 Unauthorized` responses.
- **Catalog Viewer**: Loads items using `GET /items`.
- **Protected Action Handling**: The creation form sends `Authorization: Bearer <token>` automatically, and displays custom colored badges displaying the exact HTTP response code (`201`, `401`, `403`, `422`).

