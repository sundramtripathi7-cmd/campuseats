import os
import time
import random
import requests


PAYMENTS_URL = os.getenv(
    "PAYMENTS_URL",
    "http://127.0.0.1:8080"
)


def create_payment(payment_data, idempotency_key):
    url = f"{PAYMENTS_URL}/payments"

    headers = {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotency_key
    }

    for attempt in range(3):
        try:
            response = requests.post(
                url,
                json=payment_data,
                headers=headers,
                timeout=2
            )

            # 4xx = client/business error → don't retry
            if 400 <= response.status_code < 500:
                return response

            # Success
            if response.status_code < 500:
                return response

        except requests.RequestException:
            pass

        if attempt < 2:
            delay = (2 ** attempt) + random.uniform(0, 0.5)
            time.sleep(delay)

    return None