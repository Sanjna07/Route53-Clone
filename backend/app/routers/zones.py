from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import HostedZoneCreate, HostedZoneUpdate, HostedZoneResponse, HostedZoneListResponse
from app.services.zone_service import ZoneService
from app.routers.auth import get_current_user

router = APIRouter(prefix="/hosted-zones", tags=["Hosted Zones"])

@router.get("", response_model=HostedZoneListResponse)
def list_hosted_zones(
    search: str = Query("", description="Search term for zone name"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return ZoneService.list_zones(db, search, page, limit)

@router.post("", response_model=HostedZoneResponse)
def create_hosted_zone(
    payload: HostedZoneCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return ZoneService.create_zone(db, payload)

@router.get("/{id}", response_model=HostedZoneResponse)
def get_hosted_zone(
    id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return ZoneService.get_zone(db, id)

@router.put("/{id}", response_model=HostedZoneResponse)
def update_hosted_zone(
    id: int,
    payload: HostedZoneUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return ZoneService.update_zone(db, id, payload)

@router.delete("/{id}")
def delete_hosted_zone(
    id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return ZoneService.delete_zone(db, id)
