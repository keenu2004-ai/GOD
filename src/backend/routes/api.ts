import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { employeeController } from '../controllers/employeeController.js';
import { attendanceController } from '../controllers/attendanceController.js';
import { leaveController } from '../controllers/leaveController.js';
import { payrollController } from '../controllers/payrollController.js';
import { expenseController } from '../controllers/expenseController.js';
import { projectController } from '../controllers/projectController.js';
import { dashboardController } from '../controllers/dashboardController.js';
import { miscController } from '../controllers/miscController.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = Router();

// 1. Auth Routes
router.post('/auth/login', (req, res) => authController.login(req, res));
router.post('/auth/refresh', (req, res) => authController.refreshToken(req, res));
router.get('/auth/me', authenticateToken, (req, res) => authController.getProfile(req, res));
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
router.get('/attendance/live', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'DEPT_HEAD'), (req, res) => attendanceController.getLiveManagerDashboard(req, res));
router.get('/attendance/analytics', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'DEPT_HEAD'), (req, res) => attendanceController.getAnalytics(req, res));
router.post('/attendance/regularize', authenticateToken, (req, res) => attendanceController.applyRegularization(req, res));
router.get('/attendance/regularizations', authenticateToken, (req, res) => attendanceController.getRegularizations(req, res));
router.put('/attendance/regularizations/:id/approve', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER', 'DEPT_HEAD'), (req, res) => attendanceController.processRegularization(req, res));

// 5. Leave Module Routes
router.get('/leaves', authenticateToken, (req, res) => leaveController.getAllLeaves(req, res));
router.post('/leaves', authenticateToken, (req, res) => leaveController.applyLeave(req, res));
router.post('/leaves/apply', authenticateToken, (req, res) => leaveController.applyLeave(req, res));
router.get('/leaves/balances', authenticateToken, (req, res) => leaveController.getBalances(req, res));
router.get('/leaves/balances/:employeeId', authenticateToken, (req, res) => leaveController.getBalances(req, res));
router.put('/leaves/balances/:employeeId', authenticateToken, authorizeRoles('ADMIN', 'HR_MANAGER'), (req, res) => leaveController.updateBalance(req, res));
router.get('/leaves/types', authenticateToken, (req, res) => leaveController.getTypes(req, res));
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

export default router;
