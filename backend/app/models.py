import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey, Index, CheckConstraint
)
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)

class HostedZone(Base):
    __tablename__ = "hosted_zones"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    comment = Column(String, nullable=True)
    is_private = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships & Cascades
    records = relationship("DNSRecord", back_populates="zone", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_zones_name", "name"),
    )

class DNSRecord(Base):
    __tablename__ = "dns_records"

    id = Column(Integer, primary_key=True, index=True)
    hosted_zone_id = Column(Integer, ForeignKey("hosted_zones.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    ttl = Column(Integer, nullable=False, default=300)
    routing_policy = Column(String, nullable=False, default="simple")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships & Cascades
    zone = relationship("HostedZone", back_populates="records")
    values = relationship("RecordValue", back_populates="record", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint(
            "type IN ('A','AAAA','CNAME','TXT','MX','NS','PTR','SRV','CAA','SOA')",
            name="check_record_type"
        ),
        Index("idx_records_zone_name_type", "hosted_zone_id", "name", "type"),
    )

class RecordValue(Base):
    __tablename__ = "record_values"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, ForeignKey("dns_records.id", ondelete="CASCADE"), nullable=False)
    value = Column(String, nullable=False)

    record = relationship("DNSRecord", back_populates="values")
