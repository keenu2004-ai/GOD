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
import { shiftController } from '../controllers/shiftController.js';
import { analyticsController } from '../controllers/analyticsController.js';
import { attendanceFinalizationController } from '../controllers/attendanceFinalizationController.js';
import { leavePolicyController } from '../controllers/leavePolicyController.js';
import { leaveWorkflowController } from '../controllers/leaveWorkflowController.js';
import { leaveBalanceEngineController } from '../controllers/leaveBalanceEngineController.js';
import { holidayEngineController } from '../controllers/holidayEngineController.js';
import { leaveAnalyticsController } from '../controllers/leaveAnalyticsController.js';
import { leaveFinalizationController } from '../controllers/leaveFinalizationController.js';
import { payrollFoundationController } from '../controllers/payrollFoundationController.js';
import { salaryComponentEngineController } from '../controllers/salaryComponentEngineController.js';
import { payrollProcessingController } from '../controllers/payrollProcessingController.js';
import { payslipPortalController } from '../controllers/payslipPortalController.js';
import { compensationManagementController } from '../controllers/compensationManagementController.js';
import { payrollAnalyticsController } from '../controllers/payrollAnalyticsController.js';
import { exitManagementController } from '../controllers/exitManagementController.js';
import { payrollAutomationController } from '../controllers/payrollAutomationController.js';
import { enterpriseProjectController } from '../controllers/enterpriseProjectController.js';
import { enterpriseTaskController } from '../controllers/enterpriseTaskController.js';
import { taskCollaborationController } from '../controllers/taskCollaborationController.js';
import { weeklyPlannerController } from '../controllers/weeklyPlannerController.js';
import { timeTrackingController } from '../controllers/timeTrackingController.js';
import { projectTaskController } from '../controllers/projectTaskController.js';
import { projectAnalyticsController } from '../controllers/projectAnalyticsController.js';
import { clientPortalController } from '../controllers/clientPortalController.js';
import { notificationEngineController } from '../controllers/notificationEngineController.js';
import { projectAutomationController } from '../controllers/projectAutomationController.js';
import { assetManagementController } from '../controllers/assetManagementController.js';
import { assetProcurementController } from '../controllers/assetProcurementController.js';
import { assetMaintenanceController } from '../controllers/assetMaintenanceController.js';
import { assetAnalyticsController } from '../controllers/assetAnalyticsController.js';
import { helpdeskTicketController } from '../controllers/helpdeskTicketController.js';
import { helpdeskController } from '../controllers/helpdeskController.js';
import { expenseManagementController } from '../controllers/expenseManagementController.js';
import { expensePolicyController } from '../controllers/expensePolicyController.js';
import { organizationController } from '../controllers/organizationController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = Router();

// 1. Auth Routes
router.post('/auth/login', (req, res) => authController.login(req, res));
router.post('/auth/refresh', (req, res) => authController.refreshToken(req, res));
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

