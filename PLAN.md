# Construction Site — Next Feature Set (Phases 21–28)

## Already Implemented (Phases 1–20)
Projects, Materials, Shipments, Milestones (Gantt), Issues, Photos, Comments, Daily Log, Subcontractors, Permits, Change Orders, Documents, Team, Favorites, Analytics, AI Chat, CSV Export, Health (RAG), Notifications, Audit Log.

---

## Phase 21 — Budget Line Items / Bütçe Kalemleri (new model + migration)

**Why**: `ConstructionProject.budget` is a single lump sum. Real construction budgets are broken into categories (Labor, Materials, Equipment, Subcontractors, Overhead, Contingency). This phase adds per-category planned vs actual tracking.

**21a. Backend**
- New enum `BudgetCategory`: `labor`, `materials`, `equipment`, `subcontractors`, `overhead`, `contingency`, `other`
- New model: `apps/backend/app/models/construction/budget_line.py`
  - Fields: id, project_id (FK cascade), category (BudgetCategory), description (nullable), planned_amount (Numeric 14,2), actual_amount (Numeric 14,2, default 0), notes (Text, nullable), created_at
- Register in `apps/backend/app/db/all_models.py`
- Generate migration: `make dev-alembic-rev m="add construction budget lines"`
- New schema: `apps/backend/app/schemas/construction/budget_line.py` — BudgetLineCreate, BudgetLineUpdate, BudgetLineResponse; `BudgetSummaryResponse { lines, total_planned, total_actual, variance, utilization_pct }`
- New repo: `apps/backend/app/repositories/construction/budget_line_repository.py` — get_by_project, create, update, delete, get_summary
- New service: `apps/backend/app/services/construction/budget_line_service.py`
  - When subcontractor contract_value changes → auto-update subcontractors line actual
  - When approved change order cost_delta applied → update relevant line actual
- New route: `apps/backend/app/api/routes/construction/budget.py`
  - `GET /{project_id}/budget` (CurrentUser) — full summary with lines
  - `POST /{project_id}/budget/lines` (ManagerOrAdmin)
  - `PATCH /{project_id}/budget/lines/{line_id}` (ManagerOrAdmin)
  - `DELETE /{project_id}/budget/lines/{line_id}` (ManagerOrAdmin)
- Add to `apps/backend/app/api/routes/construction/__init__.py`

**21b. Frontend**
- Add `ConstructionBudgetLine`, `BudgetCategory`, `BudgetSummaryResponse` to `types/index.ts`
- New API in `apps/frontend/src/api/endpoints/construction/budget.ts`
- New hook in `apps/frontend/src/hooks/construction/useConstructionBudget.ts`
- New component: `apps/frontend/src/components/construction/BudgetBreakdown.tsx`
  - Summary cards: Toplam Planlanan / Toplam Gerçekleşen / Fark / Kullanım %
  - Category table: icon per category, planned, actual, variance, progress bar
  - Color: green <80%, amber 80–100%, red >100% per line
  - Add/edit/delete line items (manager/admin)
  - Stacked bar chart (Recharts) — planned vs actual per category
- Replace simple budget bar in "Genel Bakış" tab with `BudgetBreakdown` component
- Update `ConstructionAnalyticsPage.tsx` — add budget utilization by category chart

**Seed data**: 5–6 budget lines per project with realistic planned/actual amounts

---

## Phase 22 — Safety Incident Log / Güvenlik Olayları (new model + migration)

**Why**: Construction is high-risk. Safety incidents (injuries, near-misses, property damage) need formal tracking separate from the issues log. This is an OSHA/legal requirement in most jurisdictions.

**22a. Backend**
- New enum `IncidentType`: `near_miss`, `minor_injury`, `major_injury`, `property_damage`, `environmental`, `fire`, `other`
- New enum `IncidentStatus`: `reported`, `under_investigation`, `corrective_action_pending`, `closed`
- New model: `apps/backend/app/models/construction/safety_incident.py`
  - Fields: id, project_id (FK cascade), incident_type, title, description (Text), location_on_site (nullable), incident_date (Date), injured_person_name (nullable), time_lost_days (Integer nullable), root_cause (Text, nullable), corrective_actions (Text, nullable), status, reported_by (FK users, joinedload), closed_at (nullable), created_at
