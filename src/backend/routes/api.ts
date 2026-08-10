import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { employeeManagementController } from '../controllers/employeeManagementController.js';
import { employeeController } from '../controllers/employeeController.js';
import { attendanceController } from '../controllers/attendanceController.js';
import { regularizationController } from '../controllers/regularizationController.js';
import { attendanceManagementController } from '../controllers/attendanceManagementController.js';
import { leaveManagementController } from '../controllers/leaveManagementController.js';
import { payrollManagementController } from '../controllers/payrollManagementController.js';
import { leaveController } from '../controllers/leaveController.js';
import { payrollController } from '../controllers/payrollController.js';
import { expenseController } from '../controllers/expenseController.js';
import { projectController } from '../controllers/projectController.js';
import { dashboardController } from '../controllers/dashboardController.js';
import { miscController } from '../controllers/miscController.js';
import { analyticsController } from '../controllers/analyticsController.js';
import { attendanceFinalizationController } from '../controllers/attendanceFinalizationController.js';
import { leavePolicyController } from '../controllers/leavePolicyController.js';
import { leaveWorkflowController } from '../controllers/leaveWorkflowController.js';
import { leaveBalanceEngineController } from '../controllers/leaveBalanceEngineController.js';
import { holidayEngineController } from '../controllers/holidayEngineController.js';
import { leaveFinalizationController } from '../controllers/leaveFinalizationController.js';
import { complianceController } from '../controllers/complianceController.js';
import { payrollFoundationController } from '../controllers/payrollFoundationController.js';
import { payslipPortalController } from '../controllers/payslipPortalController.js';
import { payrollAutomationController } from '../controllers/payrollAutomationController.js';
import { enterpriseProjectController } from '../controllers/enterpriseProjectController.js';
import { weeklyPlannerController } from '../controllers/weeklyPlannerController.js';
import { projectTaskController } from '../controllers/projectTaskController.js';
import { notificationEngineController } from '../controllers/notificationEngineController.js';
import { assetManagementController } from '../controllers/assetManagementController.js';
import { helpdeskTicketController } from '../controllers/helpdeskTicketController.js';
import { helpdeskController } from '../controllers/helpdeskController.js';
import { helpdeskEnterpriseController } from '../controllers/helpdeskEnterpriseController.js';
import { expenseManagementController } from '../controllers/expenseManagementController.js';
import { organizationController } from '../controllers/organizationController.js';
import { calendarController } from '../controllers/calendarController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = Router();

