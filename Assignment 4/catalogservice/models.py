def validate_menu_item(data):
    if not isinstance(data, dict):
        raise ValueError("Request body must be a JSON object")

    if "name" not in data:
        raise ValueError("name is required")

    if "category" not in data:
        raise ValueError("category is required")

    if "price" not in data:
        raise ValueError("price is required")

    if not isinstance(data["name"], str) or not data["name"].strip():
        raise ValueError("name must be a non-empty string")

    if not isinstance(data["category"], str) or not data["category"].strip():
        raise ValueError("category must be a non-empty string")

    if not isinstance(data["price"], (int, float)) or data["price"] < 0:
        raise ValueError("price must be a non-negative number")

    if "available" in data and not isinstance(data["available"], bool):
        raise ValueError("available must be a boolean")

    return {
        "name": data["name"].strip(),
        "category": data["category"].strip(),
        "price": float(data["price"]),
        "available": data.get("available", True)
    }