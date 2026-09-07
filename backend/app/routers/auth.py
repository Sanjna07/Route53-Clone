from fastapi import APIRouter, Depends, Response, Request, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import LoginRequest, UserResponse, ErrorResponse, ErrorDetail
from app.repositories.user_repository import UserRepository
from app.services.auth_service import verify_password, create_access_token, decode_access_token
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Auth"])

def get_current_user(request: Request, db: Session = Depends(get_db)):
    # Check cookie first, fallback to Bearer header
    token = request.cookies.get("auth_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Not authenticated"}
        )

    username = decode_access_token(token)
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Invalid or expired session"}
        )

    user = UserRepository.get_by_username(db, username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "User not found"}
        )

    return user

@router.post("/login", response_model=UserResponse)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = UserRepository.get_by_username(db, payload.username)
    if not user or not verify_password(payload.password, user.password_hash):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"error": {"code": "INVALID_CREDENTIALS", "message": "Invalid username or password", "field": "password"}}
        )

    token = create_access_token(user.username)

    # Environment-aware cookie settings
    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=86400 * 7,  # 7 days
        path="/"
    )

    return user

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key="auth_token",
        path="/",
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite
    )
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
def me(current_user = Depends(get_current_user)):
    return current_user