// 1. Auth Routes
router.post('/auth/login', (req, res) => authController.login(req, res));
router.post('/auth/logout', authenticateToken, (req, res) => authController.logout(req, res));
router.post('/auth/refresh', (req, res) => authController.refreshToken(req, res));
router.post('/auth/forgot-password', (req, res) => authController.forgotPassword(req, res));
router.post('/auth/reset-password-token', (req, res) => authController.resetPasswordByToken(req, res));
router.get('/auth/me', authenticateToken, (req, res) => authController.getProfile(req, res));
router.post('/auth/change-password', authenticateToken, (req, res) => authController.changePassword(req, res));
router.post('/auth/reset-password', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER'), (req, res) => authController.resetPassword(req, res));
router.get('/auth/login-history', authenticateToken, (req, res) => authController.getLoginHistory(req, res));
router.get('/auth/roles-permissions', authenticateToken, authorizeRoles('ADMIN'), (req, res) => authController.getRolesAndPermissions(req, res));
router.put('/auth/roles-permissions', authenticateToken, authorizeRoles('ADMIN'), (req, res) => authController.updateRolePermissions(req, res));

router.post('/seed', async (req, res) => {
  try {
    const { seedDatabase } = await import('../database/seed.js');
    await seedDatabase();
    return res.json({ success: true, message: 'Database seeded successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Dashboard Routes
router.get('/dashboard/metrics', authenticateToken, (req, res) => dashboardController.getMetrics(req, res));
router.get('/dashboard/summary', authenticateToken, (req, res) => dashboardController.getMetrics(req, res));
router.get('/dashboard/cards', authenticateToken, (req, res) => dashboardController.getMetrics(req, res));
router.get('/dashboard/widgets', authenticateToken, (req, res) => dashboardController.getMetrics(req, res));
router.get('/dashboard/activity', authenticateToken, (req, res) => dashboardController.getActivity(req, res));
router.get('/dashboard/departments', authenticateToken, (req, res) => dashboardController.getDepartments(req, res));
router.get('/dashboard/payroll', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER'), (req, res) => dashboardController.getPayrollSummary(req, res));
router.get('/dashboard/announcements', authenticateToken, (req, res) => dashboardController.getAnnouncements(req, res));
router.get('/dashboard/celebrations', authenticateToken, (req, res) => dashboardController.getCelebrations(req, res));
router.get('/dashboard/calendar', authenticateToken, (req, res) => dashboardController.getCalendar(req, res));
router.get('/dashboard/preferences', authenticateToken, (req, res) => dashboardController.getPreferences(req, res));
router.put('/dashboard/preferences', authenticateToken, (req, res) => dashboardController.updatePreferences(req, res));
router.get('/dashboard/quick-actions', authenticateToken, (req, res) => dashboardController.getMetrics(req, res));

// 3. Employee Module Routes
router.get('/employees', authenticateToken, (req, res) => employeeManagementController.getEmployees(req, res));
router.post('/employees', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => employeeManagementController.createEmployee(req, res));
router.post('/employees/create', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => employeeManagementController.createEmployee(req, res));
router.get('/employees/all', authenticateToken, (req, res) => employeeManagementController.getEmployees(req, res));
router.get('/employees/org-chart', authenticateToken, (req, res) => employeeManagementController.getOrgChartTree(req, res));
router.get('/employees/:id/profile', authenticateToken, (req, res) => employeeManagementController.getEmployeeProfile(req, res));
router.get('/employees/:id', authenticateToken, (req, res) => employeeController.getById(req, res));
router.put('/employees/:id', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER'), (req, res) => employeeController.update(req, res));
router.delete('/employees/:id', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER'), (req, res) => employeeController.softDelete(req, res));
router.post('/employees/:id/restore', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER'), (req, res) => employeeController.restore(req, res));
router.put('/employees/:id/role', authenticateToken, authorizeRoles('ADMIN'), (req, res) => employeeController.updateRole(req, res));
router.delete('/employees/:id/permanent', authenticateToken, authorizeRoles('ADMIN'), (req, res) => employeeController.permanentDelete(req, res));
router.post('/employees/:id/education', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER'), (req, res) => employeeController.addEducation(req, res));
router.post('/employees/:id/experience', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER'), (req, res) => employeeController.addExperience(req, res));

// 4. Attendance Module Routes
router.get('/attendance', authenticateToken, (req, res) => attendanceController.getHistory(req, res));
router.post('/attendance/clock-in', authenticateToken, (req, res) => attendanceManagementController.clockIn(req, res));
router.post('/attendance/clock-out', authenticateToken, (req, res) => attendanceManagementController.clockOut(req, res));
router.get('/attendance/today', authenticateToken, (req, res) => attendanceManagementController.getToday(req, res));
router.get('/attendance/my-history', authenticateToken, (req, res) => attendanceManagementController.getMyHistory(req, res));
router.post('/attendance/corrections', authenticateToken, (req, res) => attendanceManagementController.requestCorrection(req, res));
router.patch('/attendance/corrections/:id/approve', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'DEPT_HEAD'), (req, res) => attendanceManagementController.approveCorrection(req, res));
router.get('/attendance/my-status', authenticateToken, (req, res) => attendanceController.getMyStatus(req, res));
router.get('/attendance/history', authenticateToken, (req, res) => attendanceController.getHistory(req, res));
router.get('/attendance/summary', authenticateToken, (req, res) => attendanceController.getMonthlySummary(req, res));
router.get('/attendance/calendar', authenticateToken, (req, res) => attendanceController.getCalendar(req, res));
router.get('/attendance/live', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'DEPT_HEAD'), (req, res) => attendanceController.getLiveManagerDashboard(req, res));
router.get('/attendance/analytics', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'DEPT_HEAD'), (req, res) => attendanceController.getAnalytics(req, res));
router.post('/attendance/regularize', authenticateToken, (req, res) => attendanceController.applyRegularization(req, res));

// 4c. Enterprise Attendance Regularization Routes
router.get('/attendance/regularizations/request-types', authenticateToken, (req, res) => regularizationController.getRequestTypes(req, res));
router.get('/attendance/regularizations/stats', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'DEPT_HEAD'), (req, res) => regularizationController.getStats(req, res));
router.get('/attendance/regularizations', authenticateToken, (req, res) => regularizationController.getAll(req, res));
router.post('/attendance/regularizations', authenticateToken, (req, res) => regularizationController.submit(req, res));
router.post('/attendance/regularizations/bulk-approve', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'DEPT_HEAD'), (req, res) => regularizationController.bulkApprove(req, res));
router.get('/attendance/pending-approvals', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'DEPT_HEAD'), (req, res) => regularizationController.getPendingApprovals(req, res));
router.get('/attendance/regularizations/:id', authenticateToken, (req, res) => regularizationController.getById(req, res));
router.patch('/attendance/regularizations/:id/approve', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'DEPT_HEAD'), (req, res) => regularizationController.approve(req, res));
router.patch('/attendance/regularizations/:id/reject', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'DEPT_HEAD'), (req, res) => regularizationController.reject(req, res));
router.patch('/attendance/regularizations/:id/request-info', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'DEPT_HEAD'), (req, res) => regularizationController.requestInfo(req, res));
router.patch('/attendance/regularizations/:id/forward-hr', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'DEPT_HEAD'), (req, res) => regularizationController.forwardToHR(req, res));
router.post('/attendance/regularizations/:id/comments', authenticateToken, (req, res) => regularizationController.addComment(req, res));
router.delete('/attendance/regularizations/:id', authenticateToken, (req, res) => regularizationController.cancel(req, res));
// Legacy compat
router.put('/attendance/regularizations/:id/approve', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'DEPT_HEAD'), (req, res) => regularizationController.approve(req, res));

// 5. Leave Module & Policy Engine Routes
router.post('/leave/seed-defaults', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), (req, res) => leavePolicyController.seedDefaults(req, res));
router.get('/leave/types', authenticateToken, (req, res) => leavePolicyController.getTypes(req, res));
router.post('/leave/types', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => leavePolicyController.createType(req, res));
router.get('/leave/policies', authenticateToken, (req, res) => leavePolicyController.getPolicies(req, res));
router.post('/leave/policies', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => leavePolicyController.createPolicy(req, res));
router.patch('/leave/policies/:id', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => leavePolicyController.updatePolicy(req, res));
router.delete('/leave/policies/:id', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), (req, res) => leavePolicyController.deletePolicy(req, res));
router.post('/leave/policy/assign', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => leavePolicyController.assignPolicy(req, res));
router.get('/leave/assignments', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => leavePolicyController.getAssignments(req, res));
router.get('/leave/settings', authenticateToken, (req, res) => leavePolicyController.getSettings(req, res));
router.post('/leave/settings', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => leavePolicyController.updateSettings(req, res));
router.post('/leave/encash', authenticateToken, (req, res) => leavePolicyController.requestEncashment(req, res));
router.get('/leave/encashments', authenticateToken, (req, res) => leavePolicyController.getEncashments(req, res));
router.get('/leave/balance', authenticateToken, (req, res) => leaveManagementController.getBalances(req, res));
router.get('/leave/history', authenticateToken, (req, res) => leaveManagementController.getApplications(req, res));
router.post('/leaves/balances/adjust', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => leaveManagementController.adjustBalance(req, res));
router.get('/leaves/ledger', authenticateToken, (req, res) => leaveManagementController.getLedger(req, res));
router.post('/leaves/apply', authenticateToken, (req, res) => leaveManagementController.applyLeave(req, res));
router.get('/leaves/applications', authenticateToken, (req, res) => leaveManagementController.getApplications(req, res));
router.patch('/leaves/:id/approve', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'DEPT_HEAD'), (req, res) => leaveManagementController.approveLeave(req, res));
router.patch('/leaves/:id/cancel', authenticateToken, (req, res) => leaveManagementController.cancelLeave(req, res));

