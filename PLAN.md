# Construction Site — Full Feature Implementation Plan

## Context
The construction management side has basic project/material/milestone CRUD working. The goal is to bring it to full feature parity with the procurement side (27 endpoints, 7 entities, AI chat, analytics, favorites, audit log) and add construction-specific capabilities across 18 phases: portfolio stats, project type classification, analytics charts, issue tracking, Gantt timeline, site photos, project comments, daily site logs, subcontractor management, permit tracking, change orders, audit log, document attachments, project favorites, construction AI chat, CSV export, health indicators, and construction notifications.

---

## Build Order

### Phase 1 — Frontend Only (no migration, immediate)

**1a. Construction nav links**
- File: `apps/frontend/src/components/layout/AppHeader.tsx`
- Add `insaatNavLinks`: Projeler → `/construction`, Analitik → `/construction/analytics`

**1b. Portfolio stats panel**
- New file: `apps/frontend/src/components/construction/ConstructionStatsPanel.tsx`
- Computed from `useProjects` data (no new endpoint needed initially)
- Cards: Toplam Proje, Aktif, Tamamlanan, Toplam Bütçe (sum of budgets), Ort. İlerleme
- Place at top of `ConstructionDashboardPage`

**1c. Budget vs. actual cost in project detail**
- Inside `ConstructionProjectPage.tsx` "Genel Bakış" tab
- Compute: `actual_cost = Σ (quantity_used × unit_cost)`, `planned_cost = Σ (quantity_planned × unit_cost)`
- Show budget bar: actual / budget — green <80%, amber 80–100%, red over
- Uses `useMaterials(projectId)` which already exists

**1d. Milestone overdue alerts**
- Inside `MilestonesTimeline.tsx`
- Yellow warning chip on any milestone where `due_date < today` and status !== completed
- Red chip if `due_date < today - 14 days`

---

### Phase 2 — Project Type Classification (migration required)

**2a. Backend**
- New enum `ConstructionProjectType`: `shopping_mall`, `residential`, `office`, `mixed_use`, `hotel`, `industrial`, `other`
- Add `project_type` column to `ConstructionProject` model (nullable, default: other)
- Generate migration: `make dev-alembic-rev m="add construction project type"`
- Update `ProjectCreate`, `ProjectUpdate`, `ProjectResponse` schemas
- Update `project_service.py` (no logic change, just schema pass-through)

**2b. Frontend**
- Add `project_type` to `ConstructionProject` type in `types/index.ts`
- Add type dropdown to `ProjectForm.tsx`
- Add type badge to `ProjectCard.tsx`
- Add type filter chips to `ConstructionDashboardPage.tsx` (alongside status chips)

Files touched:
- `apps/backend/app/models/construction/project.py`
- `apps/backend/app/schemas/construction/project.py`
- `apps/frontend/src/types/index.ts`
- `apps/frontend/src/components/construction/ProjectForm.tsx`
- `apps/frontend/src/components/construction/ProjectCard.tsx`
- `apps/frontend/src/pages/construction/ConstructionDashboardPage.tsx`

---

### Phase 3 — Construction Analytics Page (new backend endpoint + new page)

**3a. Backend**
- New file: `apps/backend/app/api/routes/construction/analytics.py`
- New schemas in `apps/backend/app/schemas/construction/analytics.py`
- Endpoint: `GET /api/construction/analytics` (CurrentUser auth)
- Returns:
  - `projects_by_status`: count per status
  - `projects_by_type`: count per type
  - `budget_by_project`: list of {name, budget, actual_cost}
  - `material_cost_by_type`: aggregated spend per material_type
  - `milestone_status_counts`: count per task status
  - `total_budget`, `total_actual_cost`, `avg_progress`
- Register router in `apps/backend/app/api/routes/construction/__init__.py`

**3b. Frontend**
- New file: `apps/frontend/src/api/endpoints/construction/analytics.ts`
- New hook: `apps/frontend/src/hooks/construction/useConstructionAnalytics.ts`
- New page: `apps/frontend/src/pages/construction/ConstructionAnalyticsPage.tsx`
  - Status donut chart (Recharts PieChart)
  - Type distribution bar chart
  - Budget vs. actual per project (BarChart — grouped)
  - Material cost by type (PieChart)
  - Milestone status breakdown (BarChart)
- Add route `/construction/analytics` in `App.tsx`

---

### Phase 4 — Issue / Problem Log (new model + migration + full CRUD)

**4a. Backend**
- New enum `ConstructionIssueSeverity`: `low`, `medium`, `high`, `critical`
- New enum `ConstructionIssueStatus`: `open`, `in_progress`, `resolved`
- New model: `apps/backend/app/models/construction/issue.py`
  - Fields: id, project_id (FK cascade), title, description, severity, status, reported_by (FK users), created_at
