# CampusEats — Assignment 8: Menu / Catalogue REST API Service

This folder contains the complete implementation for **Assignment 8: Build CampusEats Service as REST API** using **Node.js** and **Express.js**.

---

## 1. Official Assignment Questions & Answers

### Question 1: Which CampusEats service did you pick, and what are its routes (method + path)?
**Answer**:
We picked the **CampusEats Menu / Catalogue Service**. The entity modeled is **Menu Item** (`Menu`), representing the cafeteria food and beverage items available for campus students and faculty.

The service implements the following REST API routes:
- `GET /items`: Fetches the complete list of available menu items.
- `GET /items/:id`: Fetches a single menu item matching the unique numeric ID in the URL.
- `POST /items`: Creates a new menu item using the JSON payload provided in the request body.

---

### Question 2: Which status codes did you return, and for which outcomes (200 / 201 / 404 / 422)?
**Answer**:
The service uses standard, semantic HTTP status codes for all operations:
- **`200 OK`**:
  - Returned on `GET /items` when the menu list is successfully retrieved.
  - Returned on `GET /items/:id` when a menu item matching the given ID exists.
- **`201 Created`**:
  - Returned on `POST /items` when a new menu item is successfully validated, created in memory, and assigned a new unique ID.
- **`404 Not Found`**:
  - Returned on `GET /items/:id` when no menu item exists with the requested ID.
- **`422 Unprocessable Entity`**:
  - Returned on `POST /items` when request body validation fails (specifically when the required `name` field is missing, empty, or composed only of whitespace, or when the price is negative).

---

### Question 3: Where did you use `req.params` and where `req.body`? Why does POST need `express.json()`?
**Answer**:
- **`req.params`**:
  - Used in `GET /items/:id` (as `req.params.id`) to capture route parameters defined in the URL path.
- **`req.body`**:
  - Used in `POST /items` (as `req.body`) to access the parsed JSON payload containing the fields `name`, `category`, `price`, and `available`.
- **Why does POST need `express.json()`?**:
  - By default, Node.js and Express do not automatically parse incoming HTTP request bodies. Incoming POST payloads arrive as raw data streams over the TCP socket.
  - Without `express.json()` middleware, `req.body` would be `undefined`.
  - `express.json()` intercepts incoming requests with `Content-Type: application/json`, buffers the stream, parses the raw JSON string into a native JavaScript object, and binds it to `req.body` so route handlers can read and validate its properties.

---

## 2. In-Memory Data Structure & Initial Sample Items

Each menu item has the following structure:
```json
{
  "id": 1,
  "name": "Veg Burger",
  "category": "Fast Food",
  "price": 80.0,
  "available": true
}
```

Pre-loaded sample items:
1. `Veg Burger` (Fast Food) — ₹80.00 [Available]
2. `Paneer Roll` (Rolls) — ₹100.00 [Available]
3. `Masala Chai` (Beverages) — ₹20.00 [Available]
4. `Cold Coffee` (Beverages) — ₹60.00 [Sold Out]
5. `Samosa (2 pcs)` (Snacks) — ₹30.00 [Available]

---

## 3. Installation & Startup Instructions (Windows)

### Prerequisites:
- Node.js (v18+)

### Steps:

1. Open PowerShell and navigate to the assignment directory:
   ```powershell
   cd Assignment_8_REST_API
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Start the server:
   ```powershell
   npm start
   ```

4. Output displayed in the terminal:
   ```text
   [CampusEats Assignment 8] Server running on http://localhost:3000
   [CampusEats Assignment 8] Frontend: http://localhost:3000/
   [CampusEats Assignment 8] API:      http://localhost:3000/items
   ```

5. Open your web browser and visit:
   ```text
   http://localhost:3000/
   ```

---

## 4. Testing Instructions

### Option A: Automated Jest Tests
Run the included automated test suite covering all routes, status codes, and validations:
```powershell
npm test
```

### Option B: Manual Testing using `curl`

#### 1. Fetch all items (Status 200)
```powershell
curl -i http://localhost:3000/items
```

#### 2. Fetch one existing item (Status 200)
```powershell
curl -i http://localhost:3000/items/1
```

#### 3. Fetch non-existent item (Status 404)
```powershell
curl -i http://localhost:3000/items/999
```

#### 4. Create valid menu item (Status 201)
```powershell
curl -i -X POST http://localhost:3000/items `
  -H "Content-Type: application/json" `
  -d '{"name": "Masala Dosa", "category": "South Indian", "price": 75, "available": true}'
```

#### 5. Validation failure: missing name (Status 422)
```powershell
curl -i -X POST http://localhost:3000/items `
  -H "Content-Type: application/json" `
  -d '{"category": "Snacks", "price": 40}'
```

---

## 5. Frontend Features
- **Modern Responsive Design**: Built with semantic HTML5 and CSS3 cards.
- **Fetch API Integration**: Automatically loads menu items via `GET /items`.
- **Live Statistics**: Dynamically updates total item count and in-stock count.
- **Creation Form**: Submits `POST /items` with JSON payload.
- **Auto-Refresh**: Automatically refreshes the catalog upon successful item creation.
- **Error Handling**: Displays informative success messages (green) or 422 validation errors (red).