// 5b. Leave Request Workflow & Availability Routes
const leaveMgrRoles = ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'DEPT_HEAD'];
router.get('/leave/conflicts/check', authenticateToken, (req, res) => leaveWorkflowController.checkConflicts(req, res));
router.get('/leave/team-availability', authenticateToken, (req, res) => leaveWorkflowController.getTeamAvailability(req, res));
router.post('/leave/request', authenticateToken, (req, res) => leaveWorkflowController.submitRequest(req, res));
router.patch('/leave/requests/:id/approve', authenticateToken, authorizeRoles(...leaveMgrRoles), (req, res) => leaveWorkflowController.approve(req, res));
router.patch('/leave/requests/:id/reject', authenticateToken, authorizeRoles(...leaveMgrRoles), (req, res) => leaveWorkflowController.reject(req, res));
router.post('/leave/requests/bulk-approve', authenticateToken, authorizeRoles(...leaveMgrRoles), (req, res) => leaveWorkflowController.bulkApprove(req, res));
router.post('/leave/requests/:id/override', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), (req, res) => leaveWorkflowController.superAdminOverride(req, res));
router.get('/leave/calendar-events', authenticateToken, (req, res) => leaveWorkflowController.getCalendarEvents(req, res));

// 5c. Leave Balance Engine & Permanent Ledger Routes
router.post('/leave/adjust', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => leaveBalanceEngineController.adjustBalance(req, res));
router.post('/leave/accrue-monthly', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => leaveBalanceEngineController.runMonthlyAccrual(req, res));
router.post('/leave/comp-off/request', authenticateToken, (req, res) => leaveBalanceEngineController.requestCompOff(req, res));
router.patch('/leave/comp-off/:id/approve', authenticateToken, authorizeRoles(...leaveMgrRoles), (req, res) => leaveBalanceEngineController.approveCompOff(req, res));
router.post('/leave/carry-forward/run', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), (req, res) => leaveBalanceEngineController.runYearEndCarryForward(req, res));
router.get('/leave/ledger', authenticateToken, (req, res) => leaveBalanceEngineController.getLedger(req, res));
router.get('/leave/adjustments', authenticateToken, (req, res) => leaveBalanceEngineController.getAdjustments(req, res));
router.get('/leave/comp-offs', authenticateToken, (req, res) => leaveBalanceEngineController.getCompOffs(req, res));

