# CampusEats Assignment 6

Assignment 6 adds a Flask Orders Service implementing honest HTTP status codes, Problem Details errors, field-level validation, content negotiation and retry guidance.

## Run
```bash
cd orderservice
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python app.py
```
Service URL: `http://127.0.0.1:5001`. Demo token: `campuseats-demo-token`.

## Test
```bash
cd orderservice
pytest -q
```

See `NOTES.md` for the assignment answers and `transcript.txt` for representative curl commands and expected response shapes. This is a teaching/demo service with in-memory storage and simulated payment outcomes, not production payment processing.