- Register in `apps/backend/app/db/all_models.py`
- Generate migration: `make dev-alembic-rev m="add construction safety incidents"`
- New schema: `apps/backend/app/schemas/construction/safety_incident.py`
- New repo: `apps/backend/app/repositories/construction/safety_incident_repository.py` — get_by_project (paginated), get_open_count, create, update, delete
- New service: `apps/backend/app/services/construction/safety_incident_service.py`
  - On create: if type is major_injury → notify all managers/admins immediately
  - Track Days Since Last Incident (DSLI) — computed from most recent incident date
- New route: `apps/backend/app/api/routes/construction/safety.py`
  - `GET /{project_id}/safety` (CurrentUser, paginated)
  - `GET /{project_id}/safety/stats` (CurrentUser) — DSLI, open count, by-type breakdown
  - `POST /{project_id}/safety` (CurrentUser — anyone can report)
  - `PATCH /{project_id}/safety/{incident_id}` (ManagerOrAdmin)
  - `DELETE /{project_id}/safety/{incident_id}` (ManagerOrAdmin)
- Add to `apps/backend/app/api/routes/construction/__init__.py`

**22b. Frontend**
- Add `ConstructionSafetyIncident`, `IncidentType`, `IncidentStatus` to `types/index.ts`
- New API in `apps/frontend/src/api/endpoints/construction/safety.ts`
- New hook in `apps/frontend/src/hooks/construction/useConstructionSafety.ts`
- New component: `apps/frontend/src/components/construction/SafetyLog.tsx`
  - Banner at top: "X Gündür Kazasız" (Days Since Last Incident) — green if >30d, amber 1–30d, red if 0
  - List of incidents: type badge, title, date, status chip, reporter
  - Red badge on tab if any open major_injury incidents
  - Add/edit/close (manager/admin), report button for all users
- Add "Güvenlik" tab to `ConstructionProjectPage.tsx`
- Add DSLI stat card to `ConstructionStatsPanel.tsx` (cross-project: portfolio-wide days since last incident)
- Update health indicator (Phase 17) to include safety dimension: any open major_injury → red

**Seed data**: 1–2 safety incidents per project (mostly near_miss/minor_injury, one closed, one open)

---

## Phase 23 — Invoice & Payment Tracking / Fatura Takibi (new model + migration)

**Why**: Subcontractors and suppliers send invoices that need formal tracking — received date, amount, due date, payment status. Links to subcontractors and shipments for a complete financial picture.

**23a. Backend**
- New enum `InvoiceStatus`: `received`, `under_review`, `approved`, `paid`, `disputed`, `cancelled`
- New model: `apps/backend/app/models/construction/invoice.py`
  - Fields: id, project_id (FK cascade), invoice_number, subcontractor_id (FK construction_subcontractors, nullable), shipment_id (FK construction_shipments, nullable), description, amount (Numeric 14,2), tax_amount (Numeric 14,2, default 0), total_amount (Numeric 14,2 — computed), status, invoice_date (Date), due_date (Date, nullable), paid_date (Date, nullable), paid_by (FK users, nullable), notes (Text, nullable), created_at
- Register in `apps/backend/app/db/all_models.py`
- Generate migration: `make dev-alembic-rev m="add construction invoices"`
- New schema: `apps/backend/app/schemas/construction/invoice.py` — includes subcontractor name, total_amount computed
- New repo: `apps/backend/app/repositories/construction/invoice_repository.py` — get_by_project (paginated, filterable by status), get_overdue (due_date < today and status not paid), create, update, delete
- New service: `apps/backend/app/services/construction/invoice_service.py`
  - On mark_paid: set paid_date + paid_by; notify accountant-role users
  - On create with subcontractor_id: auto-update BudgetLine actual for subcontractors category