// 5d. Enterprise Holiday Engine & Unified Calendar Feed Routes
router.post('/holidays/seed-defaults', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), (req, res) => holidayEngineController.seedDefaults(req, res));
router.get('/holidays', authenticateToken, (req, res) => holidayEngineController.getHolidays(req, res));
router.post('/holidays', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => holidayEngineController.createHoliday(req, res));
router.delete('/holidays/:id', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), (req, res) => holidayEngineController.deleteHoliday(req, res));
router.post('/holidays/optional/select', authenticateToken, (req, res) => holidayEngineController.selectOptionalHoliday(req, res));
router.get('/holidays/optional/my', authenticateToken, (req, res) => holidayEngineController.getMyOptionalHolidays(req, res));
router.get('/company-events', authenticateToken, (req, res) => holidayEngineController.getCompanyEvents(req, res));
router.post('/company-events', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => holidayEngineController.createCompanyEvent(req, res));
router.get('/calendar/unified-feed', authenticateToken, (req, res) => holidayEngineController.getUnifiedCalendarFeed(req, res));

// 5e. Leave Analytics & Business Intelligence Routes
router.get('/analytics/leave/kpis', authenticateToken, authorizeRoles(...leaveMgrRoles), (req, res) => analyticsController.getLeaveKPIs(req, res));
router.get('/analytics/leave/trend', authenticateToken, authorizeRoles(...leaveMgrRoles), (req, res) => analyticsController.getLeaveTrend(req, res));
router.get('/analytics/leave/departments', authenticateToken, authorizeRoles(...leaveMgrRoles), (req, res) => analyticsController.getLeaveDepartments(req, res));
router.get('/analytics/leave/branches', authenticateToken, authorizeRoles(...leaveMgrRoles), (req, res) => analyticsController.getLeaveBranches(req, res));
router.get('/analytics/leave/heatmap', authenticateToken, authorizeRoles(...leaveMgrRoles), (req, res) => analyticsController.getLeaveHeatmap(req, res));
router.get('/analytics/leave/forecast', authenticateToken, authorizeRoles(...leaveMgrRoles), (req, res) => analyticsController.getLeaveForecast(req, res));
router.post('/analytics/leave/log-export', authenticateToken, (req, res) => analyticsController.logLeaveExport(req, res));

// 5f. Enterprise Leave Finalization & Bulk Operations Routes
router.post('/leave/bulk/assign-policy', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => leaveFinalizationController.bulkAssignPolicy(req, res));
router.post('/leave/bulk/adjust-balances', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => leaveFinalizationController.bulkAdjustBalances(req, res));
router.post('/leave/cron/run-maintenance', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), (req, res) => leaveFinalizationController.runMaintenance(req, res));
router.get('/leave/import/template', authenticateToken, (req, res) => leaveFinalizationController.getTemplate(req, res));

// Legacy compat leave applications
router.get('/leaves', authenticateToken, (req, res) => leaveController.getAllLeaves(req, res));
router.post('/leaves', authenticateToken, (req, res) => leaveController.applyLeave(req, res));
router.post('/leaves/apply', authenticateToken, (req, res) => leaveController.applyLeave(req, res));
router.get('/leaves/balances', authenticateToken, (req, res) => leaveController.getBalances(req, res));
router.get('/leaves/balances/:employeeId', authenticateToken, (req, res) => leaveController.getBalances(req, res));
router.put('/leaves/balances/:employeeId', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER'), (req, res) => leaveController.updateBalance(req, res));
router.get('/leaves/types', authenticateToken, (req, res) => leavePolicyController.getTypes(req, res));
router.get('/leaves/holidays', authenticateToken, (req, res) => leaveController.getHolidays(req, res));
router.get('/leaves/calendar', authenticateToken, (req, res) => leaveController.getCalendar(req, res));
router.post('/leaves/bulk-approve', authenticateToken, (req, res) => leaveController.bulkApprove(req, res));
router.put('/leaves/:id', authenticateToken, (req, res) => leaveController.updateLeave(req, res));
router.post('/leaves/:id/cancel', authenticateToken, (req, res) => leaveController.cancelLeave(req, res));
router.put('/leaves/:id/status', authenticateToken, (req, res) => leaveController.processApproval(req, res));
router.post('/leaves/:id/approve', authenticateToken, (req, res) => leaveController.processApproval(req, res));

// 6. Payroll Module Routes
const payrollRoles = ['ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER', 'FINANCE_MANAGER', 'SUPER_ADMIN'];
router.post('/payroll/seed-defaults', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), (req, res) => payrollFoundationController.seedDefaults(req, res));
router.post('/payroll/calculate-preview', authenticateToken, (req, res) => payrollFoundationController.calculatePreview(req, res));
router.post('/payroll/assign', authenticateToken, authorizeRoles(...payrollRoles), (req, res) => payrollFoundationController.assignSalary(req, res));
router.get('/payroll/assignments', authenticateToken, authorizeRoles(...payrollRoles), (req, res) => payrollFoundationController.getAllAssignments(req, res));
router.get('/payroll/assignment/:employeeId', authenticateToken, (req, res) => payrollFoundationController.getEmployeeAssignment(req, res));
router.get('/payroll/templates', authenticateToken, authorizeRoles(...payrollRoles), (req, res) => payrollFoundationController.getTemplates(req, res));
router.post('/payroll/templates', authenticateToken, authorizeRoles(...payrollRoles), (req, res) => payrollFoundationController.createTemplate(req, res));
router.post('/payroll/revisions', authenticateToken, authorizeRoles(...payrollRoles), (req, res) => payrollFoundationController.requestRevision(req, res));
router.get('/payroll/revisions', authenticateToken, (req, res) => payrollFoundationController.getRevisions(req, res));
router.get('/payroll/settings', authenticateToken, (req, res) => payrollFoundationController.getSettings(req, res));
router.post('/payroll/settings', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), (req, res) => payrollFoundationController.updateSettings(req, res));
router.get('/payroll/dashboard/kpis', authenticateToken, authorizeRoles(...payrollRoles), (req, res) => payrollFoundationController.getDashboardKPIs(req, res));

