import { payrollAutomationRepository } from '../repositories/payrollAutomationRepository.js';

export class PayrollAutomationService {
  async runPreflightValidation(month: string, year: number) {
    return payrollAutomationRepository.runPreflightValidation(month, year);
  }

  async generateBankTransferFile(month: string, year: number, format?: string) {
    return payrollAutomationRepository.generateBankTransferFile(month, year, format);
  }

  async runPayrollMaintenanceCron() {
    return payrollAutomationRepository.runPayrollMaintenanceCron();
  }
}

export const payrollAutomationService = new PayrollAutomationService();