// 4b. Shift Management Routes
router.get('/shifts', authenticateToken, (req, res) => shiftController.getAllShifts(req, res));
router.post('/shifts', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => shiftController.createShift(req, res));
router.post('/shifts/seed', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), (req, res) => shiftController.seedDefaultShifts(req, res));
router.get('/shifts/my-shift', authenticateToken, (req, res) => shiftController.getMyShift(req, res));
router.get('/shifts/assignments', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'DEPT_HEAD'), (req, res) => shiftController.getAllAssignments(req, res));
router.post('/shifts/assign', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => shiftController.assignShift(req, res));
router.post('/shifts/bulk-assign', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => shiftController.bulkAssignShift(req, res));
router.get('/shifts/history', authenticateToken, (req, res) => shiftController.getShiftHistory(req, res));
router.get('/shifts/swap-requests', authenticateToken, (req, res) => shiftController.getSwapRequests(req, res));
router.post('/shifts/swap-requests', authenticateToken, (req, res) => shiftController.requestSwap(req, res));
router.put('/shifts/swap-requests/:id/process', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'DEPT_HEAD'), (req, res) => shiftController.processSwap(req, res));
router.get('/shifts/overtime-requests', authenticateToken, (req, res) => shiftController.getOvertimeRequests(req, res));
router.post('/shifts/overtime-requests', authenticateToken, (req, res) => shiftController.requestOvertime(req, res));
router.put('/shifts/overtime-requests/:id/process', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'DEPT_HEAD'), (req, res) => shiftController.processOvertime(req, res));
router.get('/shifts/reports/utilization', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => shiftController.getShiftUtilizationReport(req, res));
router.get('/shifts/reports/overtime', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => shiftController.getOvertimeSummaryReport(req, res));
router.get('/shifts/employees/:employeeId', authenticateToken, (req, res) => shiftController.getEmployeeShift(req, res));
router.get('/shifts/:id', authenticateToken, (req, res) => shiftController.getShiftById(req, res));
router.put('/shifts/:id', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => shiftController.updateShift(req, res));
router.delete('/shifts/:id', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), (req, res) => shiftController.deleteShift(req, res));

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
router.get('/analytics/leave/kpis', authenticateToken, authorizeRoles(...leaveMgrRoles), (req, res) => leaveAnalyticsController.getKPIs(req, res));
router.get('/analytics/leave/trend', authenticateToken, authorizeRoles(...leaveMgrRoles), (req, res) => leaveAnalyticsController.getTrend(req, res));
router.get('/analytics/leave/departments', authenticateToken, authorizeRoles(...leaveMgrRoles), (req, res) => leaveAnalyticsController.getDepartments(req, res));
router.get('/analytics/leave/branches', authenticateToken, authorizeRoles(...leaveMgrRoles), (req, res) => leaveAnalyticsController.getBranches(req, res));
router.get('/analytics/leave/heatmap', authenticateToken, authorizeRoles(...leaveMgrRoles), (req, res) => leaveAnalyticsController.getHeatmap(req, res));
router.get('/analytics/leave/forecast', authenticateToken, authorizeRoles(...leaveMgrRoles), (req, res) => leaveAnalyticsController.getForecast(req, res));
router.post('/analytics/leave/log-export', authenticateToken, (req, res) => leaveAnalyticsController.logExport(req, res));

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

// 6b. Enterprise Salary Component Engine, Loans, Advances, Bank & Benefits Routes
router.post('/payroll/components/seed', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), (req, res) => salaryComponentEngineController.seedComponents(req, res));
router.get('/payroll/components', authenticateToken, (req, res) => salaryComponentEngineController.getComponents(req, res));
router.post('/payroll/components', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => salaryComponentEngineController.createComponent(req, res));
router.post('/payroll/loans/request', authenticateToken, (req, res) => salaryComponentEngineController.requestLoan(req, res));
router.patch('/payroll/loans/:id/approve', authenticateToken, authorizeRoles(...payrollRoles), (req, res) => salaryComponentEngineController.approveLoan(req, res));
router.get('/payroll/loans', authenticateToken, (req, res) => salaryComponentEngineController.getLoans(req, res));
router.post('/payroll/advances/request', authenticateToken, (req, res) => salaryComponentEngineController.requestAdvance(req, res));
router.patch('/payroll/advances/:id/approve', authenticateToken, authorizeRoles(...payrollRoles), (req, res) => salaryComponentEngineController.approveAdvance(req, res));
router.get('/payroll/advances', authenticateToken, (req, res) => salaryComponentEngineController.getAdvances(req, res));
router.post('/payroll/bank-details', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => salaryComponentEngineController.saveBankDetails(req, res));
router.get('/payroll/bank-details/all', authenticateToken, authorizeRoles(...payrollRoles), (req, res) => salaryComponentEngineController.getAllBankDetails(req, res));
router.get('/payroll/bank-details/:employeeId', authenticateToken, (req, res) => salaryComponentEngineController.getBankDetails(req, res));
router.post('/payroll/benefits', authenticateToken, authorizeRoles(...payrollRoles), (req, res) => salaryComponentEngineController.assignBenefit(req, res));
router.get('/payroll/benefits', authenticateToken, (req, res) => salaryComponentEngineController.getBenefits(req, res));

// 6c. Enterprise Payroll Processing Wizard & Lock/Unlock Routes
router.post('/payroll/process', authenticateToken, authorizeRoles(...payrollRoles), (req, res) => payrollProcessingController.processPayroll(req, res));
router.get('/payroll/preview', authenticateToken, (req, res) => payrollProcessingController.getPreview(req, res));
router.post('/payroll/approve', authenticateToken, authorizeRoles(...payrollRoles), (req, res) => payrollProcessingController.approvePayroll(req, res));
router.patch('/payroll/unlock', authenticateToken, authorizeRoles('SUPER_ADMIN'), (req, res) => payrollProcessingController.unlockPayroll(req, res));
router.post('/payroll/adjustment', authenticateToken, authorizeRoles(...payrollRoles), (req, res) => payrollProcessingController.addAdjustment(req, res));