// 6h. Enterprise Payroll Automation, Pre-flight Auto-Validation & NEFT Bank Transfer Routes
router.get('/payroll/validate', authenticateToken, authorizeRoles(...payrollRoles), (req, res) => payrollAutomationController.validatePayroll(req, res));
router.post('/payroll/cron/maintenance', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), (req, res) => payrollAutomationController.runCron(req, res));

router.get('/payrolls', authenticateToken, (req, res) => payrollManagementController.getPayrollRecords(req, res));
router.get('/payrolls/:id', authenticateToken, (req, res) => payrollController.getPayslip(req, res));
router.post('/payrolls/generate', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER', 'SUPER_ADMIN'), (req, res) => payrollManagementController.processPayroll(req, res));
router.post('/payroll/process', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER', 'SUPER_ADMIN'), (req, res) => payrollManagementController.processPayroll(req, res));
router.get('/payroll/runs', authenticateToken, (req, res) => payrollManagementController.getPayrollRuns(req, res));
router.get('/payroll/records', authenticateToken, (req, res) => payrollManagementController.getPayrollRecords(req, res));
router.patch('/payroll/runs/:id/lock', authenticateToken, authorizeRoles('ADMIN', 'FINANCE_MANAGER', 'SUPER_ADMIN'), (req, res) => payrollManagementController.lockPayroll(req, res));
router.get('/payroll/my-payslips', authenticateToken, (req, res) => payrollManagementController.getMyPayslips(req, res));

// 7. Expense Module & Policy Engine Routes
router.get('/expenses', authenticateToken, (req, res) => expenseController.getAll(req, res));
router.post('/expenses', authenticateToken, (req, res) => expenseController.submit(req, res));
router.put('/expenses/:id/status', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'DEPT_HEAD'), (req, res) => expenseController.approve(req, res));

router.post('/expenses/claims', authenticateToken, (req, res) => expenseManagementController.createClaim(req, res));
router.get('/expenses/claims', authenticateToken, (req, res) => expenseManagementController.getClaims(req, res));
router.patch('/expenses/claims/:id/manager-approve', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'DEPT_HEAD', 'SUPER_ADMIN'), (req, res) => expenseManagementController.approveManager(req, res));
router.patch('/expenses/claims/:id/finance-settle', authenticateToken, authorizeRoles('ADMIN', 'FINANCE_MANAGER', 'SUPER_ADMIN'), (req, res) => expenseManagementController.approveFinanceAndSettle(req, res));
router.patch('/expenses/claims/:id/reject', authenticateToken, authorizeRoles('ADMIN', 'FINANCE_MANAGER', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => expenseManagementController.rejectExpense(req, res));
router.post('/expenses/advances', authenticateToken, (req, res) => expenseManagementController.requestAdvance(req, res));
router.get('/expenses/advances', authenticateToken, (req, res) => expenseManagementController.getAdvances(req, res));
router.patch('/expenses/advances/:id/settle', authenticateToken, authorizeRoles('ADMIN', 'FINANCE_MANAGER', 'SUPER_ADMIN'), (req, res) => expenseManagementController.settleAdvance(req, res));

// 8. Daily Standup Routes

router.post('/tasks/daily-standups', authenticateToken, (req, res) => projectTaskController.submitDailyStandup(req, res));
router.get('/tasks/daily-standups', authenticateToken, (req, res) => projectTaskController.getDailyStandups(req, res));

// 8d. Enterprise Weekly Planner Routes
router.post('/planner/items', authenticateToken, (req, res) => weeklyPlannerController.addTaskItem(req, res));
router.patch('/planner/items/:id/status', authenticateToken, (req, res) => weeklyPlannerController.updateItemStatus(req, res));
router.get('/planner/details', authenticateToken, (req, res) => weeklyPlannerController.getPlanDetails(req, res));
router.get('/planner/capacity', authenticateToken, (req, res) => weeklyPlannerController.getTeamCapacity(req, res));
router.get('/planner/export/csv', authenticateToken, (req, res) => weeklyPlannerController.exportCSV(req, res));


// 9. Enterprise IT Asset Management & Lifecycle Routes
router.post('/assets/create', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'ASSET_MANAGER', 'SUPER_ADMIN'), (req, res) => assetManagementController.createAsset(req, res));
router.get('/assets/all', authenticateToken, (req, res) => assetManagementController.getAssets(req, res));
router.post('/assets/assign', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'ASSET_MANAGER', 'SUPER_ADMIN'), (req, res) => assetManagementController.assignAsset(req, res));
router.post('/assets/transfer', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'ASSET_MANAGER', 'SUPER_ADMIN'), (req, res) => assetManagementController.transferAsset(req, res));
router.get('/assets/my-assets', authenticateToken, (req, res) => assetManagementController.getMyAssets(req, res));

