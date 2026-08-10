# CALENDAR INTEGRATION REPORT

Generated: 2026-08-10

### Unified Event Sources

1. **Holidays** (`holidays` table)
   - Integrated: Yes
   - Direct Query: `SELECT * FROM holidays WHERE date >= $1 AND date <= $2`
   - Mapping: `id`, `type: 'HOLIDAY'`, `title`, `start`, `status: 'HOLIDAY'`

2. **Leaves** (`leaves` view / `leave_applications` table)
   - Integrated: Yes
   - Direct Query: `SELECT * FROM leaves WHERE start_date <= $2 AND end_date >= $1 AND status IN ('APPROVED', 'PENDING', ...)`
   - Mapping: `id`, `type: 'LEAVE'`, `title`, `start`, `end`, `status`, `employeeId`, `employeeName`

3. **Attendance** (`attendance` table)
   - Integrated: Yes
   - Direct Query: `SELECT * FROM attendance WHERE date >= $1 AND date <= $2`
   - Mapping: `id`, `type: 'ATTENDANCE'`, `title`, `start`, `status`, `employeeId`, `employeeName`

4. **Attendance Regularization** (`attendance_regularizations` table)
   - Integrated: Yes
   - Direct Query: `SELECT * FROM attendance_regularizations WHERE attendance_date >= $1 AND attendance_date <= $2`
   - Mapping: `id`, `type: 'REGULARIZATION'`, `title`, `start`, `status`, `employeeId`, `employeeName`

5. **Calendar Tasks** (`calendar_tasks` table)
   - Integrated: Yes
   - Direct Query: `SELECT * FROM calendar_tasks WHERE task_date >= $1 AND task_date <= $2`
   - Mapping: `id`, `type: 'TASK'`, `title`, `start`, `status`, `employeeId`, `employeeName`
   - CRUD API Endpoints: `GET /calendar/tasks`, `POST /calendar/tasks`, `GET /calendar/tasks/:id`, `PATCH /calendar/tasks/:id`, `DELETE /calendar/tasks/:id`

6. **Announcements** (`announcements` table)
   - Integrated: Yes
   - Direct Query: Dated company announcements mapped into date grid.

### Navigation & Click-Through
- Clicking Attendance event -> Navigates to Attendance module
- Clicking Leave event -> Navigates to Leave Management
- Clicking Holiday event -> Navigates to Holidays page
- Clicking Task event -> Opens interactive Task Edit/Delete modal
