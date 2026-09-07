 # AWS Route53 Web Application Clone

A full-featured clone of the **AWS Route53** web application built with **Next.js** (TypeScript) and **FastAPI** (Python), backed by **SQLite**. 

This application faithfully recreates the AWS Route53 user interface, navigation, table filters, record validators, cascading deletions, and core DNS management workflows using official **AWS Cloudscape Design System** components (`@cloudscape-design/components`).

---

## Key Features

- **AWS Cloudscape UX**: 1:1 visual match with AWS Console layout (`AppLayout`, `TopNavigation`, `SideNavigation`, `BreadcrumbGroup`, `Table`, `Pagination`, `Modal`, `Flashbar`).
- **Session Authentication**: Cookie-based auth with configurable environment settings (`SameSite=Lax` for local development, `SameSite=None; Secure=True` for cross-domain production deployments).
- **Hosted Zones Management**: Full CRUD for Public and Private hosted zones with real-time search, sorting, and pagination.
- **DNS Record Management**: Full CRUD for 9 common DNS record types:
  - `A` (IPv4 format validation)
  - `AAAA` (IPv6 format validation)
  - `CNAME` (Single target validation & unique name conflict prevention)
  - `MX` (Priority + Hostname format validation)
  - `TXT` (Character limit checks)
  - `NS`, `PTR`, `SRV`, `CAA` (Structured format validation)
- **Normalized Database Design**: Separate `record_values` table with foreign key ON DELETE CASCADE.
- **Placeholder AWS Console Sections**: Dashboard, Traffic Policies, Health Checks, Resolver, and Profiles.

---

## Architecture Overview

The system is designed as a clean **Modular Monolith** using a 3-tier layered architecture:

```
frontend/ (Next.js App Router + Cloudscape UI + TanStack Query)
   │
   ▼  HTTP / REST API (JSON + Signed Cookie)
   │
backend/ (FastAPI)
 ├── routers/       --> HTTP endpoints, request parsing & auth dependency checks
 ├── services/      --> Business logic, tiered DNS record validators & duplicate checks
 └── repositories/  --> SQLAlchemy database operations & SQLite per-connection FK listeners
```

> **Architectural Decision**: A single SQLite database with a tightly coupled domain model and single deployment target means a modular monolith is the optimal architecture choice over distributed microservices.

---

## Database Schema

```sql
users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

hosted_zones (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  comment TEXT,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_zones_name ON hosted_zones(name);

dns_records (
  id INTEGER PRIMARY KEY,
  hosted_zone_id INTEGER NOT NULL REFERENCES hosted_zones(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('A','AAAA','CNAME','TXT','MX','NS','PTR','SRV','CAA')),
  ttl INTEGER NOT NULL DEFAULT 300,
  routing_policy TEXT NOT NULL DEFAULT 'simple',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_records_zone_name_type ON dns_records(hosted_zone_id, name, type);

record_values (
  id INTEGER PRIMARY KEY,
  record_id INTEGER NOT NULL REFERENCES dns_records(id) ON DELETE CASCADE,
  value TEXT NOT NULL
);
```

---

## API Contract Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server health check (`{"status": "ok"}`) |
| `POST` | `/auth/login` | Login and set `auth_token` cookie |
| `POST` | `/auth/logout` | Clear `auth_token` cookie |
| `GET` | `/auth/me` | Fetch current session user |
| `GET` | `/hosted-zones` | List hosted zones (search, pagination) |
| `POST` | `/hosted-zones` | Create a new hosted zone |
| `GET` | `/hosted-zones/{id}` | Get hosted zone details |
| `PUT` | `/hosted-zones/{id}` | Update hosted zone |
| `DELETE` | `/hosted-zones/{id}` | Delete hosted zone (cascade deletes records & values) |
| `GET` | `/hosted-zones/{id}/records` | List DNS records (search, type filter, pagination) |
| `POST` | `/hosted-zones/{id}/records` | Create DNS record |
| `PUT` | `/hosted-zones/{id}/records/{rec_id}` | Update DNS record |
| `DELETE` | `/hosted-zones/{id}/records/{rec_id}` | Delete DNS record |

---

## Local Setup & Development

### 1. Prerequisites
- **Node.js**: v18+
- **Python**: 3.10+

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend Swagger documentation will be available at: `http://127.0.0.1:8000/docs`

Default Admin Credentials:
- **Username**: `admin`
- **Password**: `admin123`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open **`http://localhost:3000`** in your browser.

---

## Deployment Instructions

### Backend (Render / Fly.io)
1. Deploy the `backend/` directory as a Python web service.
2. Mount a persistent disk volume to persist the SQLite database file `route53.db`.
3. Environment variables:
   - `ENVIRONMENT=production`
   - `ALLOWED_ORIGINS=https://your-frontend.vercel.app`
   - `SECRET_KEY=your-production-secret-key`

### Frontend (Vercel)
1. Deploy the `frontend/` directory to Vercel.
2. Environment variables:
   - `NEXT_PUBLIC_API_BASE_URL=https://your-backend.onrender.com`