- Register in `apps/backend/app/db/all_models.py`
- Generate migration: `make dev-alembic-rev m="add construction issues"`
- New schema: `apps/backend/app/schemas/construction/issue.py`
- New repo: `apps/backend/app/repositories/construction/issue_repository.py`
- New service: `apps/backend/app/services/construction/issue_service.py`
- New route: `apps/backend/app/api/routes/construction/issues.py`
  - `GET /{project_id}/issues` (CurrentUser)
  - `POST /{project_id}/issues` (CurrentUser — anyone can report)
  - `PATCH /{project_id}/issues/{issue_id}` (ManagerOrAdmin)
  - `DELETE /{project_id}/issues/{issue_id}` (ManagerOrAdmin)
- Add to `apps/backend/app/api/routes/construction/__init__.py`

**4b. Frontend**
- Add issue types to `types/index.ts`
- New API functions in `apps/frontend/src/api/endpoints/construction/issues.ts`
- New hooks in `apps/frontend/src/hooks/construction/useConstructionIssues.ts`
- New component: `apps/frontend/src/components/construction/IssuesLog.tsx`
  - List of issues with severity chip (red/orange/yellow/blue), status, title, reporter, date
  - Add issue FAB/button (all authenticated users)
  - Edit/resolve/delete for manager+admin
  - Open issue count badge on the tab
- Add "Sorunlar" tab to `ConstructionProjectPage.tsx`

---

### Phase 5 — Gantt Timeline View (frontend only, new page section)

**5a. Frontend**
- Add view toggle to `ConstructionDashboardPage.tsx`: Cards | Gantt
- New component: `apps/frontend/src/components/construction/GanttTimeline.tsx`
  - Horizontal scrollable chart
  - Y-axis: project names
  - X-axis: calendar (months)
  - Each project = colored bar from `start_date` to `end_date`
  - Color = status (planning=blue, active=green, on_hold=amber, completed=grey, cancelled=red)
  - Progress overlay (darker fill up to `progress_pct` of the bar)
  - Click bar → navigate to project detail
  - Uses Recharts `ComposedChart` or custom SVG
- Persist view preference in localStorage (`construction_view_preference`)

---

### Phase 6 — Site Progress Photos (new model + S3 + migration)

**6a. Backend**
- New model: `apps/backend/app/models/construction/photo.py`
  - Fields: id, project_id (FK cascade), uploaded_by (FK users), file_key (S3), caption, created_at
- Register in `apps/backend/app/db/all_models.py`
- Generate migration: `make dev-alembic-rev m="add construction photos"`
- New schema: `apps/backend/app/schemas/construction/photo.py`
- New repo: `apps/backend/app/repositories/construction/photo_repository.py`
- New service: `apps/backend/app/services/construction/photo_service.py` — reuse `StorageService` pattern from requirement images
- New route: `apps/backend/app/api/routes/construction/photos.py`
  - `GET /{project_id}/photos` (CurrentUser)
  - `POST /{project_id}/photos` (ManagerOrAdmin) — multipart file upload
  - `DELETE /{project_id}/photos/{photo_id}` (ManagerOrAdmin)
- Add to `apps/backend/app/api/routes/construction/__init__.py`

**6b. Frontend**
- Add photo types to `types/index.ts`
- New API in `apps/frontend/src/api/endpoints/construction/photos.ts`
- New hooks in `apps/frontend/src/hooks/construction/useConstructionPhotos.ts`
- New component: `apps/frontend/src/components/construction/PhotoGallery.tsx`
  - Grid of thumbnail images, click to open lightbox
  - Upload button (manager+admin) — file input, multipart POST
  - Delete button on hover
- Add "Fotoğraflar" tab to `ConstructionProjectPage.tsx`

---

### Phase 7 — Project Comments (mirrors procurement RequirementComment)

**7a. Backend**
- New model: `apps/backend/app/models/construction/comment.py`
  - Fields: id, project_id (FK cascade), user_id (FK users, joinedload), content, created_at
- Register in `apps/backend/app/db/all_models.py`
- Generate migration: `make dev-alembic-rev m="add construction comments"`
- New schema: `apps/backend/app/schemas/construction/comment.py` — CommentCreate, CommentResponse (includes user.full_name)
- New repo: `apps/backend/app/repositories/construction/comment_repository.py` — get_by_project (ordered by created_at desc), create, delete
- New service: `apps/backend/app/services/construction/comment_service.py`
- New route: `apps/backend/app/api/routes/construction/comments.py`
  - `GET /{project_id}/comments` (CurrentUser)
  - `POST /{project_id}/comments` (CurrentUser)
  - `DELETE /{project_id}/comments/{comment_id}` (owner or ManagerOrAdmin)
- Add to `apps/backend/app/api/routes/construction/__init__.py`

**7b. Frontend**
- Add `ConstructionComment` type to `types/index.ts`
- New API in `apps/frontend/src/api/endpoints/construction/comments.ts`
- New hook in `apps/frontend/src/hooks/construction/useConstructionComments.ts`
- New component: `apps/frontend/src/components/construction/ProjectComments.tsx`
  - Reverse-chronological list with avatar, name, date, content
  - Textarea + post button at bottom (all authenticated users)
  - Delete button for own comment or manager/admin
