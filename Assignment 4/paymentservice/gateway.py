import uuid


class Result:
    def __init__(self, declined, txn_id=None, reason=""):
        self.declined = declined
        self.txn_id = txn_id
        self.reason = reason


def charge(card_token, amount):
    # Tokens starting with tok_bad are declined
    if card_token.startswith("tok_bad"):
        return Result(
            True,
            reason="Issuer refused the charge."
        )

    return Result(
        False,
        txn_id="tx_" + uuid.uuid4().hex[:6]
    )