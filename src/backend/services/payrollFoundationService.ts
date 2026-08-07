import { payrollFoundationRepository, AssignSalaryDTO, SalaryTemplateDTO, SalaryRevisionDTO } from '../repositories/payrollFoundationRepository.js';

export class PayrollFoundationService {
  async seedDefaults() {
    return payrollFoundationRepository.seedDefaultComponents();
  }

  calculateSalaryBreakdown(ctc: number) {
    return payrollFoundationRepository.calculateSalaryBreakdown(ctc);
  }

  async assignSalaryStructure(dto: AssignSalaryDTO, creatorId: number) {
    return payrollFoundationRepository.assignSalaryStructure(dto, creatorId);
  }

  async getAllSalaryAssignments() {
    return payrollFoundationRepository.getAllSalaryAssignments();
  }

  async getEmployeeSalaryAssignment(employeeId: number) {
    return payrollFoundationRepository.getEmployeeSalaryAssignment(employeeId);
  }

  async getSalaryTemplates() {
    return payrollFoundationRepository.getSalaryTemplates();
  }

  async createSalaryTemplate(dto: SalaryTemplateDTO, creatorId: number) {
    return payrollFoundationRepository.createSalaryTemplate(dto, creatorId);
  }

  async requestSalaryRevision(dto: SalaryRevisionDTO, creatorId: number) {
    return payrollFoundationRepository.requestSalaryRevision(dto, creatorId);
  }

  async getSalaryRevisions(employeeId?: number) {
    return payrollFoundationRepository.getSalaryRevisions(employeeId);
  }

  async getPayrollSettings() {
    return payrollFoundationRepository.getPayrollSettings();
  }

  async updatePayrollSettings(data: any, updaterId: number) {
    return payrollFoundationRepository.updatePayrollSettings(data, updaterId);
  }

  async getCompensationDashboardKPIs() {
    return payrollFoundationRepository.getCompensationDashboardKPIs();
  }
}

export const payrollFoundationService = new PayrollFoundationService();
