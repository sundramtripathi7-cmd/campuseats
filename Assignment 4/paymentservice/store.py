from models import Payment


_payments: dict[int, Payment] = {}
_by_key: dict[str, int] = {}

_next_id = 1


def create(
    order_id,
    card_token,
    amount,
    currency,
    status,
    txn_id,
    key=None
):
    global _next_id

    payment = Payment(
        id=_next_id,
        order_id=order_id,
        card_token=card_token,
        amount=amount,
        currency=currency,
        status=status,
        txn_id=txn_id,
        idempotency_key=key
    )

    _payments[payment.id] = payment

    if key:
        _by_key[key] = payment.id

    _next_id += 1

    return payment


def find(pid):
    return _payments.get(pid)


def find_by_key(key):
    return _payments.get(_by_key.get(key))


def find_by_order(order_id):
    return [
        payment
        for payment in _payments.values()
        if payment.order_id == order_id
    ]