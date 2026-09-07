from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.zone_repository import ZoneRepository
from app.schemas import HostedZoneCreate, HostedZoneUpdate

class ZoneService:
    @staticmethod
    def list_zones(db: Session, search: str = "", page: int = 1, limit: int = 10):
        skip = (page - 1) * limit
        items, total = ZoneRepository.get_all(db, search, skip, limit)
        return {
            "items": items,
            "total": total,
            "page": page,
            "limit": limit
        }

    @staticmethod
    def get_zone(db: Session, zone_id: int):
        zone = ZoneRepository.get_by_id(db, zone_id)
        if not zone:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "ZONE_NOT_FOUND", "message": f"Hosted zone with ID {zone_id} not found", "field": "id"}
            )
        return zone

    @staticmethod
    def create_zone(db: Session, data: HostedZoneCreate):
        if not data.name or not data.name.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"code": "VALIDATION_ERROR", "message": "Hosted zone name is required", "field": "name"}
            )
        
        # Check duplicate
        normalized_name = data.name.strip().lower()
        if not normalized_name.endswith("."):
            normalized_name += "."
            
        existing = ZoneRepository.get_by_name(db, normalized_name)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "DUPLICATE_ZONE", "message": f"Hosted zone '{normalized_name}' already exists", "field": "name"}
            )

        return ZoneRepository.create(db, data)

    @staticmethod
    def update_zone(db: Session, zone_id: int, data: HostedZoneUpdate):
        ZoneService.get_zone(db, zone_id)
        return ZoneRepository.update(db, zone_id, data)

    @staticmethod
    def delete_zone(db: Session, zone_id: int):
        ZoneService.get_zone(db, zone_id)
        ZoneRepository.delete(db, zone_id)
        return {"message": f"Hosted zone {zone_id} deleted successfully"}
