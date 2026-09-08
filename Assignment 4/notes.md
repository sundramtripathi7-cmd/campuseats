                  Assignment 4
      Rebuilding a CampusEats service in REST
              CS543 Web Services
                   IIIT Vadodara

Team Members
1	Akshay Kumar	20251651012
2	Sundram Tripathi	20251651091
3	Abhinav Kumar Chandravanshi	20251651004
4	Ankit Kumar	20251651022

          			Answers Required in NOTES.md
A4 — Resource Table
The Catalog Service models menu items as the main durable resource. The following endpoints are implemented in the service.
Method	URL	What it does	Success	Failure
POST	/menu-items	Creates a new menu item	201	400
GET	/menu-items	Lists menu items; optional category filter	200	—
GET	/menu-items/{id}	Retrieves one menu item	200	404
POST	/menu-items/{id}/availability	Changes the availability state	200	400, 404, 409

### A5 Justification

The Catalog Service exposes menu items as the main resource because the service is responsible for managing menu-item information.

The API uses resource-oriented URLs such as `/menu-items` and `/menu-items/{id}`. HTTP methods are used to represent the required operations. The API also uses HTTP status codes such as 201 for successful creation, 200 for successful retrieval or update, 400 for invalid requests, 404 when a menu item is not found, and 409 when the requested availability state conflicts with the current state.

The design keeps the Catalog Service focused on menu-item catalog responsibilities rather than mixing unrelated business responsibilities into the same service.

##  D3 — Unreachable Dependency and Fallback

If an external dependency becomes unreachable, the Catalog Service should not wait indefinitely for the dependency. The outbound HTTP call should use a timeout.

Transient failures can be retried using bounded retries with exponential backoff and jitter. Client-side 4xx errors should not be retried automatically.

If the dependency remains unavailable after the retry policy is exhausted, the service should use the defined fallback behavior and return a controlled error response rather than exposing an unhandled exception.

The fallback should preserve the Catalog Service's own data and contract and should not silently report an external operation as successful when that operation was not completed.

## 1. WSDL vs OpenAPI

The Assignment 3 partner WSDL describes the external SOAP payment operation and its SOAP/XML message structure.

The Assignment 4 OpenAPI document describes the REST-based Catalog Service using HTTP methods, resource paths, JSON request/response bodies, parameters, and HTTP status codes.

The REST contract is therefore organized around resources and HTTP operations rather than SOAP messages.

## 2. SOAP Fault to REST Error

In Assignment 3, the payment partner can return a `card_declined` SOAP fault.

In the REST service, an equivalent domain failure can be represented without exposing the partner's SOAP vocabulary.

For example:

HTTP status:

422 Unprocessable Content

Problem response:

{
  "type": "https://campuseats.example/problems/payment-declined",
  "title": "Payment Declined",
  "status": 422,
  "detail": "The payment could not be completed."
}

The internal partner-specific fault name is not exposed to CampusEats clients.

## 3. UDDI Publish / Find / Bind

The traditional UDDI publish/find/bind idea becomes simpler in the modern design.

The service information and endpoint can be published in a service catalogue or registry. A consumer can find the service and obtain its contract information.

A live UDDI server is not required for this assignment.

## 4. XML Schema vs validate()

In the REST implementation, the `validate_menu_item()` function in `models.py` checks the incoming JSON data before the application accesses its fields.

It checks required fields, data types, and valid values.

This gives the application a code-level validation responsibility similar to the validation role that a schema provides for structured messages.

## 5. SOAP Choice

If CampusEats used SOAP for one external integration, the main guarantee would be a strong, explicit message contract together with SOAP-level features such as message-level security and transaction-oriented integration where supported by the partner.

The rest of CampusEats can remain REST-based while the external boundary uses SOAP when those requirements make that protocol appropriate.
.
Submission Evidence Checklist
☐ Service folder contains openapi.yaml, source files, and tests/.
☐ NOTES.md contains A4 resource table, A5 justification, D3 fallback, and all five answers.
☐ curl transcript includes successful create with status code and Location header.
☐ curl transcript includes the same request repeated with the same Idempotency-Key and original result.
☐ curl transcript includes malformed body (400), missing resource (404), and state conflict (409).
☐ OpenAPI validator output/screenshot shows zero errors.
☐ pytest output shows all four tests passing.
☐ All team members' names and Roll Nos. appear on the first page.
☐ Remove __pycache__ and .pytest_cache before final ZIP.

End of Assignment 4 Notes