// 9b. Enterprise Asset Requests, Procurement, POs & Receiving Routes
router.post('/assets/requests', authenticateToken, (req, res) => assetManagementController.createRequest(req, res));
router.get('/assets/requests', authenticateToken, (req, res) => assetManagementController.getRequests(req, res));
router.patch('/assets/requests/:id/review', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'DEPT_HEAD'), (req, res) => assetManagementController.reviewRequest(req, res));
router.post('/assets/requests/:id/quotations', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => assetManagementController.addQuotation(req, res));
router.get('/assets/requests/:id/quotations', authenticateToken, (req, res) => assetManagementController.getQuotations(req, res));
router.post('/assets/purchase-orders', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => assetManagementController.createPO(req, res));
router.get('/assets/purchase-orders', authenticateToken, (req, res) => assetManagementController.getPOs(req, res));
router.post('/assets/purchase-orders/:id/receive', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => assetManagementController.receivePO(req, res));

// 9. Enterprise IT Asset Management & Lifecycle Routes

// 11. Notifications Routes
router.post('/notifications/dispatch', authenticateToken, (req, res) => notificationEngineController.dispatchNotification(req, res));
router.get('/notifications/my-notifications', authenticateToken, (req, res) => notificationEngineController.getNotifications(req, res));
router.get('/notifications/unread-count', authenticateToken, (req, res) => notificationEngineController.getUnreadCount(req, res));
router.patch('/notifications/:id/read', authenticateToken, (req, res) => notificationEngineController.markAsRead(req, res));
router.post('/notifications/mark-all-read', authenticateToken, (req, res) => notificationEngineController.markAllAsRead(req, res));
router.post('/notifications/devices/register', authenticateToken, (req, res) => notificationEngineController.registerDevice(req, res));
router.get('/notifications', authenticateToken, (req, res) => notificationEngineController.getNotifications(req, res));

// 12. Announcements Routes
router.get('/announcements', authenticateToken, (req, res) => miscController.getAnnouncements(req, res));
router.post('/announcements', authenticateToken, (req, res) => miscController.createAnnouncement(req, res));