// 6d. Enterprise Employee Self-Service Payslip & Digital Documents Routes
router.get('/payroll/payslip/view', authenticateToken, (req, res) => payslipPortalController.viewPayslip(req, res));
router.post('/payroll/payslip/log-download', authenticateToken, (req, res) => payslipPortalController.logDownload(req, res));
router.post('/payroll/certificates/request', authenticateToken, (req, res) => payslipPortalController.requestCertificate(req, res));
router.get('/payroll/certificates', authenticateToken, (req, res) => payslipPortalController.getCertificates(req, res));
router.get('/payroll/self-service/feed', authenticateToken, (req, res) => payslipPortalController.getSelfServiceFeed(req, res));

// 6e. Enterprise Compensation & Benefits Management Routes
router.post('/compensation/bonus/seed', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), (req, res) => compensationManagementController.seedBonus(req, res));
router.get('/compensation/bonus/types', authenticateToken, (req, res) => compensationManagementController.getBonusMaster(req, res));
router.post('/bonus', authenticateToken, authorizeRoles(...payrollRoles), (req, res) => compensationManagementController.assignBonus(req, res));
router.patch('/bonus/:id/approve', authenticateToken, authorizeRoles(...payrollRoles), (req, res) => compensationManagementController.approveBonus(req, res));
router.get('/bonus', authenticateToken, (req, res) => compensationManagementController.getBonuses(req, res));
router.post('/incentive', authenticateToken, authorizeRoles(...payrollRoles), (req, res) => compensationManagementController.awardIncentive(req, res));
router.get('/incentives', authenticateToken, (req, res) => compensationManagementController.getIncentives(req, res));
router.post('/reimbursement', authenticateToken, (req, res) => compensationManagementController.submitClaim(req, res));
router.patch('/reimbursement/:id/approve', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER', 'SUPER_ADMIN'), (req, res) => compensationManagementController.approveClaim(req, res));
router.get('/reimbursements', authenticateToken, (req, res) => compensationManagementController.getClaims(req, res));
router.get('/compensation/analytics', authenticateToken, authorizeRoles(...payrollRoles), (req, res) => compensationManagementController.getAnalytics(req, res));

// 6f. Enterprise Payroll Analytics, BI, Forecasting & Budget Routes
router.get('/payroll/analytics/kpis', authenticateToken, authorizeRoles(...payrollRoles), (req, res) => payrollAnalyticsController.getExecutiveKPIs(req, res));
router.get('/payroll/analytics/departments', authenticateToken, authorizeRoles(...payrollRoles), (req, res) => payrollAnalyticsController.getDepartmentBreakup(req, res));
router.get('/payroll/analytics/branches', authenticateToken, authorizeRoles(...payrollRoles), (req, res) => payrollAnalyticsController.getBranchBreakup(req, res));
router.get('/payroll/analytics/trend', authenticateToken, authorizeRoles(...payrollRoles), (req, res) => payrollAnalyticsController.getTrend(req, res));
router.get('/payroll/analytics/forecast', authenticateToken, authorizeRoles(...payrollRoles), (req, res) => payrollAnalyticsController.getForecast(req, res));
router.post('/payroll/analytics/budget', authenticateToken, authorizeRoles('ADMIN', 'FINANCE_MANAGER', 'SUPER_ADMIN'), (req, res) => payrollAnalyticsController.setBudget(req, res));
router.get('/payroll/analytics/budget', authenticateToken, authorizeRoles(...payrollRoles), (req, res) => payrollAnalyticsController.getBudgets(req, res));

// 6g. Enterprise Exit Management & Full & Final (FnF) Settlement Routes
router.post('/exit/resignation', authenticateToken, (req, res) => exitManagementController.submitResignation(req, res));
router.patch('/exit/resignation/:id/approve', authenticateToken, authorizeRoles(...payrollRoles), (req, res) => exitManagementController.approveResignation(req, res));
router.get('/exit/resignations', authenticateToken, (req, res) => exitManagementController.getResignations(req, res));
router.post('/exit/clearance', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER', 'IT_MANAGER', 'SUPER_ADMIN'), (req, res) => exitManagementController.clearDepartment(req, res));
router.get('/exit/clearances/:resignationId', authenticateToken, (req, res) => exitManagementController.getClearances(req, res));
router.post('/exit/fnf/calculate', authenticateToken, authorizeRoles(...payrollRoles), (req, res) => exitManagementController.calculateFnF(req, res));
router.patch('/exit/fnf/:id/approve', authenticateToken, authorizeRoles('ADMIN', 'FINANCE_MANAGER', 'SUPER_ADMIN'), (req, res) => exitManagementController.approveFnF(req, res));
router.get('/exit/fnf/:resignationId', authenticateToken, (req, res) => exitManagementController.getFnF(req, res));

// 6h. Enterprise Payroll Automation, Pre-flight Auto-Validation & NEFT Bank Transfer Routes
router.get('/payroll/validate', authenticateToken, authorizeRoles(...payrollRoles), (req, res) => payrollAutomationController.validatePayroll(req, res));
router.get('/payroll/bank-file', authenticateToken, authorizeRoles('ADMIN', 'FINANCE_MANAGER', 'PAYROLL_MANAGER', 'SUPER_ADMIN'), (req, res) => payrollAutomationController.downloadBankFile(req, res));
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

// 7b. Expense Policy Controls, Budgeting, Risk Radar & Period Lock Routes
router.get('/expenses/risk-flags', authenticateToken, authorizeRoles('ADMIN', 'FINANCE_MANAGER', 'SUPER_ADMIN'), (req, res) => expensePolicyController.getRiskFlags(req, res));
router.patch('/expenses/risk-flags/:id/clear', authenticateToken, authorizeRoles('ADMIN', 'FINANCE_MANAGER', 'SUPER_ADMIN'), (req, res) => expensePolicyController.clearRiskFlag(req, res));
router.post('/expenses/budgets', authenticateToken, authorizeRoles('ADMIN', 'FINANCE_MANAGER', 'SUPER_ADMIN'), (req, res) => expensePolicyController.createBudget(req, res));
router.get('/expenses/budgets', authenticateToken, (req, res) => expensePolicyController.getBudgets(req, res));
router.post('/expenses/reconciliations', authenticateToken, authorizeRoles('ADMIN', 'FINANCE_MANAGER', 'SUPER_ADMIN'), (req, res) => expensePolicyController.reconcilePayment(req, res));
router.get('/expenses/reconciliations', authenticateToken, (req, res) => expensePolicyController.getReconciliations(req, res));
router.post('/expenses/periods/lock', authenticateToken, authorizeRoles('ADMIN', 'FINANCE_MANAGER', 'SUPER_ADMIN'), (req, res) => expensePolicyController.lockPeriod(req, res));
router.get('/expenses/periods', authenticateToken, (req, res) => expensePolicyController.getPeriodLocks(req, res));

// 8. Projects & Tasks Routes
router.post('/projects/create', authenticateToken, authorizeRoles('ADMIN', 'PROJECT_MANAGER', 'DEPT_HEAD', 'SUPER_ADMIN'), (req, res) => projectTaskController.createProject(req, res));
router.get('/projects/all', authenticateToken, (req, res) => projectTaskController.getProjects(req, res));
router.post('/projects/tasks/create', authenticateToken, (req, res) => projectTaskController.createTask(req, res));
router.get('/projects/tasks/all', authenticateToken, (req, res) => projectTaskController.getTasks(req, res));
router.patch('/projects/tasks/:id/status', authenticateToken, (req, res) => projectTaskController.updateTaskStatus(req, res));
router.post('/projects/tasks/:id/work-update', authenticateToken, (req, res) => projectTaskController.submitWorkUpdate(req, res));
router.get('/projects/tasks/:id/work-updates', authenticateToken, (req, res) => projectTaskController.getWorkUpdates(req, res));
router.post('/projects/members', authenticateToken, (req, res) => enterpriseProjectController.addMember(req, res));
router.delete('/projects/:id/members/:employeeId', authenticateToken, (req, res) => enterpriseProjectController.removeMember(req, res));
router.post('/projects/documents', authenticateToken, (req, res) => enterpriseProjectController.addDocument(req, res));
router.post('/projects/notes', authenticateToken, (req, res) => enterpriseProjectController.createNote(req, res));
router.get('/projects/analytics/kpis', authenticateToken, (req, res) => enterpriseProjectController.getKPIs(req, res));

// 8b. Enterprise Sprint & Interactive Kanban Task Routes
router.post('/tasks/sprints', authenticateToken, (req, res) => enterpriseTaskController.createSprint(req, res));
router.get('/tasks/sprints', authenticateToken, (req, res) => enterpriseTaskController.getSprints(req, res));
router.post('/tasks', authenticateToken, (req, res) => enterpriseTaskController.createTask(req, res));
router.patch('/tasks/:id/status', authenticateToken, (req, res) => enterpriseTaskController.updateTaskStatus(req, res));
router.get('/tasks', authenticateToken, (req, res) => enterpriseTaskController.getTasks(req, res));
router.post('/tasks/:id/checklist', authenticateToken, (req, res) => enterpriseTaskController.addChecklistItem(req, res));
router.patch('/tasks/checklist/:itemId/toggle', authenticateToken, (req, res) => enterpriseTaskController.toggleChecklistItem(req, res));

// 8c. Enterprise Task Collaboration, Comments & Daily Standup Work Reporting Routes
router.post('/tasks/daily-reports', authenticateToken, (req, res) => taskCollaborationController.submitReport(req, res));
router.patch('/tasks/daily-reports/:id/review', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'DEPT_HEAD', 'SUPER_ADMIN'), (req, res) => taskCollaborationController.reviewReport(req, res));
router.get('/tasks/daily-reports', authenticateToken, (req, res) => taskCollaborationController.getReports(req, res));
router.post('/tasks/:id/comments', authenticateToken, (req, res) => taskCollaborationController.addComment(req, res));
router.get('/tasks/:id/comments', authenticateToken, (req, res) => taskCollaborationController.getComments(req, res));
router.get('/tasks/:id/activity', authenticateToken, (req, res) => taskCollaborationController.getActivity(req, res));

// 8d. Enterprise Weekly Planner, Capacity & Workload Management Routes
router.post('/planner/items', authenticateToken, (req, res) => weeklyPlannerController.addTaskItem(req, res));
router.patch('/planner/items/:id/status', authenticateToken, (req, res) => weeklyPlannerController.updateItemStatus(req, res));
router.get('/planner/details', authenticateToken, (req, res) => weeklyPlannerController.getPlanDetails(req, res));
router.get('/planner/capacity', authenticateToken, (req, res) => weeklyPlannerController.getTeamCapacity(req, res));
router.get('/planner/export/csv', authenticateToken, (req, res) => weeklyPlannerController.exportCSV(req, res));

// 8e. Enterprise Time Tracking, Live Work Session Timer & Timesheets Routes
router.post('/timetracking/timer/start', authenticateToken, (req, res) => timeTrackingController.startTimer(req, res));
router.post('/timetracking/timer/stop', authenticateToken, (req, res) => timeTrackingController.stopTimer(req, res));
router.get('/timetracking/timer/active', authenticateToken, (req, res) => timeTrackingController.getActiveTimer(req, res));
router.post('/timetracking/entry', authenticateToken, (req, res) => timeTrackingController.logTimeEntry(req, res));
router.get('/timetracking/timesheet', authenticateToken, (req, res) => timeTrackingController.getTimesheet(req, res));
router.post('/timetracking/timesheet/submit', authenticateToken, (req, res) => timeTrackingController.submitTimesheet(req, res));
router.patch('/timetracking/timesheet/:id/approve', authenticateToken, authorizeRoles('ADMIN', 'PROJECT_MANAGER', 'DEPT_HEAD', 'SUPER_ADMIN'), (req, res) => timeTrackingController.approveTimesheet(req, res));
router.get('/timetracking/timesheets/pending', authenticateToken, (req, res) => timeTrackingController.getPendingTimesheets(req, res));
router.get('/timetracking/analytics/kpis', authenticateToken, (req, res) => timeTrackingController.getKPIs(req, res));

// 8f. Enterprise Project Analytics, Portfolio BI, Milestones & Risk Register Routes
router.get('/projects/portfolio/kpis', authenticateToken, (req, res) => projectAnalyticsController.getKPIs(req, res));
router.post('/projects/milestones', authenticateToken, (req, res) => projectAnalyticsController.createMilestone(req, res));
router.get('/projects/milestones', authenticateToken, (req, res) => projectAnalyticsController.getMilestones(req, res));
router.post('/projects/risks', authenticateToken, (req, res) => projectAnalyticsController.createRisk(req, res));
router.get('/projects/risks', authenticateToken, (req, res) => projectAnalyticsController.getRisks(req, res));
router.get('/projects/analytics/workload', authenticateToken, (req, res) => projectAnalyticsController.getWorkload(req, res));
router.get('/projects/analytics/budget-variance', authenticateToken, (req, res) => projectAnalyticsController.getBudgetVariance(req, res));
router.get('/projects/analytics/export/portfolio-csv', authenticateToken, (req, res) => projectAnalyticsController.exportCSV(req, res));

// 8g. Enterprise Client Portal, Deliverables Approval & Change Request Routes
router.post('/client/organizations', authenticateToken, authorizeRoles('ADMIN', 'PROJECT_MANAGER', 'SUPER_ADMIN'), (req, res) => clientPortalController.createOrganization(req, res));
router.post('/client/access/grant', authenticateToken, authorizeRoles('ADMIN', 'PROJECT_MANAGER', 'SUPER_ADMIN'), (req, res) => clientPortalController.grantAccess(req, res));
router.get('/client/projects', authenticateToken, (req, res) => clientPortalController.getClientProjects(req, res));
router.post('/client/deliverables', authenticateToken, (req, res) => clientPortalController.createDeliverable(req, res));
router.get('/client/deliverables', authenticateToken, (req, res) => clientPortalController.getDeliverables(req, res));
router.patch('/client/deliverables/:id/review', authenticateToken, (req, res) => clientPortalController.reviewDeliverable(req, res));
router.post('/client/change-requests', authenticateToken, (req, res) => clientPortalController.createChangeRequest(req, res));
router.get('/client/change-requests', authenticateToken, (req, res) => clientPortalController.getChangeRequests(req, res));

// 8h. Enterprise Project Automation, Health Recalculations, Bulk Actions & Global Search Routes
router.post('/projects/automation/check-deadlines', authenticateToken, (req, res) => projectAutomationController.checkDeadlines(req, res));
router.post('/projects/:id/recalculate-health', authenticateToken, (req, res) => projectAutomationController.recalculateHealth(req, res));
router.post('/tasks/bulk-update', authenticateToken, authorizeRoles('ADMIN', 'PROJECT_MANAGER', 'DEPT_HEAD', 'SUPER_ADMIN'), (req, res) => projectAutomationController.bulkUpdate(req, res));
router.get('/projects/search', authenticateToken, (req, res) => projectAutomationController.globalSearch(req, res));
router.get('/projects/:id', authenticateToken, (req, res) => projectController.getDetails(req, res));
router.post('/projects/tasks', authenticateToken, (req, res) => projectController.createTask(req, res));
router.put('/projects/tasks/:taskId/status', authenticateToken, (req, res) => projectController.updateTaskStatus(req, res));

// 9. Enterprise IT Asset Management & Lifecycle Routes
router.get('/assets/kpis', authenticateToken, (req, res) => assetAnalyticsController.getFinancialAnalytics(req, res));
router.post('/assets/create', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'ASSET_MANAGER', 'SUPER_ADMIN'), (req, res) => assetManagementController.createAsset(req, res));
router.get('/assets/all', authenticateToken, (req, res) => assetManagementController.getAssets(req, res));
router.post('/assets/assign', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'ASSET_MANAGER', 'SUPER_ADMIN'), (req, res) => assetManagementController.assignAsset(req, res));
router.post('/assets/transfer', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'ASSET_MANAGER', 'SUPER_ADMIN'), (req, res) => assetManagementController.transferAsset(req, res));
router.get('/assets/my-assets', authenticateToken, (req, res) => assetManagementController.getMyAssets(req, res));

