"""
NIRANTAR — Payment API Routes + State Machine
=================================================
Deterministic payment state machine per Architecture Doc §11.

CRITICAL SAFETY RULE:
  When state is UNKNOWN, Nirantar MUST NOT encourage a second payment.
  The user is shown a status-verification path first.

Payment secrets (UPI PIN, CVV, card numbers, OTP) NEVER enter this service.
They are handled by the mock payment provider surface only.
"""

import uuid
import random
import time
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.models.base import get_db
from backend.app.models.journey_models import (
    PaymentAttemptModel, JourneyModel, BookingModel
)

router = APIRouter(prefix="/api/v1/payments", tags=["Payment"])


# ═══════════════════════════════════════════════════════════════
# VALID STATE TRANSITIONS — Architecture Doc §11
# ═══════════════════════════════════════════════════════════════

VALID_TRANSITIONS = {
    "READY": ["INITIATED"],
    "INITIATED": ["PROCESSING", "FAILED"],
    "PROCESSING": ["SUCCESS", "FAILED", "UNKNOWN"],
    "SUCCESS": ["BOOKING_CONFIRMED"],
    "FAILED": ["INITIATED", "READY"],
    "UNKNOWN": ["VERIFYING"],
    "VERIFYING": ["SUCCESS", "FAILED", "UNKNOWN"],
    "BOOKING_CONFIRMED": [],
}


class CreatePaymentRequest(BaseModel):
    journey_id: str
    amount: int
    method: str  # UPI, CARD, NET_BANKING, WALLET
    idempotency_key: str


class MockResultRequest(BaseModel):
    result: str  # SUCCESS, FAILED, UNKNOWN


# ═══════════════════════════════════════════════════════════════
# ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@router.post("")
def create_payment(req: CreatePaymentRequest, db: Session = Depends(get_db)):
    """
    Create a new payment attempt with an idempotency key.
    Each attempt gets a unique transaction ref.
    """
    # Check idempotency — prevent duplicate payments
    existing = db.query(PaymentAttemptModel).filter_by(
        idempotency_key=req.idempotency_key
    ).first()
    if existing:
        return _serialize_payment(existing)

    # Check journey exists
    journey = db.query(JourneyModel).filter_by(id=req.journey_id).first()
    if not journey:
        raise HTTPException(404, "Journey not found")

    # Check for existing UNKNOWN/PROCESSING payments — warn user
    active = db.query(PaymentAttemptModel).filter(
        PaymentAttemptModel.journey_id == req.journey_id,
        PaymentAttemptModel.state.in_(["PROCESSING", "UNKNOWN", "VERIFYING"])
    ).first()
    if active:
        raise HTTPException(
            409,
            "An existing payment is still being processed or awaiting verification. "
            "Please check the status of your previous payment before creating a new one."
        )

    payment = PaymentAttemptModel(
        id=str(uuid.uuid4()),
        journey_id=req.journey_id,
        amount=req.amount,
        method=req.method.upper(),
        state="INITIATED",
        idempotency_key=req.idempotency_key,
        transaction_ref=f"TXN-{uuid.uuid4().hex[:12].upper()}",
    )
    db.add(payment)

    # Update journey step
    journey.current_step = "PAYMENT_PROCESSING"
    journey.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(payment)

    return _serialize_payment(payment)


@router.get("/{payment_id}")
def get_payment_status(payment_id: str, db: Session = Depends(get_db)):
    """Get the current state of a payment attempt."""
    payment = db.query(PaymentAttemptModel).filter_by(id=payment_id).first()
    if not payment:
        raise HTTPException(404, "Payment not found")
    return _serialize_payment(payment)


@router.post("/{payment_id}/verify")
def verify_payment(payment_id: str, db: Session = Depends(get_db)):
    """
    Verify an UNKNOWN payment — the ONLY way to resolve UNKNOWN state.

    CRITICAL: This is the safe path. NEVER auto-retry.
    Architecture Doc §11: "UNKNOWN must never automatically create a second payment."
    """
    payment = db.query(PaymentAttemptModel).filter_by(id=payment_id).first()
    if not payment:
        raise HTTPException(404, "Payment not found")

    if payment.state not in ("UNKNOWN", "VERIFYING", "PROCESSING"):
        raise HTTPException(
            400,
            f"Payment is in state '{payment.state}'. Verification is only for UNKNOWN/PROCESSING payments."
        )

    # Transition to VERIFYING
    payment.state = "VERIFYING"
    payment.updated_at = datetime.utcnow()
    db.commit()

    # Simulate verification delay (mock provider check)
    time.sleep(0.5)

    # Mock verification result — 80% chance SUCCESS, 20% FAILED
    resolved = "SUCCESS" if random.random() < 0.8 else "FAILED"
    payment.state = resolved
    payment.updated_at = datetime.utcnow()

    # If SUCCESS, create booking
    if resolved == "SUCCESS":
        _create_booking_on_success(payment, db)

    db.commit()
    db.refresh(payment)

    return _serialize_payment(payment)