// 13. Enterprise Helpdesk & Ticket Management Routes
const helpdeskAgentRoles = ['ADMIN', 'HR_MANAGER', 'IT_MANAGER', 'SUPER_ADMIN', 'SUPPORT_AGENT'];
router.post('/helpdesk/seed-categories', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), (req, res) => helpdeskEnterpriseController.seedCategories(req, res));
router.post('/helpdesk/create', authenticateToken, (req, res) => helpdeskEnterpriseController.createTicket(req, res));
router.get('/helpdesk/all', authenticateToken, (req, res) => helpdeskEnterpriseController.getTickets(req, res));
router.get('/helpdesk/my-tickets', authenticateToken, (req, res) => helpdeskEnterpriseController.getMyTickets(req, res));
router.get('/helpdesk/agent-queue', authenticateToken, authorizeRoles(...helpdeskAgentRoles), (req, res) => helpdeskEnterpriseController.getAgentQueue(req, res));
router.get('/helpdesk/analytics', authenticateToken, authorizeRoles(...helpdeskAgentRoles), (req, res) => helpdeskEnterpriseController.getAnalytics(req, res));
router.get('/helpdesk/categories', authenticateToken, (req, res) => helpdeskEnterpriseController.getCategories(req, res));
router.post('/helpdesk/categories', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), (req, res) => helpdeskEnterpriseController.createCategory(req, res));
router.get('/helpdesk/sla-rules', authenticateToken, authorizeRoles(...helpdeskAgentRoles), (req, res) => helpdeskEnterpriseController.getSLARules(req, res));
router.post('/helpdesk/sla-rules', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), (req, res) => helpdeskEnterpriseController.createSLARule(req, res));
router.get('/helpdesk/escalation-rules', authenticateToken, authorizeRoles(...helpdeskAgentRoles), (req, res) => helpdeskEnterpriseController.getEscalationRules(req, res));
router.post('/helpdesk/escalation-rules', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), (req, res) => helpdeskEnterpriseController.createEscalationRule(req, res));
router.get('/helpdesk/knowledge-base', authenticateToken, (req, res) => helpdeskEnterpriseController.getArticles(req, res));
router.post('/helpdesk/knowledge-base', authenticateToken, authorizeRoles(...helpdeskAgentRoles), (req, res) => helpdeskEnterpriseController.createArticle(req, res));
router.get('/helpdesk/knowledge-base/:id', authenticateToken, (req, res) => helpdeskEnterpriseController.viewArticle(req, res));
router.get('/helpdesk/canned-responses', authenticateToken, authorizeRoles(...helpdeskAgentRoles), (req, res) => helpdeskEnterpriseController.getCannedResponses(req, res));
router.post('/helpdesk/canned-responses', authenticateToken, authorizeRoles(...helpdeskAgentRoles), (req, res) => helpdeskEnterpriseController.createCannedResponse(req, res));
router.post('/helpdesk/canned-responses/:id/use', authenticateToken, authorizeRoles(...helpdeskAgentRoles), (req, res) => helpdeskEnterpriseController.useCannedResponse(req, res));
router.post('/helpdesk/bulk-assign', authenticateToken, authorizeRoles(...helpdeskAgentRoles), (req, res) => helpdeskEnterpriseController.bulkAssign(req, res));
router.post('/helpdesk/bulk-close', authenticateToken, authorizeRoles(...helpdeskAgentRoles), (req, res) => helpdeskEnterpriseController.bulkClose(req, res));
router.get('/helpdesk/tickets/:id', authenticateToken, (req, res) => helpdeskEnterpriseController.getTicketById(req, res));
router.patch('/helpdesk/tickets/:id/assign', authenticateToken, authorizeRoles(...helpdeskAgentRoles), (req, res) => helpdeskEnterpriseController.assignTicket(req, res));
router.patch('/helpdesk/tickets/:id/status', authenticateToken, authorizeRoles(...helpdeskAgentRoles), (req, res) => helpdeskEnterpriseController.updateStatus(req, res));
router.patch('/helpdesk/tickets/:id/resolve', authenticateToken, authorizeRoles(...helpdeskAgentRoles), (req, res) => helpdeskEnterpriseController.updateStatus(req, res));
router.patch('/helpdesk/tickets/:id/escalate', authenticateToken, authorizeRoles(...helpdeskAgentRoles), (req, res) => helpdeskEnterpriseController.escalateTicket(req, res));
router.post('/helpdesk/tickets/:id/reopen', authenticateToken, (req, res) => helpdeskEnterpriseController.reopenTicket(req, res));
router.post('/helpdesk/tickets/:id/comments', authenticateToken, (req, res) => helpdeskEnterpriseController.addComment(req, res));
router.get('/helpdesk/tickets/:id/comments', authenticateToken, (req, res) => helpdeskEnterpriseController.getComments(req, res));
router.post('/helpdesk/tickets/:id/watchers', authenticateToken, (req, res) => helpdeskEnterpriseController.addWatcher(req, res));
router.delete('/helpdesk/tickets/:id/watchers/:employeeId', authenticateToken, (req, res) => helpdeskEnterpriseController.removeWatcher(req, res));
router.post('/helpdesk/tickets/:id/tags', authenticateToken, authorizeRoles(...helpdeskAgentRoles), (req, res) => helpdeskEnterpriseController.addTag(req, res));
router.delete('/helpdesk/tickets/:id/tags', authenticateToken, authorizeRoles(...helpdeskAgentRoles), (req, res) => helpdeskEnterpriseController.removeTag(req, res));
router.post('/helpdesk/tickets/:id/rate', authenticateToken, (req, res) => helpdeskEnterpriseController.rateSatisfaction(req, res));

// 14. Branches & Organization Management Routes
router.get('/branches', authenticateToken, (req, res) => organizationController.getBranches(req, res));
router.post('/org/branches', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), (req, res) => organizationController.createBranch(req, res));
router.post('/org/transfers', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => organizationController.transferEmployee(req, res));
router.get('/org/roles', authenticateToken, (req, res) => organizationController.getRoles(req, res));
router.get('/org/roles/:id/permissions', authenticateToken, (req, res) => organizationController.getRolePermissions(req, res));
router.get('/org/hierarchy', authenticateToken, (req, res) => organizationController.getHierarchy(req, res));

// 15. Documents Route
router.get('/documents', authenticateToken, (req, res) => miscController.getDocuments(req, res));
router.post('/documents', authenticateToken, (req, res) => miscController.createDocument(req, res));

// 18. Weekly Planner
router.get('/planner', authenticateToken, (req, res) => miscController.getWeeklyPlanner(req, res));
router.post('/planner', authenticateToken, (req, res) => miscController.createWeeklyPlannerTask(req, res));
router.put('/planner/:id/status', authenticateToken, (req, res) => miscController.updatePlannerStatus(req, res));

