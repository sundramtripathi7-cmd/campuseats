# CampusEats — Assignment 5

## Run the Catalog Service

Open a terminal in `Assignment 5/catalogservice`:

```bash
pip install -r requirements.txt
```

Set the demo token:

Windows PowerShell:
```powershell
$env:CAMPUSEATS_TOKEN="campuseats-demo-token"
```

Optional Payment Service URL:
```powershell
$env:PAYMENTS_URL="http://127.0.0.1:8080"
```

Start the Catalog Service:

```bash
python app.py
```

The service runs on:

```text
http://127.0.0.1:5000
```

## Run tests

```bash
pytest -q
```

## Validate OpenAPI

```bash
openapi-spec-validator openapi.yaml
```

## Run the curl transcript

Run the commands in `curl-transcript.txt` from the `Assignment 5` directory after starting the service.

## Important

Replace `[ENTER TEAM ID]` in `NOTES.md` with the actual Team ID before submission.

The `curl-transcript.txt` included in this package is a prepared transcript matching the implemented endpoints. Re-run it locally with `curl -v` before final submission so dynamic `Date`, `Server`, `Content-Length`, and runtime rate-limit values reflect the actual environment.

## GraphQL API Integration

The Campus Eats Catalog Service supports GraphQL alongside its existing REST API. GraphQL allows clients to request only the required menu-item fields and perform supported operations through a single endpoint.

### Endpoint

`POST /graphql`

### Supported Queries

**1. Fetch all menu items**
```graphql
{
  menuItems {
    id
    name
    category
    price
    available
  }
}
```

**2. Fetch menu items by category**
```graphql
{
  menuItems(category: "Pizza") {
    id
    name
    price
    available
  }
}
```

### Supported Mutations

**1. Create a menu item**
```graphql
mutation {
  createMenuItem(
    name: "Test Pizza"
    category: "Pizza"
    price: 199
  ) {
    menuItem {
      id
      name
      category
      price
      available
    }
  }
}
```

**2. Update menu-item availability**
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

### Testing

Run the GraphQL tests from the catalog service directory:

```bash
python -m pytest test_graphql.py -v
```

The current test suite verifies menu-item queries, creation, and availability updates.

# CampusEats — Assignment 5

## 1. Project Overview

CampusEats is a campus food catalog application that allows users to view menu items, check their availability, and manage menu items. The project uses a Python Flask backend, a web-based HTML/CSS frontend, and supports both REST and GraphQL APIs.

## 2. Prerequisites

Install the following before running the project:

- Python 3.10 or later
- pip
- A modern web browser

## 3. Run the Catalog Service

Open a terminal in `Assignment 5/catalogservice`.

Install dependencies:

```bash
python -m pip install -r requirements.txt
```

Set the demo token in Windows PowerShell:

```powershell
$env:CAMPUSEATS_TOKEN="campuseats-demo-token"
```

Optional Payment Service URL:

```powershell
$env:PAYMENTS_URL="http://127.0.0.1:8080"
```

Start the Flask service:

```bash
python app.py
```

The application is available at:

`http://127.0.0.1:5000`

Keep the terminal running while using the application.

## 4. Run the Frontend

The frontend uses HTML, CSS, and JavaScript and is served by the Flask application.

1. Start the Catalog Service using the instructions above.
2. Open `http://127.0.0.1:5000` in your browser.
3. Use the Menu page to view menu items.
4. Open Manage Items to create menu items and update their availability.

The frontend communicates with the Flask backend and GraphQL endpoint.

## 5. REST API and GraphQL Integration

The Catalog Service supports GraphQL alongside its existing REST API.

### GraphQL Endpoint

`POST http://127.0.0.1:5000/graphql`

GraphQL requests should be sent using HTTP POST with a JSON body containing the query or mutation. Opening `/graphql` directly in the browser address bar sends a GET request, which may return `405 Method Not Allowed`.

### Supported Queries

#### Fetch all menu items

```graphql
{
  menuItems {
    id
    name
    category
    price
    available
  }
}
```

#### Fetch menu items by category

```graphql
{
  menuItems(category: "Pizza") {
    id
    name
    price
    available
  }
}
```

### Supported Mutations

#### Create a menu item

```graphql
mutation {
  createMenuItem(
    name: "Test Pizza"
    category: "Pizza"
    price: 199
  ) {
    menuItem {
      id
      name
      category
      price
      available
    }
  }
}
```

