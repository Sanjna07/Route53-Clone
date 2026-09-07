from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.repositories.user_repository import UserRepository
from app.routers import auth, zones, records

# Initialize FastAPI App
app = FastAPI(
    title="AWS Route53 API Clone",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS Middleware with explicit origins & credentials
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Standard Error Envelope Exception Handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict) and "code" in exc.detail:
        error_payload = exc.detail
    else:
        error_payload = {
            "code": "HTTP_ERROR",
            "message": str(exc.detail)
        }
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": error_payload}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    first_error = errors[0] if errors else {}
    field = ".".join([str(loc) for loc in first_error.get("loc", []) if loc not in ("body", "query", "path")])
    message = first_error.get("msg", "Validation error")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": message,
                "field": field or None
            }
        }
    )

# Include Routers
app.include_router(auth.router)
app.include_router(zones.router)
app.include_router(records.router)

# Health Check Endpoint
@app.get("/health")
def health_check():
    return {"status": "ok"}

# Database Initialization & Startup Seeding
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        UserRepository.seed_admin_user(db)
    finally:
        db.close()