// 19. System Config & Settings
router.get('/config', authenticateToken, (req, res) => miscController.getConfig(req, res));
router.put('/config', authenticateToken, authorizeRoles('ADMIN'), (req, res) => miscController.updateConfig(req, res));

// 20. Audit Logs
router.get('/audit-logs', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER'), (req, res) => miscController.getAuditLogs(req, res));

// 21. Enterprise Permissions Matrix
router.get('/permissions', authenticateToken, (req, res) => miscController.getPermissions(req, res));

// 22. Company Documents Center
router.get('/company-documents', authenticateToken, (req, res) => miscController.getCompanyDocs(req, res));
router.post('/company-documents', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER'), (req, res) => miscController.createCompanyDoc(req, res));

// 23. Attendance Analytics & Reports
const mgr = ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'DEPT_HEAD'];
router.get('/analytics/attendance/dashboard', authenticateToken, authorizeRoles(...mgr), (req, res) => analyticsController.getDashboard(req, res));
router.get('/analytics/attendance/trend', authenticateToken, authorizeRoles(...mgr), (req, res) => analyticsController.getTrend(req, res));
router.get('/analytics/attendance/departments', authenticateToken, authorizeRoles(...mgr), (req, res) => analyticsController.getDepartments(req, res));
router.get('/analytics/attendance/branches', authenticateToken, authorizeRoles(...mgr), (req, res) => analyticsController.getBranches(req, res));
router.get('/analytics/attendance/monthly-trend', authenticateToken, authorizeRoles(...mgr), (req, res) => analyticsController.getMonthlyTrend(req, res));
router.get('/analytics/attendance/calendar', authenticateToken, (req, res) => analyticsController.getCalendar(req, res));
router.get('/analytics/attendance/employee-report', authenticateToken, (req, res) => analyticsController.getEmployeeReport(req, res));
router.get('/analytics/attendance/late-report', authenticateToken, authorizeRoles(...mgr), (req, res) => analyticsController.getLateReport(req, res));
router.get('/analytics/attendance/overtime-report', authenticateToken, authorizeRoles(...mgr), (req, res) => analyticsController.getOvertimeReport(req, res));
router.get('/analytics/attendance/absent-report', authenticateToken, authorizeRoles(...mgr), (req, res) => analyticsController.getAbsentReport(req, res));
router.get('/analytics/attendance/monthly-summary', authenticateToken, authorizeRoles(...mgr), (req, res) => analyticsController.getMonthlySummary(req, res));
router.get('/analytics/attendance/payroll-sync', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => analyticsController.getPayrollSync(req, res));
router.get('/analytics/attendance/gps-compliance', authenticateToken, authorizeRoles(...mgr), (req, res) => analyticsController.getGPSCompliance(req, res));
router.get('/analytics/attendance/charts', authenticateToken, authorizeRoles(...mgr), (req, res) => analyticsController.getChartsData(req, res));
router.get('/analytics/attendance/punch-distribution', authenticateToken, authorizeRoles(...mgr), (req, res) => analyticsController.getPunchDistribution(req, res));
router.get('/analytics/attendance/work-hour-distribution', authenticateToken, authorizeRoles(...mgr), (req, res) => analyticsController.getWorkHourDistribution(req, res));
router.post('/analytics/attendance/log-export', authenticateToken, (req, res) => analyticsController.logExport(req, res));

// 24. Enterprise Attendance Finalization & Integration Routes
router.get('/attendance/health-score', authenticateToken, authorizeRoles(...mgr), (req, res) => attendanceFinalizationController.getHealthScore(req, res));
router.get('/attendance/integrations/weekly-planner', authenticateToken, (req, res) => attendanceFinalizationController.getWeeklyPlanner(req, res));
router.get('/attendance/integrations/org-chart', authenticateToken, (req, res) => attendanceFinalizationController.getOrgChart(req, res));
router.get('/attendance/integrations/dashboard-feed', authenticateToken, (req, res) => attendanceFinalizationController.getDashboardFeed(req, res));
router.post('/attendance/log-event', authenticateToken, (req, res) => attendanceFinalizationController.logEvent(req, res));

// 25. Unified Calendar & Calendar Task Routes
router.get('/calendar/events', authenticateToken, (req, res) => calendarController.getEvents(req, res));
router.get('/calendar/tasks', authenticateToken, (req, res) => calendarController.getTasks(req, res));
router.get('/calendar/tasks/:id', authenticateToken, (req, res) => calendarController.getTaskById(req, res));
router.post('/calendar/tasks', authenticateToken, (req, res) => calendarController.createTask(req, res));
router.patch('/calendar/tasks/:id', authenticateToken, (req, res) => calendarController.updateTask(req, res));
router.delete('/calendar/tasks/:id', authenticateToken, (req, res) => calendarController.deleteTask(req, res));

export default router;
