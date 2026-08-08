import {
  payrollManagementRepository, ProcessPayrollDTO
} from '../repositories/payrollManagementRepository.js';

export class PayrollManagementService {
  async processPayrollPeriod(dto: ProcessPayrollDTO, creatorId: number) {
    return payrollManagementRepository.processPayrollPeriod(dto, creatorId);
  }

  async getPayrollRuns() {
    return payrollManagementRepository.getPayrollRuns();
  }

  async getPayrollRecords(month: string, year: number) {
    return payrollManagementRepository.getPayrollRecords(month, year);
  }

  async lockPayroll(payrollRunId: number, reviewerId: number) {
    return payrollManagementRepository.lockPayroll(payrollRunId, reviewerId);
  }

  async getEmployeePayslips(employeeId: number, requesterId: number, requesterRole: string) {
    return payrollManagementRepository.getEmployeePayslips(employeeId, requesterId, requesterRole);
  }
}

export const payrollManagementService = new PayrollManagementService();
