menu_items = {}
next_id = 1
idempotency_results = {}


def create_item(item):
    global next_id
    item_id = str(next_id)
    next_id += 1
    menu_item = {
        "id": item_id,
        "name": item["name"],
        "category": item["category"],
        "price": item["price"],
        "available": item["available"]
    }
    menu_items[item_id] = menu_item
    return menu_item


def get_item(item_id):
    return menu_items.get(item_id)


def list_items(category=None):
    items = list(menu_items.values())
    if category is not None:
        items = [item for item in items if item["category"].lower() == category.lower()]
    return items


def update_availability(item_id, available):
    item = menu_items.get(item_id)
    if item is None:
        return None
    item["available"] = available
    return item


def get_idempotency_result(key):
    return idempotency_results.get(key)


def save_idempotency_result(key, result):
    idempotency_results[key] = result
