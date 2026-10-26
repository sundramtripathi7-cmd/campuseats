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
