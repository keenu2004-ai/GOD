export interface UserProfile {
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
  status: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED' | 'INACTIVE';
  is_deleted?: boolean;
  department_name?: string;
  branch_name?: string;
  manager_first_name?: string;
  manager_last_name?: string;
  organization_id?: number;
}

export interface DashboardMetrics {
  totalEmployees: number;
  totalDepartments: number;
  totalBranches: number;
  presentToday: number;
  lateToday: number;
  pendingLeaves: number;
  pendingExpenses: number;
  activeProjects: number;
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
  first_name?: string;
  last_name?: string;
  employee_code?: string;
  avatar_url?: string;
  department_name?: string;
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
  rejection_reason?: string;
  leave_type_name?: string;
  leave_type_code?: string;
  first_name?: string;
  last_name?: string;
  employee_code?: string;
  avatar_url?: string;
  approver_first_name?: string;
  approver_last_name?: string;
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
  first_name?: string;
  last_name?: string;
  employee_code?: string;
  designation?: string;
  department_name?: string;
  branch_name?: string;
  bank_account?: string;
  ifsc_code?: string;
  pan_number?: string;
}

export interface ExpenseClaim {
  id: number;
  employee_id: number;
  title: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  receipt_url?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  first_name?: string;
  last_name?: string;
  employee_code?: string;
  avatar_url?: string;
  department_name?: string;
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
  total_members?: number;
  total_tasks?: number;
  completed_tasks?: number;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  category: string;
  is_pinned: boolean;
  author_first_name?: string;
  author_last_name?: string;
  author_avatar?: string;
  created_at?: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at?: string;
}