- Add "Yorumlar" tab to `ConstructionProjectPage.tsx`

---

### Phase 8 — Daily Site Log / Şantiye Günlüğü (new model + migration)

**8a. Backend**
- New enum `WeatherCondition`: `sunny`, `cloudy`, `rainy`, `stormy`, `snowy`
- New model: `apps/backend/app/models/construction/daily_log.py`
  - Fields: id, project_id (FK cascade), log_date (Date, unique per project), weather, temperature_c (Integer, nullable), worker_count (Integer), work_summary (Text), equipment_on_site (Text, nullable), visitors (Text, nullable), recorded_by (FK users), created_at
  - Unique constraint: (project_id, log_date)
- Register in `apps/backend/app/db/all_models.py`
- Generate migration: `make dev-alembic-rev m="add construction daily logs"`
- New schema: `apps/backend/app/schemas/construction/daily_log.py`
- New repo: `apps/backend/app/repositories/construction/daily_log_repository.py` — get_by_project (paginated, most recent first), get_by_date, create, update, delete
- New service: `apps/backend/app/services/construction/daily_log_service.py` — enforce uniqueness per date
- New route: `apps/backend/app/api/routes/construction/daily_logs.py`
  - `GET /{project_id}/daily-logs` (CurrentUser, paginated)
  - `POST /{project_id}/daily-logs` (ManagerOrAdmin)
  - `PATCH /{project_id}/daily-logs/{log_id}` (ManagerOrAdmin)
  - `DELETE /{project_id}/daily-logs/{log_id}` (ManagerOrAdmin)
- Add to `apps/backend/app/api/routes/construction/__init__.py`

**8b. Frontend**
- Add `ConstructionDailyLog`, `WeatherCondition` types to `types/index.ts`
- New API in `apps/frontend/src/api/endpoints/construction/dailyLogs.ts`
- New hook in `apps/frontend/src/hooks/construction/useConstructionDailyLogs.ts`
- New component: `apps/frontend/src/components/construction/DailyLogList.tsx`
  - Timeline-style list: date header, weather icon, worker count badge, work summary
  - "Yeni Günlük Ekle" button (manager/admin) → dialog form
  - Edit/delete on each entry (manager/admin)
- Add "Günlük" tab to `ConstructionProjectPage.tsx`

---

### Phase 9 — Subcontractor Management (new model + migration)

**9a. Backend**
- New enum `SubcontractorStatus`: `active`, `inactive`, `blacklisted`
- New model: `apps/backend/app/models/construction/subcontractor.py`
  - Fields: id, project_id (FK cascade), company_name, trade (e.g., "Electrical", "Plumbing"), contact_name, contact_phone, contact_email (nullable), contract_value (Numeric 14,2, nullable), status, notes (Text, nullable), created_at
- Register in `apps/backend/app/db/all_models.py`
- Generate migration: `make dev-alembic-rev m="add construction subcontractors"`
- New schema: `apps/backend/app/schemas/construction/subcontractor.py`
- New repo: `apps/backend/app/repositories/construction/subcontractor_repository.py`
- New service: `apps/backend/app/services/construction/subcontractor_service.py`
- New route: `apps/backend/app/api/routes/construction/subcontractors.py`
  - `GET /{project_id}/subcontractors` (CurrentUser)
  - `POST /{project_id}/subcontractors` (ManagerOrAdmin)
  - `PATCH /{project_id}/subcontractors/{sub_id}` (ManagerOrAdmin)
  - `DELETE /{project_id}/subcontractors/{sub_id}` (ManagerOrAdmin)
- Add to `apps/backend/app/api/routes/construction/__init__.py`

**9b. Frontend**
- Add `ConstructionSubcontractor` type to `types/index.ts`
- New API in `apps/frontend/src/api/endpoints/construction/subcontractors.ts`
- New hook in `apps/frontend/src/hooks/construction/useConstructionSubcontractors.ts`
- New component: `apps/frontend/src/components/construction/SubcontractorList.tsx`
  - Table rows: company, trade, contact, contract value, status chip
  - Status chip: active=green, inactive=grey, blacklisted=red
  - Add/edit/delete (manager/admin)
  - Total contracted value summary card above table
- Add "Taşeronlar" tab to `ConstructionProjectPage.tsx`

---

### Phase 10 — Permit Tracker (new model + migration)

**10a. Backend**
- New enum `PermitType`: `construction`, `demolition`, `electrical`, `plumbing`, `fire_safety`, `environmental`, `occupancy`, `other`
- New enum `PermitStatus`: `not_applied`, `applied`, `under_review`, `approved`, `rejected`, `expired`
- New model: `apps/backend/app/models/construction/permit.py`
  - Fields: id, project_id (FK cascade), permit_type, permit_number (nullable), issuing_authority, status, applied_date (Date, nullable), approved_date (Date, nullable), expiry_date (Date, nullable), notes (Text, nullable), created_at
