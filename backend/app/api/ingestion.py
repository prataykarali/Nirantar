"""Public railway information ingestion endpoints."""

from typing import Any, Dict, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from backend.app.services.ingestion.pipeline import ingest_railway_information
from backend.app.services.ingestion.sources import ALLOWED_URLS, PERMITTED_PUBLIC_SOURCES

router = APIRouter(prefix="/api/v1/ingestion", tags=["Railway Ingestion"])


class IngestRequest(BaseModel):
    query: str = ""
    force_refresh: bool = False


@router.post("/railway")
def ingest_railway(payload: IngestRequest) -> Dict[str, Any]:
    return ingest_railway_information(payload.query, force_refresh=payload.force_refresh)


@router.get("/railway")
def get_railway_info(query: Optional[str] = "", refresh: bool = False) -> Dict[str, Any]:
    return ingest_railway_information(query or "", force_refresh=refresh)


@router.get("/sources")
def list_permitted_sources() -> Dict[str, Any]:
    return {
        "status": 200,
        "policy": {
            "personalInformation": False,
            "restrictedSystems": False,
            "undocumentedPrivateApis": False,
            "replaceableByOfficialApi": True,
        },
        "allowlist": PERMITTED_PUBLIC_SOURCES,
        "allowedUrls": sorted(ALLOWED_URLS),
        "disclaimer": (
            "Scrapling obtains only permitted public information. "
            "This prototype is not connected to live railway booking systems."
        ),
    }
