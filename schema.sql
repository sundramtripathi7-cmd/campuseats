-- CampusEats Database Schema


-- Identity Service

CREATE TABLE Student (
    student_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE Vendor (
    vendor_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact VARCHAR(150)
);

CREATE TABLE Administrator (
    administrator_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL
);


-- Catalog Service


CREATE TABLE Restaurant (
    restaurant_id INT PRIMARY KEY,
    vendor_id INT,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200),

    FOREIGN KEY (vendor_id)
        REFERENCES Vendor(vendor_id)
);

CREATE TABLE Food (
    food_id INT PRIMARY KEY,
    restaurant_id INT,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    price DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (restaurant_id)
        REFERENCES Restaurant(restaurant_id)
);

CREATE TABLE MenuItem (
    menu_item_id INT PRIMARY KEY,
    restaurant_id INT,
    food_id INT,
    availability BOOLEAN NOT NULL,

    FOREIGN KEY (restaurant_id)
        REFERENCES Restaurant(restaurant_id),

    FOREIGN KEY (food_id)
        REFERENCES Food(food_id)
);


-- Order Service

CREATE TABLE Orders (
    order_id INT PRIMARY KEY,
    student_id INT,
    restaurant_id INT,
    order_status VARCHAR(50) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP,

    FOREIGN KEY (student_id)
        REFERENCES Student(student_id),

    FOREIGN KEY (restaurant_id)
        REFERENCES Restaurant(restaurant_id)
);

CREATE TABLE OrderItem (
    order_item_id INT PRIMARY KEY,
    order_id INT,
    food_id INT,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (order_id)
        REFERENCES Orders(order_id),

    FOREIGN KEY (food_id)
        REFERENCES Food(food_id)
);


-- Payment Service

CREATE TABLE Payment (
    payment_id INT PRIMARY KEY,
    order_id INT,
    amount DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(50) NOT NULL,
    paid_at TIMESTAMP,

    FOREIGN KEY (order_id)
        REFERENCES Orders(order_id)
);


-- Delivery Service

CREATE TABLE Delivery (
    delivery_id INT PRIMARY KEY,
    order_id INT,
    delivery_status VARCHAR(50) NOT NULL,
    delivery_address VARCHAR(255),
    delivered_at TIMESTAMP,

    FOREIGN KEY (order_id)
        REFERENCES Orders(order_id)
);