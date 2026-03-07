# ===== KarakaslarGroup - Makefile =====
# Usage:
#   make up              # build & start all services (prod Dockerfiles)
#   make dev             # build & start with hot reload (Dockerfile.dev + volumes)
#   make down            # stop services (keep volumes)
#   make downv           # stop & remove volumes (db wipe)
#   make rebuild-backend # rebuild backend image & start just backend
#   make logs-backend    # tail backend logs
#   make exec-backend    # bash into backend container
#   make psql            # open psql shell to Postgres
#   make alembic-rev m="baseline"   # autogenerate migration
#   make alembic-up      # upgrade DB to head
#   make seed            # seed users (add COMPOSE=docker-compose.dev.yml for dev)
#   make check           # curl basic health endpoints
#   make help            # list targets

# ---------- Variables (override with make VAR=value) ----------
COMPOSE ?= docker-compose.yml

BACKEND_DIR    ?= apps/backend
FRONTEND_DIR   ?= apps/frontend

BACKEND_SVC    ?= backend
FRONTEND_SVC   ?= frontend
DB_SVC         ?= db

DB_USER        ?= karakaslar
DB_NAME        ?= karakaslar

API_HOST       ?= http://localhost:8000
WEB_HOST       ?= http://localhost:80

DC     := docker compose -f $(COMPOSE)
DC_DEV := docker compose -f docker-compose.dev.yml

# ---------- Meta ----------
.PHONY: help up dev down downv dev-down restart ps logs \
        rebuild-backend rebuild-frontend \
        logs-backend logs-frontend dev-logs-backend dev-logs-frontend \
        exec-backend exec-frontend sh-backend sh-frontend dev-exec-backend \
        psql db-backup db-restore \
        alembic-init alembic-rev alembic-up alembic-down seed seed-data \
        dev-alembic-up dev-alembic-down dev-seed dev-seed-data \
        check check-backend check-frontend \
        build-frontend clean-images clean-volumes

help:
	@echo "KarakaslarGroup — common tasks"
	@echo
	@echo "Stack:"
	@echo "  make up                  Build & start all services (prod)"
	@echo "  make dev                 Build & start with hot reload (dev)"
	@echo "  make down                Stop prod services (keep volumes)"
	@echo "  make dev-down            Stop dev services"
	@echo "  make downv               Stop & remove volumes (DB wipe)"
	@echo "  make restart             Restart backend & frontend"
	@echo
	@echo "Backend:"
	@echo "  make rebuild-backend     Rebuild backend image and start backend"
	@echo "  make logs-backend        Tail backend logs (prod)"
	@echo "  make dev-logs-backend    Tail backend logs (dev)"
	@echo "  make exec-backend        Bash into backend container"
	@echo "  make alembic-init        Initialize Alembic (once)"
	@echo "  make alembic-rev m=MSG   Autogenerate migration with message"
	@echo "  make alembic-up          Apply migrations to head"
	@echo "  make alembic-down        Downgrade one revision"
	@echo "  make seed                Seed DB with users (add COMPOSE=docker-compose.dev.yml for dev)"
	@echo "  make seed-data           Seed DB with sample data"
	@echo
	@echo "Frontend:"
	@echo "  make rebuild-frontend    Rebuild frontend image and start frontend"
	@echo "  make logs-frontend       Tail frontend logs (prod)"
	@echo "  make dev-logs-frontend   Tail frontend logs (dev)"
	@echo "  make exec-frontend       Bash into frontend container"
	@echo "  make build-frontend      Run 'npm run build' inside container"
	@echo
	@echo "DB & Tools:"
	@echo "  make psql                Open psql shell to Postgres"
	@echo "  make clean-images        Prune dangling Docker images"
	@echo "  make clean-volumes       Remove all local Docker volumes (DANGEROUS)"
	@echo
	@echo "Checks:"
	@echo "  make check               Hit API endpoints"
	@echo "  make check-backend       POST $${API_HOST}/api/auth/login"
	@echo "  make check-frontend      Opens $(WEB_HOST) in your browser (best-effort)"
	@echo

# ---------- Orchestration ----------
up:
	$(DC) up --build

