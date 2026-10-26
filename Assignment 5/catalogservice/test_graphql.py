
from graphql_schema import schema


def test_menu_items_query():
    query = """
    {
        menuItems {
            id
            name
            category
            price
            available
        }
    }
    """

    result = schema.execute(query)

    assert result.errors is None
    assert result.data is not None
    assert "menuItems" in result.data


def test_create_menu_item():
    mutation = """
    mutation {
        createMenuItem(
            name: "Test Burger"
            category: "Fast Food"
            price: 80
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
    """

    result = schema.execute(mutation)

    assert result.errors is None

    item = result.data["createMenuItem"]["menuItem"]

    assert item["name"] == "Test Burger"
    assert item["category"] == "Fast Food"
    assert item["price"] == 80.0
    assert item["available"] is True


def test_update_menu_availability():
    # First create a menu item
    create_mutation = """
    mutation {
        createMenuItem(
            name: "Availability Test Pizza"
            category: "Pizza"
            price: 199
        ) {
            menuItem {
                id
                name
                available
            }
        }
    }
    """

    create_result = schema.execute(create_mutation)

    assert create_result.errors is None

    created_item = create_result.data["createMenuItem"]["menuItem"]
    item_id = created_item["id"]

    # Then update the same item's availability
    update_mutation = f"""
    mutation {{
        updateMenuAvailability(
            id: "{item_id}"
            available: false
        ) {{
            menuItem {{
                id
                name
                available
            }}
        }}
    }}
    """

    update_result = schema.execute(update_mutation)

    assert update_result.errors is None

    updated_item = update_result.data["updateMenuAvailability"]["menuItem"]

    assert updated_item["id"] == item_id
    assert updated_item["name"] == "Availability Test Pizza"
    assert updated_item["available"] is False
