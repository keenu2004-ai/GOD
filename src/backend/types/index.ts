export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface UserSession {
  id: number;
  employee_code: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  branch_id?: number;
  department_id?: number;
  organization_id?: number;
}

export interface Employee {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: 'ADMIN' | 'HR_MANAGER' | 'DEPT_HEAD' | 'EMPLOYEE';
  department_id: number;
  branch_id: number;
  designation: string;
  joining_date: string;
  salary: number;
  bank_account?: string;
  ifsc_code?: string;
  pan_number?: string;
  aadhaar_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  reporting_manager_id?: number;
  avatar_url?: string;
  password_hash?: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED' | 'INACTIVE';
  is_deleted?: boolean;
  created_at?: string;
}

export interface Branch {
  id: number;
  name: string;
  code: string;
  city: string;
  state: string;
  country: string;
  timezone: string;
  address: string;
  latitude: number;
  longitude: number;
  geofence_radius_meters: number;
  is_headquarters: boolean;
  created_at?: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  head_employee_id?: number;
  created_at?: string;
}

export interface AttendanceRecord {
  id: number;
  employee_id: number;
  date: string;
  punch_in?: string;
  punch_out?: string;
  punch_in_lat?: number;
  punch_in_lng?: number;
  punch_out_lat?: number;
  punch_out_lng?: number;
  work_hours: number;
  break_duration_mins: number;
  shift_name: string;
  is_late: boolean;
  is_overtime: boolean;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE' | 'LATE';
  created_at?: string;
}

export interface LeaveRequest {
  id: number;
  employee_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approved_by?: number;
  rejection_reason?: string;
  created_at?: string;
}

export interface PayrollRecord {
  id: number;
  employee_id: number;
  month: string;
  year: number;
  basic_salary: number;
  hra: number;
  conveyance: number;
  allowances: number;
  gross_salary: number;
  pf_deduction: number;
  esi_deduction: number;
  tds_deduction: number;
  net_salary: number;
  payment_status: 'PAID' | 'PROCESSING' | 'PENDING';
  payment_date?: string;
  created_at?: string;
}

export interface ExpenseClaim {
  id: number;
  employee_id: number;
  title: string;
  category: 'TRAVEL' | 'MEALS' | 'OFFICE_SUPPLIES' | 'SOFTWARE' | 'MISC';
  amount: number;
  date: string;
  description: string;
  receipt_url?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approved_by?: number;
  created_at?: string;
}

export interface Project {
  id: number;
  name: string;
  code: string;
  description: string;
  client_name: string;
  start_date: string;
  end_date: string;
  budget: number;
  status: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED';
  progress: number;
  created_at?: string;
}

export interface ProjectTask {
  id: number;
  project_id: number;
  title: string;
  description: string;
  assigned_to: number;
  due_date: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  created_at?: string;
}

export interface HelpdeskTicket {
  id: number;
  ticket_code: string;
  employee_id: number;
  category: 'IT_SUPPORT' | 'HR' | 'PAYROLL' | 'FACILITIES' | 'HARDWARE';
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  assigned_to?: number;
  created_at?: string;
}

export interface AssetRecord {
  id: number;
  asset_name: string;
  asset_code: string;
  category: string;
  serial_number: string;
  assigned_to_employee_id?: number;
  purchase_date: string;
  value: number;
  status: 'AVAILABLE' | 'ALLOCATED' | 'UNDER_REPAIR' | 'DISPOSED';
  created_at?: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  category: 'GENERAL' | 'POLICY' | 'EVENT' | 'EXECUTIVE';
  is_pinned: boolean;
  posted_by: number;
  created_at?: string;
}

export interface NotificationItem {
  id: number;
  employee_id: number;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  is_read: boolean;
  created_at?: string;
}