- Register in `apps/backend/app/db/all_models.py`
- Generate migration: `make dev-alembic-rev m="add construction permits"`
- New schema: `apps/backend/app/schemas/construction/permit.py`
- New repo: `apps/backend/app/repositories/construction/permit_repository.py`
- New service: `apps/backend/app/services/construction/permit_service.py`
- New route: `apps/backend/app/api/routes/construction/permits.py`
  - `GET /{project_id}/permits` (CurrentUser)
  - `POST /{project_id}/permits` (ManagerOrAdmin)
  - `PATCH /{project_id}/permits/{permit_id}` (ManagerOrAdmin)
  - `DELETE /{project_id}/permits/{permit_id}` (ManagerOrAdmin)
- Add to `apps/backend/app/api/routes/construction/__init__.py`

**10b. Frontend**
- Add `ConstructionPermit` types to `types/index.ts`
- New API in `apps/frontend/src/api/endpoints/construction/permits.ts`
- New hook in `apps/frontend/src/hooks/construction/useConstructionPermits.ts`
- New component: `apps/frontend/src/components/construction/PermitTracker.tsx`
  - Card-per-permit: type badge, permit number, issuing authority, status chip, expiry date
  - Red badge if expiry within 30 days or already expired
  - Add/edit/delete (manager/admin)
- Add "İzinler" tab to `ConstructionProjectPage.tsx`

---

### Phase 11 — Change Orders / Revize Emirleri (new model + migration)

**11a. Backend**
- New enum `ChangeOrderStatus`: `draft`, `submitted`, `approved`, `rejected`
- New model: `apps/backend/app/models/construction/change_order.py`
  - Fields: id, project_id (FK cascade), title, description (Text), cost_delta (Numeric 14,2 — can be negative), schedule_delta_days (Integer, nullable), status, requested_by (FK users, joinedload), reviewed_by (FK users, nullable, joinedload), created_at, reviewed_at (nullable)
- Register in `apps/backend/app/db/all_models.py`
- Generate migration: `make dev-alembic-rev m="add construction change orders"`
- New schema: `apps/backend/app/schemas/construction/change_order.py` — includes requester/reviewer names
- New repo: `apps/backend/app/repositories/construction/change_order_repository.py`
- New service: `apps/backend/app/services/construction/change_order_service.py`
  - `approve_change_order` — sets status=approved, reviewed_by, reviewed_at; updates project budget by cost_delta
  - `reject_change_order` — sets status=rejected, reviewed_by, reviewed_at
- New route: `apps/backend/app/api/routes/construction/change_orders.py`
  - `GET /{project_id}/change-orders` (CurrentUser)
  - `POST /{project_id}/change-orders` (CurrentUser — anyone can request)
  - `POST /{project_id}/change-orders/{co_id}/approve` (ManagerOrAdmin)
  - `POST /{project_id}/change-orders/{co_id}/reject` (ManagerOrAdmin)
  - `DELETE /{project_id}/change-orders/{co_id}` (ManagerOrAdmin)
- Add to `apps/backend/app/api/routes/construction/__init__.py`

**11b. Frontend**
- Add `ConstructionChangeOrder` types to `types/index.ts`
- New API in `apps/frontend/src/api/endpoints/construction/changeOrders.ts`
- New hook in `apps/frontend/src/hooks/construction/useConstructionChangeOrders.ts`
- New component: `apps/frontend/src/components/construction/ChangeOrderList.tsx`
  - List with status chip, cost delta (+/- formatted), schedule impact, requester, date
  - Approve/Reject buttons for manager/admin on `submitted` orders
  - Total approved cost delta summary card
- Add "Revizyonlar" tab to `ConstructionProjectPage.tsx`

---

### Phase 12 — Project Audit Log (mirrors procurement audit_log)

**12a. Backend**
- New enum `ConstructionAuditAction`: `created`, `status_changed`, `budget_changed`, `progress_updated`, `edited`
- New model: `apps/backend/app/models/construction/audit_log.py`
  - Fields: id, project_id (FK cascade), user_id (FK users, joinedload), action, field_name (nullable), old_value (nullable), new_value (nullable), created_at
- Register in `apps/backend/app/db/all_models.py`
- Generate migration: `make dev-alembic-rev m="add construction audit log"`
- New schema: `apps/backend/app/schemas/construction/audit_log.py`
- New repo: `apps/backend/app/repositories/construction/audit_log_repository.py` — create, get_by_project (last 100, desc)
- Update `apps/backend/app/services/construction/project_service.py` — write audit entries on create/update/status change
- New route endpoint added to `apps/backend/app/api/routes/construction/projects.py`:
  - `GET /{project_id}/audit-log` (ManagerOrAdmin)
- Add to `apps/backend/app/db/all_models.py`

