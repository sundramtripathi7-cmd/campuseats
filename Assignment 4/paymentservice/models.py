from dataclasses import dataclass, field
from datetime import datetime, timezone


@dataclass
class Payment:
    id: int
    order_id: int
    card_token: str
    amount: int
    currency: str
    status: str
    txn_id: str | None = None
    idempotency_key: str | None = None
    created_at: datetime = field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    def as_json(self) -> dict:
        return {
            "id": self.id,
            "orderId": self.order_id,
            "amount": self.amount,
            "currency": self.currency,
            "status": self.status,
            "createdAt": self.created_at.isoformat()
        }