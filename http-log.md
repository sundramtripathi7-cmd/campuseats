# HTTP Request and Response Log

**API used:** JSONPlaceholder  
**Tool:** `curl -i`

## Request 1 — Get Post 1

### Command

```bash
curl -i https://jsonplaceholder.typicode.com/posts/1
```

### Result

- **Status:** `200 OK` — the request was successful.
- **Content-Type:** `application/json` — the response is JSON data.

### Captured response

```HTTP/1.1 200 OK
Date: Sat, 15 Aug 2026 13:56:45 GMT
Content-Type: application/json; charset=utf-8
Content-Length: 292
Connection: keep-alive
access-control-allow-credentials: true
Cache-Control: max-age=43200
etag: W/"124-yiKdLzqO5gfBrJFrcdJ8Yq0LGnU"
expires: -1
nel: {"report_to":"heroku-nel","response_headers":["Via"],"max_age":3600,"success_fraction":0.01,"failure_fraction":0.1}
pragma: no-cache
report-to: {"group":"heroku-nel","endpoints":[{"url":"https://nel.heroku.com/reports?s=QwcX6nLtJ2b6%2BABQIX1mfYF8MxKJ69sRv8nTGsMQs8o%3D\u0026sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d\u0026ts=1785189191"}],"max_age":3600}
reporting-endpoints: heroku-nel="https://nel.heroku.com/reports?s=QwcX6nLtJ2b6%2BABQIX1mfYF8MxKJ69sRv8nTGsMQs8o%3D&sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d&ts=1785189191"
Server: cloudflare
vary: Origin, Accept-Encoding
via: 2.0 heroku-router
x-content-type-options: nosniff
x-powered-by: Express
x-ratelimit-limit: 1000
x-ratelimit-remaining: 999
x-ratelimit-reset: 1785189203
Age: 19028
Accept-Ranges: bytes
cf-cache-status: HIT
CF-RAY: a2b8b455bd26e28e-MRS
alt-svc: h3=":443"; ma=86400

{
  "userId": 1,
  "id": 1,
  "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
  "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
}
```

## Request 2 — Get Post 2

### Command

```bash
curl -i https://jsonplaceholder.typicode.com/posts/2
```

### Result

- **Status:** `200 OK` — the request was successful.
- **Content-Type:** `application/json; charset=utf-8` — the response is JSON data encoded as UTF-8.

### Captured response

```HTTP/1.1 200 OK
Date: Sat, 15 Aug 2026 13:58:15 GMT
Content-Type: application/json; charset=utf-8
Content-Length: 278
Connection: keep-alive
access-control-allow-credentials: true
Cache-Control: max-age=43200
etag: W/"116-jnDuMpjju89+9j7e0BqkdFsVRjs"
expires: -1
nel: {"report_to":"heroku-nel","response_headers":["Via"],"max_age":3600,"success_fraction":0.01,"failure_fraction":0.1}
pragma: no-cache
report-to: {"group":"heroku-nel","endpoints":[{"url":"https://nel.heroku.com/reports?s=esZU3n0kEMa3ipZ%2FpmJGVLbwyXG9FJUfZj21%2FVD9ILc%3D\u0026sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d\u0026ts=1786783414"}],"max_age":3600}
reporting-endpoints: heroku-nel="https://nel.heroku.com/reports?s=esZU3n0kEMa3ipZ%2FpmJGVLbwyXG9FJUfZj21%2FVD9ILc%3D&sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d&ts=1786783414"
Server: cloudflare
vary: Origin, Accept-Encoding
via: 2.0 heroku-router
x-content-type-options: nosniff
x-powered-by: Express
x-ratelimit-limit: 1000
x-ratelimit-remaining: 999
x-ratelimit-reset: 1786783423
Age: 18881
Accept-Ranges: bytes
cf-cache-status: HIT
CF-RAY: a2b8b68c1c944b79-MRS
alt-svc: h3=":443"; ma=86400

{
  "userId": 1,
  "id": 2,
  "title": "qui est esse",
  "body": "est rerum tempore vitae\nsequi sint nihil reprehenderit dolor beatae ea dolores neque\nfugiat blanditiis voluptate porro vel nihil molestiae ut reiciendis\nqui aperiam non debitis possimus qui neque nisi nulla"
}
```

## Request 3 — Get User 1

### Command

```bash
curl -i https://jsonplaceholder.typicode.com/users/1
```

### Result

- **Status:** `200 OK` — the request was successful.
- **Content-Type:** `application/json; charset=utf-8` — the response is JSON data encoded as UTF-8.

### Captured response

```HTTP/1.1 200 OK
Date: Sat, 15 Aug 2026 13:59:25 GMT
Content-Type: application/json; charset=utf-8
Content-Length: 509
Connection: keep-alive
access-control-allow-credentials: true
Cache-Control: max-age=43200
etag: W/"1fd-+2Y3G3w049iSZtw5t1mzSnunngE"
expires: -1
nel: {"report_to":"heroku-nel","response_headers":["Via"],"max_age":3600,"success_fraction":0.01,"failure_fraction":0.1}
pragma: no-cache
report-to: {"group":"heroku-nel","endpoints":[{"url":"https://nel.heroku.com/reports?s=kD3R3x8jf6R9jEDAz5WRBRBkA4%2Bf64aA6e2ObqoaoM8%3D\u0026sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d\u0026ts=1786792655"}],"max_age":3600}
reporting-endpoints: heroku-nel="https://nel.heroku.com/reports?s=kD3R3x8jf6R9jEDAz5WRBRBkA4%2Bf64aA6e2ObqoaoM8%3D&sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d&ts=1786792655"
Server: cloudflare
vary: Origin, Accept-Encoding
via: 2.0 heroku-router
x-content-type-options: nosniff
x-powered-by: Express
x-ratelimit-limit: 1000
x-ratelimit-remaining: 937
x-ratelimit-reset: 1786792663
Age: 9709
Accept-Ranges: bytes
cf-cache-status: HIT
CF-RAY: a2b8b83dffebc6a5-MRS
alt-svc: h3=":443"; ma=86400

{
  "id": 1,
  "name": "Leanne Graham",
  "username": "Bret",
  "email": "Sincere@april.biz",
  "address": {
    "street": "Kulas Light",
    "suite": "Apt. 556",
    "city": "Gwenborough",
    "zipcode": "92998-3874",
    "geo": {
      "lat": "-37.3159",
      "lng": "81.1496"
    }
  },
  "phone": "1-770-736-8031 x56442",
  "website": "hildegard.org",
  "company": {
    "name": "Romaguera-Crona",
    "catchPhrase": "Multi-layered client-server neural-net",
    "bs": "harness real-time e-markets"
  }
}
```

