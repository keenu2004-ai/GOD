import { complianceRepository } from '../repositories/complianceRepository.js';

export class ComplianceService {
  async generatePFECR(month: string, year: number, organizationId?: number) {
    return complianceRepository.generatePFECR(month, year, organizationId);
  }

  async generateESICReturn(month: string, year: number, organizationId?: number) {
    return complianceRepository.generateESICReturn(month, year, organizationId);
  }

  async getForm16Estimate(employeeId: number, financialYear?: string) {
    return complianceRepository.getForm16Estimate(employeeId, financialYear);
  }
}

export const complianceService = new ComplianceService();
