import hashlib
import jwt
from datetime import datetime, timedelta
from typing import Optional
from app.config import settings

SALT = b"route53_salt_2026_secure"

def hash_password(password: str) -> str:
    """Salted SHA-256 password hash using standard library hashlib."""
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), SALT, 100000)
    return key.hex()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def create_access_token(username: str, expires_delta: Optional[timedelta] = None) -> str:
    delta = expires_delta or timedelta(days=7)
    expire = datetime.utcnow() + delta
    payload = {
        "sub": username,
        "exp": expire,
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

def decode_access_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return payload.get("sub")
    except Exception:
        return None
