import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "route53.db"

class Settings:
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-route53-key-2026")
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # CORS Origins - includes dev frontend and backend ports
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:8001",
        "http://127.0.0.1:8001",
    ] + [origin for origin in os.getenv("ALLOWED_ORIGINS", "").split(",") if origin]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    @property
    def cookie_secure(self) -> bool:
        # Secure=True requires HTTPS (prod), dev uses False
        return self.is_production or os.getenv("COOKIE_SECURE", "false").lower() == "true"

    @property
    def cookie_samesite(self) -> str:
        # Prod requires SameSite=None for cross-domain cookies; dev uses Lax
        return "none" if self.cookie_secure else "lax"

settings = Settings()
