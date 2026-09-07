from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import HostedZone, DNSRecord
from app.schemas import HostedZoneCreate, HostedZoneUpdate

class ZoneRepository:
    @staticmethod
    def get_all(db: Session, search: str = "", skip: int = 0, limit: int = 10):
        query = db.query(
            HostedZone,
            func.count(DNSRecord.id).label("record_count")
        ).outerjoin(DNSRecord, HostedZone.id == DNSRecord.hosted_zone_id)

        if search:
            query = query.filter(HostedZone.name.ilike(f"%{search}%"))

        query = query.group_by(HostedZone.id)
        total = query.count()
        results = query.offset(skip).limit(limit).all()

        zones = []
        for zone, count in results:
            zone.record_count = count
            zones.append(zone)

        return zones, total

    @staticmethod
    def get_by_id(db: Session, zone_id: int):
        zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
        if zone:
            zone.record_count = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone.id).count()
        return zone

    @staticmethod
    def get_by_name(db: Session, name: str):
        return db.query(HostedZone).filter(HostedZone.name == name.strip().lower()).first()

    @staticmethod
    def create(db: Session, data: HostedZoneCreate):
        # Normalize domain name
        domain_name = data.name.strip().lower()
        if not domain_name.endswith("."):
            domain_name = domain_name + "."

        zone = HostedZone(
            name=domain_name,
            comment=data.comment,
            is_private=data.is_private or False
        )
        db.add(zone)
        db.commit()
        db.refresh(zone)
        zone.record_count = 0
        return zone

    @staticmethod
    def update(db: Session, zone_id: int, data: HostedZoneUpdate):
        zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
        if not zone:
            return None

        if data.name is not None:
            domain_name = data.name.strip().lower()
            if not domain_name.endswith("."):
                domain_name = domain_name + "."
            zone.name = domain_name

        if data.comment is not None:
            zone.comment = data.comment

        if data.is_private is not None:
            zone.is_private = data.is_private

        db.commit()
        db.refresh(zone)
        zone.record_count = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone.id).count()
        return zone

    @staticmethod
    def delete(db: Session, zone_id: int) -> bool:
        zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
        if not zone:
            return False
        db.delete(zone)
        db.commit()
        return True
