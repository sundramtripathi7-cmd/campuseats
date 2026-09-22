# CampusEats — Assignment 5

## Run the Catalog Service

Open a terminal in `Assignment 5/catalogservice`:

```bash
pip install -r requirements.txt
```

Set the demo token:

Windows PowerShell:
```powershell
$env:CAMPUSEATS_TOKEN="campuseats-demo-token"
```

Optional Payment Service URL:
```powershell
$env:PAYMENTS_URL="http://127.0.0.1:8080"
```

Start the Catalog Service:

```bash
python app.py
```

The service runs on:

```text
http://127.0.0.1:5000
```

## Run tests

```bash
pytest -q
```

## Validate OpenAPI

```bash
openapi-spec-validator openapi.yaml
```

## Run the curl transcript

Run the commands in `curl-transcript.txt` from the `Assignment 5` directory after starting the service.

## Important

Replace `[ENTER TEAM ID]` in `NOTES.md` with the actual Team ID before submission.

The `curl-transcript.txt` included in this package is a prepared transcript matching the implemented endpoints. Re-run it locally with `curl -v` before final submission so dynamic `Date`, `Server`, `Content-Length`, and runtime rate-limit values reflect the actual environment.
