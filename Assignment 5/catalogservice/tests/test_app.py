import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest
import store
from app import app, rate_state

import pytest

import store
from app import app, rate_state


TOKEN = "campuseats-demo-token"
AUTH = {"Authorization": f"Bearer {TOKEN}", "Accept": "application/json"}


@pytest.fixture(autouse=True)
def reset_store():
    store.menu_items.clear()
    store.idempotency_results.clear()
    store.next_id = 1
    rate_state.clear()
    yield
    store.menu_items.clear()
    store.idempotency_results.clear()
    rate_state.clear()


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def create_item(client, key="test-create-001"):
    return client.post(
        "/menu-items",
        json={
            "name": "Veg Burger",
            "category": "Fast Food",
            "price": 80,
            "available": True,
        },
        headers={**AUTH, "Idempotency-Key": key},
    )


def test_create_returns_201_location_and_etag(client):
    response = create_item(client)
    assert response.status_code == 201
    assert response.headers["Location"] == "/menu-items/1"
    assert response.headers["ETag"]
    assert response.headers["Content-Type"].startswith("application/json")


def test_idempotency_returns_original_result(client):
    first = create_item(client, "same-key")
    second = create_item(client, "same-key")

    assert first.status_code == 201
    assert second.status_code == 201
    assert first.get_json() == second.get_json()
    assert first.headers["Location"] == second.headers["Location"]
    assert first.headers["ETag"] == second.headers["ETag"]


def test_conditional_get_returns_304(client):
    create_item(client)
    first = client.get("/menu-items/1", headers=AUTH)
    etag = first.headers["ETag"]

    second = client.get(
        "/menu-items/1",
        headers={**AUTH, "If-None-Match": etag},
    )

    assert first.status_code == 200
    assert second.status_code == 304
    assert second.data == b""
    assert second.headers["ETag"] == etag


def test_conditional_write_returns_412_for_stale_etag(client):
    create_item(client)
    current = client.get("/menu-items/1", headers=AUTH).headers["ETag"]

    # Change the representation so the old ETag is stale.
    changed = client.post(
        "/menu-items/1/availability",
        json={"available": False},
        headers={**AUTH, "If-Match": current},
    )
    assert changed.status_code == 200

    stale = client.post(
        "/menu-items/1/availability",
        json={"available": True},
        headers={**AUTH, "If-Match": current},
    )
    assert stale.status_code == 412


def test_bad_request(client):
    response = client.post(
        "/menu-items",
        json={"name": "Only Name"},
        headers={**AUTH, "Idempotency-Key": "bad-001"},
    )
    assert response.status_code == 400


def test_unknown_resource_returns_404(client):
    response = client.get("/menu-items/99999", headers=AUTH)
    assert response.status_code == 404


def test_missing_auth_returns_401(client):
    response = client.get("/menu-items/1")
    assert response.status_code == 401


def test_unsupported_accept_returns_406(client):
    response = client.get(
        "/menu-items",
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Accept": "application/xml",
        },
    )
    assert response.status_code == 406


def test_options_returns_allow_and_cors(client):
    response = client.options(
        "/menu-items",
        headers={"Origin": "http://localhost:3000"},
    )
    assert response.status_code == 204
    assert response.headers["Allow"] == "GET, POST, OPTIONS"
    assert response.headers["Access-Control-Allow-Origin"] == "http://localhost:3000"


def test_list_uses_query_filter_sort_and_pagination(client):
    create_item(client, "item-1")
    client.post(
        "/menu-items",
        json={
            "name": "Paneer Roll",
            "category": "Indian",
            "price": 100,
            "available": True,
        },
        headers={**AUTH, "Idempotency-Key": "item-2"},
    )

    response = client.get(
        "/menu-items?category=Fast%20Food&sort=price&order=desc&page=1&limit=1",
        headers=AUTH,
    )

    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 1
    assert data[0]["category"] == "Fast Food"