- New route: `apps/backend/app/api/routes/construction/invoices.py`
  - `GET /{project_id}/invoices` (CurrentUser, paginated, filter by status)
  - `GET /invoices/overdue` (ManagerOrAdmin) — cross-project overdue invoices
  - `POST /{project_id}/invoices` (ManagerOrAdmin)
  - `PATCH /{project_id}/invoices/{invoice_id}` (ManagerOrAdmin)
  - `POST /{project_id}/invoices/{invoice_id}/pay` (ManagerOrAdmin) — mark as paid
  - `DELETE /{project_id}/invoices/{invoice_id}` (ManagerOrAdmin)
- Add to `apps/backend/app/api/routes/construction/__init__.py`

**23b. Frontend**
- Add `ConstructionInvoice`, `InvoiceStatus` to `types/index.ts`
- New API in `apps/frontend/src/api/endpoints/construction/invoices.ts`
- New hook in `apps/frontend/src/hooks/construction/useConstructionInvoices.ts`
- New component: `apps/frontend/src/components/construction/InvoiceList.tsx`
  - Table: invoice #, subcontractor/supplier, description, amount, tax, total, due date, status
  - Status chip: received=blue, under_review=orange, approved=teal, paid=green, disputed=red, cancelled=grey
  - Red overdue indicator if due_date passed and not paid
  - "Ödendi" quick action button on approved rows (manager/admin)
  - Summary row: total received, total paid, total outstanding
- Add "Faturalar" tab to `ConstructionProjectPage.tsx`
- Add overdue invoice count badge to `ConstructionStatsPanel.tsx` (cross-project)

**Seed data**: 2–3 invoices per project (mix of statuses, some linked to subcontractors)

---

## Phase 24 — Punch List / Teslim Listesi (new model + migration)

**Why**: Before a construction project is handed over to the client, all defects and incomplete items are catalogued in a punch list (snagging list). Items are assigned to subcontractors to fix with target close dates.

**24a. Backend**
- New enum `PunchListStatus`: `open`, `in_progress`, `completed`, `verified`, `rejected`
- New model: `apps/backend/app/models/construction/punch_list_item.py`
  - Fields: id, project_id (FK cascade), title, description (Text, nullable), location_on_site (nullable), subcontractor_id (FK nullable), assigned_to (FK users, nullable), status, due_date (Date, nullable), completed_date (Date, nullable), verified_by (FK users, nullable, joinedload), photo_key (S3 key, nullable), created_by (FK users), created_at
- Register in `apps/backend/app/db/all_models.py`
- Generate migration: `make dev-alembic-rev m="add construction punch list"`
- New schema: `apps/backend/app/schemas/construction/punch_list.py`
- New repo: `apps/backend/app/repositories/construction/punch_list_repository.py` — get_by_project (filter by status), get_open_count, create, update, delete
- New service: `apps/backend/app/services/construction/punch_list_service.py`
  - `verify_item` — sets status=verified, verified_by, date; only ManagerOrAdmin
  - Notify assigned user when item created/updated
- New route: `apps/backend/app/api/routes/construction/punch_list.py`
  - `GET /{project_id}/punch-list` (CurrentUser, filter by status)
  - `POST /{project_id}/punch-list` (ManagerOrAdmin)
  - `PATCH /{project_id}/punch-list/{item_id}` (ManagerOrAdmin or assigned user for status)
  - `POST /{project_id}/punch-list/{item_id}/verify` (ManagerOrAdmin)
  - `DELETE /{project_id}/punch-list/{item_id}` (ManagerOrAdmin)
- Add to `apps/backend/app/api/routes/construction/__init__.py`

**24b. Frontend**
- Add `PunchListItem`, `PunchListStatus` to `types/index.ts`
- New API in `apps/frontend/src/api/endpoints/construction/punchList.ts`
- New hook in `apps/frontend/src/hooks/construction/useConstructionPunchList.ts`
- New component: `apps/frontend/src/components/construction/PunchList.tsx`
  - Kanban-style or list view: Open / In Progress / Completed / Verified columns
  - Each item: title, location, subcontractor, assigned user, due date, photo thumbnail if present
  - Progress summary: "X/Y tamamlandı" with percentage bar
  - Overdue items highlighted in red
  - "Doğrula" button (manager/admin) on completed items
  - Add item button with photo upload option
