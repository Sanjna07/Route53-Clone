from fastapi import APIRouter, Depends, Query, Body, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import HostedZoneCreate, HostedZoneUpdate, HostedZoneResponse, HostedZoneListResponse
from app.services.zone_service import ZoneService
from app.repositories.record_repository import RecordRepository
from app.services.record_exporter import RecordExporter
from app.services.bind_parser import BINDParser
from app.services.record_service import RecordService
from app.schemas import DNSRecordCreate
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

@router.get("/{id}/export")
def export_hosted_zone(
    id: int,
    format: str = Query("bind", description="Export format: bind or json"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    zone = ZoneService.get_zone(db, id)
    records, _ = RecordRepository.get_all_by_zone(db, id, limit=1000)

    if format.lower() == "json":
        return RecordExporter.export_to_json(
            {"id": zone.id, "name": zone.name, "comment": zone.comment, "is_private": zone.is_private, "created_at": zone.created_at},
            records
        )
    
    # BIND format
    bind_text = RecordExporter.export_to_bind(zone.name, records)
    filename = f"{zone.name.rstrip('.')}.zone"
    return Response(
        content=bind_text,
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.post("/{id}/import")
def import_hosted_zone(
    id: int,
    content: str = Body(..., media_type="text/plain"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    zone = ZoneService.get_zone(db, id)
    parsed_records = BINDParser.parse(content, zone.name)

    created_count = 0
    errors = []

    for rec in parsed_records:
        try:
            payload = DNSRecordCreate(
                name=rec["name"],
                type=rec["type"],
                ttl=rec["ttl"],
                values=rec["values"],
                routing_policy="simple"
            )
            RecordService.create_record(db, id, payload)
            created_count += 1
        except Exception as e:
            errors.append(f"Record {rec['name']} ({rec['type']}): {str(e)}")

    return {
        "message": f"Successfully imported {created_count} record(s)",
        "created_count": created_count,
        "errors": errors
    }