**12b. Frontend**
- Add `ConstructionAuditLog` type to `types/index.ts`
- New API function in `apps/frontend/src/api/endpoints/construction/projects.ts` — `fetchProjectAuditLog`
- Add to hook in `apps/frontend/src/hooks/construction/useConstruction.ts`
- New component: `apps/frontend/src/components/construction/ProjectAuditLog.tsx`
  - Timeline list: action badge, field, old→new values, user, timestamp
- Add "Geçmiş" tab to `ConstructionProjectPage.tsx` (ManagerOrAdmin only, hide tab for others)

---

### Phase 13 — Document Attachments (mirrors requirement_images + S3)

**13a. Backend**
- New model: `apps/backend/app/models/construction/document.py`
  - Fields: id, project_id (FK cascade), uploaded_by (FK users), file_key (S3 key), original_filename, file_size_bytes (Integer), document_type (nullable — e.g. "blueprint", "contract", "inspection"), caption (nullable), created_at
- Register in `apps/backend/app/db/all_models.py`
- Generate migration: `make dev-alembic-rev m="add construction documents"`
- New schema: `apps/backend/app/schemas/construction/document.py`
- New repo: `apps/backend/app/repositories/construction/document_repository.py`
- New service: `apps/backend/app/services/construction/document_service.py` — reuse `StorageService` (same pattern as `ImageService` in procurement)
- New route: `apps/backend/app/api/routes/construction/documents.py`
  - `GET /{project_id}/documents` (CurrentUser) — returns presigned URLs
  - `POST /{project_id}/documents` (ManagerOrAdmin) — multipart upload
  - `DELETE /{project_id}/documents/{doc_id}` (ManagerOrAdmin) — delete from S3 + DB
- Add to `apps/backend/app/api/routes/construction/__init__.py`

**13b. Frontend**
- Add `ConstructionDocument` type to `types/index.ts`
- New API in `apps/frontend/src/api/endpoints/construction/documents.ts`
- New hook in `apps/frontend/src/hooks/construction/useConstructionDocuments.ts`
- New component: `apps/frontend/src/components/construction/DocumentList.tsx`
  - File list: icon by type (PDF/image/other), filename, size, uploader, date, download link
  - Document type filter chips (blueprint/contract/inspection/other)
  - Upload button (manager/admin) — file input, type selector dropdown, caption
  - Delete button (manager/admin)
- Add "Belgeler" tab to `ConstructionProjectPage.tsx`

---

### Phase 14 — Project Favorites (mirrors procurement favorites)

**14a. Backend**
- New model: `apps/backend/app/models/construction/project_favorite.py`
  - Fields: id, user_id (FK users), project_id (FK construction_projects); unique constraint (user_id, project_id)
- Register in `apps/backend/app/db/all_models.py`
- Generate migration: `make dev-alembic-rev m="add construction project favorites"`
- New schema: `apps/backend/app/schemas/construction/project_favorite.py` — FavoriteToggleResponse {is_favorite: bool}
- New repo: `apps/backend/app/repositories/construction/project_favorite_repository.py` — get_by_user, add, remove, get_ids_for_user (batch like procurement)
- New service: `apps/backend/app/services/construction/project_favorite_service.py` — toggle (add if absent, remove if present)
- Update `project_service.py` to accept `current_user_id` and annotate `is_favorite` on `ProjectResponse`
- New route: `apps/backend/app/api/routes/construction/favorites.py`
  - `GET /favorites` (CurrentUser) — returns list of favorited projects
  - `POST /{project_id}/favorite` (CurrentUser) — toggle
- Add to `apps/backend/app/api/routes/construction/__init__.py`

**14b. Frontend**
- Add `is_favorite` to `ConstructionProject` type in `types/index.ts`
- New API in `apps/frontend/src/api/endpoints/construction/favorites.ts`
- New hook in `apps/frontend/src/hooks/construction/useConstructionFavorites.ts`
- Add favorite toggle (bookmark icon) to `ProjectCard.tsx` — filled when favorited
- Add "Favoriler" filter chip to `ConstructionDashboardPage.tsx`
- Add `FavoriteProjectsSection.tsx` at top of dashboard (collapsed by default, shows when user has favorites)

---

### Phase 15 — Construction AI Chat (mirrors procurement ChatWidget)

**15a. Backend**
- New file: `apps/backend/app/api/routes/construction/chat.py`
- New schemas in `apps/backend/app/schemas/construction/chat.py` — ConstructionChatRequest, ConstructionChatResponse
- Reuse agentic loop pattern from `app/chat/` but with construction-scoped tools:
  - `get_construction_projects` — list projects with status/progress/budget
  - `get_project_detail` — milestones, materials, issues, recent log
  - `get_construction_stats` — portfolio summary
  - `get_open_issues` — open/in-progress issues across all or one project
  - `get_overdue_milestones` — milestones past due date
- Turkish system prompt describing the construction management context
- Endpoint: `POST /api/construction/chat` (CurrentUser)
- Add to `apps/backend/app/api/routes/construction/__init__.py`
- Register in `apps/backend/app/main.py`