- Add "Teslim Listesi" tab to `ConstructionProjectPage.tsx` (visible when project status is `active` or `completed`)
- Add open punch list count to `ProjectHealthCard.tsx` as fourth health dimension

**Seed data**: 3–5 punch list items per project in `completed` or `active` status projects

---

## Phase 25 — RFI Tracker / Bilgi Talepleri (new model + migration)

**Why**: RFI (Request for Information) is a formal communication mechanism in construction to ask design consultants (architects, engineers) for clarification. Unanswered RFIs block work and cause delays — they need a status-tracked log.

**25a. Backend**
- New enum `RFIStatus`: `draft`, `submitted`, `under_review`, `answered`, `closed`
- New enum `RFIPriority`: `low`, `normal`, `high`, `urgent`
- New model: `apps/backend/app/models/construction/rfi.py`
  - Fields: id, project_id (FK cascade), rfi_number (String, auto-incremented per project like RFI-001), subject, question (Text), response (Text, nullable), status, priority, submitted_to (String — name/company of design consultant), submitted_date (Date, nullable), response_date (Date, nullable), due_date (Date, nullable), submitted_by (FK users, joinedload), answered_by_name (String, nullable), created_at
- Register in `apps/backend/app/db/all_models.py`
- Generate migration: `make dev-alembic-rev m="add construction rfis"`
- New schema: `apps/backend/app/schemas/construction/rfi.py`
- New repo: `apps/backend/app/repositories/construction/rfi_repository.py` — get_by_project (paginated), get_open (for dashboard), next_rfi_number (count+1), create, update, delete
- New service: `apps/backend/app/services/construction/rfi_service.py` — auto-assign rfi_number on create, notify on overdue
- New route: `apps/backend/app/api/routes/construction/rfis.py`
  - `GET /{project_id}/rfis` (CurrentUser, paginated)
  - `POST /{project_id}/rfis` (CurrentUser)
  - `PATCH /{project_id}/rfis/{rfi_id}` (ManagerOrAdmin — add response, change status)
  - `DELETE /{project_id}/rfis/{rfi_id}` (ManagerOrAdmin)
- Add to `apps/backend/app/api/routes/construction/__init__.py`

**25b. Frontend**
- Add `ConstructionRFI`, `RFIStatus`, `RFIPriority` to `types/index.ts`
- New API in `apps/frontend/src/api/endpoints/construction/rfis.ts`
- New hook in `apps/frontend/src/hooks/construction/useConstructionRFIs.ts`
- New component: `apps/frontend/src/components/construction/RFIList.tsx`
  - List: RFI number badge, subject, priority chip, submitted to, status, days open/response time
  - Expand row to show full question + response inline
  - Overdue badge if due_date passed and not answered
  - "Yanıt Ekle" button on submitted/under_review items (manager/admin)
  - Open RFI count badge on tab
- Add "Bilgi Talepleri" tab to `ConstructionProjectPage.tsx`

**Seed data**: 2 RFIs per project (one answered, one open)

---

## Phase 26 — Meeting Minutes / Toplantı Tutanakları (new model + migration)

**Why**: Site meetings happen weekly. Decisions and action items from meetings need to be recorded with owners and due dates to ensure accountability and a traceable decision log.

**26a. Backend**
- New model: `apps/backend/app/models/construction/meeting.py`
  - Fields: id, project_id (FK cascade), title, meeting_date (Date), location (nullable — "Site Office", "Online"), attendees (Text — comma-separated names or JSON), agenda (Text, nullable), summary (Text), decisions (Text, nullable), created_by (FK users, joinedload), created_at
- New model: `apps/backend/app/models/construction/meeting_action.py`
  - Fields: id, meeting_id (FK cascade), description, assigned_to_name (String), due_date (Date, nullable), completed (Boolean default False), created_at
