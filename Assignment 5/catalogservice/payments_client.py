import os
import random
import time

import requests


PAYMENTS_URL = os.getenv("PAYMENTS_URL")


def create_payment(payment_data, idempotency_key):
    if not PAYMENTS_URL:
        return None

    url = f"{PAYMENTS_URL.rstrip('/')}/payments"

    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Idempotency-Key": idempotency_key,
    }

    for attempt in range(3):
        try:
            response = requests.post(
                url,
                json=payment_data,
                headers=headers,
                timeout=2,
            )

            # 4xx is a client/domain failure and must never be retried.
            if 400 <= response.status_code < 500:
                return response

            # 2xx/3xx is a completed HTTP response.
            if response.status_code < 500:
                return response

        except requests.RequestException:
            pass

        if attempt < 2:
            delay = (2 ** attempt) + random.uniform(0, 0.5)
            time.sleep(delay)

    return None
