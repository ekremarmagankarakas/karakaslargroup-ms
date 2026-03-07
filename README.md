# 🏗️ KarakaslarGroup Construction & Mall Management Platform

A **modular monolith** web platform built with **FastAPI**, **Vite + React**, **PostgreSQL**, and **Docker Compose**.
It serves as a unified management system for a construction company operating two connected business divisions:

* 🧱 **Build Division** — handles construction projects, requisitions, approvals, and vendors
* 🏬 **Manage Division** — manages malls, tenants, leases, work orders, and billing

Users can switch between the two divisions via a dropdown at the top of the frontend.

---

## 📚 Table of Contents

1. [Overview](#-overview)
2. [Architecture](#-architecture)
3. [Tech Stack](#️-tech-stack)
4. [Monorepo Structure](#-monorepo-structure)
5. [Database Design](#-database-design)
6. [Getting Started (Development)](#-getting-started-development)
7. [Docker & Makefile Workflow](#-docker--makefile-workflow)
8. [Backend (FastAPI)](#-backend-fastapi)
9. [Frontend (Vite + React)](#-frontend-vite--react)
10. [Environment Variables](#-environment-variables)
11. [Database & Alembic Migrations](#-database--alembic-migrations)
12. [Common Make Commands](#-common-make-commands)
13. [Future Improvements](#-future-improvements)
14. [License](#-license)

---

## 🚀 Overview

**KarakaslarGroup** integrates both construction and mall management workflows in a single web application.

| Division   | Description                                             | Example Features                             |
| ---------- | ------------------------------------------------------- | -------------------------------------------- |
| **Build**  | Manages projects, requisitions, vendors, and approvals. | Requisitions, cost codes, vendor contracts.  |
| **Manage** | Oversees malls, tenants, leases, and maintenance.       | Sites, tenants, work orders, rent invoicing. |

Both share the same backend and authentication layer, separated logically by routes and database schemas.

---

## 🧩 Architecture

**Type:** Modular Monolith (schema and package boundaries, one deployable app)
**Deployment:** Docker Compose (dev) → ECS Fargate (future production)
**Database:** PostgreSQL with three schemas (`core`, `build`, `manage`)
**Frontend:** Vite + React (TypeScript)

```
   ┌────────────────────────────┐
   │      Frontend (Vite)       │
   │ React + TS + React Query   │
   │ Site Switch: Build ↔ Manage│
   └──────────────┬─────────────┘
                  │ REST API
   ┌──────────────┴─────────────┐
   │       Backend (FastAPI)    │
   │  /api/core    - shared     │
   │  /api/build   - projects   │
   │  /api/manage  - malls      │
   └──────────────┬─────────────┘
                  │ SQLAlchemy
   ┌──────────────┴─────────────┐
   │ PostgreSQL (core/build/manage)
   └────────────────────────────┘
```

---

## ⚙️ Tech Stack

| Layer                      | Technology                                           |
| -------------------------- | ---------------------------------------------------- |
| **Frontend**               | Vite + React + TypeScript, React Router, React Query |
| **Backend**                | FastAPI, SQLAlchemy 2.0, Pydantic v2, Alembic        |
| **Database**               | PostgreSQL 16 (3 schemas: `core`, `build`, `manage`) |
| **Containerization**       | Docker + Docker Compose                              |
| **Environment Management** | `.env.dev` + pydantic-settings                       |
| **HTTP Server**            | Uvicorn (auto-reload for dev)                        |
| **Migrations**             | Alembic                                              |
| **Package Management**     | npm (frontend), pip (backend)                        |

---

## 🗂️ Monorepo Structure

```
karakaslargroup/
├─ apps/
│  ├─ backend/
│  │  ├─ app/
│  │  │  ├─ main.py                # Entry point
│  │  │  ├─ core/                  # Config, DB, shared models
│  │  │  ├─ build/                 # Build division domain
│  │  │  ├─ manage/                # Manage division domain
│  │  │  └─ migrations/ (Alembic)
│  │  ├─ Dockerfile.dev
│  │  ├─ requirements.txt
│  │  └─ .env.dev
│  ├─ frontend/
│  │  ├─ src/
│  │  │  ├─ build/                 # Build division UI
│  │  │  ├─ manage/                # Manage division UI
│  │  │  ├─ app/                   # Router, providers, site switch
│  │  │  └─ main.tsx
│  │  ├─ package.json
│  │  └─ Dockerfile.dev
├─ infra/
│  └─ compose/docker-compose.dev.yml
├─ Makefile                        # Developer command automation
└─ README.md
```

---

## 🗃️ Database Design

**Database:** `kgdb`
**Schemas:**

* `core` → users, roles, files, audit
* `build` → projects, requisitions, vendors, approvals
* `manage` → sites, tenants, leases, work orders, invoices

Each schema isolates its domain but shares stable foreign keys for common entities (like `core.users`).

---

## 🧑‍💻 Getting Started (Development)

### 1️⃣ Prerequisites

* [Docker Desktop](https://docs.docker.com/get-docker/)
* [Docker Compose](https://docs.docker.com/compose/)
* (Optional) Node.js ≥ 20 & Python ≥ 3.12 for local runs outside Docker

### 2️⃣ Clone the repository

```bash
git clone https://github.com/<your-org>/karakaslargroup.git
cd karakaslargroup
```

### 3️⃣ Start the full stack

```bash
make up
```

This runs:

* 🐘 Postgres (db)
* ⚙️ FastAPI backend (`localhost:8000`)
* 💻 React frontend (`localhost:5173`)

---

## 🐳 Docker & Makefile Workflow

All dev operations are defined in the **Makefile** — use it instead of raw `docker compose` commands.

| Command                    | Description                               |
| -------------------------- | ----------------------------------------- |
| `make up`                  | Build and start backend, frontend, and db |
| `make down`                | Stop all containers                       |
| `make downv`               | Stop and remove DB volume (wipe data)     |
| `make restart`             | Restart backend & frontend                |
| `make rebuild-backend`     | Rebuild backend image and restart it      |
| `make rebuild-frontend`    | Rebuild frontend image and restart it     |
| `make logs-backend`        | Tail backend logs                         |
| `make exec-backend`        | Open shell in backend container           |
| `make psql`                | Open Postgres shell (`psql`)              |
| `make alembic-init`        | Initialize Alembic folder                 |
| `make alembic-rev m="msg"` | Generate migration                        |
| `make alembic-up`          | Apply migrations                          |
| `make check`               | Ping all health endpoints                 |

Example:

```bash
make rebuild-backend
make alembic-rev m="add requisitions table"
make alembic-up
```

> 💡 You can run `make help` to list all available commands.

---

## 🐍 Backend (FastAPI)

### Endpoints

| Path                        | Description                       |
| --------------------------- | --------------------------------- |
| `/api/core/health`          | Health check                      |
| `/api/core/auth/login`      | OAuth2 password login (JWT)       |
| `/api/core/auth/me`         | Current user                      |
| `/api/core/files/upload`    | Upload attachment (JPG/PNG/PDF)   |
| `/api/core/files/{id}`      | Download attachment               |
| `/api/build/projects/hello` | Test endpoint for Build division  |
| `/api/build/requisitions`   | Create/list requisitions          |
| `/api/build/requisitions/{id}/decision` | Manager accept/decline |
| `/api/build/requisitions/{id}/payment`  | Accountant paid/unpaid  |
| `/api/build/requisitions/{id}/favorite` | Toggle favorite         |
| `/api/manage/sites/hello`   | Test endpoint for Manage division |

### Run manually (optional)

```bash
cd apps/backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### API Docs

* Swagger UI → [http://localhost:8000/docs](http://localhost:8000/docs)
* ReDoc → [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## ⚛️ Frontend (Vite + React)

### Run inside Docker

```bash
make up
```

Or locally:

```bash
cd apps/frontend
npm install
npm run dev
```

**Local URL:** [http://localhost:5173](http://localhost:5173)

### Dev login accounts

When `APP_ENV=dev` and `SEED_DEV_USERS=true`, the backend auto-seeds three users:

* `manager@kg.dev` / `manager123`
* `employee@kg.dev` / `employee123`
* `accountant@kg.dev` / `accountant123`

### Key Features

* Switch between **Build** and **Manage** via dropdown
* React Router for navigation
* React Query for data fetching and caching
* Environment variable `VITE_API_URL` links backend (default: `http://localhost:8000`)

---

## 🔐 Environment Variables

| Variable       | Description         | Default                                       |
| -------------- | ------------------- | --------------------------------------------- |
| `DB_USER`      | Postgres username   | `kg`                                          |
| `DB_PASS`      | Postgres password   | `kgpass`                                      |
| `DB_HOST`      | Database host       | `db`                                          |
| `DB_PORT`      | Database port       | `5432`                                        |
| `DB_NAME`      | Database name       | `kgdb`                                        |
| `DATABASE_URL` | Full SQLAlchemy DSN | `postgresql+psycopg://kg:kgpass@db:5432/kgdb` |
| `CORS_ORIGINS` | Allowed origins     | `http://localhost:5173`                       |
| `APP_ENV`      | Environment mode    | `dev`                                         |

---

## 🧬 Database & Alembic Migrations

### Inside backend container

```bash
make exec-backend
# inside container
alembic init app/migrations
# edit app/migrations/env.py to import Base.metadata
alembic revision --autogenerate -m "init"
alembic upgrade head
```

Or from host using Make:

```bash
make alembic-rev m="init"
make alembic-up
```

Alembic version table is stored in the `core` schema.

---

## 🧰 Common Make Commands

| Action                  | Command                            |
| ----------------------- | ---------------------------------- |
| Build & start stack     | `make up`                          |
| Stop all services       | `make down`                        |
| Wipe DB & volumes       | `make downv`                       |
| Tail backend logs       | `make logs-backend`                |
| Open shell in backend   | `make exec-backend`                |
| Run Alembic migration   | `make alembic-up`                  |
| Generate migration      | `make alembic-rev m="description"` |
| Health check            | `make check`                       |
| Open psql prompt        | `make psql`                        |
| Clean old Docker images | `make clean-images`                |

---

## 🧭 Future Improvements

| Area           | Planned Enhancements                            |
| -------------- | ----------------------------------------------- |
| **Auth**       | Integrate AWS Cognito / JWT RBAC per division   |
| **DB**         | Add seeding and test fixtures                   |
| **CI/CD**      | GitHub Actions → ECS deploy pipeline            |
| **Frontend**   | Type-safe OpenAPI client generation             |
| **Prod**       | Docker Compose → ECS Fargate + RDS + CloudFront |
| **Monitoring** | CloudWatch metrics + X-Ray tracing              |

---

## 🧠 Design Philosophy

* **Modular Monolith Now, Microservice Ready Later**
  Each domain (core/build/manage) lives in its own package and DB schema.
  You can split these into services later with minimal refactor.

* **Fast Iteration**
  Hot reload in backend and frontend containers.

* **Developer Simplicity**
  One command (`make up`) runs the whole environment.

* **Clean Contracts**
  OpenAPI & Alembic manage API and DB evolution cleanly.

---

## 🧾 License

© 2025 **KarakaslarGroup**.
All rights reserved. This software is proprietary and intended for internal use only.

---

Would you like me to extend this README with a **“Quick Start for New Developers”** section that walks through cloning, spinning up Docker, and verifying API endpoints in <5 minutes? It’s great for onboarding new team members.
