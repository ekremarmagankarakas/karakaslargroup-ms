# Construction Site — Remaining Implementation Plan

## Context
Phases 1–18 are fully implemented. Two features remain: material shipment tracking and project team management.

---

## Phase 19 — Material Shipment Tracking / Sevkiyat Takibi (new model + migration)

**Why**: Materials like Beton, Demir arrive in batches from suppliers. You need to know what was ordered vs what actually arrived, when it arrived, who received it, and whether deliveries were complete or rejected. This is distinct from the materials list (which tracks planned/used totals) — shipments are the individual delivery events.

**19a. Backend**
- New enum `ShipmentStatus`: `ordered`, `in_transit`, `delivered`, `partial`, `rejected`, `returned`
- New model: `apps/backend/app/models/construction/shipment.py`
  - Fields: id, project_id (FK cascade), material_id (FK construction_materials, nullable — can be ad-hoc), material_name (String — denormalized for display even if material deleted), supplier_name, quantity_ordered (Numeric 12,2), quantity_delivered (Numeric 12,2, nullable), unit (ConstructionMaterialUnit enum), unit_cost (Numeric 12,2, nullable), total_cost (Numeric 14,2, nullable — computed or manual), status, order_date (Date), expected_delivery_date (Date, nullable), actual_delivery_date (Date, nullable), delivery_note_number (nullable), notes (Text, nullable), received_by (FK users, nullable, joinedload), created_at
- Register in `apps/backend/app/db/all_models.py`
- Generate migration: `make dev-alembic-rev m="add construction shipments"`
- New schema: `apps/backend/app/schemas/construction/shipment.py`
  - `ShipmentCreate`, `ShipmentUpdate`, `ShipmentResponse` (includes receiver name, material name)
- New repo: `apps/backend/app/repositories/construction/shipment_repository.py`
  - `get_by_project` (paginated, most recent first), `get_by_material`, `create`, `update`, `delete`
  - `get_pending_all` — cross-project query of ordered+in_transit shipments for dashboard
- New service: `apps/backend/app/services/construction/shipment_service.py`
  - On status change to `delivered` or `partial`: if `material_id` is set, increment `ConstructionMaterial.quantity_used` by `quantity_delivered`
  - On status change to `rejected` or `returned`: reverse any prior quantity increment
- New route: `apps/backend/app/api/routes/construction/shipments.py`
  - `GET /{project_id}/shipments` (CurrentUser, paginated, filterable by status/material)
  - `POST /{project_id}/shipments` (ManagerOrAdmin)
  - `PATCH /{project_id}/shipments/{shipment_id}` (ManagerOrAdmin) — status change triggers qty update
  - `DELETE /{project_id}/shipments/{shipment_id}` (ManagerOrAdmin)
  - `GET /api/construction/shipments/pending` (ManagerOrAdmin) — cross-project pending shipments
- Add to `apps/backend/app/api/routes/construction/__init__.py`

**19b. Frontend**
- Add `ConstructionShipment`, `ShipmentStatus` types to `types/index.ts`
- New API in `apps/frontend/src/api/endpoints/construction/shipments.ts`
- New hook in `apps/frontend/src/hooks/construction/useConstructionShipments.ts`
- New component: `apps/frontend/src/components/construction/ShipmentList.tsx`
  - Table: material name, supplier, ordered qty, delivered qty, unit cost, total, status chip, expected/actual dates
  - Status chip colors: ordered=blue, in_transit=amber, delivered=green, partial=orange, rejected=red, returned=grey
  - "Yeni Sevkiyat" button (manager/admin) → dialog form with material selector dropdown
  - Inline status update (manager/admin) — "Teslim Alındı" / "Reddedildi" quick action buttons on in_transit rows
  - Summary card above table: total ordered value, total delivered value, pending count
- Add "Sevkiyatlar" tab to `ConstructionProjectPage.tsx`
- Add pending shipments badge to `ConstructionDashboardPage.tsx` stats panel (cross-project count of ordered+in_transit)

**Seed data**: 2-3 shipments per project (mix of statuses, linked to their seeded materials)

---

## Phase 20 — Project Team Management / Proje Ekibi (new model + migration)

**Why**: Currently users have global roles (employee/manager/admin) but no concept of which users belong to which construction project. Team management enables: per-project roster, "My Projects" view, scoped notifications to project members, and construction-specific roles (site engineer, foreman) that are independent of the procurement role system.

**20a. Backend**
- New enum `ConstructionProjectRole`: `project_manager`, `site_engineer`, `foreman`, `architect`, `safety_officer`, `consultant`, `observer`
- New model: `apps/backend/app/models/construction/project_member.py`
  - Fields: id, project_id (FK cascade), user_id (FK users, joinedload), construction_role (ConstructionProjectRole), joined_at (Date), notes (Text, nullable), created_at
  - Unique constraint: (project_id, user_id)
- Register in `apps/backend/app/db/all_models.py`
- Generate migration: `make dev-alembic-rev m="add construction project members"`
- New schema: `apps/backend/app/schemas/construction/project_member.py`
  - `ProjectMemberCreate`, `ProjectMemberUpdate`, `ProjectMemberResponse` (includes user full_name, email, global role)