// 9b. Enterprise Asset Requests, Procurement, POs & Receiving Routes
router.post('/assets/requests', authenticateToken, (req, res) => assetProcurementController.createRequest(req, res));
router.get('/assets/requests', authenticateToken, (req, res) => assetProcurementController.getRequests(req, res));
router.patch('/assets/requests/:id/review', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'DEPT_HEAD'), (req, res) => assetProcurementController.reviewRequest(req, res));
router.post('/assets/requests/:id/quotations', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => assetProcurementController.addQuotation(req, res));
router.get('/assets/requests/:id/quotations', authenticateToken, (req, res) => assetProcurementController.getQuotations(req, res));
router.post('/assets/purchase-orders', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => assetProcurementController.createPO(req, res));
router.get('/assets/purchase-orders', authenticateToken, (req, res) => assetProcurementController.getPOs(req, res));
router.post('/assets/purchase-orders/:id/receive', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => assetProcurementController.receivePO(req, res));

// 9c. Enterprise Asset Warranty Claims, Damage Investigations & Payroll Recovery Routes
router.post('/assets/warranty-claims', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => assetMaintenanceController.createWarrantyClaim(req, res));
router.get('/assets/warranty-claims', authenticateToken, (req, res) => assetMaintenanceController.getWarrantyClaims(req, res));
router.post('/assets/damage-investigations', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'DEPT_HEAD'), (req, res) => assetMaintenanceController.createDamageInvestigation(req, res));
router.get('/assets/damage-investigations', authenticateToken, (req, res) => assetMaintenanceController.getDamageInvestigations(req, res));
router.post('/assets/payroll-recoveries', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => assetMaintenanceController.createPayrollRecovery(req, res));
router.get('/assets/payroll-recoveries', authenticateToken, (req, res) => assetMaintenanceController.getPayrollRecoveries(req, res));
router.patch('/assets/payroll-recoveries/:id/approve', authenticateToken, authorizeRoles('ADMIN', 'FINANCE_MANAGER', 'SUPER_ADMIN'), (req, res) => assetMaintenanceController.approvePayrollRecovery(req, res));

