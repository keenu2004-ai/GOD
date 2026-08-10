# DATABASE SCHEMA MISMATCH REPORT

Generated: 2026-08-10T11:21:27.747Z

| Table | Actual Column | Code Expects | Problem | Fix |
|---|---|---|---|---|
| `employees` | `organization_id` (Integer, default 1) | `organization_id` | Code queries assume multi-tenant organization_id filter. DB contains 1 default organization (Single Company HRMS). | Keep single-company default organization_id = 1 fallback in all backend queries |
| `calendar_tasks` | Table Missing | `calendar_tasks` | Unified Calendar Task feature table is missing from live database | Create `calendar_tasks` table with foreign keys to employees |
| `salary_certificates` | Table Purged (Correct) | N/A | Table cleanly purged | None |