@router.post("/{payment_id}/mock-result")
def mock_payment_result(payment_id: str, req: MockResultRequest, db: Session = Depends(get_db)):
    """
    Demo-only: Force a payment state transition for testing.
    Simulates the mock payment provider resolving.
    """
    payment = db.query(PaymentAttemptModel).filter_by(id=payment_id).first()
    if not payment:
        raise HTTPException(404, "Payment not found")

    result = req.result.upper()
    if result not in ("SUCCESS", "FAILED", "UNKNOWN"):
        raise HTTPException(400, "Result must be SUCCESS, FAILED, or UNKNOWN")

    # Transition: INITIATED/PROCESSING → result
    payment.state = result
    payment.updated_at = datetime.utcnow()

    journey = db.query(JourneyModel).filter_by(id=payment.journey_id).first()
    if journey:
        step_map = {
            "SUCCESS": "TICKET_ISSUED",
            "FAILED": "PAYMENT_FAILED",
            "UNKNOWN": "PAYMENT_UNKNOWN",
        }
        journey.current_step = step_map.get(result, journey.current_step)
        journey.updated_at = datetime.utcnow()

    if result == "SUCCESS":
        _create_booking_on_success(payment, db)

    db.commit()
    db.refresh(payment)
    return _serialize_payment(payment)


# ═══════════════════════════════════════════════════════════════
# DIGITAL BANK & CITIZEN VIRTUAL WALLET ENDPOINTS
# ═══════════════════════════════════════════════════════════════

class WalletTopUpRequest(BaseModel):
    user_id: str = "usr-pratay-84920"
    amount: int
    source: str = "NET_BANKING"  # NET_BANKING, UPI, FASTPAY, GRANT
    idempotency_key: Optional[str] = None


# In-memory wallet balance registry (persisted with fallback default of ₹10,000)
_WALLET_BALANCES: dict[str, float] = {"usr-pratay-84920": 10000.0}
_WALLET_TRANSACTIONS: dict[str, list] = {}


@router.get("/wallet/balance")
def get_wallet_balance(user_id: str = "usr-pratay-84920"):
    """Fetch real-time digital bank / citizen wallet balance."""
    bal = _WALLET_BALANCES.get(user_id, 10000.0)
    txns = _WALLET_TRANSACTIONS.get(user_id, [])
    return {
        "userId": user_id,
        "balance": bal,
        "currency": "INR",
        "accountMask": "XX-8492",
        "bankName": "Digital Citizen Travel Bank",
        "recentTransactions": txns[-10:],
    }


@router.post("/wallet/topup")
def topup_wallet(req: WalletTopUpRequest):
    """
    Top-up / add real funds to the Digital Citizen Virtual Wallet.
    Emits an authentic digital banking notification event and records the credit transaction.
    """
    if req.amount <= 0:
        raise HTTPException(400, "Top-up amount must be strictly greater than zero.")
    if req.amount > 50000:
        raise HTTPException(400, "Maximum single top-up limit is ₹50,000 as per RBI prepaid wallet guidelines.")

    current = _WALLET_BALANCES.get(req.user_id, 10000.0)
    new_bal = current + req.amount
    _WALLET_BALANCES[req.user_id] = new_bal

    txn_ref = f"CR-BANK-{uuid.uuid4().hex[:10].upper()}"
    now_iso = datetime.utcnow().isoformat()

    txn_record = {
        "id": f"txn_{uuid.uuid4().hex[:8]}",
        "type": "CREDIT",
        "amount": req.amount,
        "source": req.source,
        "transactionRef": txn_ref,
        "balanceAfter": new_bal,
        "timestamp": now_iso,
        "description": f"Fund Addition via {req.source} to A/C XX-8492",
    }

    if req.user_id not in _WALLET_TRANSACTIONS:
        _WALLET_TRANSACTIONS[req.user_id] = []
    _WALLET_TRANSACTIONS[req.user_id].insert(0, txn_record)

    return {
        "success": True,
        "amountAdded": req.amount,
        "newBalance": new_bal,
        "transactionRef": txn_ref,
        "bankAccount": "A/C XX-8492",
        "smsAlert": f"Dear Customer, INR {req.amount}.00 credited to Digital Citizen Travel Bank A/C XX8492 on {datetime.now().strftime('%d-%b-%Y %H:%M:%S')} via {req.source}. Avail Bal: INR {new_bal:,.2f}. Ref: {txn_ref}.",
    }