// 9d. Enterprise Asset Financial Valuation, Depreciation & Physical Audit Routes
router.get('/assets/analytics/financial', authenticateToken, (req, res) => assetAnalyticsController.getFinancialAnalytics(req, res));
router.post('/assets/depreciation/calculate', authenticateToken, authorizeRoles('ADMIN', 'FINANCE_MANAGER', 'SUPER_ADMIN'), (req, res) => assetAnalyticsController.calculateDepreciation(req, res));
router.get('/assets/depreciation/schedules', authenticateToken, (req, res) => assetAnalyticsController.getDepreciationSchedules(req, res));
router.post('/assets/audits', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => assetAnalyticsController.createAudit(req, res));
router.get('/assets/audits', authenticateToken, (req, res) => assetAnalyticsController.getAudits(req, res));
router.post('/assets/audits/:id/findings', authenticateToken, (req, res) => assetAnalyticsController.recordFinding(req, res));
router.get('/assets/audit-findings', authenticateToken, (req, res) => assetAnalyticsController.getFindings(req, res));
router.patch('/assets/audit-findings/:id/reconcile', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'), (req, res) => assetAnalyticsController.reconcileFinding(req, res));

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

// 13. Helpdesk & Support Desk Routes
router.post('/helpdesk/create', authenticateToken, (req, res) => helpdeskTicketController.createTicket(req, res));
router.get('/helpdesk/all', authenticateToken, (req, res) => helpdeskTicketController.getTickets(req, res));
router.patch('/helpdesk/tickets/:id/assign', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'IT_MANAGER', 'SUPER_ADMIN'), (req, res) => helpdeskTicketController.assignTicket(req, res));
router.patch('/helpdesk/tickets/:id/resolve', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'IT_MANAGER', 'SUPER_ADMIN'), (req, res) => helpdeskTicketController.resolveTicket(req, res));
router.post('/helpdesk/tickets/:id/comments', authenticateToken, (req, res) => helpdeskTicketController.addComment(req, res));
router.get('/helpdesk/tickets/:id/comments', authenticateToken, (req, res) => helpdeskTicketController.getComments(req, res));

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

// 16. Timesheets Route
router.get('/timesheets', authenticateToken, (req, res) => miscController.getTimesheets(req, res));
router.post('/timesheets', authenticateToken, (req, res) => miscController.logTimesheet(req, res));

// 17. Performance Reviews
router.get('/performance', authenticateToken, (req, res) => miscController.getPerformanceReviews(req, res));
router.post('/performance', authenticateToken, (req, res) => miscController.createPerformanceReview(req, res));

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

export default router;
