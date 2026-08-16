# CampusEats — Service Design

## Task 1: System Capabilities

The CampusEats system provides the following distinct capabilities:

1. **Discover Food**
   - Allows students to discover available campus food services.

2. **View Food Service**
   - Allows students to view information about campus food services.

3. **Place Order**
   - Allows students to place food orders.

4. **Process Order**
   - Allows food services to process submitted orders.

5. **Manage Orders**
   - Allows the system and food services to manage food orders.

6. **Manage Food Services**
   - Allows campus food services to be managed by the system.

## Task 2: Service Design

CampusEats is divided into five services based on data ownership:

1. **Identity Service**
   - Owns Student, Vendor, and Administrator data.

2. **Catalog Service**
   - Owns Restaurant, Food, and Menu Item data.

3. **Order Service**
   - Owns Order and Order Item data.

4. **Payment Service**
   - Owns Payment data.

5. **Delivery Service**
   - Owns Delivery data.

## Task 3: Service Contracts

### 1. Identity Service

| Operation  | Input                   | Output                   | Errors                                |
| ---------- | ----------------------- | ------------------------ | ------------------------------------- |
| register() | user details            | registration result      | invalid details, user already exists  |
| login()    | login credentials       | authentication result    | invalid credentials                   |
| manage()   | user management request | updated user information | unauthorized request, invalid request |

### 2. Catalog Service

| Operation | Input                        | Output                      | Errors                                |
| --------- | ---------------------------- | --------------------------- | ------------------------------------- |
| browse()  | search or browse criteria    | available food services     | invalid criteria, service unavailable |
| view()    | food item or service request | food/service details        | item not found                        |
| select()  | selected food items          | selected item information   | item unavailable, invalid selection   |
| manage()  | catalog management request   | updated catalog information | unauthorized request, invalid request |

### 3. Order Service

| Operation | Input                           | Output               | Errors                                     |
| --------- | ------------------------------- | -------------------- | ------------------------------------------ |
| order()   | selected food and order details | order confirmation   | invalid order, unavailable item            |
| cancel()  | order cancellation request      | cancellation result  | order not found, order cannot be cancelled |
| manage()  | order management request        | updated order status | unauthorized request, invalid request      |

### 4. Payment Service

| Operation | Input           | Output         | Errors                                  |
| --------- | --------------- | -------------- | --------------------------------------- |
| pay()     | payment request | payment result | payment failed, invalid payment request |

### 5. Delivery Service

| Operation | Input            | Output                  | Errors                                |
| --------- | ---------------- | ----------------------- | ------------------------------------- |
| deliver() | delivery request | delivery status         | delivery unavailable, invalid request |
| track()   | tracking request | current delivery status | delivery not found                    |

## Task 4: placeOrder Specification

### Operation: placeOrder

The `placeOrder` operation allows a student to submit an order for selected food items.

### Inputs

- Student identity
- Selected food items
- Quantities
- Order details
- Payment details
- Delivery details

### Outputs

- Order confirmation
- Order identifier
- Order status
- Payment status
- Delivery status

### Error Cases

- Student is not authenticated
- Selected food item is unavailable
- Invalid quantity
- Invalid order details
- Payment fails
- Delivery service is unavailable
- Order cannot be created

### Internal Details Hidden from Callers

The caller does not need to know how the order is processed internally. The service handles:

1. Validating the student and order details.
2. Checking the availability of selected food items.
3. Creating the order.
4. Processing the payment.
5. Preparing the order for delivery.
6. Creating or updating delivery information.
7. Updating the order status.
8. Returning the final order result to the caller.

## Task 5: Database Schema

### Identity Service

#### Student

- student_id — INT — Primary Key
- name — VARCHAR(100)
- email — VARCHAR(150)
- password — VARCHAR(255)

#### Vendor

- vendor_id — INT — Primary Key
- name — VARCHAR(100)
- contact — VARCHAR(150)

#### Administrator

- administrator_id — INT — Primary Key
- name — VARCHAR(100)
- email — VARCHAR(150)

### Catalog Service

#### Restaurant

- restaurant_id — INT — Primary Key
- vendor_id — INT — Foreign Key
- name — VARCHAR(100)
- location — VARCHAR(200)

#### Food

- food_id — INT — Primary Key
- restaurant_id — INT — Foreign Key
- name — VARCHAR(100)
- description — VARCHAR(255)
- price — DECIMAL(10,2)

#### MenuItem

- menu_item_id — INT — Primary Key
- restaurant_id — INT — Foreign Key
- food_id — INT — Foreign Key
- availability — BOOLEAN

### Order Service

#### Orders

- order_id — INT — Primary Key
- student_id — INT — Foreign Key
- restaurant_id — INT — Foreign Key
- order_status — VARCHAR(50)
- total_amount — DECIMAL(10,2)
- created_at — TIMESTAMP

#### OrderItem

- order_item_id — INT — Primary Key
- order_id — INT — Foreign Key
- food_id — INT — Foreign Key
- quantity — INT
- unit_price — DECIMAL(10,2)

### Payment Service

#### Payment

- payment_id — INT — Primary Key
- order_id — INT — Foreign Key
- amount — DECIMAL(10,2)
- payment_status — VARCHAR(50)
- paid_at — TIMESTAMP

### Delivery Service

#### Delivery

- delivery_id — INT — Primary Key
- order_id — INT — Foreign Key
- delivery_status — VARCHAR(50)
- delivery_address — VARCHAR(255)
- delivered_at — TIMESTAMP

### Service Boundary Rule

Each table belongs to exactly one service. Tables are not duplicated across services. Foreign keys are used to represent relationships between owned data.


## Task 6: Service Validation

Each CampusEats service was checked against the five required service properties: reachable, self-contained, contract-based, independent, and loosely coupled.

| Service | Reachable | Self-contained | Has Contract | Independent | Loosely Coupled |
|---|---|---|---|---|---|
| Identity Service | Yes | Yes | Yes | Yes | Yes |
| Catalog Service | Yes | Yes | Yes | Yes | Yes |
| Order Service | Yes | Yes | Yes | Yes | Yes |
| Payment Service | Yes | Yes | Yes | Yes | Yes |
| Delivery Service | Yes | Yes | Yes | Yes | Yes |

### Validation Notes

- **Identity Service:** Provides access to student, vendor, and administrator data through its own service boundary.
- **Catalog Service:** Manages restaurant, food, and menu item data independently.
- **Order Service:** Manages orders and order items and exposes operations through a defined contract.
- **Payment Service:** Owns payment data and handles payment-related operations separately from other services.
- **Delivery Service:** Owns delivery data and manages delivery status independently.

All five services satisfy the required properties. The services communicate through defined contracts rather than directly sharing their internal implementation or database tables.