- Register both in `apps/backend/app/db/all_models.py`
- Generate migration: `make dev-alembic-rev m="add construction meetings"`
- New schemas in `apps/backend/app/schemas/construction/meeting.py` — MeetingCreate, MeetingResponse (includes actions), ActionCreate, ActionResponse
- New repo: `apps/backend/app/repositories/construction/meeting_repository.py` — get_by_project (paginated desc), create with actions, update action status
- New service: `apps/backend/app/services/construction/meeting_service.py`
- New route: `apps/backend/app/api/routes/construction/meetings.py`
  - `GET /{project_id}/meetings` (CurrentUser, paginated)
  - `POST /{project_id}/meetings` (ManagerOrAdmin — with nested actions)
  - `PATCH /{project_id}/meetings/{meeting_id}` (ManagerOrAdmin)
  - `PATCH /{project_id}/meetings/{meeting_id}/actions/{action_id}` (CurrentUser — toggle completed)
  - `DELETE /{project_id}/meetings/{meeting_id}` (ManagerOrAdmin)
- Add to `apps/backend/app/api/routes/construction/__init__.py`

**26b. Frontend**
- Add `ConstructionMeeting`, `MeetingAction` to `types/index.ts`
- New API in `apps/frontend/src/api/endpoints/construction/meetings.ts`
- New hook in `apps/frontend/src/hooks/construction/useConstructionMeetings.ts`
- New component: `apps/frontend/src/components/construction/MeetingMinutes.tsx`
  - Timeline list of meetings: date, title, location, attendee count
  - Expand each meeting to show summary, decisions, and action items
  - Action item checklist with owner and due date — checkbox toggle for all users
  - Overdue uncompleted actions highlighted
  - "Yeni Toplantı" button → dialog with title, date, attendees textarea, agenda, summary, decisions, + dynamic action items list
- Add "Toplantılar" tab to `ConstructionProjectPage.tsx`

**Seed data**: 1–2 meetings per project with 2–3 action items each

---

## Phase 27 — Equipment Register / Ekipman Kaydı (new model + migration)

**Why**: Construction sites have heavy equipment (cranes, excavators, concrete pumps) that are rented or owned. Tracking what's on site, rental periods, and daily costs enables equipment cost control.

**27a. Backend**
- New enum `EquipmentStatus`: `on_site`, `off_site`, `under_maintenance`, `returned`
- New model: `apps/backend/app/models/construction/equipment.py`
  - Fields: id, project_id (FK cascade), name, equipment_type (String — "Tower Crane", "Excavator", etc.), serial_number (nullable), supplier_company (nullable), status, arrival_date (Date), departure_date (Date, nullable), daily_cost (Numeric 10,2, nullable), total_cost (Numeric 14,2, nullable — computed or manual), notes (Text, nullable), created_at
- Register in `apps/backend/app/db/all_models.py`
- Generate migration: `make dev-alembic-rev m="add construction equipment"`
- New schema: `apps/backend/app/schemas/construction/equipment.py` — includes computed days_on_site, estimated_total_cost
- New repo: `apps/backend/app/repositories/construction/equipment_repository.py`
- New service: `apps/backend/app/services/construction/equipment_service.py` — compute total_cost from daily_cost × days_on_site; update BudgetLine actual for equipment category
- New route: `apps/backend/app/api/routes/construction/equipment.py`
  - `GET /{project_id}/equipment` (CurrentUser)
  - `POST /{project_id}/equipment` (ManagerOrAdmin)
  - `PATCH /{project_id}/equipment/{equipment_id}` (ManagerOrAdmin)
  - `DELETE /{project_id}/equipment/{equipment_id}` (ManagerOrAdmin)
- Add to `apps/backend/app/api/routes/construction/__init__.py`

