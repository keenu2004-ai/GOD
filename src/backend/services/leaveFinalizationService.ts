import { leaveFinalizationRepository, BulkAssignPolicyDTO, BulkAdjustBalanceDTO } from '../repositories/leaveFinalizationRepository.js';

export class LeaveFinalizationService {
  async bulkAssignPolicy(dto: BulkAssignPolicyDTO, creatorId: number) {
    return leaveFinalizationRepository.bulkAssignPolicy(dto, creatorId);
  }

  async bulkAdjustBalances(dto: BulkAdjustBalanceDTO, adminId: number) {
    return leaveFinalizationRepository.bulkAdjustBalances(dto, adminId);
  }

  async runAutomatedMaintenanceJobs(executorId = 1) {
    return leaveFinalizationRepository.runAutomatedMaintenanceJobs(executorId);
  }

  getImportTemplate() {
    return leaveFinalizationRepository.getImportTemplate();
  }
}

export const leaveFinalizationService = new LeaveFinalizationService();