#### Update menu-item availability

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

The ID in the update example must match an existing menu item.

## 6. Run Tests

Run the complete test suite from `Assignment 5/catalogservice`:

```bash
python -m pytest -v
```

Run only the GraphQL tests:

```bash
python -m pytest test_graphql.py -v
```

The current verified test run reported 13 passing tests, including GraphQL query, creation, and availability-update tests.

## 7. Validate OpenAPI

If `openapi-spec-validator` is installed, run:

```bash
openapi-spec-validator openapi.yaml
```

If the command is not found, install the validator:

```bash
python -m pip install openapi-spec-validator
```

## 8. Run the cURL Transcript

From the `Assignment 5` directory, follow the commands in `curl-transcript.txt` after starting the required service.

Re-run the commands locally before submission so response headers and runtime values reflect the actual environment.

## 9. Important Submission Notes

- Replace `[ENTER TEAM ID]` in `NOTES.md` with the actual Team ID.
- Ensure `requirements.txt` includes all dependencies used by the project, including Graphene and pytest if required.
- Run the complete test suite before submission.
- Confirm that the frontend, REST endpoints, and GraphQL operations work in the local environment.

## 10. Project Structure

```text
Assignment 5/
└── catalogservice/
    ├── app.py
    ├── graphql_schema.py
    ├── models.py
    ├── store.py
    ├── templates/
    ├── static/
    ├── tests/
    ├── test_graphql.py
    ├── requirements.txt
    ├── openapi.yaml
    └── README.md
```

The project structure above highlights the main application, frontend, API schema, and test files.

 

## Assignment 7 — GraphQL Menu Service

### 1. Selected CampusEats Service

We selected the **Menu Catalog Service** of CampusEats. It allows clients to retrieve menu items, filter items by category, fetch an item by ID, create new menu items, and update their availability.

### 2. GraphQL Implementation

The service is implemented using Python Flask, Graphene, and MySQL. The GraphQL endpoint is:

`POST /graphql`

**Object Type:** `MenuItemType`

Fields:
- `id`: Menu item identifier
- `name`: Name of the dish
- `category`: Menu category
- `price`: Price of the dish
- `available`: Availability status

**Queries:**
- `menuItems(category:)` — Retrieves all menu items or filters them by category.
- `menuItem(id:)` — Retrieves a single menu item by ID.

**Mutations:**
- `createMenuItem` — Adds a new menu item.
- `updateMenuAvailability` — Updates the availability of an existing item.

### 3. Database Mapping

The GraphQL resolvers delegate database operations to functions in `store.py`.

- `resolve_menu_items` calls `list_items()` to retrieve menu items, optionally filtered by category.
- `resolve_menu_item` calls `get_item()` to retrieve an item by ID.
- The `CreateMenuItem.mutate` method validates the input and calls `create_item()`. The database insertion is performed inside `store.py`.
- The `UpdateMenuAvailability.mutate` method calls `update_availability()` to update an item's availability.

For the category filter, the database operation uses the category condition to select matching records. The exact SQL implementation is defined in `store.py`.

### 4. Answers to Assignment Questions

**Q1. Which CampusEats service did you pick?**

We selected the Menu Catalog Service, which manages menu-item details and availability.

**Q2. Name one field a client can skip and one it cannot. Why do we use the `!` sign?**

In GraphQL, a nullable field can be omitted from the selection set, while a non-null field marked with `!` cannot return `null` when requested. For example, `category` can be omitted from a query selection. In the current implementation, the object fields are nullable by default; the `id` argument of `menuItem` and the `id` and `available` arguments of `updateMenuAvailability` are required.

**Q3. Which part of your query became the SQL WHERE condition, and which resolver ran the INSERT?**

The category argument of `menuItems(category:)` is used to filter menu items in the database. The `CreateMenuItem.mutate` method invokes `create_item()`, which performs the database insertion.

### 5. Frontend Demonstration

The HTML/CSS/JavaScript frontend is served by Flask. It fetches menu items through the GraphQL endpoint and provides controls to create menu items and update availability.

The live demonstration should include:
1. The menu before the mutation.
2. Creating a new menu item or updating its availability.
3. The updated menu after the mutation.

### 6. Submission Evidence

- Before-mutation screenshot: Added in submission folder.
- After-mutation screenshot: Added in submission folder
- Demonstration video: Add the Google Drive link here.
- GitHub repository: https://github.com/sundramtripathi7-cmd/campuseats

