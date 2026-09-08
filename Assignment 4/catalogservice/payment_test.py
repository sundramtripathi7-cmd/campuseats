from payments_client import create_payment


payment_data = {
    "orderId": 10,
    "cardToken": "tok_good_001",
    "amount": 8000,
    "currency": "INR"
}

response = create_payment(
    payment_data,
    "catalog-payment-test-001"
)

if response is None:
    print("Payment Service unavailable")
else:
    print("Status:", response.status_code)
    print("Response:", response.text)