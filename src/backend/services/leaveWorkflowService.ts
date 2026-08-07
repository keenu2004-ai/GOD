import { leaveWorkflowRepository, SubmitLeaveWorkflowDTO } from '../repositories/leaveWorkflowRepository.js';

export class LeaveWorkflowService {
  async detectConflicts(employeeId: number, startDate: string, endDate: string, excludeLeaveId?: number) {
    return leaveWorkflowRepository.detectConflicts(employeeId, startDate, endDate, excludeLeaveId);
  }

  async getTeamAvailability(managerId: number, startDate: string, endDate: string) {
    return leaveWorkflowRepository.getTeamAvailability(managerId, startDate, endDate);
  }

  async submitRequest(dto: SubmitLeaveWorkflowDTO) {
    return leaveWorkflowRepository.submitWorkflowRequest(dto);
  }

  async processApproval(id: number, action: 'APPROVED' | 'REJECTED' | 'REQUEST_INFO', approverId: number, approverRole: string, comment: string) {
    return leaveWorkflowRepository.processApproval(id, action, approverId, approverRole, comment);
  }

  async superAdminOverride(id: number, action: 'FORCE_APPROVE' | 'FORCE_REJECT' | 'CANCEL', adminId: number, reason: string) {
    return leaveWorkflowRepository.superAdminOverride(id, action, adminId, reason);
  }

  async bulkApprove(ids: number[], approverId: number, approverRole: string, comment: string) {
    return leaveWorkflowRepository.bulkApprove(ids, approverId, approverRole, comment);
  }

  async getCalendarEvents(year?: number, month?: number) {
    const yr = year || new Date().getFullYear();
    const mth = month || new Date().getMonth() + 1;
    return leaveWorkflowRepository.getLeaveCalendarEvents(yr, mth);
  }
}

export const leaveWorkflowService = new LeaveWorkflowService();