**27b. Frontend**
- Add `ConstructionEquipment`, `EquipmentStatus` to `types/index.ts`
- New API in `apps/frontend/src/api/endpoints/construction/equipment.ts`
- New hook in `apps/frontend/src/hooks/construction/useConstructionEquipment.ts`
- New component: `apps/frontend/src/components/construction/EquipmentRegister.tsx`
  - Table: name, type, supplier, status chip, arrival, departure, daily cost, total cost, days on site
  - Status: on_site=green, off_site=grey, under_maintenance=orange, returned=blue
  - "Ekipman Ekle" button (manager/admin)
  - Summary: currently on-site count, total equipment cost to date
- Add "Ekipman" tab to `ConstructionProjectPage.tsx`

**Seed data**: 2–3 equipment entries per active project (crane, excavator, etc.)

---

## Phase 28 — S-Curve Progress Chart (frontend only, new analytics chart)

**Why**: The S-curve (planned vs actual progress over time) is the single most important visualization in construction project management. It shows whether the project is ahead or behind schedule at any point in time.

**28a. Backend**
- New endpoint added to `apps/backend/app/api/routes/construction/projects.py`:
  - `GET /{project_id}/progress-history` (CurrentUser)
  - Returns weekly snapshots: week_start_date, planned_pct (linear interpolation between start/end date), actual_pct (from ConstructionAuditLog `progress_updated` entries)
  - If insufficient audit data, return current progress_pct as single point
- New endpoint in `apps/backend/app/api/routes/construction/analytics.py`:
  - `GET /analytics/portfolio-scurve` — portfolio-level S-curve across all projects (normalized 0–100% timeline)

**28b. Frontend**
- New component: `apps/frontend/src/components/construction/SCurveChart.tsx`
  - Recharts `ComposedChart` with two lines: "Planlanan" (blue dashed) and "Gerçekleşen" (green solid)
  - X-axis: weeks/months, Y-axis: 0–100%
  - Shaded area between planned and actual (red if behind, green if ahead)
  - Today marker as vertical reference line
- Add `SCurveChart` as a new card in `ConstructionProjectPage.tsx` "Genel Bakış" tab (below health card)
- Add portfolio S-curve to `ConstructionAnalyticsPage.tsx` as a new section

---

## New Files Summary

### Backend (new files)
| File | Purpose |
|------|---------|
| `models/construction/budget_line.py` | Budget category breakdown |
| `models/construction/safety_incident.py` | Safety incident log |
| `models/construction/invoice.py` | Invoice & payment tracking |
| `models/construction/punch_list_item.py` | Pre-handover defect list |
| `models/construction/rfi.py` | Request for Information |
| `models/construction/meeting.py` | Meeting minutes |
| `models/construction/meeting_action.py` | Meeting action items |
| `models/construction/equipment.py` | Equipment register |
| `schemas/construction/budget_line.py` | Budget schemas |
| `schemas/construction/safety_incident.py` | Safety schemas |
| `schemas/construction/invoice.py` | Invoice schemas |
| `schemas/construction/punch_list.py` | Punch list schemas |
| `schemas/construction/rfi.py` | RFI schemas |
| `schemas/construction/meeting.py` | Meeting + action schemas |
| `schemas/construction/equipment.py` | Equipment schemas |
| `repositories/construction/budget_line_repository.py` | Budget data access |
| `repositories/construction/safety_incident_repository.py` | Safety data access |
| `repositories/construction/invoice_repository.py` | Invoice data access |
| `repositories/construction/punch_list_repository.py` | Punch list data access |
| `repositories/construction/rfi_repository.py` | RFI data access |
| `repositories/construction/meeting_repository.py` | Meeting + actions data access |
| `repositories/construction/equipment_repository.py` | Equipment data access |
| `services/construction/budget_line_service.py` | Budget logic |
| `services/construction/safety_incident_service.py` | Safety + notifications |
| `services/construction/invoice_service.py` | Invoice + payment logic |
| `services/construction/punch_list_service.py` | Punch list + verification |
| `services/construction/rfi_service.py` | RFI + auto-numbering |
| `services/construction/meeting_service.py` | Meeting + action logic |
| `services/construction/equipment_service.py` | Equipment + cost sync |
| `api/routes/construction/budget.py` | Budget line CRUD |
| `api/routes/construction/safety.py` | Safety CRUD + stats |
| `api/routes/construction/invoices.py` | Invoice CRUD + pay |
| `api/routes/construction/punch_list.py` | Punch list CRUD + verify |
| `api/routes/construction/rfis.py` | RFI CRUD |
| `api/routes/construction/meetings.py` | Meetings + actions |
| `api/routes/construction/equipment.py` | Equipment CRUD |

