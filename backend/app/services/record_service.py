from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.record_repository import RecordRepository
from app.repositories.zone_repository import ZoneRepository
from app.services.record_validator import validate_dns_record
from app.schemas import DNSRecordCreate, DNSRecordUpdate

class RecordService:
    @staticmethod
    def list_records(db: Session, zone_id: int, search: str = "", type_filter: str = "", page: int = 1, limit: int = 10):
        # Verify zone exists
        zone = ZoneRepository.get_by_id(db, zone_id)
        if not zone:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "ZONE_NOT_FOUND", "message": f"Hosted zone with ID {zone_id} not found", "field": "id"}
            )
        skip = (page - 1) * limit
        items, total = RecordRepository.get_all_by_zone(db, zone_id, search, type_filter, skip, limit)
        return {
            "items": items,
            "total": total,
            "page": page,
            "limit": limit
        }

    @staticmethod
    def get_record(db: Session, zone_id: int, record_id: int):
        record = RecordRepository.get_by_id(db, record_id)
        if not record or record["hosted_zone_id"] != zone_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "RECORD_NOT_FOUND", "message": f"DNS record with ID {record_id} not found in zone {zone_id}", "field": "id"}
            )
        return record

    @staticmethod
    def create_record(db: Session, zone_id: int, data: DNSRecordCreate):
        zone = ZoneRepository.get_by_id(db, zone_id)
        if not zone:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "ZONE_NOT_FOUND", "message": f"Hosted zone with ID {zone_id} not found", "field": "id"}
            )

        # Name normalization & auto-append zone name if relative name provided
        rec_name = data.name.strip().lower()
        if not rec_name.endswith(zone.name):
            if rec_name == "@" or rec_name == "":
                rec_name = zone.name
            else:
                rec_name = f"{rec_name}.{zone.name}"

        # Fetch existing records with same name for CNAME conflict check
        existing_records = RecordRepository.get_by_name(db, zone_id, rec_name)
        validated_values = validate_dns_record(data.type, data.values, rec_name, existing_records if data.type.upper() == "CNAME" else None)

        data.name = rec_name
        return RecordRepository.create(db, zone_id, data, validated_values)

    @staticmethod
    def update_record(db: Session, zone_id: int, record_id: int, data: DNSRecordUpdate):
        existing = RecordService.get_record(db, zone_id, record_id)
        zone = ZoneRepository.get_by_id(db, zone_id)

        rec_name = data.name.strip().lower() if data.name else existing["name"]
        if not rec_name.endswith(zone.name):
            if rec_name == "@" or rec_name == "":
                rec_name = zone.name
            else:
                rec_name = f"{rec_name}.{zone.name}"

        rec_type = data.type.upper() if data.type else existing["type"]
        rec_values = data.values if data.values is not None else existing["values"]

        same_name_records = RecordRepository.get_by_name(db, zone_id, rec_name, exclude_id=record_id)
        validated_values = validate_dns_record(rec_type, rec_values, rec_name, same_name_records if rec_type == "CNAME" else None)

        if data.name:
            data.name = rec_name

        return RecordRepository.update(db, record_id, data, validated_values)

    @staticmethod
    def delete_record(db: Session, zone_id: int, record_id: int):
        RecordService.get_record(db, zone_id, record_id)
        RecordRepository.delete(db, record_id)
        return {"message": f"DNS record {record_id} deleted successfully"}
