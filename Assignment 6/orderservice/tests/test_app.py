import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import app as service
import pytest
@pytest.fixture
def client():
    service.orders.clear(); service.idempotency.clear(); service.rate.clear()
    return service.app.test_client()
H={"Authorization":"Bearer campuseats-demo-token","Accept":"application/json","Content-Type":"application/json"}
def create(client, payload=None, **headers):
    h={**H,**headers}
    return client.post("/orders",json=payload or {"items":[{"menuItemId":"1","qty":2}],"address":"Hostel A, Room 12"},headers=h)
def test_create_201_location_and_content_type(client):
    r=create(client,**{"Idempotency-Key":"order-1"})
    assert r.status_code==201 and r.headers["Location"].startswith("/orders/")
    assert r.headers["Content-Type"].startswith("application/json")
def test_validation_collects_multiple_errors(client):
    r=create(client,{"items":[{"menuItemId":"1","qty":0}],"address":""})
    assert r.status_code==422 and len(r.json["errors"])==2
    assert r.headers["Content-Type"].startswith("application/problem+json")
def test_empty_cart_422(client):
    r=create(client,{"items":[],"address":"Hostel"})
    assert r.status_code==422 and r.json["type"]=="validation-error"
def test_unknown_order_404(client):
    r=client.get("/orders/nope",headers=H); assert r.status_code==404
def test_illegal_transition_409(client):
    r=create(client); oid=r.json["id"]
    r=client.patch(f"/orders/{oid}",json={"status":"completed"},headers=H)
    assert r.status_code==409 and r.json["type"]=="illegal-transition"
def test_payment_declined_402(client):
    r=create(client); oid=r.json["id"]
    r=client.patch(f"/orders/{oid}",json={"status":"paid"},headers={**H,"X-Simulate-Payment":"declined"})
    assert r.status_code==402 and r.json["type"]=="payment-declined"
def test_idempotency(client):
    a=create(client,**{"Idempotency-Key":"same"}); b=create(client,**{"Idempotency-Key":"same"})
    assert a.json["id"]==b.json["id"]
def test_xml_negotiation(client):
    r=create(client,**{"Accept":"application/xml"})
    assert r.status_code==201 and r.headers["Content-Type"].startswith("application/xml") and "<order>" in r.text
def test_unsupported_accept_406(client):
    r=client.get("/orders",headers={**H,"Accept":"image/png"}); assert r.status_code==406
def test_delete_created_order_204(client):
    r=create(client); oid=r.json["id"]
    d=client.delete(f"/orders/{oid}",headers=H); assert d.status_code==204


def test_payment_service_unavailable_has_retry_after(client):
    r=create(client); oid=r.json["id"]
    out=client.patch(f"/orders/{oid}",json={"status":"paid"},headers={**H,"X-Simulate-Payment":"unavailable"})
    assert out.status_code==503 and out.headers["Retry-After"]=="5"
