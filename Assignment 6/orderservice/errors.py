from flask import jsonify
def problem(status,title,detail,problem_type=None,errors=None):
    body={"type":problem_type or f"http-error-{status}","title":title,"status":status,"detail":detail}
    if errors is not None: body["errors"]=errors
    response=jsonify(body); response.status_code=status
    response.headers["Content-Type"]="application/problem+json; charset=utf-8"
    return response
