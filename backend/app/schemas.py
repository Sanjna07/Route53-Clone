from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# --- Error Envelope ---
class ErrorDetail(BaseModel):
    code: str
    message: str
    field: Optional[str] = None

class ErrorResponse(BaseModel):
    error: ErrorDetail

# --- Auth Schemas ---
class LoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    token: Optional[str] = None

    class Config:
        from_attributes = True

# --- Hosted Zone Schemas ---
class HostedZoneCreate(BaseModel):
    name: str = Field(..., description="Domain name, e.g. example.com")
    comment: Optional[str] = None
    is_private: Optional[bool] = False

class HostedZoneUpdate(BaseModel):
    name: Optional[str] = None
    comment: Optional[str] = None
    is_private: Optional[bool] = None

class HostedZoneResponse(BaseModel):
    id: int
    name: str
    comment: Optional[str] = None
    is_private: bool
    record_count: Optional[int] = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class HostedZoneListResponse(BaseModel):
    items: List[HostedZoneResponse]
    total: int
    page: int
    limit: int

# --- DNS Record Schemas ---
class RecordValueSchema(BaseModel):
    id: Optional[int] = None
    value: str

    class Config:
        from_attributes = True

class DNSRecordCreate(BaseModel):
    name: str = Field(..., description="Record name, e.g. sub.example.com or example.com")
    type: str = Field(..., description="Record type: A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA")
    ttl: int = Field(300, ge=0)
    values: List[str] = Field(..., min_items=1)
    routing_policy: Optional[str] = "simple"

class DNSRecordUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    ttl: Optional[int] = None
    values: Optional[List[str]] = None
    routing_policy: Optional[str] = None

class DNSRecordResponse(BaseModel):
    id: int
    hosted_zone_id: int
    name: str
    type: str
    ttl: int
    values: List[str]
    routing_policy: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DNSRecordListResponse(BaseModel):
    items: List[DNSRecordResponse]
    total: int
    page: int
    limit: int