- New repo: `apps/backend/app/repositories/construction/project_member_repository.py`
  - `get_by_project` (with joinedload on user), `get_by_user` (for "my projects"), `add`, `update_role`, `remove`
- New service: `apps/backend/app/services/construction/project_member_service.py`
  - `add_member` — prevent duplicates, notify the added user
  - `remove_member` — notify the removed user
  - `get_user_projects` — return projects where user is a member (used for "My Projects" view)
- Update `project_service.py`:
  - `list_projects` — accept optional `my_projects=True` filter that scopes to user's memberships
  - `ProjectResponse` — include `team_count: int` (number of members)
- New route: `apps/backend/app/api/routes/construction/team.py`
  - `GET /{project_id}/team` (CurrentUser) — list all team members
  - `POST /{project_id}/team` (ManagerOrAdmin) — add a user to the project
  - `PATCH /{project_id}/team/{member_id}` (ManagerOrAdmin) — update construction role
  - `DELETE /{project_id}/team/{member_id}` (ManagerOrAdmin) — remove from project
  - `GET /api/construction/my-projects` (CurrentUser) — projects where current user is a member
- Add to `apps/backend/app/api/routes/construction/__init__.py`
- Update `notification_service.py` — send notifications to project team members instead of all managers

**20b. Frontend**
- Add `ConstructionProjectMember`, `ConstructionProjectRole`, `team_count` types to `types/index.ts`
- New API in `apps/frontend/src/api/endpoints/construction/team.ts`
- New hook in `apps/frontend/src/hooks/construction/useConstructionTeam.ts`
  - `useProjectTeam(projectId)` — list members
  - `useMyProjects()` — projects where current user is a member
- New component: `apps/frontend/src/components/construction/ProjectTeam.tsx`
  - Avatar list with name, email, construction role badge, global role chip, joined date
  - "Üye Ekle" button (manager/admin) → user search dialog (search existing system users by name/email) + role dropdown
  - Change role / remove member (manager/admin)
  - Team member count chip shown in project header
- Add "Ekip" tab to `ConstructionProjectPage.tsx`
- Add "Projelerim" filter chip to `ConstructionDashboardPage.tsx` — filters to projects where current user is a member (calls `useMyProjects`)
- Add team member avatars (max 4 + overflow count) to `ProjectCard.tsx`
- Update `ConstructionStatsPanel.tsx` — add "Aktif Ekip Üyesi" count across all projects

**Seed data**: Assign 2-4 system users to each seeded project with realistic construction roles

---

## New Files Summary

### Backend
| File | Purpose |
|------|---------|
| `models/construction/shipment.py` | Shipment model + status enum |
| `schemas/construction/shipment.py` | Shipment schemas |
| `repositories/construction/shipment_repository.py` | Shipment data access |
| `services/construction/shipment_service.py` | Shipment + qty sync logic |
| `api/routes/construction/shipments.py` | Shipment CRUD + pending view |
| `models/construction/project_member.py` | Project member model + role enum |
| `schemas/construction/project_member.py` | Project member schemas |
| `repositories/construction/project_member_repository.py` | Member data access |
| `services/construction/project_member_service.py` | Add/remove member + notify |
| `api/routes/construction/team.py` | Team management + my-projects |

### Migrations (2 total)
1. `add_construction_shipments`
2. `add_construction_project_members`

### Frontend
| File | Purpose |
|------|---------|
| `components/construction/ShipmentList.tsx` | Shipment table + status actions |
| `components/construction/ProjectTeam.tsx` | Team roster + add/remove |
| `api/endpoints/construction/shipments.ts` | Shipments API |
| `api/endpoints/construction/team.ts` | Team API |
| `hooks/construction/useConstructionShipments.ts` | Shipments hooks |
| `hooks/construction/useConstructionTeam.ts` | Team hooks |

### Modified Files
- `types/index.ts` — new types for shipments and team members
- `ConstructionProjectPage.tsx` — add "Sevkiyatlar" and "Ekip" tabs
- `ConstructionDashboardPage.tsx` — pending shipments badge, "Projelerim" filter
- `ConstructionStatsPanel.tsx` — team member count card
- `ProjectCard.tsx` — team member avatars
- `models/construction/__init__.py` — export new models
- `db/all_models.py` — import new models
- `api/routes/construction/__init__.py` — register new routers
- `services/construction/project_service.py` — team_count on response, my_projects filter
- `services/construction/notification_service.py` — notify project team members

## Verification
1. Run migrations: `docker exec <backend> .venv/bin/alembic upgrade head`
2. Re-run seed: `docker exec <backend> PYTHONPATH=/app .venv/bin/python scripts/seed_data.py`
3. Open any project → "Sevkiyatlar" tab — add a shipment, mark as delivered, verify material qty_used updates
4. Open any project → "Ekip" tab — add a user, verify team count on ProjectCard
5. Use "Projelerim" filter on dashboard — verify it scopes to assigned projects
6. Pending shipments badge on dashboard shows correct cross-project count