## Request 4 — Get Comment 1

### Command

```bash
curl -i https://jsonplaceholder.typicode.com/comments/1
```

### Result

- **Status:** `200 OK` — the request was successful.
- **Content-Type:** `application/json; charset=utf-8` — the response is JSON data encoded as UTF-8.

### Captured response

```HTTP/1.1 200 OK
Date: Sat, 15 Aug 2026 14:00:35 GMT
Content-Type: application/json; charset=utf-8
Content-Length: 268
Connection: keep-alive
access-control-allow-credentials: true
Cache-Control: max-age=43200
etag: W/"10c-KJ4I9RM/+33TKdV8CFsIvqsDSP0"
expires: -1
nel: {"report_to":"heroku-nel","response_headers":["Via"],"max_age":3600,"success_fraction":0.01,"failure_fraction":0.1}
pragma: no-cache
report-to: {"group":"heroku-nel","endpoints":[{"url":"https://nel.heroku.com/reports?s=R2432pd9Tr9aso3iWhyLZUFttIX7vsyYNmW3GW%2BzId8%3D\u0026sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d\u0026ts=1786756197"}],"max_age":3600}
reporting-endpoints: heroku-nel="https://nel.heroku.com/reports?s=R2432pd9Tr9aso3iWhyLZUFttIX7vsyYNmW3GW%2BzId8%3D&sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d&ts=1786756197"
Server: cloudflare
vary: Origin, Accept-Encoding
via: 2.0 heroku-router
x-content-type-options: nosniff
x-powered-by: Express
x-ratelimit-limit: 1000
x-ratelimit-remaining: 984
x-ratelimit-reset: 1786756210
Age: 16781
Accept-Ranges: bytes
cf-cache-status: HIT
CF-RAY: a2b8b9f7bfd1e19a-MRS
alt-svc: h3=":443"; ma=86400

{
  "postId": 1,
  "id": 1,
  "name": "id labore ex et quam laborum",
  "email": "Eliseo@gardner.biz",
  "body": "laudantium enim quasi est quidem magnam voluptate ipsam eos\ntempora quo necessitatibus\ndolor quam autem quasi\nreiciendis et nam sapiente accusantium"
}
```

## Request 5 — Deliberate Failure (404)

### Command

```bash
curl -i https://jsonplaceholder.typicode.com/posts/999999
```

### Result

- **Status:** `404 Not Found` — the requested resource does not exist.
- **Content-Type:** `application/json; charset=utf-8` — the error response is JSON data encoded as UTF-8.

### Captured response

```HTTP/1.1 404 Not Found
Date: Sat, 15 Aug 2026 14:01:40 GMT
Content-Type: application/json; charset=utf-8
Content-Length: 2
Connection: keep-alive
access-control-allow-credentials: true
Cache-Control: max-age=43200
etag: W/"2-vyGp6PvFo4RvsFtPoIWeCReyIC8"
expires: -1
nel: {"report_to":"heroku-nel","response_headers":["Via"],"max_age":3600,"success_fraction":0.01,"failure_fraction":0.1}
pragma: no-cache
report-to: {"group":"heroku-nel","endpoints":[{"url":"https://nel.heroku.com/reports?s=nMmkQn2ADnDhw4OGk0YooHuymhEDnIBkRGnxuBJUpYg%3D\u0026sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d\u0026ts=1786778093"}],"max_age":3600}
reporting-endpoints: heroku-nel="https://nel.heroku.com/reports?s=nMmkQn2ADnDhw4OGk0YooHuymhEDnIBkRGnxuBJUpYg%3D&sid=e11707d5-02a7-43ef-b45e-2cf4d2036f7d&ts=1786778093"
Server: cloudflare
vary: Origin, Accept-Encoding
via: 2.0 heroku-router
x-content-type-options: nosniff
x-powered-by: Express
x-ratelimit-limit: 1000
x-ratelimit-remaining: 999
x-ratelimit-reset: 1786778143
Age: 24406
cf-cache-status: HIT
CF-RAY: a2b8bb8b7b73121c-MRS
alt-svc: h3=":443"; ma=86400

{}
```

## Summary

| #   | Endpoint        | Status          | Content-Type                      |
| --- | --------------- | --------------- | --------------------------------- |
| 1   | `/posts/1`      | `200 OK`        | `application/json`                |
| 2   | `/posts/2`      | `200 OK`        | `application/json; charset=utf-8` |
| 3   | `/users/1`      | `200 OK`        | `application/json; charset=utf-8` |
| 4   | `/comments/1`   | `200 OK`        | `application/json; charset=utf-8` |
| 5   | `/posts/999999` | `404 Not Found` | `application/json; charset=utf-8` |

Four requests were successful with `200 OK`. The fifth request deliberately asked for a non-existent post and returned `404 Not Found`, satisfying the required failure case.