### Migrations (8 total)
1. `add_construction_budget_lines`
2. `add_construction_safety_incidents`
3. `add_construction_invoices`
4. `add_construction_punch_list`
5. `add_construction_rfis`
6. `add_construction_meetings`
7. `add_construction_equipment`
8. (No migration for Phase 28 — endpoints added to existing routes)

### Frontend (new files)
| File | Purpose |
|------|---------|
| `components/construction/BudgetBreakdown.tsx` | Budget category cards + chart |
| `components/construction/SafetyLog.tsx` | Safety incidents + DSLI banner |
| `components/construction/InvoiceList.tsx` | Invoice table + pay action |
| `components/construction/PunchList.tsx` | Kanban/list pre-handover defects |
| `components/construction/RFIList.tsx` | RFI list + inline response |
| `components/construction/MeetingMinutes.tsx` | Meeting timeline + action checklist |
| `components/construction/EquipmentRegister.tsx` | Equipment table |
| `components/construction/SCurveChart.tsx` | Planned vs actual progress |
| `api/endpoints/construction/budget.ts` | Budget API |
| `api/endpoints/construction/safety.ts` | Safety API |
| `api/endpoints/construction/invoices.ts` | Invoice API |
| `api/endpoints/construction/punchList.ts` | Punch list API |
| `api/endpoints/construction/rfis.ts` | RFI API |
| `api/endpoints/construction/meetings.ts` | Meetings API |
| `api/endpoints/construction/equipment.ts` | Equipment API |
| `hooks/construction/useConstructionBudget.ts` | Budget hooks |
| `hooks/construction/useConstructionSafety.ts` | Safety hooks |
| `hooks/construction/useConstructionInvoices.ts` | Invoice hooks |
| `hooks/construction/useConstructionPunchList.ts` | Punch list hooks |
| `hooks/construction/useConstructionRFIs.ts` | RFI hooks |
| `hooks/construction/useConstructionMeetings.ts` | Meeting hooks |
| `hooks/construction/useConstructionEquipment.ts` | Equipment hooks |

### Modified Files
- `types/index.ts` — all new types
- `ConstructionProjectPage.tsx` — add 7 new tabs: Bütçe Kalemleri, Güvenlik, Faturalar, Teslim Listesi, Bilgi Talepleri, Toplantılar, Ekipman; SCurveChart in Genel Bakış
- `ConstructionStatsPanel.tsx` — DSLI card, overdue invoice count
- `ProjectHealthCard.tsx` — add safety dimension (4th RAG indicator)
- `ConstructionAnalyticsPage.tsx` — budget by category chart, portfolio S-curve
- `db/all_models.py` — all new model imports
- `api/routes/construction/__init__.py` — all new routers
- `api/routes/construction/projects.py` — progress-history endpoint
- `api/routes/construction/analytics.py` — portfolio-scurve endpoint

## Verification
1. Migrations: `docker exec <backend> .venv/bin/alembic upgrade head`
2. Seed: `docker exec <backend> PYTHONPATH=/app .venv/bin/python scripts/seed_data.py`
3. Project "Genel Bakış" tab: budget breakdown + S-curve visible
4. "Güvenlik" tab: DSLI banner + incidents list
5. "Faturalar" tab: invoice table with "Ödendi" button
6. "Teslim Listesi" tab: kanban/list with verified items
7. "Bilgi Talepleri" tab: RFI-001, RFI-002 from seed
8. "Toplantılar" tab: meeting with action item checkboxes
9. "Ekipman" tab: crane/excavator entries
10. Analytics page: budget utilization by category chart visible