### 7. Team Details

Sundaram Tripathi               :  (20251651091) (lead),
Abhinav Kumar Chandravanshi     :  (20251651004)
Ankit Kumar                     :  (20251651022)
akshay kumar                    :  (20251651012)

## Assignment 7 — GraphQL Menu Catalog Service

### Project Overview

CampusEats is a campus food catalog application. For Assignment 7, the Menu Catalog Service is exposed through a GraphQL API. Users can retrieve menu items, filter them by category, create new menu items, and update item availability.

### Technology Stack

- **Backend:** Python Flask
- **GraphQL:** Graphene
- **Database:** MySQL
- **Frontend:** HTML, CSS and JavaScript
- **GraphQL Endpoint:** `POST /graphql`

### Features

1. Retrieve all menu items.
2. Retrieve a menu item by ID.
3. Filter menu items by category.
4. Create a new menu item using a mutation.
5. Update menu-item availability using a mutation.
6. Display menu data through the CampusEats web interface.

### Main Project Files

```text
catalogservice/
├── app.py
├── graphql_schema.py
├── models.py
├── store.py
├── requirements.txt
├── templates/
│   └── index.html
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
├── test_graphql.py
└── README.md
```

### How to Run the Project

1. Start the MySQL server.
2. Open a terminal in the `catalogservice` directory.
3. Install the required Python dependencies:

```powershell
pip install -r requirements.txt
```

4. Configure the database connection using environment variables. Set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` to match your local MySQL setup. Do not commit your database password.
5. Start the Flask application:

```powershell
python app.py
```

6. Open the application at `http://127.0.0.1:5000`.
7. Use the Menu and Manage Items sections to view and modify menu items.

### GraphQL Examples

**Query — Retrieve menu items**

```graphql
{
  menuItems {
    id
    name
    category
    price
    available
  }
}
```

**Query — Filter by category**

```graphql
{
  menuItems(category: "Snacks") {
    id
    name
    price
    available
  }
}
```

**Mutation — Create a menu item**

```graphql
mutation {
  createMenuItem(
    name: "Assignment 7 Test Sandwich"
    category: "Snacks"
    price: 75
    available: true
  ) {
    menuItem {
      id
      name
      category
      price
      available
    }
  }
}
```

**Mutation — Update availability**

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

Use an existing menu-item ID when running the availability mutation. The GraphQL endpoint uses the authentication configured in the application.

### Answers to Assignment Questions

**Q1. Which CampusEats service did you pick?**

We selected the Menu Catalog Service, which manages menu-item details, category, price and availability.

**Q2. Name one field a client can skip and one it cannot. Why is the `!` sign used?**

A client can omit the `category` field from its selection set when it does not need category information. The `id` argument of the `menuItem` query cannot be omitted because it is declared with `required=True` in the Graphene schema. GraphQL's `!` notation indicates a non-null type or required argument. In the current implementation, object fields are nullable by default, so they are not all marked non-null.

**Q3. Which part of your query became the SQL `WHERE` condition, and which resolver ran the `INSERT`?**

The `category` argument in `menuItems(category: "Snacks")` is used to filter database records. In MySQL mode, the storage function `list_items(category)` applies the category filter using a SQL `WHERE` condition. The `CreateMenuItem.mutate` method validates the input and calls `create_item(item)`, which executes the SQL `INSERT` statement.

### Submission Evidence

**Before mutation:** `Assignment_7/Screanshots/before/`

**After mutation:** `Assignment_7/Screanshots/after/`

**Demonstration video:** [https://drive.google.com/file/d/1YRPuP__5XNtUoycgHGEGP0XmdFn5Q_lV/view?usp=drivesdk]

**GitHub repository:** [https://github.com/sundramtripathi7-cmd/campuseats]

### Testing

Run the test suite from the project directory:

```powershell
$env:STORE_BACKEND = "memory"
python -m pytest -q
```

The memory backend is intended for testing. Remove the environment override before running the application against MySQL:

```powershell
Remove-Item Env:STORE_BACKEND -ErrorAction SilentlyContinue
```

Before submission, verify the tests and the live MySQL demonstration.

### Conclusion

The CampusEats Menu Catalog Service demonstrates how GraphQL queries and mutations can be integrated with a Flask application, a MySQL database and a simple web interface. It supports menu retrieval, category filtering, item creation and availability updates.
