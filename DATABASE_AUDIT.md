# DATABASE AUDIT

Generated: 2026-08-10T11:20:20.385Z

## Table: `announcements`

- **Row Count**: 2
- **Primary Key**: id
- **Foreign Keys**:
  - `posted_by` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('announcements_id_seq'::regclass)` |
| `title` | `character varying` | NO | `` |
| `content` | `text` | NO | `` |
| `category` | `character varying` | YES | `'GENERAL'::character varying` |
| `is_pinned` | `boolean` | YES | `false` |
| `posted_by` | `integer` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `asset_assignments`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `asset_id` -> `assets.id`
  - `employee_id` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('asset_assignments_id_seq'::regclass)` |
| `asset_id` | `integer` | NO | `` |
| `employee_id` | `integer` | NO | `` |
| `assignment_date` | `date` | NO | `` |
| `expected_return_date` | `date` | YES | `` |
| `return_date` | `date` | YES | `` |
| `condition_at_assignment` | `character varying` | YES | `'EXCELLENT'::character varying` |
| `condition_at_return` | `character varying` | YES | `` |
| `status` | `character varying` | YES | `'ASSIGNED'::character varying` |
| `is_acknowledged` | `boolean` | YES | `false` |
| `acknowledged_at` | `timestamp without time zone` | YES | `` |
| `notes` | `text` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `asset_issues`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `asset_id` -> `assets.id`
  - `reported_by` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('asset_issues_id_seq'::regclass)` |
| `asset_id` | `integer` | NO | `` |
| `reported_by` | `integer` | NO | `` |
| `issue_type` | `character varying` | YES | `'DAMAGE'::character varying` |
| `description` | `text` | NO | `` |
| `severity` | `character varying` | YES | `'MEDIUM'::character varying` |
| `status` | `character varying` | YES | `'OPEN'::character varying` |
| `resolution_notes` | `text` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `asset_requests`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `employee_id` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('asset_requests_id_seq'::regclass)` |
| `request_number` | `character varying` | NO | `` |
| `employee_id` | `integer` | NO | `` |
| `category` | `character varying` | NO | `` |
| `request_type` | `character varying` | YES | `'NEW_ASSET'::character varying` |
| `reason` | `text` | NO | `` |
| `priority` | `character varying` | YES | `'NORMAL'::character varying` |
| `required_date` | `date` | YES | `` |
| `status` | `character varying` | YES | `'SUBMITTED'::character varying` |
| `estimated_cost` | `numeric` | YES | `0` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `asset_transfers`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `asset_id` -> `assets.id`
  - `from_employee_id` -> `employees.id`
  - `to_employee_id` -> `employees.id`
  - `transferred_by` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('asset_transfers_id_seq'::regclass)` |
| `asset_id` | `integer` | NO | `` |
| `from_employee_id` | `integer` | YES | `` |
| `to_employee_id` | `integer` | NO | `` |
| `transfer_date` | `date` | NO | `CURRENT_DATE` |
| `reason` | `text` | NO | `` |
| `transferred_by` | `integer` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `assets`

- **Row Count**: 4
- **Primary Key**: id
- **Foreign Keys**:
  - `assigned_to_employee_id` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('assets_id_seq'::regclass)` |
| `asset_name` | `character varying` | NO | `` |
| `asset_code` | `character varying` | NO | `` |
| `category` | `character varying` | NO | `` |
| `serial_number` | `character varying` | NO | `` |
| `assigned_to_employee_id` | `integer` | YES | `` |
| `purchase_date` | `date` | NO | `` |
| `value` | `numeric` | NO | `` |
| `status` | `character varying` | YES | `'ALLOCATED'::character varying` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `attendance`

- **Row Count**: 6
- **Primary Key**: id
- **Foreign Keys**:
  - `employee_id` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('attendance_id_seq'::regclass)` |
| `employee_id` | `integer` | NO | `` |
| `date` | `date` | NO | `` |
| `punch_in` | `timestamp without time zone` | YES | `` |
| `punch_out` | `timestamp without time zone` | YES | `` |
| `punch_in_lat` | `numeric` | YES | `` |
| `punch_in_lng` | `numeric` | YES | `` |
| `punch_out_lat` | `numeric` | YES | `` |
| `punch_out_lng` | `numeric` | YES | `` |
| `work_hours` | `numeric` | YES | `0.0` |
| `break_duration_mins` | `integer` | YES | `0` |
| `shift_name` | `character varying` | YES | `'General Shift (9 AM - 6 PM)'::character varying` |
| `is_late` | `boolean` | YES | `false` |
| `is_overtime` | `boolean` | YES | `false` |
| `status` | `character varying` | YES | `'PRESENT'::character varying` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `attendance_regularizations`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `admin_id` -> `employees.id`
  - `approved_by` -> `employees.id`
  - `employee_id` -> `employees.id`
  - `hr_id` -> `employees.id`
  - `manager_id` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('attendance_regularizations_id_seq'::regclass)` |
| `employee_id` | `integer` | NO | `` |
| `attendance_date` | `date` | NO | `` |
| `request_type` | `character varying` | NO | `'MISSED_PUNCH'::character varying` |
| `requested_punch_in` | `timestamp without time zone` | YES | `` |
| `requested_punch_out` | `timestamp without time zone` | YES | `` |
| `requested_break_start` | `timestamp without time zone` | YES | `` |
| `requested_break_end` | `timestamp without time zone` | YES | `` |
| `reason` | `text` | NO | `` |
| `supporting_notes` | `text` | YES | `` |
| `attachment_url` | `text` | YES | `` |
| `status` | `character varying` | NO | `'PENDING_MANAGER'::character varying` |
| `manager_id` | `integer` | YES | `` |
| `manager_action` | `character varying` | YES | `` |
| `manager_comment` | `text` | YES | `` |
| `manager_actioned_at` | `timestamp without time zone` | YES | `` |
| `hr_id` | `integer` | YES | `` |
| `hr_action` | `character varying` | YES | `` |
| `hr_comment` | `text` | YES | `` |
| `hr_actioned_at` | `timestamp without time zone` | YES | `` |
| `admin_id` | `integer` | YES | `` |
| `admin_action` | `character varying` | YES | `` |
| `admin_comment` | `text` | YES | `` |
| `admin_actioned_at` | `timestamp without time zone` | YES | `` |
| `approved_by` | `integer` | YES | `` |
| `approved_at` | `timestamp without time zone` | YES | `` |
| `rejection_reason` | `text` | YES | `` |
| `attendance_updated` | `boolean` | NO | `false` |
| `payroll_recalculated` | `boolean` | NO | `false` |
| `deleted_at` | `timestamp without time zone` | YES | `` |
| `created_by` | `integer` | YES | `` |
| `updated_by` | `integer` | YES | `` |
| `created_at` | `timestamp without time zone` | NO | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp without time zone` | NO | `CURRENT_TIMESTAMP` |

---

## Table: `audit_logs`

- **Row Count**: 4
- **Primary Key**: id
- **Foreign Keys**:
  - `employee_id` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('audit_logs_id_seq'::regclass)` |
