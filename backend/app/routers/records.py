from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import DNSRecordCreate, DNSRecordUpdate, DNSRecordResponse, DNSRecordListResponse
from app.services.record_service import RecordService
from app.routers.auth import get_current_user

router = APIRouter(prefix="/hosted-zones/{zone_id}/records", tags=["DNS Records"])

@router.get("", response_model=DNSRecordListResponse)
def list_dns_records(
    zone_id: int,
    search: str = Query("", description="Search term for record name"),
    type: str = Query("", description="Filter by record type (A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA)"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return RecordService.list_records(db, zone_id, search, type, page, limit)

@router.post("", response_model=DNSRecordResponse)
def create_dns_record(
    zone_id: int,
    payload: DNSRecordCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return RecordService.create_record(db, zone_id, payload)

@router.get("/{record_id}", response_model=DNSRecordResponse)
def get_dns_record(
    zone_id: int,
    record_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return RecordService.get_record(db, zone_id, record_id)

@router.put("/{record_id}", response_model=DNSRecordResponse)
def update_dns_record(
    zone_id: int,
    record_id: int,
    payload: DNSRecordUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return RecordService.update_record(db, zone_id, record_id, payload)

@router.delete("/{record_id}")
def delete_dns_record(
    zone_id: int,
    record_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return RecordService.delete_record(db, zone_id, record_id)
