from sqlalchemy.orm import Session
from app.models import DNSRecord, RecordValue
from app.schemas import DNSRecordCreate, DNSRecordUpdate

class RecordRepository:
    @staticmethod
    def get_all_by_zone(db: Session, zone_id: int, search: str = "", type_filter: str = "", skip: int = 0, limit: int = 10):
        query = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone_id)

        if search:
            query = query.filter(DNSRecord.name.ilike(f"%{search}%"))

        if type_filter:
            query = query.filter(DNSRecord.type == type_filter.upper())

        total = query.count()
        records = query.order_by(DNSRecord.name.asc()).offset(skip).limit(limit).all()

        # Format output to include values string list
        result = []
        for r in records:
            r_dict = {
                "id": r.id,
                "hosted_zone_id": r.hosted_zone_id,
                "name": r.name,
                "type": r.type,
                "ttl": r.ttl,
                "routing_policy": r.routing_policy,
                "values": [v.value for v in r.values],
                "created_at": r.created_at,
                "updated_at": r.updated_at,
            }
            result.append(r_dict)

        return result, total

    @staticmethod
    def get_by_id(db: Session, record_id: int):
        r = db.query(DNSRecord).filter(DNSRecord.id == record_id).first()
        if not r:
            return None
        return {
            "id": r.id,
            "hosted_zone_id": r.hosted_zone_id,
            "name": r.name,
            "type": r.type,
            "ttl": r.ttl,
            "routing_policy": r.routing_policy,
            "values": [v.value for v in r.values],
            "created_at": r.created_at,
            "updated_at": r.updated_at,
        }

    @staticmethod
    def get_by_name(db: Session, zone_id: int, name: str, exclude_id: int = None):
        query = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone_id, DNSRecord.name == name)
        if exclude_id:
            query = query.filter(DNSRecord.id != exclude_id)
        return query.all()

    @staticmethod
    def create(db: Session, zone_id: int, data: DNSRecordCreate, validated_values: list[str]):
        record = DNSRecord(
            hosted_zone_id=zone_id,
            name=data.name.strip().lower(),
            type=data.type.upper(),
            ttl=data.ttl,
            routing_policy=data.routing_policy or "simple"
        )
        db.add(record)
        db.flush()

        for val in validated_values:
            rv = RecordValue(record_id=record.id, value=val)
            db.add(rv)

        db.commit()
        db.refresh(record)
        return RecordRepository.get_by_id(db, record.id)

    @staticmethod
    def update(db: Session, record_id: int, data: DNSRecordUpdate, validated_values: list[str] = None):
        record = db.query(DNSRecord).filter(DNSRecord.id == record_id).first()
        if not record:
            return None

        if data.name is not None:
            record.name = data.name.strip().lower()
        if data.type is not None:
            record.type = data.type.upper()
        if data.ttl is not None:
            record.ttl = data.ttl
        if data.routing_policy is not None:
            record.routing_policy = data.routing_policy

        if validated_values is not None:
            # Re-seed values
            db.query(RecordValue).filter(RecordValue.record_id == record.id).delete()
            for val in validated_values:
                rv = RecordValue(record_id=record.id, value=val)
                db.add(rv)

        db.commit()
        return RecordRepository.get_by_id(db, record.id)

    @staticmethod
    def delete(db: Session, record_id: int) -> bool:
        record = db.query(DNSRecord).filter(DNSRecord.id == record_id).first()
        if not record:
            return False
        db.delete(record)
        db.commit()
        return True