| `employee_id` | `integer` | YES | `` |
| `action` | `character varying` | NO | `` |
| `module` | `character varying` | NO | `` |
| `details` | `text` | YES | `` |
| `ip_address` | `character varying` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `branches`

- **Row Count**: 3
- **Primary Key**: id
- **Foreign Keys**:
  - `organization_id` -> `organizations.id`
  - `region_id` -> `regions.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('branches_id_seq'::regclass)` |
| `organization_id` | `integer` | YES | `1` |
| `name` | `character varying` | NO | `` |
| `code` | `character varying` | NO | `` |
| `region_id` | `integer` | YES | `` |
| `city` | `character varying` | NO | `` |
| `state` | `character varying` | NO | `` |
| `country` | `character varying` | YES | `'India'::character varying` |
| `timezone` | `character varying` | YES | `'Asia/Kolkata'::character varying` |
| `address` | `text` | NO | `` |
| `latitude` | `numeric` | YES | `12.971598` |
| `longitude` | `numeric` | YES | `77.594566` |
| `geofence_radius_meters` | `integer` | YES | `500` |
| `is_headquarters` | `boolean` | YES | `false` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `candidates`

- **Row Count**: 3
- **Primary Key**: id
- **Foreign Keys**:
  - `recruitment_id` -> `recruitments.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('candidates_id_seq'::regclass)` |
| `recruitment_id` | `integer` | NO | `` |
| `candidate_name` | `character varying` | NO | `` |
| `email` | `character varying` | NO | `` |
| `phone` | `character varying` | NO | `` |
| `resume_url` | `text` | YES | `` |
| `status` | `character varying` | YES | `'APPLIED'::character varying` |
| `interview_date` | `timestamp without time zone` | YES | `` |
| `feedback` | `text` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `celebrations`

- **Row Count**: 2
- **Primary Key**: id
- **Foreign Keys**:
  - `employee_id` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('celebrations_id_seq'::regclass)` |
| `employee_id` | `integer` | NO | `` |
| `type` | `character varying` | NO | `` |
| `event_date` | `date` | NO | `` |
| `title` | `character varying` | NO | `` |
| `message` | `text` | YES | `` |

---

## Table: `company_documents`

- **Row Count**: 2
- **Primary Key**: id
- **Foreign Keys**:
  - `uploaded_by` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('company_documents_id_seq'::regclass)` |
| `title` | `character varying` | NO | `` |
| `category` | `character varying` | NO | `` |
| `file_url` | `text` | NO | `` |
| `version` | `character varying` | YES | `'1.0'::character varying` |
| `expiry_date` | `date` | YES | `` |
| `uploaded_by` | `integer` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `company_events`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `branch_id` -> `branches.id`
  - `created_by` -> `employees.id`
  - `department_id` -> `departments.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('company_events_id_seq'::regclass)` |
| `title` | `character varying` | NO | `` |
| `description` | `text` | YES | `` |
| `event_date` | `date` | NO | `` |
| `event_type` | `character varying` | YES | `'TOWNHALL'::character varying` |
| `branch_id` | `integer` | YES | `` |
| `department_id` | `integer` | YES | `` |
| `is_active` | `boolean` | YES | `true` |
| `created_by` | `integer` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `daily_standups`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `employee_id` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('daily_standups_id_seq'::regclass)` |
| `employee_id` | `integer` | NO | `` |
| `standup_date` | `date` | NO | `` |
| `yesterday_work` | `text` | NO | `` |
| `today_plan` | `text` | NO | `` |
| `blockers` | `text` | YES | `` |
| `notes` | `text` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `dashboard_preferences`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `employee_id` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('dashboard_preferences_id_seq'::regclass)` |
| `employee_id` | `integer` | NO | `` |
| `theme` | `character varying` | YES | `'light'::character varying` |
| `default_tab` | `character varying` | YES | `'dashboard'::character varying` |
| `layout_json` | `text` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `dashboard_widgets`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**: None

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('dashboard_widgets_id_seq'::regclass)` |
| `widget_key` | `character varying` | NO | `` |
| `title` | `character varying` | NO | `` |
| `category` | `character varying` | YES | `'ANALYTICS'::character varying` |
| `role_permissions` | `text` | YES | `'ALL'::text` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `departments`

- **Row Count**: 7
- **Primary Key**: id
- **Foreign Keys**:
  - `organization_id` -> `organizations.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('departments_id_seq'::regclass)` |
| `organization_id` | `integer` | YES | `1` |
| `name` | `character varying` | NO | `` |
| `code` | `character varying` | NO | `` |
| `head_employee_id` | `integer` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `documents`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `employee_id` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('documents_id_seq'::regclass)` |
| `employee_id` | `integer` | NO | `` |
| `title` | `character varying` | NO | `` |
| `category` | `character varying` | NO | `` |
| `file_url` | `text` | NO | `` |
| `expiry_date` | `date` | YES | `` |
| `uploaded_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `education`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `employee_id` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('education_id_seq'::regclass)` |
| `employee_id` | `integer` | NO | `` |
| `institution` | `character varying` | NO | `` |
| `degree` | `character varying` | NO | `` |
| `field_of_study` | `character varying` | YES | `` |
| `start_date` | `date` | YES | `` |
| `end_date` | `date` | YES | `` |
| `grade` | `character varying` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `employee_bank_details`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `employee_id` -> `employees.id`
  - `updated_by` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('employee_bank_details_id_seq'::regclass)` |
| `employee_id` | `integer` | NO | `` |
| `account_holder_name` | `character varying` | NO | `` |
| `account_number` | `character varying` | NO | `` |
| `bank_name` | `character varying` | NO | `` |
| `ifsc_code` | `character varying` | NO | `` |
| `branch_name` | `character varying` | YES | `` |
| `payment_mode` | `character varying` | YES | `'BANK_TRANSFER'::character varying` |
| `is_verified` | `boolean` | YES | `true` |
| `updated_by` | `integer` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `employee_branch_transfers`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `employee_id` -> `employees.id`
  - `from_branch_id` -> `branches.id`
  - `to_branch_id` -> `branches.id`
  - `transferred_by` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('employee_branch_transfers_id_seq'::regclass)` |