**15b. Frontend**
- New API in `apps/frontend/src/api/endpoints/construction/chat.ts`
- New component: `apps/frontend/src/components/construction/ConstructionChatWidget.tsx`
  - Same floating FAB + slide-up panel pattern as procurement ChatWidget
  - Scoped to construction data only
  - Title: "İnşaat Asistanı"
- Add `ConstructionChatWidget` to `ConstructionDashboardPage.tsx` and `ConstructionProjectPage.tsx`

---

### Phase 16 — CSV Export

**16a. Backend**
- Add export endpoints to existing routes (no new files needed):
  - `GET /api/construction/export/projects` (ManagerOrAdmin) — CSV of all projects with status, type, budget, actual cost, progress
  - `GET /api/construction/{project_id}/export/materials` (ManagerOrAdmin) — CSV of materials
  - `GET /api/construction/{project_id}/export/milestones` (ManagerOrAdmin) — CSV of milestones
- Use Python `csv` module + `StreamingResponse` with `text/csv` media type
- Add export handlers to `apps/backend/app/api/routes/construction/projects.py` and sub-routes

**16b. Frontend**
- Add export utility in `apps/frontend/src/utils/exportCsv.ts` — trigger download from blob
- Add "CSV İndir" button (manager/admin) to:
  - `ConstructionDashboardPage.tsx` — exports all projects
  - `MaterialsList.tsx` — exports materials for current project
  - `MilestonesTimeline.tsx` — exports milestones for current project

---

### Phase 17 — Project Health Indicator (RAG Status)

**17a. Backend**
- Add computed endpoint: `GET /api/construction/{project_id}/health` (CurrentUser)
- Health score computed from:
  - Budget: >100% = red, 80-100% = amber, <80% = green
  - Schedule: any milestone overdue >14 days = red, overdue 1-14 days = amber
  - Issues: any critical open issue = red, any high open issue = amber
  - Overall: worst of the three dimensions
- Response schema: `HealthResponse { overall, budget_status, schedule_status, issue_status, details: list[str] }`
- Add to `apps/backend/app/api/routes/construction/projects.py`

**17b. Frontend**
- New hook: add `useProjectHealth(projectId)` to `useConstruction.ts`
- New component: `apps/frontend/src/components/construction/ProjectHealthCard.tsx`
  - RAG indicator: large colored circle (red/amber/green) with label
  - Three sub-indicators: Bütçe / Zamanlama / Sorunlar
  - Bullet list of detail strings from backend
- Place `ProjectHealthCard` at top of `ConstructionProjectPage.tsx` "Genel Bakış" tab
- Add small RAG dot to `ProjectCard.tsx` (top-right corner)

---

### Phase 18 — Construction Notifications

**18a. Backend**
- Reuse existing `Notification` model and `notifications` table (already in DB)
- New file: `apps/backend/app/services/construction/notification_service.py`
  - `notify_milestone_overdue(project_id, milestone)` — notify project manager/admin
  - `notify_budget_exceeded(project)` — notify manager/admin when actual_cost > budget
  - `notify_critical_issue(issue, project)` — notify all managers/admins
  - `notify_change_order_submitted(change_order, project)` — notify managers/admins
  - `notify_permit_expiring(permit, project)` — notify managers/admins (within 30 days)
- Hook notifications into:
  - `milestone_service.py` — after update, check for overdue and notify
  - `issue_service.py` — after create, if severity=critical, notify
  - `change_order_service.py` — after submit, notify
  - `photo_service.py` (reuse existing pattern) — no notification needed
- Add background task: `GET /api/construction/check-permits` (AdminOnly, called by cron or manually) — scans permits expiring in 30 days and creates notifications

**18b. Frontend**
- No new frontend work needed — existing `NotificationBell` in `AppHeader.tsx` already shows all notifications
- Ensure construction notification messages are Turkish and descriptive
- Add notification type icons in notification list for construction events (optional enhancement to `NotificationBell`)

---

## Summary of New Files

