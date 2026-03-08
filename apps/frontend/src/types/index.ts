export type UserRole = 'employee' | 'manager' | 'accountant' | 'admin';
export type RequirementStatus = 'pending' | 'accepted' | 'declined';

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

export interface Requirement {
  id: number;
  user_id: number;
  username: string;
  item_name: string;
  price: string; // Decimal serialised as string from FastAPI
  explanation: string | null;
  status: RequirementStatus;
  paid: boolean;
  approved_by: number | null;
  approved_by_username: string | null;
  location_id: number | null;
  location_name: string | null;
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
  paid?: boolean;
  month?: number;
  year?: number;
  location_id?: number;
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