| `employee_id` | `integer` | NO | `` |
| `from_branch_id` | `integer` | YES | `` |
| `to_branch_id` | `integer` | NO | `` |
| `transfer_date` | `date` | NO | `CURRENT_DATE` |
| `reason` | `text` | NO | `` |
| `transferred_by` | `integer` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `employee_documents`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `employee_id` -> `employees.id`
  - `uploaded_by` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('employee_documents_id_seq'::regclass)` |
| `employee_id` | `integer` | NO | `` |
| `title` | `character varying` | NO | `` |
| `category` | `character varying` | NO | `` |
| `file_url` | `text` | NO | `` |
| `uploaded_by` | `integer` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `employee_onboarding_checklists`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `employee_id` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('employee_onboarding_checklists_id_seq'::regclass)` |
| `employee_id` | `integer` | NO | `` |
| `step_name` | `character varying` | NO | `` |
| `is_completed` | `boolean` | YES | `false` |
| `completed_at` | `timestamp without time zone` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `employee_salary_assignments`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `created_by` -> `employees.id`
  - `employee_id` -> `employees.id`
  - `template_id` -> `salary_templates.id`
  - `updated_by` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('employee_salary_assignments_id_seq'::regclass)` |
| `employee_id` | `integer` | NO | `` |
| `template_id` | `integer` | YES | `` |
| `annual_ctc` | `numeric` | NO | `` |
| `monthly_gross` | `numeric` | NO | `` |
| `monthly_net` | `numeric` | NO | `` |
| `basic_salary` | `numeric` | NO | `` |
| `hra` | `numeric` | NO | `` |
| `special_allowance` | `numeric` | NO | `` |
| `pf_deduction` | `numeric` | YES | `0` |
| `esi_deduction` | `numeric` | YES | `0` |
| `pt_deduction` | `numeric` | YES | `200` |
| `tds_deduction` | `numeric` | YES | `0` |
| `effective_date` | `date` | NO | `` |
| `is_active` | `boolean` | YES | `true` |
| `created_by` | `integer` | YES | `` |
| `updated_by` | `integer` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `employees`

- **Row Count**: 6
- **Primary Key**: id
- **Foreign Keys**:
  - `branch_id` -> `branches.id`
  - `department_id` -> `departments.id`
  - `organization_id` -> `organizations.id`
  - `reporting_manager_id` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('employees_id_seq'::regclass)` |
| `organization_id` | `integer` | YES | `1` |
| `employee_code` | `character varying` | NO | `` |
| `first_name` | `character varying` | NO | `` |
| `last_name` | `character varying` | NO | `` |
| `email` | `character varying` | NO | `` |
| `phone` | `character varying` | NO | `` |
| `password_hash` | `character varying` | NO | `` |
| `role` | `character varying` | NO | `'EMPLOYEE'::character varying` |
| `department_id` | `integer` | YES | `` |
| `branch_id` | `integer` | YES | `` |
| `designation` | `character varying` | NO | `` |
| `joining_date` | `date` | NO | `` |
| `salary` | `numeric` | NO | `50000.00` |
| `bank_account` | `character varying` | YES | `` |
| `ifsc_code` | `character varying` | YES | `` |
| `pan_number` | `character varying` | YES | `` |
| `aadhaar_number` | `character varying` | YES | `` |
| `emergency_contact_name` | `character varying` | YES | `` |
| `emergency_contact_phone` | `character varying` | YES | `` |
| `reporting_manager_id` | `integer` | YES | `` |
| `avatar_url` | `text` | YES | `` |
| `status` | `character varying` | YES | `'ACTIVE'::character varying` |
| `is_deleted` | `boolean` | YES | `false` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `expense_advances`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `employee_id` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('expense_advances_id_seq'::regclass)` |
| `advance_number` | `character varying` | NO | `` |
| `employee_id` | `integer` | NO | `` |
| `advance_amount` | `numeric` | NO | `` |
| `purpose` | `text` | NO | `` |
| `status` | `character varying` | YES | `'PENDING_APPROVAL'::character varying` |
| `settled_amount` | `numeric` | YES | `0` |
| `is_settled` | `boolean` | YES | `false` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `expenses`

- **Row Count**: 3
- **Primary Key**: id
- **Foreign Keys**:
  - `approved_by` -> `employees.id`
  - `employee_id` -> `employees.id`
  - `project_id` -> `projects.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('expenses_id_seq'::regclass)` |
| `expense_number` | `character varying` | YES | `` |
| `employee_id` | `integer` | NO | `` |
| `title` | `character varying` | NO | `` |
| `category` | `character varying` | NO | `` |
| `amount` | `numeric` | NO | `` |
| `currency` | `character varying` | YES | `'INR'::character varying` |
| `merchant_name` | `character varying` | YES | `` |
| `date` | `date` | NO | `` |
| `description` | `text` | YES | `` |
| `receipt_url` | `text` | YES | `` |
| `project_id` | `integer` | YES | `` |
| `status` | `character varying` | YES | `'SUBMITTED'::character varying` |
| `approved_by` | `integer` | YES | `` |
| `reimbursed_amount` | `numeric` | YES | `` |
| `payment_status` | `character varying` | YES | `'PENDING'::character varying` |
| `payment_reference` | `character varying` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `experience`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `employee_id` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('experience_id_seq'::regclass)` |
| `employee_id` | `integer` | NO | `` |
| `company_name` | `character varying` | NO | `` |
| `designation` | `character varying` | NO | `` |
| `start_date` | `date` | NO | `` |
| `end_date` | `date` | YES | `` |
| `description` | `text` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `geofence_settings`

- **Row Count**: 1
- **Primary Key**: id
- **Foreign Keys**: None

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `character varying` | NO | `'HQ'::character varying` |
| `office_name` | `character varying` | YES | `'THEIAKSHI HQ - Bengaluru'::character varying` |
| `latitude` | `numeric` | YES | `12.9716` |
| `longitude` | `numeric` | YES | `77.5946` |
| `radius_meters` | `integer` | YES | `500` |
| `enforce_strict_geofence` | `boolean` | YES | `true` |
| `updated_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `helpdesk_canned_responses`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `created_by` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('helpdesk_canned_responses_id_seq'::regclass)` |
| `title` | `character varying` | NO | `` |
| `response_text` | `text` | NO | `` |
| `category` | `character varying` | YES | `` |
| `shortcut_code` | `character varying` | YES | `` |
| `usage_count` | `integer` | YES | `0` |
| `created_by` | `integer` | YES | `` |
| `is_active` | `boolean` | YES | `true` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `helpdesk_categories`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `default_assignee_id` -> `employees.id`
  - `department_id` -> `departments.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('helpdesk_categories_id_seq'::regclass)` |
| `name` | `character varying` | NO | `` |
| `code` | `character varying` | NO | `` |
| `description` | `text` | YES | `` |
| `department_id` | `integer` | YES | `` |
| `default_assignee_id` | `integer` | YES | `` |
| `default_priority` | `character varying` | YES | `'MEDIUM'::character varying` |
| `is_active` | `boolean` | YES | `true` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `helpdesk_knowledge_base`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `category_id` -> `helpdesk_categories.id`
  - `created_by` -> `employees.id`
  - `updated_by` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('helpdesk_knowledge_base_id_seq'::regclass)` |
| `title` | `character varying` | NO | `` |
| `content` | `text` | NO | `` |
| `category_id` | `integer` | YES | `` |
| `tags` | `text` | YES | `` |
| `views_count` | `integer` | YES | `0` |
| `is_published` | `boolean` | YES | `true` |
| `created_by` | `integer` | YES | `` |
| `updated_by` | `integer` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `helpdesk_ticket_history`

- **Row Count**: 9
- **Primary Key**: id
- **Foreign Keys**:
  - `actor_id` -> `employees.id`
  - `ticket_id` -> `helpdesk_tickets.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('helpdesk_ticket_history_id_seq'::regclass)` |
| `ticket_id` | `integer` | NO | `` |
| `actor_id` | `integer` | NO | `` |
| `action` | `character varying` | NO | `` |
| `old_value` | `text` | YES | `` |
| `new_value` | `text` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `helpdesk_tickets`

- **Row Count**: 7
- **Primary Key**: id
- **Foreign Keys**:
  - `asset_id` -> `assets.id`
  - `assigned_to` -> `employees.id`
  - `employee_id` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('helpdesk_tickets_id_seq'::regclass)` |
