import { regularizationRepository, CreateRegDTO, RequestType } from '../repositories/regularizationRepository.js';

export class RegularizationService {
  async submit(dto: CreateRegDTO) {
    return regularizationRepository.create(dto);
  }

  async getAll(filters: {
    employee_id?: number;
    status?: string;
    manager_id?: number;
    startDate?: string;
    endDate?: string;
    isManager?: boolean;
    isHR?: boolean;
  }) {
    return regularizationRepository.getAll(filters);
  }

  async getById(id: number) {
    const reg = await regularizationRepository.getById(id);
    if (!reg) throw new Error('Regularization request not found');
    return reg;
  }

  async getPendingApprovals(actorId: number, actorRole: string) {
    return regularizationRepository.getPendingApprovals(actorId, actorRole);
  }

  async managerAction(id: number, action: 'APPROVED' | 'REJECTED' | 'INFO_REQUESTED' | 'FORWARD_HR', managerId: number, comment: string) {
    return regularizationRepository.managerAction(id, action, managerId, comment || '');
  }

  async hrAction(id: number, action: 'APPROVED' | 'REJECTED' | 'ESCALATE', hrId: number, comment: string) {
    return regularizationRepository.hrAction(id, action, hrId, comment || '');
  }

  async adminAction(id: number, action: 'APPROVED' | 'REJECTED' | 'FORCE_APPROVE' | 'FORCE_REJECT', adminId: number, comment: string) {
    return regularizationRepository.adminAction(id, action, adminId, comment || '');
  }

  async cancel(id: number, employeeId: number) {
    return regularizationRepository.cancel(id, employeeId);
  }

  async bulkApprove(ids: number[], actorId: number, actorRole: string) {
    return regularizationRepository.bulkApprove(ids, actorId, actorRole);
  }

  async addComment(regId: number, commenterId: number, comment: string, isInternal: boolean) {
    return regularizationRepository.addComment(regId, commenterId, comment, isInternal);
  }

  async getStats(startDate?: string, endDate?: string) {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];
    const [overall, department, manager] = await Promise.all([
      regularizationRepository.getRegularizationStats(start, end),
      regularizationRepository.getDepartmentStats(start, end),
      regularizationRepository.getManagerStats(start, end),
    ]);
    return { overall, department, manager };
  }

  listRequestTypes(): Array<{ value: RequestType; label: string }> {
    return [
      { value: 'MISSED_PUNCH_IN', label: 'Missed Clock In' },
      { value: 'MISSED_PUNCH_OUT', label: 'Missed Clock Out' },
      { value: 'LATE_ARRIVAL', label: 'Late Arrival' },
      { value: 'EARLY_DEPARTURE', label: 'Early Departure' },
      { value: 'WRONG_STATUS', label: 'Wrong Attendance Status' },
      { value: 'FORGOT_BREAK', label: 'Forgot Break' },
      { value: 'FORGOT_BREAK_END', label: 'Forgot Break End' },
      { value: 'WFH_CORRECTION', label: 'Work From Home Correction' },
      { value: 'BUSINESS_VISIT', label: 'Business Visit' },
      { value: 'TRAINING', label: 'Training Attendance' },
      { value: 'SYSTEM_ERROR', label: 'System Error' },
      { value: 'GPS_FAILURE', label: 'GPS Failure' },
      { value: 'MANUAL_ENTRY', label: 'Manual Attendance Request' },
      { value: 'CUSTOM', label: 'Custom Request' },
    ];
  }
}

export const regularizationService = new RegularizationService();
