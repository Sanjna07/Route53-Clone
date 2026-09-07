import ipaddress
import re
from fastapi import HTTPException, status

def validate_dns_record(type_: str, values: list[str], record_name: str, existing_records_same_name: list = None):
    """
    Tiered validation function with rules dictionary keyed by record type.
    """
    if not values or len(values) == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "VALIDATION_ERROR", "message": "At least one record value is required", "field": "values"}
        )

    # Clean whitespace
    values = [v.strip() for v in values if v.strip()]
    if not values:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "VALIDATION_ERROR", "message": "Values cannot be empty", "field": "values"}
        )

    type_upper = type_.upper()

    if type_upper == "A":
        for val in values:
            try:
                ipaddress.IPv4Address(val)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail={"code": "INVALID_A_RECORD", "message": f"Value '{val}' is not a valid IPv4 address", "field": "values"}
                )

    elif type_upper == "AAAA":
        for val in values:
            try:
                ipaddress.IPv6Address(val)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail={"code": "INVALID_AAAA_RECORD", "message": f"Value '{val}' is not a valid IPv6 address", "field": "values"}
                )

    elif type_upper == "CNAME":
        if len(values) != 1:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"code": "INVALID_CNAME_RECORD", "message": "CNAME records must have exactly one value", "field": "values"}
            )
        # Reject if another record exists with the same name in the zone
        if existing_records_same_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "CNAME_CONFLICT", "message": f"CNAME record name '{record_name}' conflicts with existing record(s) in this zone", "field": "name"}
            )

    elif type_upper == "MX":
        for val in values:
            parts = val.split(maxsplit=1)
            if len(parts) != 2 or not parts[0].isdigit():
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail={"code": "INVALID_MX_RECORD", "message": f"MX record '{val}' must be formatted as '<int priority> <hostname>'", "field": "values"}
                )

    elif type_upper == "TXT":
        for val in values:
            if len(val) > 255:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail={"code": "INVALID_TXT_RECORD", "message": "TXT record strings cannot exceed 255 characters", "field": "values"}
                )

    elif type_upper == "NS" or type_upper == "PTR":
        for val in values:
            if len(val) < 2 or " " in val:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail={"code": f"INVALID_{type_upper}_RECORD", "message": f"Value '{val}' is not a valid hostname shape", "field": "values"}
                )

    elif type_upper == "SRV":
        for val in values:
            parts = val.split()
            if len(parts) != 4 or not (parts[0].isdigit() and parts[1].isdigit() and parts[2].isdigit()):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail={"code": "INVALID_SRV_RECORD", "message": f"SRV record '{val}' must match '<priority> <weight> <port> <target>'", "field": "values"}
                )

    elif type_upper == "CAA":
        for val in values:
            parts = val.split(maxsplit=2)
            if len(parts) < 3 or not parts[0].isdigit():
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail={"code": "INVALID_CAA_RECORD", "message": f"CAA record '{val}' must match '<flags> <tag> <value>'", "field": "values"}
                )

    return values