| `ticket_code` | `character varying` | NO | `` |
| `employee_id` | `integer` | NO | `` |
| `category` | `character varying` | NO | `` |
| `subject` | `character varying` | NO | `` |
| `description` | `text` | NO | `` |
| `priority` | `character varying` | YES | `'MEDIUM'::character varying` |
| `status` | `character varying` | YES | `'OPEN'::character varying` |
| `assigned_to` | `integer` | YES | `` |
| `asset_id` | `integer` | YES | `` |
| `resolution_notes` | `text` | YES | `` |
| `sla_due_date` | `timestamp without time zone` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |
| `type` | `character varying` | YES | `'IT'::character varying` |
| `resolved_at` | `timestamp without time zone` | YES | `` |

---

## Table: `holiday_regions`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**: None

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('holiday_regions_id_seq'::regclass)` |
| `code` | `character varying` | NO | `` |
| `name` | `character varying` | NO | `` |
| `description` | `text` | YES | `` |

---

## Table: `holidays`

- **Row Count**: 16
- **Primary Key**: id
- **Foreign Keys**:
  - `branch_id` -> `branches.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('holidays_id_seq'::regclass)` |
| `branch_id` | `integer` | YES | `` |
| `region_code` | `character varying` | YES | `'COMMON'::character varying` |
| `name` | `character varying` | NO | `` |
| `date` | `date` | NO | `` |
| `type` | `character varying` | YES | `'NATIONAL'::character varying` |
| `is_optional` | `boolean` | YES | `false` |
| `description` | `text` | YES | `` |
| `is_active` | `boolean` | YES | `true` |
| `created_by` | `integer` | YES | `` |
| `updated_by` | `integer` | YES | `` |
| `deleted_at` | `timestamp without time zone` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `leave_accrual_history`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `employee_id` -> `employees.id`
  - `leave_type_id` -> `leave_types.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('leave_accrual_history_id_seq'::regclass)` |
| `employee_id` | `integer` | NO | `` |
| `leave_type_id` | `integer` | NO | `` |
| `accrual_period` | `character varying` | NO | `` |
| `days_accrued` | `numeric` | NO | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `leave_adjustments`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `approved_by` -> `employees.id`
  - `employee_id` -> `employees.id`
  - `leave_type_id` -> `leave_types.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('leave_adjustments_id_seq'::regclass)` |
| `employee_id` | `integer` | NO | `` |
| `leave_type_id` | `integer` | NO | `` |
| `adjustment_type` | `character varying` | NO | `` |
| `days` | `numeric` | NO | `` |
| `reason` | `text` | NO | `` |
| `approved_by` | `integer` | NO | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `leave_applications`

- **Row Count**: 3
- **Primary Key**: id
- **Foreign Keys**:
  - `approver_id` -> `employees.id`
  - `employee_id` -> `employees.id`
  - `hr_id` -> `employees.id`
  - `leave_type_id` -> `leave_types.id`
  - `manager_id` -> `employees.id`
  - `replacement_employee_id` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('leave_applications_id_seq'::regclass)` |
| `employee_id` | `integer` | NO | `` |
| `leave_type_id` | `integer` | NO | `` |
| `start_date` | `date` | NO | `` |
| `end_date` | `date` | NO | `` |
| `total_days` | `numeric` | NO | `` |
| `is_half_day` | `boolean` | YES | `false` |
| `half_day_session` | `character varying` | YES | `` |
| `is_hourly` | `boolean` | YES | `false` |
| `hours_requested` | `numeric` | YES | `` |
| `reason` | `text` | NO | `` |
| `emergency_contact` | `character varying` | YES | `` |
| `contact_during_leave` | `character varying` | YES | `` |
| `work_handover` | `text` | YES | `` |
| `replacement_employee_id` | `integer` | YES | `` |
| `attachment_url` | `text` | YES | `` |
| `status` | `character varying` | YES | `'MANAGER_PENDING'::character varying` |
| `manager_id` | `integer` | YES | `` |
| `manager_action` | `character varying` | YES | `` |
| `manager_comment` | `text` | YES | `` |
| `manager_actioned_at` | `timestamp without time zone` | YES | `` |
| `hr_id` | `integer` | YES | `` |
| `hr_action` | `character varying` | YES | `` |
| `hr_comment` | `text` | YES | `` |
| `hr_actioned_at` | `timestamp without time zone` | YES | `` |
| `approver_id` | `integer` | YES | `` |
| `rejection_reason` | `text` | YES | `` |
| `attendance_synced` | `boolean` | YES | `false` |
| `payroll_synced` | `boolean` | YES | `false` |
| `deleted_at` | `timestamp without time zone` | YES | `` |
| `created_by` | `integer` | YES | `` |
| `updated_by` | `integer` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `leave_approvals`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `approver_id` -> `employees.id`
  - `leave_id` -> `leave_applications.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('leave_approvals_id_seq'::regclass)` |
| `leave_id` | `integer` | NO | `` |
| `approver_id` | `integer` | NO | `` |
| `level` | `character varying` | NO | `'MANAGER'::character varying` |
| `action` | `character varying` | NO | `` |
| `comment` | `text` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `leave_balance_ledger`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `created_by` -> `employees.id`
  - `employee_id` -> `employees.id`
  - `leave_type_id` -> `leave_types.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('leave_balance_ledger_id_seq'::regclass)` |
| `employee_id` | `integer` | NO | `` |
| `leave_type_id` | `integer` | NO | `` |
| `transaction_type` | `character varying` | NO | `` |
| `amount` | `numeric` | NO | `` |
| `opening_balance` | `numeric` | NO | `` |
| `closing_balance` | `numeric` | NO | `` |
| `reason` | `text` | YES | `` |
| `created_by` | `integer` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `leave_balance_transactions`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `created_by` -> `employees.id`
  - `employee_id` -> `employees.id`
  - `leave_type_id` -> `leave_types.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('leave_balance_transactions_id_seq'::regclass)` |
| `employee_id` | `integer` | NO | `` |
| `leave_type_id` | `integer` | NO | `` |
| `transaction_type` | `character varying` | NO | `` |
| `days_changed` | `numeric` | NO | `` |
| `opening_balance` | `numeric` | NO | `` |
| `closing_balance` | `numeric` | NO | `` |
| `reference_type` | `character varying` | YES | `` |
| `reference_id` | `integer` | YES | `` |
| `description` | `text` | NO | `` |
| `created_by` | `integer` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `leave_balances`

- **Row Count**: 18
- **Primary Key**: id
- **Foreign Keys**:
  - `employee_id` -> `employees.id`
  - `leave_type_id` -> `leave_types.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('leave_balances_id_seq'::regclass)` |
