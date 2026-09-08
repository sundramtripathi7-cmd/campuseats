from flask import jsonify


def problem(status, title, detail, problem_type=None):
    if problem_type is None:
        problem_type = f"https://campuseats.example/problems/{status}"

    response = jsonify({
        "type": problem_type,
        "title": title,
        "status": status,
        "detail": detail
    })

    response.status_code = status
    response.content_type = "application/problem+json"

    return response