import { payslipPortalRepository} from '../repositories/payslipPortalRepository.js';

export class PayslipPortalService {
  async getEmployeePayslipDetails(employeeId: number, month: string, year: number, creatorId = 1) {
    return payslipPortalRepository.getEmployeePayslipDetails(employeeId, month, year, creatorId);
  }

  async logDownload(payslipId: number, employeeId: number, ipAddress?: string) {
    return payslipPortalRepository.logDownload(payslipId, employeeId, ipAddress);
  }

  async getEmployeeSelfServiceFeed(employeeId: number) {
    return payslipPortalRepository.getEmployeeSelfServiceFeed(employeeId);
  }
}

export const payslipPortalService = new PayslipPortalService();