| `employee_id` | `integer` | NO | `` |
| `leave_type_id` | `integer` | NO | `` |
| `total_allocated` | `numeric` | NO | `12` |
| `used_days` | `numeric` | YES | `0` |
| `remaining_days` | `numeric` | NO | `12` |
| `updated_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `leave_carry_forward_history`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `employee_id` -> `employees.id`
  - `leave_type_id` -> `leave_types.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('leave_carry_forward_history_id_seq'::regclass)` |
| `employee_id` | `integer` | NO | `` |
| `leave_type_id` | `integer` | NO | `` |
| `year` | `integer` | NO | `` |
| `days_carried` | `numeric` | NO | `` |
| `days_expired` | `numeric` | NO | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `leave_comp_offs`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `approved_by` -> `employees.id`
  - `employee_id` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('leave_comp_offs_id_seq'::regclass)` |
| `employee_id` | `integer` | NO | `` |
| `date_worked` | `date` | NO | `` |
| `days_granted` | `numeric` | NO | `1.0` |
| `expiry_date` | `date` | NO | `` |
| `status` | `character varying` | YES | `'PENDING'::character varying` |
| `reason` | `text` | NO | `` |
| `approved_by` | `integer` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `leave_conflicts`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `leave_id` -> `leave_applications.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('leave_conflicts_id_seq'::regclass)` |
| `leave_id` | `integer` | NO | `` |
| `conflict_type` | `character varying` | NO | `` |
| `conflict_description` | `text` | NO | `` |
| `severity` | `character varying` | YES | `'WARNING'::character varying` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `leave_encashments`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `approved_by` -> `employees.id`
  - `employee_id` -> `employees.id`
  - `leave_type_id` -> `leave_types.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('leave_encashments_id_seq'::regclass)` |
| `employee_id` | `integer` | NO | `` |
| `leave_type_id` | `integer` | NO | `` |
| `days_encashed` | `numeric` | YES | `0` |
| `requested_days` | `numeric` | YES | `0` |
| `amount_per_day` | `numeric` | YES | `0` |
| `total_amount` | `numeric` | YES | `0` |
| `status` | `character varying` | YES | `'PENDING'::character varying` |
| `approved_by` | `integer` | YES | `` |
| `rejection_reason` | `text` | YES | `` |
| `requested_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `leave_policies`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `branch_id` -> `branches.id`
  - `department_id` -> `departments.id`
  - `leave_type_id` -> `leave_types.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('leave_policies_id_seq'::regclass)` |
| `name` | `character varying` | NO | `` |
| `code` | `character varying` | NO | `` |
| `description` | `text` | YES | `` |
| `leave_type_id` | `integer` | YES | `` |
| `annual_allocation` | `numeric` | NO | `12.0` |
| `monthly_accrual` | `numeric` | NO | `1.0` |
| `max_balance` | `numeric` | YES | `30.0` |
| `carry_forward_limit` | `numeric` | YES | `6.0` |
| `encashment_limit` | `numeric` | YES | `0.0` |
| `half_day_allowed` | `boolean` | YES | `true` |
| `hourly_leave_allowed` | `boolean` | YES | `false` |
| `negative_balance_allowed` | `boolean` | YES | `false` |
| `probation_applicable` | `boolean` | YES | `true` |
| `min_notice_days` | `integer` | YES | `0` |
| `max_consecutive_days` | `integer` | YES | `14` |
| `attachment_required` | `boolean` | YES | `false` |
| `is_active` | `boolean` | YES | `true` |
| `branch_id` | `integer` | YES | `` |
| `department_id` | `integer` | YES | `` |
| `deleted_at` | `timestamp without time zone` | YES | `` |
| `created_by` | `integer` | YES | `` |
| `updated_by` | `integer` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `leave_policy_assignments`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `branch_id` -> `branches.id`
  - `department_id` -> `departments.id`
  - `employee_id` -> `employees.id`
  - `policy_id` -> `leave_policies.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('leave_policy_assignments_id_seq'::regclass)` |
| `policy_id` | `integer` | NO | `` |
| `employee_id` | `integer` | YES | `` |
| `department_id` | `integer` | YES | `` |
| `branch_id` | `integer` | YES | `` |
| `role` | `character varying` | YES | `` |
| `employment_type` | `character varying` | YES | `` |
| `effective_date` | `date` | NO | `CURRENT_DATE` |
| `expiry_date` | `date` | YES | `` |
| `is_active` | `boolean` | YES | `true` |
| `deleted_at` | `timestamp without time zone` | YES | `` |
| `created_by` | `integer` | YES | `` |
| `updated_by` | `integer` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `leave_request_comments`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `commenter_id` -> `employees.id`
  - `leave_id` -> `leave_applications.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('leave_request_comments_id_seq'::regclass)` |
| `leave_id` | `integer` | NO | `` |
| `commenter_id` | `integer` | NO | `` |
| `comment` | `text` | NO | `` |
| `is_internal` | `boolean` | YES | `false` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `leave_settings`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**: None

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('leave_settings_id_seq'::regclass)` |
| `leave_year_start_month` | `integer` | YES | `1` |
| `auto_carry_forward` | `boolean` | YES | `true` |
| `max_negative_days` | `numeric` | YES | `0` |
| `sandwich_rule_enabled` | `boolean` | YES | `false` |
| `updated_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `leave_types`

- **Row Count**: 5
- **Primary Key**: id
- **Foreign Keys**: None

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('leave_types_id_seq'::regclass)` |
| `name` | `character varying` | NO | `` |
| `code` | `character varying` | NO | `` |
| `color` | `character varying` | YES | `'#3B82F6'::character varying` |
| `days_allowed` | `integer` | NO | `12` |
| `is_carry_forward` | `boolean` | YES | `true` |
| `is_paid` | `boolean` | YES | `true` |
| `is_encashable` | `boolean` | YES | `false` |
| `max_consecutive_days` | `integer` | YES | `14` |
| `requires_attachment` | `boolean` | YES | `false` |
| `description` | `text` | YES | `` |
| `is_active` | `boolean` | YES | `true` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `notification_devices`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `employee_id` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('notification_devices_id_seq'::regclass)` |
| `employee_id` | `integer` | NO | `` |
| `device_token` | `text` | NO | `` |
| `platform` | `character varying` | YES | `'ANDROID'::character varying` |
| `is_active` | `boolean` | YES | `true` |
| `last_seen` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `notification_preferences`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `employee_id` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('notification_preferences_id_seq'::regclass)` |
| `employee_id` | `integer` | NO | `` |
| `module` | `character varying` | NO | `` |
| `enable_in_app` | `boolean` | YES | `true` |
| `enable_push` | `boolean` | YES | `true` |
| `enable_email` | `boolean` | YES | `true` |

---

## Table: `notifications`

