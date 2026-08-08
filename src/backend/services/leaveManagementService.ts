import {
  leaveManagementRepository, ApplyLeaveDTO
} from '../repositories/leaveManagementRepository.js';

export class LeaveManagementService {
  async getLeaveBalances(employeeId: number) {
    return leaveManagementRepository.getLeaveBalances(employeeId);
  }

  async adjustLeaveBalance(
    employeeId: number, leaveTypeId: number, amount: number, transactionType: string, reason: string, createdBy: number
  ) {
    return leaveManagementRepository.adjustLeaveBalance(employeeId, leaveTypeId, amount, transactionType, reason, createdBy);
  }

  async getBalanceLedger(employeeId: number) {
    return leaveManagementRepository.getBalanceLedger(employeeId);
  }

  async applyLeave(dto: ApplyLeaveDTO) {
    return leaveManagementRepository.applyLeave(dto);
  }

  async getApplications(employeeId: number) {
    return leaveManagementRepository.getApplications(employeeId);
  }

  async approveLeave(leaveId: number, reviewerId: number) {
    return leaveManagementRepository.approveLeave(leaveId, reviewerId);
  }

  async cancelLeave(leaveId: number, userId: number) {
    return leaveManagementRepository.cancelLeave(leaveId, userId);
  }
}

export const leaveManagementService = new LeaveManagementService();