### Backend
| File | Purpose |
|------|---------|
| `models/construction/issue.py` | Issue model + enums |
| `models/construction/photo.py` | Photo model |
| `models/construction/comment.py` | Comment model |
| `models/construction/daily_log.py` | Daily site log + weather enum |
| `models/construction/subcontractor.py` | Subcontractor model |
| `models/construction/permit.py` | Permit model + enums |
| `models/construction/change_order.py` | Change order model + enum |
| `models/construction/audit_log.py` | Audit log model + action enum |
| `models/construction/document.py` | Document attachment model |
| `models/construction/project_favorite.py` | Project favorites model |
| `schemas/construction/analytics.py` | Analytics response schemas |
| `schemas/construction/issue.py` | Issue schemas |
| `schemas/construction/photo.py` | Photo schemas |
| `schemas/construction/comment.py` | Comment schemas |
| `schemas/construction/daily_log.py` | Daily log schemas |
| `schemas/construction/subcontractor.py` | Subcontractor schemas |
| `schemas/construction/permit.py` | Permit schemas |
| `schemas/construction/change_order.py` | Change order schemas |
| `schemas/construction/audit_log.py` | Audit log schemas |
| `schemas/construction/document.py` | Document schemas |
| `schemas/construction/project_favorite.py` | Favorites schemas |
| `schemas/construction/chat.py` | Chat request/response schemas |
| `repositories/construction/issue_repository.py` | Issue data access |
| `repositories/construction/photo_repository.py` | Photo data access |
| `repositories/construction/comment_repository.py` | Comment data access |
| `repositories/construction/daily_log_repository.py` | Daily log data access |
| `repositories/construction/subcontractor_repository.py` | Subcontractor data access |
| `repositories/construction/permit_repository.py` | Permit data access |
| `repositories/construction/change_order_repository.py` | Change order data access |
| `repositories/construction/audit_log_repository.py` | Audit log data access |
| `repositories/construction/document_repository.py` | Document data access |
| `repositories/construction/project_favorite_repository.py` | Favorites data access |
| `services/construction/issue_service.py` | Issue business logic |
| `services/construction/photo_service.py` | Photo upload/delete |
| `services/construction/comment_service.py` | Comment business logic |
| `services/construction/daily_log_service.py` | Daily log business logic |
| `services/construction/subcontractor_service.py` | Subcontractor business logic |
| `services/construction/permit_service.py` | Permit business logic |
| `services/construction/change_order_service.py` | Change order + approval logic |
| `services/construction/document_service.py` | Document upload/delete (S3) |
| `services/construction/project_favorite_service.py` | Favorites toggle |
| `services/construction/notification_service.py` | Construction event notifications |
| `api/routes/construction/analytics.py` | Analytics endpoint |
| `api/routes/construction/issues.py` | Issue CRUD endpoints |
| `api/routes/construction/photos.py` | Photo upload endpoints |
| `api/routes/construction/comments.py` | Comment CRUD endpoints |
| `api/routes/construction/daily_logs.py` | Daily log endpoints |
| `api/routes/construction/subcontractors.py` | Subcontractor CRUD |
| `api/routes/construction/permits.py` | Permit CRUD |
| `api/routes/construction/change_orders.py` | Change order + approve/reject |
| `api/routes/construction/documents.py` | Document upload/delete |
| `api/routes/construction/favorites.py` | Project favorites toggle |
| `api/routes/construction/chat.py` | Construction AI chat |

### Migrations (autogenerated, 9 total — run in order)
1. `add_construction_project_type`
2. `add_construction_issues`
3. `add_construction_photos`
4. `add_construction_comments`
5. `add_construction_daily_logs`
6. `add_construction_subcontractors`
7. `add_construction_permits`
8. `add_construction_change_orders`
9. `add_construction_audit_log`
10. `add_construction_documents`
11. `add_construction_project_favorites`

### Frontend
| File | Purpose |
|------|---------|
| `components/construction/ConstructionStatsPanel.tsx` | Portfolio stats |
| `components/construction/GanttTimeline.tsx` | Gantt chart view |
| `components/construction/IssuesLog.tsx` | Issue list + forms |
| `components/construction/PhotoGallery.tsx` | Photo grid + upload |
| `components/construction/ProjectComments.tsx` | Comment thread |
| `components/construction/DailyLogList.tsx` | Daily log timeline |
| `components/construction/SubcontractorList.tsx` | Subcontractor table |
| `components/construction/PermitTracker.tsx` | Permit cards |
| `components/construction/ChangeOrderList.tsx` | Change order list + approve/reject |
| `components/construction/ProjectAuditLog.tsx` | Audit log timeline |
| `components/construction/DocumentList.tsx` | Document list + upload |
| `components/construction/FavoriteProjectsSection.tsx` | Favorited projects panel |
| `components/construction/ConstructionChatWidget.tsx` | AI chat floating widget |
| `components/construction/ProjectHealthCard.tsx` | RAG health indicator |
| `pages/construction/ConstructionAnalyticsPage.tsx` | Analytics charts |
| `api/endpoints/construction/analytics.ts` | Analytics API |
| `api/endpoints/construction/issues.ts` | Issues API |
| `api/endpoints/construction/photos.ts` | Photos API |
| `api/endpoints/construction/comments.ts` | Comments API |
| `api/endpoints/construction/dailyLogs.ts` | Daily logs API |
| `api/endpoints/construction/subcontractors.ts` | Subcontractors API |
| `api/endpoints/construction/permits.ts` | Permits API |
| `api/endpoints/construction/changeOrders.ts` | Change orders API |
| `api/endpoints/construction/documents.ts` | Documents API |
| `api/endpoints/construction/favorites.ts` | Favorites API |
| `api/endpoints/construction/chat.ts` | Construction chat API |
| `hooks/construction/useConstructionAnalytics.ts` | Analytics hooks |
| `hooks/construction/useConstructionIssues.ts` | Issues hooks |
| `hooks/construction/useConstructionPhotos.ts` | Photos hooks |
| `hooks/construction/useConstructionComments.ts` | Comments hooks |
| `hooks/construction/useConstructionDailyLogs.ts` | Daily logs hooks |
| `hooks/construction/useConstructionSubcontractors.ts` | Subcontractors hooks |
| `hooks/construction/useConstructionPermits.ts` | Permits hooks |
| `hooks/construction/useConstructionChangeOrders.ts` | Change orders hooks |
| `hooks/construction/useConstructionDocuments.ts` | Documents hooks |
| `hooks/construction/useConstructionFavorites.ts` | Favorites hooks |
| `utils/exportCsv.ts` | CSV download utility |