- **Row Count**: 8
- **Primary Key**: id
- **Foreign Keys**:
  - `employee_id` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('notifications_id_seq'::regclass)` |
| `employee_id` | `integer` | NO | `` |
| `title` | `character varying` | NO | `` |
| `message` | `text` | NO | `` |
| `type` | `character varying` | YES | `'INFO'::character varying` |
| `channel` | `character varying` | YES | `'IN_APP'::character varying` |
| `priority` | `character varying` | YES | `'NORMAL'::character varying` |
| `deep_link` | `text` | YES | `` |
| `is_read` | `boolean` | YES | `false` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `optional_holiday_selections`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `employee_id` -> `employees.id`
  - `holiday_id` -> `holidays.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('optional_holiday_selections_id_seq'::regclass)` |
| `employee_id` | `integer` | NO | `` |
| `holiday_id` | `integer` | NO | `` |
| `year` | `integer` | NO | `` |
| `status` | `character varying` | YES | `'APPROVED'::character varying` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `organizations`

- **Row Count**: 1
- **Primary Key**: id
- **Foreign Keys**: None

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('organizations_id_seq'::regclass)` |
| `name` | `character varying` | NO | `` |
| `code` | `character varying` | NO | `` |
| `tax_identifier` | `character varying` | YES | `` |
| `status` | `character varying` | YES | `'ACTIVE'::character varying` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `password_reset_tokens`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `employee_id` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('password_reset_tokens_id_seq'::regclass)` |
| `employee_id` | `integer` | NO | `` |
| `token` | `character varying` | NO | `` |
| `expires_at` | `timestamp without time zone` | NO | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `payroll_approvals`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `approver_id` -> `employees.id`
  - `run_id` -> `payroll_runs.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('payroll_approvals_id_seq'::regclass)` |
| `run_id` | `integer` | NO | `` |
| `approver_id` | `integer` | NO | `` |
| `level` | `character varying` | NO | `` |
| `status` | `character varying` | YES | `'APPROVED'::character varying` |
| `comment` | `text` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `payroll_run_items`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `employee_id` -> `employees.id`
  - `run_id` -> `payroll_runs.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('payroll_run_items_id_seq'::regclass)` |
| `run_id` | `integer` | NO | `` |
| `employee_id` | `integer` | NO | `` |
| `basic_salary` | `numeric` | YES | `0` |
| `hra` | `numeric` | YES | `0` |
| `special_allowance` | `numeric` | YES | `0` |
| `overtime_pay` | `numeric` | YES | `0` |
| `night_shift_pay` | `numeric` | YES | `0` |
| `bonus` | `numeric` | YES | `0` |
| `reimbursements` | `numeric` | YES | `0` |
| `gross_salary` | `numeric` | YES | `0` |
| `pf_deduction` | `numeric` | YES | `0` |
| `pt_deduction` | `numeric` | YES | `0` |
| `esi_deduction` | `numeric` | YES | `0` |
| `tds_deduction` | `numeric` | YES | `0` |
| `loan_deduction` | `numeric` | YES | `0` |
| `advance_deduction` | `numeric` | YES | `0` |
| `lop_deduction` | `numeric` | YES | `0` |
| `arrears` | `numeric` | YES | `0` |
| `net_salary` | `numeric` | YES | `0` |
| `working_days` | `integer` | YES | `22` |
| `present_days` | `integer` | YES | `22` |
| `absent_days` | `integer` | YES | `0` |
| `lop_days` | `numeric` | YES | `0` |
| `ot_hours` | `numeric` | YES | `0` |
| `warning_flags` | `text` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `payroll_runs`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `approved_by` -> `employees.id`
  - `created_by` -> `employees.id`
  - `locked_by` -> `employees.id`
  - `updated_by` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('payroll_runs_id_seq'::regclass)` |
| `period_name` | `character varying` | YES | `` |
| `month` | `character varying` | YES | `` |
| `year` | `integer` | YES | `` |
| `start_date` | `date` | YES | `` |
| `end_date` | `date` | YES | `` |
| `status` | `character varying` | YES | `'DRAFT'::character varying` |
| `gross_payroll` | `numeric` | YES | `0` |
| `total_gross` | `numeric` | YES | `0` |
| `total_deductions` | `numeric` | YES | `0` |
| `net_payroll` | `numeric` | YES | `0` |
| `total_net` | `numeric` | YES | `0` |
| `total_employees` | `integer` | YES | `0` |
| `locked_by` | `integer` | YES | `` |
| `locked_at` | `timestamp without time zone` | YES | `` |
| `created_by` | `integer` | YES | `` |
| `updated_by` | `integer` | YES | `` |
| `approved_by` | `integer` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `payroll_settings`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `updated_by` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('payroll_settings_id_seq'::regclass)` |
| `payroll_cycle` | `character varying` | YES | `'MONTHLY'::character varying` |
| `cutoff_day` | `integer` | YES | `25` |
| `pay_day` | `integer` | YES | `1` |
| `working_days_month` | `integer` | YES | `22` |
| `pf_rate` | `numeric` | YES | `12.00` |
| `esi_rate` | `numeric` | YES | `0.75` |
| `pt_amount` | `numeric` | YES | `200.00` |
| `updated_by` | `integer` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `payrolls`

- **Row Count**: 6
- **Primary Key**: id
- **Foreign Keys**:
  - `employee_id` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('payrolls_id_seq'::regclass)` |
| `employee_id` | `integer` | NO | `` |
| `month` | `character varying` | NO | `` |
| `year` | `integer` | NO | `` |
| `basic_salary` | `numeric` | NO | `` |
| `hra` | `numeric` | NO | `` |
| `conveyance` | `numeric` | NO | `` |
| `allowances` | `numeric` | NO | `` |
| `gross_salary` | `numeric` | NO | `` |
| `pf_deduction` | `numeric` | NO | `` |
| `esi_deduction` | `numeric` | NO | `` |
| `tds_deduction` | `numeric` | NO | `` |
| `net_salary` | `numeric` | NO | `` |
| `payment_status` | `character varying` | YES | `'PAID'::character varying` |
| `payment_date` | `date` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `payslip_documents`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `created_by` -> `employees.id`
  - `employee_id` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('payslip_documents_id_seq'::regclass)` |
| `employee_id` | `integer` | NO | `` |
| `month` | `character varying` | NO | `` |
| `year` | `integer` | NO | `` |
| `gross_salary` | `numeric` | NO | `` |
| `net_salary` | `numeric` | NO | `` |
| `total_deductions` | `numeric` | NO | `` |
| `qr_verification_code` | `character varying` | NO | `` |
| `is_released` | `boolean` | YES | `true` |
| `created_by` | `integer` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `payslip_download_logs`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `employee_id` -> `employees.id`
  - `payslip_id` -> `payslip_documents.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('payslip_download_logs_id_seq'::regclass)` |
| `payslip_id` | `integer` | NO | `` |
| `employee_id` | `integer` | NO | `` |
| `ip_address` | `character varying` | YES | `` |
| `downloaded_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `permissions`

- **Row Count**: 11
- **Primary Key**: id
- **Foreign Keys**: None

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('permissions_id_seq'::regclass)` |
| `permission_code` | `character varying` | NO | `` |
| `code` | `character varying` | YES | `` |
| `name` | `character varying` | YES | `` |
| `category` | `character varying` | NO | `` |
| `module` | `character varying` | YES | `` |
| `description` | `text` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `project_categories`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**: None

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('project_categories_id_seq'::regclass)` |
| `name` | `character varying` | NO | `` |
| `code` | `character varying` | NO | `` |
| `description` | `text` | YES | `` |
| `is_active` | `boolean` | YES | `true` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `project_members`

- **Row Count**: 5
- **Primary Key**: id
- **Foreign Keys**:
  - `employee_id` -> `employees.id`
  - `project_id` -> `projects.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('project_members_id_seq'::regclass)` |
