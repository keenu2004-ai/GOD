import {
  payrollProcessingRepository,
  ProcessPayrollDTO, ApprovePayrollDTO, PayrollAdjustmentDTO
} from '../repositories/payrollProcessingRepository.js';

export class PayrollProcessingService {
  async generatePayrollRun(dto: ProcessPayrollDTO, creatorId: number) {
    return payrollProcessingRepository.generatePayrollRun(dto, creatorId);
  }

  async getPayrollRunDetails(month: string, year: number) {
    return payrollProcessingRepository.getPayrollRunDetails(month, year);
  }

  async approvePayrollRun(dto: ApprovePayrollDTO, approverId: number) {
    return payrollProcessingRepository.approvePayrollRun(dto, approverId);
  }

  async unlockPayrollPeriod(month: string, year: number, reason: string, adminId: number) {
    return payrollProcessingRepository.unlockPayrollPeriod(month, year, reason, adminId);
  }

  async addAdjustment(dto: PayrollAdjustmentDTO, creatorId: number) {
    return payrollProcessingRepository.addAdjustment(dto, creatorId);
  }
}

export const payrollProcessingService = new PayrollProcessingService();