### Backend
| File | Purpose |
|------|---------|
| `models/construction/issue.py` | Issue model + enums |
| `models/construction/photo.py` | Photo model |
| `schemas/construction/analytics.py` | Analytics response schemas |
| `schemas/construction/issue.py` | Issue schemas |
| `schemas/construction/photo.py` | Photo schemas |
| `repositories/construction/issue_repository.py` | Issue data access |
| `repositories/construction/photo_repository.py` | Photo data access |
| `services/construction/issue_service.py` | Issue business logic |
| `services/construction/photo_service.py` | Photo upload/delete |
| `api/routes/construction/analytics.py` | Analytics endpoint |
| `api/routes/construction/issues.py` | Issue CRUD endpoints |
| `api/routes/construction/photos.py` | Photo upload endpoints |

### Migrations (autogenerated, 3 total)
1. `add_construction_project_type`
2. `add_construction_issues`
3. `add_construction_photos`

### Frontend
| File | Purpose |
|------|---------|
| `components/construction/ConstructionStatsPanel.tsx` | Portfolio stats |
| `components/construction/GanttTimeline.tsx` | Gantt chart view |
| `components/construction/IssuesLog.tsx` | Issue list + forms |
| `components/construction/PhotoGallery.tsx` | Photo grid + upload |
| `pages/construction/ConstructionAnalyticsPage.tsx` | Analytics charts |
| `api/endpoints/construction/analytics.ts` | Analytics API |
| `api/endpoints/construction/issues.ts` | Issues API |
| `api/endpoints/construction/photos.ts` | Photos API |
| `hooks/construction/useConstructionAnalytics.ts` | Analytics hooks |
| `hooks/construction/useConstructionIssues.ts` | Issues hooks |
| `hooks/construction/useConstructionPhotos.ts` | Photos hooks |

### Modified Files
- `AppHeader.tsx` — add construction nav links
- `ConstructionDashboardPage.tsx` — stats panel, view toggle, type filter, favorites section, chat widget
- `ConstructionProjectPage.tsx` — add 10 new tabs: Sorunlar, Günlük, Taşeronlar, İzinler, Revizyonlar, Belgeler, Yorumlar, Geçmiş, Fotoğraflar; health card in Genel Bakış
- `ProjectCard.tsx` — project type badge, favorite toggle, RAG dot
- `ProjectForm.tsx` — project type dropdown
- `MilestonesTimeline.tsx` — overdue alerts, CSV export button
- `MaterialsList.tsx` — CSV export button
- `App.tsx` — analytics route
- `types/index.ts` — all new types
- `models/construction/project.py` — project_type field
- `schemas/construction/project.py` — project_type + is_favorite in schemas
- `services/construction/project_service.py` — audit log writes, is_favorite annotation
- `services/construction/milestone_service.py` — overdue notifications
- `services/construction/issue_service.py` — critical issue notifications
- `services/construction/change_order_service.py` — submit/approve notifications
- `db/all_models.py` — all new model imports
- `api/routes/construction/__init__.py` — all new routers
- `api/routes/construction/projects.py` — health + audit-log + export endpoints added

## Seed Data Updates
After Phase 4+ add seed data to `scripts/seed_data.py` for:
- 2-3 issues per project (mix of severities/statuses)
- 2-4 daily logs per active project (last 7 days)
- 2-3 subcontractors per project
- 1-2 permits per project
- 1-2 change orders per project (mix of statuses)
- Sample comments (3 per project)

## Verification
1. `make dev` — both frontend and backend start clean
2. Run all migrations in order: `docker exec <backend> .venv/bin/alembic upgrade head`
3. Re-run seed: `docker exec <backend> PYTHONPATH=/app .venv/bin/python scripts/seed_data.py`
4. Frontend build: `npm run build` inside frontend container (no TS errors)
5. Visit `/construction` — stats panel + type filters + favorites + chat widget visible
6. Visit `/construction/analytics` — all 5 charts render with seed data
7. Open any project → verify all tabs visible, health card in Genel Bakış, budget bar
8. Toggle Gantt view on dashboard — all 6 seeded projects on timeline
9. Test favorites toggle on project card
10. Test construction AI chat — ask "Hangi projeler bütçeyi aştı?"
11. Manager login → test CSV downloads for projects + materials
12. Test notification bell — verify construction events appear