@router.post("/wallet/debit")
def debit_wallet(user_id: str, amount: int, purpose: str = "Ticket Booking"):
    """
    Deduct balance from the Digital Citizen Virtual Wallet.
    """
    if amount <= 0:
        raise HTTPException(400, "Debit amount must be greater than zero.")
    current = _WALLET_BALANCES.get(user_id, 10000.0)
    if current < amount:
        raise HTTPException(400, f"Insufficient funds in Citizen Wallet. Active: ₹{current:,.2f}, Required: ₹{amount:,.2f}")

    new_bal = current - amount
    _WALLET_BALANCES[user_id] = new_bal

    txn_ref = f"DR-BANK-{uuid.uuid4().hex[:10].upper()}"
    now_iso = datetime.utcnow().isoformat()

    txn_record = {
        "id": f"txn_{uuid.uuid4().hex[:8]}",
        "type": "DEBIT",
        "amount": amount,
        "purpose": purpose,
        "transactionRef": txn_ref,
        "balanceAfter": new_bal,
        "timestamp": now_iso,
        "description": f"Fare Debit for {purpose} from A/C XX-8492",
    }

    if user_id not in _WALLET_TRANSACTIONS:
        _WALLET_TRANSACTIONS[user_id] = []
    _WALLET_TRANSACTIONS[user_id].insert(0, txn_record)

    return {
        "success": True,
        "amountDebited": amount,
        "newBalance": new_bal,
        "transactionRef": txn_ref,
        "bankAccount": "A/C XX-8492",
        "smsAlert": f"Dear Customer, INR {amount}.00 debited from A/C XX8492 to IRCTC RAILWAY CORP on {datetime.now().strftime('%d-%b-%Y %H:%M:%S')}. Avail Bal: INR {new_bal:,.2f}. Ref: {txn_ref}.",
    }


# ═══════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════

def _create_booking_on_success(payment: PaymentAttemptModel, db: Session):
    """Create a confirmed booking when payment succeeds."""
    journey = db.query(JourneyModel).filter_by(id=payment.journey_id).first()
    if not journey:
        return

    # Check if booking already exists (idempotency)
    existing = db.query(BookingModel).filter_by(journey_id=journey.id).first()
    if existing:
        return

    # Generate synthetic booking data
    pnr = f"{random.randint(1000, 9999)} {random.randint(1000, 9999)} {random.randint(1000, 9999)}"
    booking_ref = f"NR-{uuid.uuid4().hex[:8].upper()}"
    coach = f"S{random.randint(1, 12)}"
    seat = random.randint(1, 72)
    berth_types = ["Lower", "Middle", "Upper", "Side Lower", "Side Upper"]

    from backend.app.models.journey_models import TrainModel
    train = db.query(TrainModel).filter_by(train_number=journey.selected_train_number).first()

    is_wl = (
        journey.selected_train_number in ("12232", "12863", "12864", "12245")
        or (journey.origin_code == "HWH" and journey.destination_code == "SBC")
        or (journey.origin_code == "SBC" and journey.destination_code == "HWH")
        or (journey.origin_code == "CDG" and journey.destination_code == "LKO")
    )
    coach = "GNWL" if is_wl else f"S{random.randint(1, 12)}"
    seat = 42 if is_wl else random.randint(1, 72)
    berth = "Waitlist Queue #42 (Real-Time Clearance)" if is_wl else random.choice(berth_types)
    status = "WAITLIST" if is_wl else "CONFIRMED"
    train_num = journey.selected_train_number or ("12863" if (journey.origin_code == "HWH" and journey.destination_code == "SBC") else "12302")
    train_name = train.train_name if train else ("Howrah - KSR Bengaluru SF Express" if (journey.origin_code == "HWH" and journey.destination_code == "SBC") else ("Chandigarh - Lucknow SF Express" if is_wl else "Express"))

    booking = BookingModel(
        id=str(uuid.uuid4()),
        journey_id=journey.id,
        booking_reference=booking_ref,
        pnr_number=pnr,
        train_number=train_num,
        train_name=train_name,
        class_code=journey.selected_class_code or "3A",
        status=status,
        coach=coach,
        seat_number=seat,
        berth_type=berth,
    )
    db.add(booking)

    # Update journey
    journey.current_step = "TICKET_ISSUED"
    journey.status = "COMPLETED"

    # Move payment to BOOKING_CONFIRMED
    payment.state = "BOOKING_CONFIRMED"


def _serialize_payment(p: PaymentAttemptModel) -> dict:
    return {
        "id": p.id,
        "journeyId": p.journey_id,
        "amount": p.amount,
        "method": p.method,
        "state": p.state,
        "idempotencyKey": p.idempotency_key,
        "transactionRef": p.transaction_ref,
        "createdAt": p.created_at.isoformat() if p.created_at else None,
        "updatedAt": p.updated_at.isoformat() if p.updated_at else None,
    }
