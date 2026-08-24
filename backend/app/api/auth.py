"""
NIRANTAR — Mock Authentication API Routes
==========================================
Synthetic authentication surface per Architecture Doc §16.

SECURITY RULES:
  1. Authentication is a separate security boundary from Nira AI.
  2. Passwords and OTPs are verified directly by this service.
  3. The LLM NEVER receives passwords, OTPs, session cookies, or access tokens.
  4. Nira receives only safe context: authenticated=true, display_name, journey_id.
"""

import uuid
import hashlib
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.models.base import get_db
from backend.app.models.journey_models import UserModel

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


class MockLoginRequest(BaseModel):
    username: str
    password: str  # Synthetic credential — handled only by this endpoint, never sent to AI


class MockVerifyRequest(BaseModel):
    user_id: str
    otp: str  # Synthetic OTP — handled only by this endpoint, never sent to AI


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


@router.post("/mock-login")
def mock_login(req: MockLoginRequest, db: Session = Depends(get_db)):
    """
    Synthetic credential verification.
    Validates username/password directly against hashed database records.
    Never passes credentials to Nira AI context.
    """
    user = db.query(UserModel).filter_by(username=req.username.lower().strip()).first()
    
    # If user doesn't exist, allow synthetic login for demo users
    if not user:
        if req.username.lower().strip() in ["ananya", "rahul", "sunita", "citizen"]:
            # Auto-provision or mock success for known demo accounts
            user = UserModel(
                id=str(uuid.uuid4()),
                display_name=req.username.capitalize() + " Sharma",
                username=req.username.lower().strip(),
                password_hash=hash_password(req.password or "nirantar2026"),
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            raise HTTPException(status_code=401, detail="Invalid synthetic citizen credentials.")

    # Check password
    if user.password_hash != hash_password(req.password):
        raise HTTPException(status_code=401, detail="Incorrect password. Please verify and retry.")

    return {
        "status": "VERIFIED",
        "userId": user.id,
        "displayName": user.display_name,
        "isAuthenticated": True,
        "failureReason": None,
    }


@router.post("/mock-verify")
def mock_verify(req: MockVerifyRequest, db: Session = Depends(get_db)):
    """
    Synthetic OTP verification.
    Accepts 4-6 digit synthetic OTP (e.g. 1234, 123456, or matching demo pattern).
    """
    user = db.query(UserModel).filter_by(id=req.user_id).first()
    if not user:
        # Fallback demo citizen
        return {
            "status": "VERIFIED",
            "userId": req.user_id,
            "displayName": "Ananya Sharma",
            "isAuthenticated": True,
            "failureReason": None,
        }

    # Reject obviously malformed or failure-testing OTPs (e.g. '0000')
    if req.otp == "0000":
        return {
            "status": "FAILED",
            "userId": user.id,
            "displayName": user.display_name,
            "isAuthenticated": False,
            "failureReason": "Invalid OTP entered. Please retry.",
        }

    return {
        "status": "VERIFIED",
        "userId": user.id,
        "displayName": user.display_name,
        "isAuthenticated": True,
        "failureReason": None,
    }


@router.get("/session")
def get_session(user_id: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Returns only safe non-sensitive session context.
    No credentials or token secrets returned.
    """
    if user_id:
        user = db.query(UserModel).filter_by(id=user_id).first()
        if user:
            return {
                "status": "VERIFIED",
                "userId": user.id,
                "displayName": user.display_name,
                "isAuthenticated": True,
                "failureReason": None,
            }

    # Default demo session
    return {
        "status": "VERIFIED",
        "userId": "usr-ananya-84920",
        "displayName": "Ananya Sharma",
        "isAuthenticated": True,
        "failureReason": None,
    }
