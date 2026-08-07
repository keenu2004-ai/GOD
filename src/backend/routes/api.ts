import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { employeeController } from '../controllers/employeeController.js';
import { attendanceController } from '../controllers/attendanceController.js';
import { regularizationController } from '../controllers/regularizationController.js';
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
router.get('/employees', authenticateToken, (req, res) => employeeController.getAll(req, res));
router.post('/employees', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER'), (req, res) => employeeController.create(req, res));
router.get('/employees/:id', authenticateToken, (req, res) => employeeController.getById(req, res));
router.put('/employees/:id', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER'), (req, res) => employeeController.update(req, res));
router.delete('/employees/:id', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER'), (req, res) => employeeController.softDelete(req, res));
router.post('/employees/:id/restore', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER'), (req, res) => employeeController.restore(req, res));
router.put('/employees/:id/role', authenticateToken, authorizeRoles('ADMIN'), (req, res) => employeeController.updateRole(req, res));
router.delete('/employees/:id/permanent', authenticateToken, authorizeRoles('ADMIN'), (req, res) => employeeController.permanentDelete(req, res));

// 4. Attendance Module Routes
router.post('/attendance/punch-in', authenticateToken, (req, res) => attendanceController.punchIn(req, res));
router.post('/attendance/punch-out', authenticateToken, (req, res) => attendanceController.punchOut(req, res));
router.post('/attendance/break', authenticateToken, (req, res) => attendanceController.updateBreak(req, res));
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
router.get('/leave/balance', authenticateToken, (req, res) => leaveController.getBalances(req, res));
router.get('/leave/history', authenticateToken, (req, res) => leaveController.getAllLeaves(req, res));

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
router.get('/payrolls', authenticateToken, (req, res) => payrollController.getAllPayrolls(req, res));
router.get('/payrolls/:id', authenticateToken, (req, res) => payrollController.getPayslip(req, res));
router.post('/payrolls/generate', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER'), (req, res) => payrollController.generatePayroll(req, res));

// 7. Expense Module Routes
router.get('/expenses', authenticateToken, (req, res) => expenseController.getAll(req, res));
router.post('/expenses', authenticateToken, (req, res) => expenseController.submit(req, res));
router.put('/expenses/:id/status', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'DEPT_HEAD'), (req, res) => expenseController.approve(req, res));

// 8. Projects & Tasks Routes
router.get('/projects', authenticateToken, (req, res) => projectController.getAll(req, res));
router.post('/projects', authenticateToken, (req, res) => projectController.createProject(req, res));
router.get('/projects/:id', authenticateToken, (req, res) => projectController.getDetails(req, res));
router.post('/projects/tasks', authenticateToken, (req, res) => projectController.createTask(req, res));
router.put('/projects/tasks/:taskId/status', authenticateToken, (req, res) => projectController.updateTaskStatus(req, res));

// 9. Assets Routes
router.get('/assets', authenticateToken, (req, res) => miscController.getAllAssets(req, res));
router.post('/assets', authenticateToken, (req, res) => miscController.createAsset(req, res));

// 11. Notifications Routes
router.get('/notifications', authenticateToken, (req, res) => miscController.getNotifications(req, res));
router.put('/notifications/:id/read', authenticateToken, (req, res) => miscController.markNotificationRead(req, res));

// 12. Announcements Routes
router.get('/announcements', authenticateToken, (req, res) => miscController.getAnnouncements(req, res));
router.post('/announcements', authenticateToken, (req, res) => miscController.createAnnouncement(req, res));

// 13. Helpdesk Routes
router.get('/helpdesk', authenticateToken, (req, res) => miscController.getHelpdeskTickets(req, res));
router.post('/helpdesk', authenticateToken, (req, res) => miscController.createTicket(req, res));
router.put('/helpdesk/:id/status', authenticateToken, (req, res) => miscController.updateTicketStatus(req, res));

// 14. Branches Route
router.get('/branches', authenticateToken, (req, res) => miscController.getBranches(req, res));

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