| `project_id` | `integer` | NO | `` |
| `employee_id` | `integer` | NO | `` |
| `role_in_project` | `character varying` | YES | `'MEMBER'::character varying` |
| `assigned_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `project_members_v2`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `employee_id` -> `employees.id`
  - `project_id` -> `projects.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('project_members_v2_id_seq'::regclass)` |
| `project_id` | `integer` | NO | `` |
| `employee_id` | `integer` | NO | `` |
| `role` | `character varying` | YES | `'DEVELOPER'::character varying` |

---

## Table: `project_tasks`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `assignee_id` -> `employees.id`
  - `created_by` -> `employees.id`
  - `project_id` -> `projects.id`
  - `reporter_id` -> `employees.id`
  - `updated_by` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('project_tasks_id_seq'::regclass)` |
| `task_number` | `character varying` | NO | `` |
| `title` | `character varying` | NO | `` |
| `description` | `text` | YES | `` |
| `project_id` | `integer` | NO | `` |
| `sprint_id` | `integer` | YES | `` |
| `task_type` | `character varying` | YES | `'FEATURE'::character varying` |
| `priority` | `character varying` | YES | `'MEDIUM'::character varying` |
| `status` | `character varying` | YES | `'TO_DO'::character varying` |
| `assignee_id` | `integer` | YES | `` |
| `reporter_id` | `integer` | YES | `` |
| `estimated_hours` | `integer` | YES | `0` |
| `actual_hours` | `integer` | YES | `0` |
| `story_points` | `integer` | YES | `3` |
| `progress_percentage` | `integer` | YES | `0` |
| `due_date` | `date` | YES | `` |
| `created_by` | `integer` | YES | `` |
| `updated_by` | `integer` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `project_work_updates`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `employee_id` -> `employees.id`
  - `task_id` -> `tasks.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('project_work_updates_id_seq'::regclass)` |
| `task_id` | `integer` | NO | `` |
| `employee_id` | `integer` | NO | `` |
| `work_completed` | `text` | NO | `` |
| `hours_worked` | `numeric` | NO | `` |
| `progress_pct` | `integer` | NO | `` |
| `blockers` | `text` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `projects`

- **Row Count**: 3
- **Primary Key**: id
- **Foreign Keys**: None

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('projects_id_seq'::regclass)` |
| `name` | `character varying` | NO | `` |
| `code` | `character varying` | NO | `` |
| `description` | `text` | YES | `` |
| `client_name` | `character varying` | NO | `` |
| `start_date` | `date` | NO | `` |
| `end_date` | `date` | NO | `` |
| `budget` | `numeric` | NO | `` |
| `status` | `character varying` | YES | `'IN_PROGRESS'::character varying` |
| `progress` | `integer` | YES | `0` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `purchase_orders`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `created_by` -> `employees.id`
  - `request_id` -> `asset_requests.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('purchase_orders_id_seq'::regclass)` |
| `po_number` | `character varying` | NO | `` |
| `request_id` | `integer` | YES | `` |
| `vendor_name` | `character varying` | NO | `` |
| `total_amount` | `numeric` | NO | `` |
| `status` | `character varying` | YES | `'APPROVED'::character varying` |
| `expected_delivery` | `date` | YES | `` |
| `created_by` | `integer` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `quick_actions`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**: None

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('quick_actions_id_seq'::regclass)` |
| `action_key` | `character varying` | NO | `` |
| `label` | `character varying` | NO | `` |
| `icon` | `character varying` | NO | `` |
| `path` | `character varying` | NO | `` |
| `role_permissions` | `text` | YES | `'ALL'::text` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `recruitments`

- **Row Count**: 3
- **Primary Key**: id
- **Foreign Keys**:
  - `department_id` -> `departments.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('recruitments_id_seq'::regclass)` |
| `job_title` | `character varying` | NO | `` |
| `department_id` | `integer` | YES | `` |
| `openings` | `integer` | NO | `1` |
| `experience_required` | `character varying` | NO | `` |
| `salary_range` | `character varying` | NO | `` |
| `status` | `character varying` | YES | `'OPEN'::character varying` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `regions`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**: None

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('regions_id_seq'::regclass)` |
| `name` | `character varying` | NO | `` |
| `code` | `character varying` | NO | `` |
| `description` | `text` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `regularization_audit`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `actor_id` -> `employees.id`
  - `regularization_id` -> `attendance_regularizations.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('regularization_audit_id_seq'::regclass)` |
| `regularization_id` | `integer` | NO | `` |
| `actor_id` | `integer` | NO | `` |
| `action` | `character varying` | NO | `` |
| `from_status` | `character varying` | YES | `` |
| `to_status` | `character varying` | YES | `` |
| `notes` | `text` | YES | `` |
| `created_at` | `timestamp without time zone` | NO | `CURRENT_TIMESTAMP` |

---

## Table: `regularization_comments`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `commenter_id` -> `employees.id`
  - `regularization_id` -> `attendance_regularizations.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('regularization_comments_id_seq'::regclass)` |
| `regularization_id` | `integer` | NO | `` |
| `commenter_id` | `integer` | NO | `` |
| `comment` | `text` | NO | `` |
| `is_internal` | `boolean` | NO | `false` |
| `created_at` | `timestamp without time zone` | NO | `CURRENT_TIMESTAMP` |

---

## Table: `role_permissions`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `permission_id` -> `permissions.id`
  - `role_id` -> `roles.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('role_permissions_id_seq'::regclass)` |
| `role_id` | `integer` | YES | `` |
| `permission_id` | `integer` | YES | `` |
| `role` | `character varying` | YES | `` |
| `permission_code` | `character varying` | YES | `` |
| `scope` | `character varying` | YES | `'ORGANIZATION'::character varying` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `roles`

- **Row Count**: 4
- **Primary Key**: id
- **Foreign Keys**:
  - `organization_id` -> `organizations.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('roles_id_seq'::regclass)` |
| `organization_id` | `integer` | YES | `1` |
| `name` | `character varying` | NO | `` |
| `description` | `text` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `salary_components`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**: None

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('salary_components_id_seq'::regclass)` |
| `code` | `character varying` | NO | `` |
| `name` | `character varying` | NO | `` |
| `type` | `character varying` | NO | `` |
| `calculation_type` | `character varying` | YES | `'PERCENTAGE_OF_BASIC'::character varying` |
| `default_value` | `numeric` | YES | `0` |
| `is_taxable` | `boolean` | YES | `true` |
| `is_active` | `boolean` | YES | `true` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `salary_revisions`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `approved_by` -> `employees.id`
  - `created_by` -> `employees.id`
  - `employee_id` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('salary_revisions_id_seq'::regclass)` |
| `employee_id` | `integer` | NO | `` |
| `old_ctc` | `numeric` | NO | `` |
| `new_ctc` | `numeric` | NO | `` |
| `revision_type` | `character varying` | NO | `` |
| `effective_date` | `date` | NO | `` |
| `reason` | `text` | NO | `` |
| `status` | `character varying` | YES | `'APPROVED'::character varying` |
| `approved_by` | `integer` | YES | `` |
| `created_by` | `integer` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `salary_template_components`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `component_id` -> `salary_components.id`
  - `template_id` -> `salary_templates.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('salary_template_components_id_seq'::regclass)` |
| `template_id` | `integer` | NO | `` |
| `component_id` | `integer` | NO | `` |
| `amount` | `numeric` | YES | `0` |
| `percentage` | `numeric` | YES | `0` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `salary_templates`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `branch_id` -> `branches.id`
  - `created_by` -> `employees.id`
  - `department_id` -> `departments.id`
  - `updated_by` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('salary_templates_id_seq'::regclass)` |
