import pytest

from app import app


@pytest.fixture
def client():
    app.config["TESTING"] = True

    with app.test_client() as client:
        yield client


def test_create_menu_item(client):
    response = client.post(
        "/menu-items",
        json={
            "name": "Veg Burger",
            "category": "Fast Food",
            "price": 80,
            "available": True
        },
        headers={
            "Idempotency-Key": "create-test-001"
        }
    )

    assert response.status_code == 201
    assert "Location" in response.headers


def test_unknown_menu_item(client):
    response = client.get("/menu-items/99999")

    assert response.status_code == 404


def test_invalid_create_request(client):
    response = client.post(
        "/menu-items",
        json={
            "name": "Veg Burger"
        },
        headers={
            "Idempotency-Key": "invalid-test-001"
        }
    )

    assert response.status_code == 400


def test_filter_menu_items(client):
    client.post(
        "/menu-items",
        json={
            "name": "Veg Burger",
            "category": "Fast Food",
            "price": 80,
            "available": True
        },
        headers={
            "Idempotency-Key": "filter-test-001"
        }
    )

    response = client.get(
        "/menu-items?category=Fast Food"
    )

    assert response.status_code == 200


def test_idempotency_key_prevents_duplicate_create(client):
    item = {
        "name": "Paneer Roll",
        "category": "Fast Food",
        "price": 100,
        "available": True
    }

    first_response = client.post(
        "/menu-items",
        json=item,
        headers={
            "Idempotency-Key": "order-test-001"
        }
    )

    second_response = client.post(
        "/menu-items",
        json=item,
        headers={
            "Idempotency-Key": "order-test-001"
        }
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 201

    assert first_response.get_json() == second_response.get_json()

    assert (
        first_response.headers["Location"]
        == second_response.headers["Location"]
    )