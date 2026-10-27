
import os
import mysql.connector

# Default backend is MySQL.
# Tests can use memory storage by setting STORE_BACKEND=memory.
STORE_BACKEND = os.getenv("STORE_BACKEND", "mysql").lower()

# In-memory storage for tests
menu_items = {}
next_id = 1
idempotency_results = {}


def get_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "campuseats_db"),
    )


def create_item(item):
    global next_id

    if STORE_BACKEND == "memory":
        item_id = str(next_id)
        next_id += 1

        new_item = {
            "id": item_id,
            "name": item["name"],
            "category": item["category"],
            "price": float(item["price"]),
            "available": bool(item["available"]),
        }
        menu_items[item_id] = new_item
        return new_item.copy()

    conn = get_connection()
    cursor = None
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            INSERT INTO menu_items (name, category, price, available)
            VALUES (%s, %s, %s, %s)
            """,
            (
                item["name"],
                item["category"],
                item["price"],
                item["available"],
            ),
        )
        conn.commit()

        item_id = cursor.lastrowid
        cursor.execute(
            """
            SELECT id, name, category, price, available
            FROM menu_items
            WHERE id = %s
            """,
            (item_id,),
        )
        result = cursor.fetchone()
        result["id"] = str(result["id"])
        result["price"] = float(result["price"])
        result["available"] = bool(result["available"])
        return result
    finally:
        if cursor is not None:
            cursor.close()
        conn.close()


def get_item(item_id):
    item_id = str(item_id)

    if STORE_BACKEND == "memory":
        item = menu_items.get(item_id)
        return item.copy() if item is not None else None

    conn = get_connection()
    cursor = None
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT id, name, category, price, available
            FROM menu_items
            WHERE id = %s
            """,
            (item_id,),
        )
        item = cursor.fetchone()

        if item is not None:
            item["id"] = str(item["id"])
            item["price"] = float(item["price"])
            item["available"] = bool(item["available"])

        return item
    finally:
        if cursor is not None:
            cursor.close()
        conn.close()


def list_items(category=None):
    if STORE_BACKEND == "memory":
        items = list(menu_items.values())

        if category is not None:
            items = [
                item
                for item in items
                if item["category"].lower() == category.lower()
            ]

        return [item.copy() for item in items]

    conn = get_connection()
    cursor = None
    try:
        cursor = conn.cursor(dictionary=True)

        if category is None:
            cursor.execute(
                """
                SELECT id, name, category, price, available
                FROM menu_items
                ORDER BY id
                """
            )
        else:
            cursor.execute(
                """
                SELECT id, name, category, price, available
                FROM menu_items
                WHERE LOWER(category) = LOWER(%s)
                ORDER BY id
                """,
                (category,),
            )

        items = cursor.fetchall()

        for item in items:
            item["id"] = str(item["id"])
            item["price"] = float(item["price"])
            item["available"] = bool(item["available"])

        return items
    finally:
        if cursor is not None:
            cursor.close()
        conn.close()


def update_availability(item_id, available):
    item_id = str(item_id)

    if STORE_BACKEND == "memory":
        item = menu_items.get(item_id)

        if item is None:
            return None

        item["available"] = bool(available)
        return item.copy()

    conn = get_connection()
    cursor = None
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE menu_items
            SET available = %s
            WHERE id = %s
            """,
            (available, item_id),
        )
        conn.commit()

        if cursor.rowcount == 0:
            # A no-op update can also return zero rows changed.
            cursor.execute(
                "SELECT id FROM menu_items WHERE id = %s",
                (item_id,),
            )
            if cursor.fetchone() is None:
                return None

        return get_item(item_id)
    finally:
        if cursor is not None:
            cursor.close()
        conn.close()


def get_idempotency_result(key):
    return idempotency_results.get(key)


def save_idempotency_result(key, result):
    idempotency_results[key] = result
