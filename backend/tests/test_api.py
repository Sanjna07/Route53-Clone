import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine import Engine

from app.main import app
from app.database import Base, get_db
from app.repositories.user_repository import UserRepository

TEST_DATABASE_URL = "sqlite:///./backend/tests/test.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})

@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON;")
    cursor.close()

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    UserRepository.seed_admin_user(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

def test_health_check():
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

def test_login_and_auth_me():
    with TestClient(app) as client:
        # Invalid Login
        res_bad = client.post("/auth/login", json={"username": "admin", "password": "wrongpassword"})
        assert res_bad.status_code == 401

        # Valid Login
        res_good = client.post("/auth/login", json={"username": "admin", "password": "admin123"})
        assert res_good.status_code == 200
        data = res_good.json()
        assert data["username"] == "admin"
        assert "token" in data

        token = data["token"]

        # Test /auth/me with Bearer token
        res_me = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert res_me.status_code == 200
        assert res_me.json()["username"] == "admin"

def test_hosted_zone_crud_and_ns_soa_seeding():
    with TestClient(app) as client:
        login_res = client.post("/auth/login", json={"username": "admin", "password": "admin123"}).json()
        headers = {"Authorization": f"Bearer {login_res['token']}"}

        # Create Zone
        create_res = client.post("/hosted-zones", json={"name": "testapp.com", "comment": "Test Zone"}, headers=headers)
        assert create_res.status_code == 200
        zone_data = create_res.json()
        assert zone_data["name"] == "testapp.com."
        zone_id = zone_data["id"]

        # Verify Auto-Seeded NS and SOA Records exist
        records_res = client.get(f"/hosted-zones/{zone_id}/records", headers=headers).json()
        assert records_res["total"] == 2
        types = [r["type"] for r in records_res["items"]]
        assert "NS" in types
        assert "SOA" in types

        # Update Zone
        update_res = client.put(f"/hosted-zones/{zone_id}", json={"comment": "Updated Comment"}, headers=headers)
        assert update_res.status_code == 200
        assert update_res.json()["comment"] == "Updated Comment"

        # Delete Zone
        del_res = client.delete(f"/hosted-zones/{zone_id}", headers=headers)
        assert del_res.status_code == 200

def test_dns_record_validation():
    with TestClient(app) as client:
        login_res = client.post("/auth/login", json={"username": "admin", "password": "admin123"}).json()
        headers = {"Authorization": f"Bearer {login_res['token']}"}

        zone = client.post("/hosted-zones", json={"name": "validapp.com"}, headers=headers).json()
        zone_id = zone["id"]

        # Invalid A Record (bad IPv4)
        bad_a = client.post(f"/hosted-zones/{zone_id}/records", json={
            "name": "www", "type": "A", "ttl": 300, "values": ["999.999.999.999"]
        }, headers=headers)
        assert bad_a.status_code == 422

        # Valid A Record
        good_a = client.post(f"/hosted-zones/{zone_id}/records", json={
            "name": "www", "type": "A", "ttl": 300, "values": ["192.0.2.1"]
        }, headers=headers)
        assert good_a.status_code == 200

        # CNAME conflict (cannot create CNAME for name 'www' which already has A record)
        cname_conflict = client.post(f"/hosted-zones/{zone_id}/records", json={
            "name": "www", "type": "CNAME", "ttl": 300, "values": ["target.com."]
        }, headers=headers)
        assert cname_conflict.status_code == 400

        # Valid MX Record
        good_mx = client.post(f"/hosted-zones/{zone_id}/records", json={
            "name": "mail", "type": "MX", "ttl": 300, "values": ["10 mailserver.com."]
        }, headers=headers)
        assert good_mx.status_code == 200

def test_bind_export_and_import():
    with TestClient(app) as client:
        login_res = client.post("/auth/login", json={"username": "admin", "password": "admin123"}).json()
        headers = {"Authorization": f"Bearer {login_res['token']}"}

        zone = client.post("/hosted-zones", json={"name": "exportapp.com"}, headers=headers).json()
        zone_id = zone["id"]

        # Add A Record
        client.post(f"/hosted-zones/{zone_id}/records", json={
            "name": "app", "type": "A", "ttl": 300, "values": ["203.0.113.5"]
        }, headers=headers)

        # Export BIND
        export_res = client.get(f"/hosted-zones/{zone_id}/export?format=bind", headers=headers)
        assert export_res.status_code == 200
        bind_text = export_res.text
        assert "$ORIGIN exportapp.com." in bind_text
        assert "203.0.113.5" in bind_text

        # Create second zone & import BIND text into it
        zone2 = client.post("/hosted-zones", json={"name": "importapp.com"}, headers=headers).json()
        zone2_id = zone2["id"]

        import_res = client.post(
            f"/hosted-zones/{zone2_id}/import",
            content=bind_text,
            headers={**headers, "Content-Type": "text/plain"}
        )
        assert import_res.status_code == 200
        assert import_res.json()["created_count"] > 0