dev:
	$(DC_DEV) up --build

down:
	$(DC) down

dev-down:
	$(DC_DEV) down

downv:
	$(DC) down -v

restart:
	$(DC) restart $(BACKEND_SVC) $(FRONTEND_SVC)

# ---------- Rebuild single services ----------
rebuild-backend:
	$(DC) up --build -d $(BACKEND_SVC)

rebuild-frontend:
	$(DC) up --build -d $(FRONTEND_SVC)

# ---------- Logs ----------
logs-backend:
	$(DC) logs -f $(BACKEND_SVC)

logs-frontend:
	$(DC) logs -f $(FRONTEND_SVC)

dev-logs-backend:
	$(DC_DEV) logs -f $(BACKEND_SVC)

dev-logs-frontend:
	$(DC_DEV) logs -f $(FRONTEND_SVC)

dev-exec-backend:
	$(DC_DEV) exec $(BACKEND_SVC) bash

# ---------- Shell / Exec ----------
exec-backend:
	$(DC) exec $(BACKEND_SVC) bash

exec-frontend:
	$(DC) exec $(FRONTEND_SVC) bash

sh-backend: exec-backend
sh-frontend: exec-frontend

# ---------- Database ----------
psql:
	$(DC) exec $(DB_SVC) psql -U $(DB_USER) $(DB_NAME)

# Placeholders for backups (customize paths/strategy as needed)
db-backup:
	@echo "Implement a pg_dump target here (e.g., docker exec db pg_dump ... > backup.sql)"

db-restore:
	@echo "Implement a psql restore target here (e.g., cat backup.sql | docker exec -i db psql ...)"

# ---------- Alembic (run inside backend container) ----------
alembic-init:
	$(DC) exec $(BACKEND_SVC) uv run alembic init alembic

# Example: make alembic-rev m="baseline"
alembic-rev:
	@if [ -z "$(m)" ]; then echo "Missing message. Usage: make alembic-rev m=\"your message\""; exit 1; fi
	$(DC) exec $(BACKEND_SVC) uv run alembic revision --autogenerate -m "$(m)"

alembic-up:
	$(DC) exec $(BACKEND_SVC) uv run alembic upgrade head

alembic-down:
	$(DC) exec $(BACKEND_SVC) uv run alembic downgrade -1

seed:
	$(DC) exec -e PYTHONPATH=/app $(BACKEND_SVC) uv run python scripts/seed.py

seed-data:
	$(DC) exec -e PYTHONPATH=/app $(BACKEND_SVC) uv run python scripts/seed_data.py

# ---------- Dev DB helpers ----------
dev-alembic-up:
	$(DC_DEV) exec $(BACKEND_SVC) uv run alembic upgrade head

dev-alembic-down:
	$(DC_DEV) exec $(BACKEND_SVC) uv run alembic downgrade -1

dev-seed:
	$(DC_DEV) exec -e PYTHONPATH=/app $(BACKEND_SVC) uv run python scripts/seed.py

dev-seed-data:
	$(DC_DEV) exec -e PYTHONPATH=/app $(BACKEND_SVC) uv run python scripts/seed_data.py

# ---------- Frontend build (optional) ----------
build-frontend:
	$(DC) exec $(FRONTEND_SVC) npm run build

# ---------- Health checks ----------
check: check-backend
	@echo "Frontend: $(WEB_HOST)"
	@echo "Open in browser if not already: make check-frontend"

check-backend:
	@echo "GET $(API_HOST)/api/auth/login"
	@curl -fsS -X POST $(API_HOST)/api/auth/login -H "Content-Type: application/json" -d '{"username":"test","password":"test"}' | jq . || true
	@echo

# Best-effort: tries to open in default browser on macOS/Linux/WSL
check-frontend:
	@if command -v xdg-open >/dev/null 2>&1; then xdg-open $(WEB_HOST); \
	elif command -v open >/dev/null 2>&1; then open $(WEB_HOST); \
	else echo "Open $(WEB_HOST) manually."; fi

# ---------- Cleanup ----------
clean-images:
	docker image prune -f

# Danger: removes ALL local volumes
clean-volumes:
	docker volume prune -f

