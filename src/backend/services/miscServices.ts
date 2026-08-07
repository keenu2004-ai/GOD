import { expenseRepository } from '../repositories/expenseRepository.js';
import { projectRepository } from '../repositories/projectRepository.js';
import { dashboardRepository } from '../repositories/dashboardRepository.js';
import {
  recruitmentRepository,
  assetRepository,
} from '../repositories/recruitmentRepository.js';
import { notificationRepository } from '../repositories/notificationRepository.js';
import { announcementRepository } from '../repositories/announcementRepository.js';
import {
  helpdeskRepository,
  branchRepository,
  documentRepository,
  timesheetRepository,
  performanceRepository,
  plannerRepository,
  systemConfigRepository,
  auditLogRepository,
  permissionRepository,
  companyDocumentRepository,
} from '../repositories/miscRepository.js';

import { payrollRepository } from '../repositories/payrollRepository.js';

export class PayrollService {
  async getAllPayrolls(month?: string, year?: number, employeeId?: number) {
    return await payrollRepository.getAllPayrolls(month, year, employeeId);
  }

  async getPayslipDetails(id: number) {
    const payslip = await payrollRepository.getById(id);
    if (!payslip) throw new Error('Payslip record not found');
    return payslip;
  }

  async generatePayroll(employeeId: number, month: string, year: number, basicSalary: number) {
    return await payrollRepository.generatePayrollForEmployee(employeeId, month, year, basicSalary);
  }

  async generateMonthlyPayroll(month: string, year: number, generatedBy: number) {
    return await payrollRepository.getAllPayrolls(month, year);
  }
}

export class ExpenseService {
  async getAllExpenses(employeeId?: number, status?: string) {
    return await expenseRepository.getAllExpenses(employeeId, status);
  }

  async submitExpense(data: any) {
    return await expenseRepository.createExpense(data);
  }

  async approveExpense(id: number, status: 'APPROVED' | 'REJECTED', approvedBy: number) {
    return await expenseRepository.updateExpenseStatus(id, status, approvedBy);
  }
}

export class ProjectService {
  async getAllProjects() {
    return await projectRepository.getAllProjects();
  }

  async getProjectDetails(id: number) {
    const details = await projectRepository.getProjectDetails(id);
    if (!details) throw new Error('Project not found');
    return details;
  }

  async createProject(data: any) {
    return await projectRepository.createProject(data);
  }

  async createTask(data: any) {
    return await projectRepository.createTask(data);
  }

  async updateTaskStatus(taskId: number, status: string, reportSummary?: string) {
    return await projectRepository.updateTaskStatus(taskId, status, reportSummary);
  }
}

export class DashboardService {
  async getMetrics() {
    return await dashboardRepository.getMetrics();
  }

  async getActivity() {
    return await dashboardRepository.getRecentActivity();
  }

  async getDepartmentDistribution() {
    return await dashboardRepository.getDepartmentDistribution();
  }

  async getPayrollSummary() {
    return await dashboardRepository.getPayrollSummary();
  }

  async getAnnouncements() {
    return await dashboardRepository.getAnnouncements();
  }

  async getCelebrations() {
    return await dashboardRepository.getCelebrations();
  }
}

export class MiscService {
  // Recruitments
  async getJobOpenings() { return await recruitmentRepository.getAllJobOpenings(); }
  async getCandidates(jobId: number) { return await recruitmentRepository.getCandidatesByJob(jobId); }
  async createJobOpening(data: any) { return await recruitmentRepository.createJobOpening(data); }
  async createCandidate(data: any) { return await recruitmentRepository.createCandidate(data); }
  async updateCandidateStatus(id: number, status: string, feedback?: string) {
    return await recruitmentRepository.updateCandidateStatus(id, status, feedback);
  }

  // Assets
  async getAllAssets(empId?: number) { return await assetRepository.getAll(empId); }
  async createAsset(data: any) { return await assetRepository.create(data); }

  // Notifications
  async getNotifications(empId: number) { return await notificationRepository.getByEmployee(empId); }
  async markNotificationRead(id: number) { return await notificationRepository.markAsRead(id); }

  // Announcements
  async getAllAnnouncements() { return await announcementRepository.getAll(); }
  async createAnnouncement(data: any) {
    return await announcementRepository.create(data.title, data.content, data.category, data.is_pinned, data.posted_by);
  }

  // Helpdesk
  async getHelpdeskTickets(empId?: number) { return await helpdeskRepository.getAll(empId); }
  async createTicket(data: any) {
    return await helpdeskRepository.create(data.employee_id, data.category, data.subject, data.description, data.priority);
  }
  async updateTicketStatus(id: number, status: string, assignedTo?: number) {
    return await helpdeskRepository.updateStatus(id, status, assignedTo);
  }

  // Branches
  async getAllBranches() { return await branchRepository.getAll(); }

  // Documents
  async getDocuments(empId: number) { return await documentRepository.getByEmployee(empId); }
  async createDocument(data: any) { return await documentRepository.create(data.employee_id, data.title, data.category, data.file_url); }

  // Timesheets
  async getTimesheets(empId: number) { return await timesheetRepository.getByEmployee(empId); }
  async logTimesheet(data: any) {
    return await timesheetRepository.create(data.employee_id, data.project_id, data.task_id, data.date, data.hours_spent, data.description);
  }

  // Performance Reviews
  async getPerformanceReviews() { return await performanceRepository.getAll(); }
  async createPerformanceReview(data: any) {
    return await performanceRepository.create(data.employee_id, data.reviewer_id, data.review_period, data.rating, data.feedback, data.goals);
  }

  // Weekly Planner
  async getWeeklyPlanner(empId: number) { return await plannerRepository.getByEmployee(empId); }
  async createWeeklyPlannerTask(data: any) {
    return await plannerRepository.create(data.employee_id, data.week_start_date, data.title, data.description, data.priority);
  }
  async updatePlannerStatus(id: number, status: string) { return await plannerRepository.updateStatus(id, status); }
  // System Config
  async getConfig() { return await systemConfigRepository.getConfig(); }
  async updateConfig(data: any) { return await systemConfigRepository.updateConfig(data); }

  // Audit Logs
  async getAuditLogs(limit?: number) { return await auditLogRepository.getAuditLogs(limit); }
  async logAction(empId: number | null, action: string, module: string, details: string, ip?: string) {
    return await auditLogRepository.logAction(empId, action, module, details, ip);
  }

  // Permissions & Company Docs
  async getAllPermissions() { return await permissionRepository.getAllPermissions(); }
  async getCompanyDocs() { return await companyDocumentRepository.getAllCompanyDocs(); }
  async createCompanyDoc(title: string, category: string, fileUrl: string, uploadedBy: number) {
    return await companyDocumentRepository.createCompanyDoc(title, category, fileUrl, uploadedBy);
  }
}

export const payrollService = new PayrollService();
export const expenseService = new ExpenseService();
export const projectService = new ProjectService();
export const dashboardService = new DashboardService();
export const miscService = new MiscService();
