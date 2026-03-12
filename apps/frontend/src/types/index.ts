export type UserRole = 'employee' | 'manager' | 'accountant' | 'admin';
export type RequirementStatus = 'pending' | 'accepted' | 'declined';
export type RequirementPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface UserDropdownItem {
  id: number;
  username: string;
}

export interface RequirementImage {
  id: number;
  s3_key: string;
  original_filename: string;
  file_type: string; // 'image' | 'pdf'
  url: string; // presigned S3 URL
}

export interface Category {
  id: number;
  name: string;
  color: string | null;
  created_at: string;
}

export interface Requirement {
  id: number;
  user_id: number;
  username: string;
  item_name: string;
  price: string; // Decimal serialised as string from FastAPI
  explanation: string | null;
  status: RequirementStatus;
  priority: RequirementPriority;
  needed_by: string | null;
  paid: boolean;
  approved_by: number | null;
  approved_by_username: string | null;
  location_id: number | null;
  location_name: string | null;
  category_id: number | null;
  category_name: string | null;
  category_color: string | null;
  images: RequirementImage[];
  is_favorited: boolean;
  created_at: string;
}

export interface Location {
  id: number;
  name: string;
  address: string | null;
  created_at: string;
}

export interface LocationWithUsers extends Location {
  users: UserDropdownItem[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface StatisticsResponse {
  total_count: number;
  pending_count: number;
  accepted_count: number;
  declined_count: number;
  total_price: string;
  pending_price: string;
  accepted_price: string;
  declined_price: string;
}

export interface RequirementFilters {
  page?: number;
  limit?: number;
  search?: string;
  user_id?: number;
  status?: RequirementStatus;
  priority?: RequirementPriority;
  paid?: boolean;
  month?: number;
  year?: number;
  location_id?: number;
  category_id?: number;
}

export interface StatisticsFilters {
  search?: string;
  user_id?: number;
  paid?: boolean;
  month?: number;
  year?: number;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface SpendDataPoint {
  year: number;
  month: number;
  month_label: string;
  total_price: string;
  accepted_price: string;
  count: number;
}

export interface SpendOverTimeResponse {
  data: SpendDataPoint[];
}

export interface TopRequesterItem {
  user_id: number;
  username: string;
  total_price: string;
  total_count: number;
  accepted_count: number;
}

export interface TopRequestersResponse {
  data: TopRequesterItem[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AnalyticsFilters {
  user_id?: number;
  paid?: boolean;
  month?: number;
  year?: number;
}

export interface Comment {
  id: number;
  requirement_id: number;
  user_id: number;
  username: string;
  body: string;
  created_at: string;
}

export interface AuditLogEntry {
  id: number;
  requirement_id: number;
  actor_id: number;
  actor_username: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  requirement_id: number | null;
  message: string;
  read: boolean;
  created_at: string;
}

export interface BudgetStatus {
  budget_amount: string | null;
  budget_used: string;
  budget_period_month: number | null;
  budget_period_year: number | null;
}

export interface LocationStatsItem {
  location_id: number;
  location_name: string;
  total_count: number;
  pending_count: number;
  accepted_count: number;
  declined_count: number;
  total_price: string;
  accepted_price: string;
}

export interface LocationStatsResponse {
  data: LocationStatsItem[];
}

export interface BudgetHistoryItem {
  month: number;
  year: number;
  month_label: string;
  budget_amount: string | null;
  budget_used: string;
  utilization_pct: number;
}

export interface BudgetHistoryResponse {
  data: BudgetHistoryItem[];
}

// ── Construction Management ──────────────────────────────────────────────────

export type ConstructionProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
export type ConstructionProjectType = 'shopping_mall' | 'residential' | 'office' | 'mixed_use' | 'hotel' | 'industrial' | 'other';
export type ConstructionMaterialUnit = 'm3' | 'kg' | 'ton' | 'adet' | 'm2' | 'm' | 'litre';
export type ConstructionTaskStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';

export interface ConstructionProject {
  id: number;
  name: string;
  description: string | null;
  location_id: number | null;
  location_name: string | null;
  created_by: number;
  created_by_username: string;
  status: ConstructionProjectStatus;
  project_type: ConstructionProjectType | null;
  start_date: string | null;
  end_date: string | null;
  budget: string | null;
  progress_pct: number;
  created_at: string;
  is_favorite: boolean;
  team_count: number;
}

export interface ConstructionMaterial {
  id: number;
  project_id: number;
  name: string;
  material_type: string;
  unit: ConstructionMaterialUnit;
  quantity_planned: string;
  quantity_used: string;
  unit_cost: string | null;
  notes: string | null;
  created_at: string;
}

export interface ConstructionMilestone {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  status: ConstructionTaskStatus;
  completion_pct: number;
  created_at: string;
}

export interface ConstructionProjectFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: ConstructionProjectStatus;
  project_type?: ConstructionProjectType;
  location_id?: number;
  my_projects?: boolean;
}

export interface ConstructionStatusCount {
  status: string;
  count: number;
}

export interface ConstructionTypeCount {
  project_type: string;
  count: number;
}

export interface ConstructionBudgetByProject {
  name: string;
  budget: number;
  actual_cost: number;
}

export interface ConstructionMaterialCostByType {
  material_type: string;
  total_cost: number;
}

export interface ConstructionMilestoneStatusCount {
  status: string;
  count: number;
}

export interface ConstructionAnalyticsResponse {
  projects_by_status: ConstructionStatusCount[];
  projects_by_type: ConstructionTypeCount[];
  budget_by_project: ConstructionBudgetByProject[];
  material_cost_by_type: ConstructionMaterialCostByType[];
  milestone_status_counts: ConstructionMilestoneStatusCount[];
  total_budget: number;
  total_actual_cost: number;
  avg_progress: number;
}

export type ConstructionIssueSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ConstructionIssueStatus = 'open' | 'in_progress' | 'resolved';

export interface ConstructionIssue {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  severity: ConstructionIssueSeverity;
  status: ConstructionIssueStatus;
  reported_by: number | null;
  reporter_username: string | null;
  created_at: string;
}

export interface ConstructionPhoto {
  id: number;
  project_id: number;
  uploaded_by: number | null;
  uploader_username: string | null;
  file_key: string;
  url: string;
  caption: string | null;
  created_at: string;
}

export interface ConstructionComment {
  id: number;
  project_id: number;
  user_id: number | null;
  username: string | null;
  content: string;
  created_at: string;
}

export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';

export interface ConstructionDailyLog {
  id: number;
  project_id: number;
  log_date: string;
  weather: WeatherCondition;
  temperature_c: number | null;
  worker_count: number;
  work_summary: string;
  equipment_on_site: string | null;
  visitors: string | null;
  recorded_by: number | null;
  recorder_username: string | null;
  created_at: string;
}

export type SubcontractorStatus = 'active' | 'inactive' | 'blacklisted';

export interface ConstructionSubcontractor {
  id: number;
  project_id: number;
  company_name: string;
  trade: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string | null;
  contract_value: string | null;
  status: SubcontractorStatus;
  notes: string | null;
  created_at: string;
}

export type PermitType = 'construction' | 'demolition' | 'electrical' | 'plumbing' | 'fire_safety' | 'environmental' | 'occupancy' | 'other';
export type PermitStatus = 'not_applied' | 'applied' | 'under_review' | 'approved' | 'rejected' | 'expired';

export interface ConstructionPermit {
  id: number;
  project_id: number;
  permit_type: PermitType;
  permit_number: string | null;
  issuing_authority: string;
  status: PermitStatus;
  applied_date: string | null;
  approved_date: string | null;
  expiry_date: string | null;
  notes: string | null;
  created_at: string;
}

export type ChangeOrderStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface ConstructionChangeOrder {
  id: number;
  project_id: number;
  title: string;
  description: string;
  cost_delta: string;
  schedule_delta_days: number | null;
  status: ChangeOrderStatus;
  requested_by: number | null;
  requester_username: string | null;
  reviewed_by: number | null;
  reviewer_username: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export type ConstructionAuditAction = 'created' | 'status_changed' | 'budget_changed' | 'progress_updated' | 'edited';

export interface ConstructionAuditLog {
  id: number;
  project_id: number;
  user_id: number | null;
  username: string | null;
  action: ConstructionAuditAction;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export interface ConstructionDocument {
  id: number;
  project_id: number;
  uploaded_by: number | null;
  uploader_username: string | null;
  file_key: string;
  url: string;
  original_filename: string;
  file_size_bytes: number | null;
  document_type: string | null;
  caption: string | null;
  created_at: string;
}

export type ConstructionProjectRole =
  | 'project_manager'
  | 'site_engineer'
  | 'foreman'
  | 'architect'
  | 'safety_officer'
  | 'consultant'
  | 'observer';

export interface ConstructionProjectMember {
  id: number;
  project_id: number;
  user_id: number;
  username: string;
  email: string;
  global_role: string;
  construction_role: ConstructionProjectRole;
  joined_at: string | null;
  notes: string | null;
  created_at: string;
}

export type ShipmentStatus = 'ordered' | 'in_transit' | 'delivered' | 'partial' | 'rejected' | 'returned';

export interface ConstructionShipment {
  id: number;
  project_id: number;
  material_id: number | null;
  material_name: string;
  supplier_name: string;
  quantity_ordered: string;
  quantity_delivered: string | null;
  unit: ConstructionMaterialUnit;
  unit_cost: string | null;
  total_cost: string | null;
  status: ShipmentStatus;
  order_date: string;
  expected_delivery_date: string | null;
  actual_delivery_date: string | null;
  delivery_note_number: string | null;
  notes: string | null;
  received_by: number | null;
  receiver_username: string | null;
  created_at: string;
}

// ── Budget Lines ──────────────────────────────────────────────────────────────

export type BudgetCategory = 'labor' | 'materials' | 'equipment' | 'subcontractors' | 'overhead' | 'contingency' | 'other';

export interface ConstructionBudgetLine {
  id: number;
  project_id: number;
  category: BudgetCategory;
  description: string | null;
  planned_amount: string;
  actual_amount: string;
  notes: string | null;
  created_at: string;
}

export interface BudgetSummaryResponse {
  lines: ConstructionBudgetLine[];
  total_planned: string;
  total_actual: string;
  variance: string;
  utilization_pct: number;
}

export interface BudgetLineCreate {
  category: BudgetCategory;
  description?: string;
  planned_amount: string;
  actual_amount?: string;
  notes?: string;
}

export interface BudgetLineUpdate {
  category?: BudgetCategory;
  description?: string;
  planned_amount?: string;
  actual_amount?: string;
  notes?: string;
}
