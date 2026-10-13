import os, time, uuid, logging
from functools import wraps
from flask import Flask, request, jsonify, make_response
from errors import problem

logging.basicConfig(level=logging.ERROR)
app = Flask(__name__)
TOKEN = os.getenv("CAMPUSEATS_TOKEN", "campuseats-demo-token")
RATE_LIMIT = int(os.getenv("RATE_LIMIT", "20"))
rate = {}
orders = {}
menu = {"1": {"id":"1","name":"Veg Burger","price":80.0,"available":True},
        "2": {"id":"2","name":"Paneer Roll","price":100.0,"available":True}}
idempotency = {}

def negotiate():
    accept = request.headers.get("Accept", "*/*").lower()
    if "*/*" in accept or "application/json" in accept or "application/problem+json" in accept:
        return "json"
    if "application/xml" in accept or "text/xml" in accept:
        return "xml"
    return None

def xml_response(data, status=200, content_type="application/xml; charset=utf-8"):
    def element(name, value):
        if isinstance(value, dict):
            inner = "".join(element(str(k), v) for k, v in value.items())
            return f"<{name}>{inner}</{name}>"
        if isinstance(value, list):
            return f"<{name}>" + "".join(element("item", v) for v in value) + f"</{name}>"
        return f"<{name}>{xml_escape(value)}</{name}>"
    if isinstance(data, dict):
        body = element("order", data)
    elif isinstance(data, list):
        body = element("orders", data)
    else:
        body = str(data)
    return make_response(body, status, {"Content-Type":content_type})
def xml_escape(v):
    import html
    if isinstance(v, (dict,list)): v=json.dumps(v)
    return html.escape(str(v))

@app.before_request
def throttle():
    if request.method == "OPTIONS": return None
    now=time.monotonic(); ip=request.remote_addr or "unknown"
    state=rate.get(ip)
    if not state or now-state["start"]>=60: state={"start":now,"count":0}; rate[ip]=state
    if state["count"] >= RATE_LIMIT:
        r=problem(429,"Too Many Requests","Request rate limit exceeded","rate-limited")
        r.headers["Retry-After"]=str(max(1,int(60-(now-state["start"]))))
        return r
    state["count"]+=1

@app.after_request
def common(r):
    if not r.headers.get("Content-Type"):
        r.headers["Content-Type"]="application/json; charset=utf-8"
    elif "charset=" not in r.headers["Content-Type"] and "204" not in str(r.status_code) and "304" not in str(r.status_code):
        r.headers["Content-Type"] += "; charset=utf-8"
    return r

def protected(fn):
    @wraps(fn)
    def wrapper(*args,**kwargs):
        fmt=negotiate()
        if fmt is None: return problem(406,"Not Acceptable","Supported response types are application/json and application/xml","not-acceptable")
        if request.headers.get("Authorization") != f"Bearer {TOKEN}":
            r=problem(401,"Unauthorized","A valid Bearer token is required","unauthorized")
            return r
        return fn(*args,**kwargs)
    return wrapper

def respond(data,status=200,location=None):
    fmt=negotiate()
    if fmt=="xml": r=xml_response(data,status)
    else: r=make_response(jsonify(data),status,{"Content-Type":"application/json; charset=utf-8"})
    if location: r.headers["Location"]=location
    return r

def bad_fields(data):
    errors=[]
    if not isinstance(data,dict):
        return [{"field":"body","message":"must be a JSON object"}]
    items=data.get("items")
    if not isinstance(items,list) or not items:
        errors.append({"field":"items","message":"must be a non-empty array"})
    else:
        for i,item in enumerate(items):
            if not isinstance(item,dict):
                errors.append({"field":f"items[{i}]","message":"must be an object"}); continue
            q=item.get("qty")
            if isinstance(q,bool) or not isinstance(q,int) or q<1:
                errors.append({"field":f"items[{i}].qty","message":"must be an integer greater than or equal to 1"})
            mid=str(item.get("menuItemId",""))
            if not mid:
                errors.append({"field":f"items[{i}].menuItemId","message":"is required"})
            elif mid not in menu:
                errors.append({"field":f"items[{i}].menuItemId","message":"does not identify a known menu item"})
    if not isinstance(data.get("address"),str) or not data.get("address","").strip():
        errors.append({"field":"address","message":"is required and must be a non-empty string"})
    return errors

@app.route("/orders", methods=["GET","POST"])
@protected
def order_collection():
    if request.method=="GET":
        return respond(list(orders.values()))
    data=request.get_json(silent=True)
    errors=bad_fields(data)
    if errors:
        return problem(422,"Validation Failed","One or more fields are invalid","validation-error",errors=errors)
    if all(not menu[str(i["menuItemId"])]["available"] for i in data["items"]):
        return problem(409,"Items Unavailable","No requested menu items are currently available","item-unavailable")
    key=request.headers.get("Idempotency-Key")
    if key and key in idempotency:
        old=idempotency[key]
        return respond(old["body"],old["status"],old["location"])
    total=0
    for i in data["items"]:
        item=menu[str(i["menuItemId"])]
        if not item["available"]:
            return problem(409,"Item Unavailable",f"Menu item {item['id']} is unavailable","item-unavailable")
        total += item["price"]*i["qty"]
    order_id=str(uuid.uuid4())[:8]
    order={"id":order_id,"items":data["items"],"address":data["address"].strip(),"status":"created","total":round(total,2)}
    orders[order_id]=order
    location=f"/orders/{order_id}"
    if key: idempotency[key]={"body":order,"status":201,"location":location}
    return respond(order,201,location)

@app.route("/orders/<order_id>", methods=["GET","PATCH","DELETE"])
@protected
def order_resource(order_id):
    order=orders.get(order_id)
    if not order: return problem(404,"Order Not Found","No order exists with this id","order-not-found")
    if request.method=="GET": return respond(order)
    if request.method=="DELETE":
        if order["status"] not in ("created","cancelled"):
            return problem(409,"Illegal Transition","Only a created order can be deleted","illegal-transition")
        del orders[order_id]
        return make_response("",204,{"Content-Type":"application/json; charset=utf-8"})
    data=request.get_json(silent=True)
    status=data.get("status") if isinstance(data,dict) else None
    allowed={"created":{"paid","cancelled"},"paid":{"preparing","cancelled"},"preparing":{"ready"},"ready":{"completed"},"completed":set(),"cancelled":set()}
    if status not in allowed.get(order["status"],set()):
        return problem(409,"Illegal Transition",f"Cannot change order from {order['status']} to {status}","illegal-transition")
    if status=="paid" and request.headers.get("X-Simulate-Payment")=="unavailable":
        r=problem(503,"Service Unavailable","Payment processor is temporarily unavailable","payment-service-unavailable")
        r.headers["Retry-After"]="5"
        return r
    if status=="paid" and request.headers.get("X-Simulate-Payment")=="declined":
        return problem(402,"Payment Declined","Payment was declined; no order status change was made","payment-declined")
    order["status"]=status
    return respond(order)

@app.get("/health")
def health(): return jsonify({"status":"ok"})

if __name__=="__main__":
    app.run(host="127.0.0.1",port=int(os.getenv("PORT","5001")),debug=False)
