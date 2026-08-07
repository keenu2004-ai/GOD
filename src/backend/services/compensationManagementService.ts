import {
  compensationManagementRepository,
  CreateBonusDTO, AssignBonusDTO, AwardIncentiveDTO, ClaimReimbursementDTO
} from '../repositories/compensationManagementRepository.js';

export class CompensationManagementService {
  async seedBonusMaster() {
    return compensationManagementRepository.seedBonusMaster();
  }

  async getBonusMaster() {
    return compensationManagementRepository.getBonusMaster();
  }

  async assignBonus(dto: AssignBonusDTO, creatorId: number) {
    return compensationManagementRepository.assignBonus(dto, creatorId);
  }

  async approveBonus(bonusId: number, approverId: number) {
    return compensationManagementRepository.approveBonus(bonusId, approverId);
  }

  async getBonuses(employeeId?: number) {
    return compensationManagementRepository.getBonuses(employeeId);
  }

  async awardIncentive(dto: AwardIncentiveDTO, creatorId: number) {
    return compensationManagementRepository.awardIncentive(dto, creatorId);
  }

  async getIncentives(employeeId?: number) {
    return compensationManagementRepository.getIncentives(employeeId);
  }

  async submitClaim(dto: ClaimReimbursementDTO) {
    return compensationManagementRepository.submitClaim(dto);
  }

  async approveClaim(claimId: number, approverId: number, role?: string) {
    return compensationManagementRepository.approveClaim(claimId, approverId, role);
  }

  async getClaims(employeeId?: number) {
    return compensationManagementRepository.getClaims(employeeId);
  }

  async getCompensationAnalytics() {
    return compensationManagementRepository.getCompensationAnalytics();
  }
}

export const compensationManagementService = new CompensationManagementService();