| `name` | `character varying` | NO | `` |
| `description` | `text` | YES | `` |
| `annual_ctc` | `numeric` | NO | `` |
| `employment_type` | `character varying` | YES | `'PERMANENT'::character varying` |
| `branch_id` | `integer` | YES | `` |
| `department_id` | `integer` | YES | `` |
| `is_active` | `boolean` | YES | `true` |
| `created_by` | `integer` | YES | `` |
| `updated_by` | `integer` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `system_config`

- **Row Count**: 1
- **Primary Key**: id
- **Foreign Keys**: None

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `character varying` | NO | `'MAIN'::character varying` |
| `company_name` | `character varying` | YES | `'THEIAKSHI ENTERPRISES'::character varying` |
| `shift_start_time` | `character varying` | YES | `'09:00'::character varying` |
| `shift_end_time` | `character varying` | YES | `'18:00'::character varying` |
| `grace_minutes` | `integer` | YES | `15` |
| `half_day_threshold_time` | `character varying` | YES | `'11:30'::character varying` |
| `auto_deduct_leave_for_two_half_days` | `boolean` | YES | `true` |
| `require_gps_clock_in` | `boolean` | YES | `true` |
| `currency` | `character varying` | YES | `'INR'::character varying` |
| `updated_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `task_daily_reports`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `employee_id` -> `employees.id`
  - `reviewed_by` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('task_daily_reports_id_seq'::regclass)` |
| `employee_id` | `integer` | NO | `` |
| `report_date` | `date` | NO | `` |
| `completed_work` | `text` | NO | `` |
| `upcoming_plan` | `text` | YES | `` |
| `blockers` | `text` | YES | `` |
| `hours_worked` | `numeric` | YES | `8.0` |
| `status` | `character varying` | YES | `'SUBMITTED'::character varying` |
| `manager_feedback` | `text` | YES | `` |
| `reviewed_by` | `integer` | YES | `` |
| `reviewed_at` | `timestamp without time zone` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |
| `updated_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `tasks`

- **Row Count**: 3
- **Primary Key**: id
- **Foreign Keys**:
  - `assigned_to` -> `employees.id`
  - `project_id` -> `projects.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('tasks_id_seq'::regclass)` |
| `project_id` | `integer` | NO | `` |
| `title` | `character varying` | NO | `` |
| `description` | `text` | YES | `` |
| `assigned_to` | `integer` | YES | `` |
| `due_date` | `date` | NO | `` |
| `priority` | `character varying` | YES | `'MEDIUM'::character varying` |
| `status` | `character varying` | YES | `'TODO'::character varying` |
| `progress_pct` | `integer` | YES | `0` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `ticket_activity_log`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `actor_id` -> `employees.id`
  - `ticket_id` -> `helpdesk_tickets.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('ticket_activity_log_id_seq'::regclass)` |
| `ticket_id` | `integer` | NO | `` |
| `actor_id` | `integer` | NO | `` |
| `action_type` | `character varying` | NO | `` |
| `from_value` | `character varying` | YES | `` |
| `to_value` | `character varying` | YES | `` |
| `details` | `text` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `ticket_attachments`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `ticket_id` -> `helpdesk_tickets.id`
  - `uploaded_by` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('ticket_attachments_id_seq'::regclass)` |
| `ticket_id` | `integer` | NO | `` |
| `file_name` | `character varying` | NO | `` |
| `file_url` | `text` | NO | `` |
| `file_type` | `character varying` | YES | `` |
| `file_size_bytes` | `integer` | YES | `0` |
| `uploaded_by` | `integer` | NO | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `ticket_comments`

- **Row Count**: 1
- **Primary Key**: id
- **Foreign Keys**:
  - `author_id` -> `employees.id`
  - `ticket_id` -> `helpdesk_tickets.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('ticket_comments_id_seq'::regclass)` |
| `ticket_id` | `integer` | NO | `` |
| `author_id` | `integer` | NO | `` |
| `comment_text` | `text` | NO | `` |
| `is_internal_note` | `boolean` | YES | `false` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `ticket_escalation_rules`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `category_id` -> `helpdesk_categories.id`
  - `escalate_to_employee_id` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('ticket_escalation_rules_id_seq'::regclass)` |
| `category_id` | `integer` | YES | `` |
| `priority` | `character varying` | NO | `` |
| `escalation_after_hours` | `integer` | NO | `4` |
| `escalate_to_role` | `character varying` | NO | `'HR_MANAGER'::character varying` |
| `escalate_to_employee_id` | `integer` | YES | `` |
| `notify_manager` | `boolean` | YES | `true` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `ticket_satisfaction_ratings`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `employee_id` -> `employees.id`
  - `ticket_id` -> `helpdesk_tickets.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('ticket_satisfaction_ratings_id_seq'::regclass)` |
| `ticket_id` | `integer` | NO | `` |
| `employee_id` | `integer` | NO | `` |
| `rating` | `integer` | NO | `` |
| `feedback` | `text` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `ticket_sla_rules`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**: None

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('ticket_sla_rules_id_seq'::regclass)` |
| `category` | `character varying` | NO | `` |
| `priority` | `character varying` | NO | `` |
| `resolution_hours` | `integer` | YES | `24` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `ticket_tags`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `ticket_id` -> `helpdesk_tickets.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('ticket_tags_id_seq'::regclass)` |
| `ticket_id` | `integer` | NO | `` |
| `tag_name` | `character varying` | NO | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `ticket_watchers`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `added_by` -> `employees.id`
  - `employee_id` -> `employees.id`
  - `ticket_id` -> `helpdesk_tickets.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('ticket_watchers_id_seq'::regclass)` |
| `ticket_id` | `integer` | NO | `` |
| `employee_id` | `integer` | NO | `` |
| `added_by` | `integer` | YES | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `user_refresh_tokens`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `employee_id` -> `employees.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('user_refresh_tokens_id_seq'::regclass)` |
| `employee_id` | `integer` | NO | `` |
| `token` | `text` | NO | `` |
| `is_revoked` | `boolean` | YES | `false` |
| `expires_at` | `timestamp without time zone` | NO | `` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

## Table: `vendor_quotations`

- **Row Count**: 0
- **Primary Key**: id
- **Foreign Keys**:
  - `request_id` -> `asset_requests.id`

| Column | Data Type | Nullable | Default |
|---|---|---|---|
| `id` | `integer` | NO | `nextval('vendor_quotations_id_seq'::regclass)` |
| `request_id` | `integer` | NO | `` |
| `vendor_name` | `character varying` | NO | `` |
| `quotation_amount` | `numeric` | NO | `` |
| `delivery_days` | `integer` | YES | `3` |
| `is_selected` | `boolean` | YES | `false` |
| `created_at` | `timestamp without time zone` | YES | `CURRENT_TIMESTAMP` |

---

