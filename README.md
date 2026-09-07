# AWS Route53 Web Application Clone

[![Next.js](https://img.shields.io/badge/Next.js-14.1.4-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![AWS Cloudscape](https://img.shields.io/badge/AWS_Cloudscape-Design_System-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)](https://cloudscape.design/)
[![Pytest](https://img.shields.io/badge/Pytest-Automated_Suite-0A9EDC?style=for-the-badge&logo=pytest&logoColor=white)](https://docs.pytest.org/)

A full-stack, enterprise-grade clone of the **AWS Route53** web application built with **Next.js** (TypeScript), **FastAPI** (Python), and **SQLite**, designed using the official **AWS Cloudscape Design System**.

---

## 🌟 Features & Scope

### 🎨 AWS Cloudscape Design & Theme System
- **Authentic AWS Console UX**: Recreates AWS Console navigation using Cloudscape `AppLayout`, `TopNavigation`, `SideNavigation`, `BreadcrumbGroup`, `Tabs`, `Table`, `Modal`, and `Flashbar`.
- **AWS Dark Mode & Light Mode**: Seamless dark theme toggle integrated in `TopNavigation` via `@cloudscape-design/global-styles` (`applyMode(Mode.Dark)`), persisted in `localStorage`.

### 🌐 Hosted Zones & Automatic Records
- **Hosted Zone CRUD**: Create Public or Private hosted zones, update comments, and delete zones with full cascading record deletion.
- **Auto-Seeded AWS NS & SOA Records**: Creating a Hosted Zone automatically generates 4 authentic AWS Name Servers (`ns-xxx.awsdns-xx.org`) and an SOA record, matching AWS Route 53 behavior.

### 📜 BIND Zone File Import & Export
- **BIND Zone Export**: Export any Hosted Zone and its records to standard BIND `.zone` file syntax or structured JSON. Includes live preview and file download.
- **BIND Zone Import**: Upload or paste BIND zone files to parse `$ORIGIN`, `$TTL`, and record directives directly into a Hosted Zone.

### ⌨️ Global Keyboard Shortcuts
- **`C`**: Open Create modal (Hosted Zone or DNS Record)
- **`R`**: Refresh current table data
- **`/`**: Auto-focus table search input
- **`Esc`**: Instantly close active modal dialogs

### 🔐 Dual-Mode Authentication & Security
- **Cross-Domain Session Management**: Supports both HTTP-Only Cookies and `Authorization: Bearer <token>` fallback for cross-domain deployments (`vercel.app` -> `onrender.com`).
- **SQLite Integrity**: Connection-level Foreign Key enforcement via SQLAlchemy `PRAGMA foreign_keys=ON;` and ON DELETE CASCADE logic.

---

## 🏗 System Architecture

```mermaid
graph TD
    subgraph Frontend [Next.js 14 Client App Router]
        UI[AWS Cloudscape Components]
        Theme[Global Styles Mode Handler - Light/Dark]
        QueryCache[TanStack React Query Cache]
        Hotkeys[Keyboard Shortcuts Hook]
    end

    subgraph API [FastAPI Backend]
        AuthRouter["Auth Router (/auth)"]
        ZoneRouter["Zones Router (/hosted-zones)"]
        RecordRouter["Records Router (/hosted-zones/{id}/records)"]
        AuthMiddleware[Bearer / Cookie Auth Middleware]
    end

    subgraph ServiceLayer [Domain Service Layer]
        ZoneService[Zone Service & Auto NS/SOA Seeder]
        RecordService[Record Service & Syntax Validator]
        Exporter[BIND / JSON Zone Exporter]
        Parser[BIND Zone Parser]
    end

    subgraph Database [SQLite Storage Engine]
        DB[(route53.db / test.db)]
        FKPragma["PRAGMA foreign_keys=ON"]
    end

    UI --> Theme
    UI --> QueryCache
    QueryCache -->|HTTP + Bearer/Cookie| AuthMiddleware
    AuthMiddleware --> AuthRouter
    AuthMiddleware --> ZoneRouter
    AuthMiddleware --> RecordRouter

    ZoneRouter --> ZoneService
    ZoneRouter --> Exporter
    ZoneRouter --> Parser
    RecordRouter --> RecordService

    ZoneService --> RepoLayer[Repository Layer]
    RecordService --> RepoLayer
    RepoLayer --> FKPragma
    FKPragma --> DB
```

---

## 🔄 BIND Import & Export Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Browser
    participant Modal as Export / Import Modal
    participant API as FastAPI Router
    participant Service as Exporter / Parser Service
    participant DB as SQLite DB

    note over User, DB: BIND Zone File Export Pipeline
    User->>Modal: Click "Export zone" & "Generate preview"
    Modal->>API: GET /hosted-zones/{id}/export?format=bind
    API->>DB: Fetch Zone & DNS Records
    DB-->>API: Zone + Records Data
    API->>Service: RecordExporter.export_to_bind(name, records)
    Service-->>API: BIND zone string ($ORIGIN, $TTL, records)
    API-->>Modal: Response (text/plain)
    Modal-->>User: Render preview & enable .zone file download

    note over User, DB: BIND Zone File Import Pipeline
    User->>Modal: Upload .zone file or paste BIND text
    Modal->>API: POST /hosted-zones/{id}/import (text/plain)
    API->>Service: BINDParser.parse(content, zone_name)
    Service-->>API: Parsed Record Objects List
    loop For Each Parsed Record
        API->>DB: Validate & Insert Record + Values
    end
    DB-->>API: Commit Transaction
    API-->>Modal: JSON Response ({created_count, errors})
    Modal-->>User: Refresh Records Table & Show Success Alert
```

---

## 🗄 Database Schema

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
  type TEXT NOT NULL CHECK(type IN ('A','AAAA','CNAME','TXT','MX','NS','PTR','SRV','CAA','SOA')),
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

## 🔌 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server health check (`{"status": "ok"}`) |
| `POST` | `/auth/login` | Authenticate user & return token + set cookie |
| `POST` | `/auth/logout` | Clear active session cookie |
| `GET` | `/auth/me` | Retrieve currently authenticated user session |
| `GET` | `/hosted-zones` | List hosted zones with search & pagination |
| `POST` | `/hosted-zones` | Create hosted zone (auto-seeds NS & SOA) |
| `GET` | `/hosted-zones/{id}` | Get hosted zone metadata |
| `PUT` | `/hosted-zones/{id}` | Update hosted zone comment |
| `DELETE` | `/hosted-zones/{id}` | Delete hosted zone (cascade deletes records & values) |
| `GET` | `/hosted-zones/{id}/export` | Export zone as BIND (`format=bind`) or JSON (`format=json`) |
| `POST` | `/hosted-zones/{id}/import` | Import BIND zone file content into hosted zone |
| `GET` | `/hosted-zones/{id}/records` | List DNS records with search & type filter |
| `POST` | `/hosted-zones/{id}/records` | Create DNS record with syntax validation |
| `PUT` | `/hosted-zones/{id}/records/{rec_id}` | Update DNS record values and TTL |
| `DELETE` | `/hosted-zones/{id}/records/{rec_id}` | Delete DNS record |

---

## ⚙️ Local Setup & Testing Instructions

### 1. Backend Setup & Pytest Execution

```bash
# Navigate to backend directory
cd backend

# Create & activate virtual environment (Windows)
python -m venv venv
.\venv\Scripts\activate

# On Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run Automated Pytest Suite
python -m pytest tests/test_api.py -v

# Start FastAPI Server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

Default Credentials:
- **Username**: `admin`
- **Password**: `admin123`

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install packages
npm install

# Start Next.js Development Server
npm run dev
```

Open **`http://localhost:3000`** in your browser.
