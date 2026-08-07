import { payslipPortalRepository, CertificateRequestDTO } from '../repositories/payslipPortalRepository.js';

export class PayslipPortalService {
  async getEmployeePayslipDetails(employeeId: number, month: string, year: number, creatorId = 1) {
    return payslipPortalRepository.getEmployeePayslipDetails(employeeId, month, year, creatorId);
  }

  async logDownload(payslipId: number, employeeId: number, ipAddress?: string) {
    return payslipPortalRepository.logDownload(payslipId, employeeId, ipAddress);
  }

  async requestSalaryCertificate(dto: CertificateRequestDTO, creatorId: number) {
    return payslipPortalRepository.requestSalaryCertificate(dto, creatorId);
  }

  async getSalaryCertificates(employeeId?: number) {
    return payslipPortalRepository.getSalaryCertificates(employeeId);
  }

  async getEmployeeSelfServiceFeed(employeeId: number) {
    return payslipPortalRepository.getEmployeeSelfServiceFeed(employeeId);
  }
}

export const payslipPortalService = new PayslipPortalService();
