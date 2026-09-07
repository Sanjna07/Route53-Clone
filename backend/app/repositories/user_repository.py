from sqlalchemy.orm import Session
from app.models import User
from app.services.auth_service import hash_password

class UserRepository:
    @staticmethod
    def get_by_username(db: Session, username: str) -> User | None:
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def get_by_id(db: Session, user_id: int) -> User | None:
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def seed_admin_user(db: Session) -> User:
        admin = UserRepository.get_by_username(db, "admin")
        if not admin:
            admin = User(
                username="admin",
                password_hash=hash_password("admin123")
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
        return admin
