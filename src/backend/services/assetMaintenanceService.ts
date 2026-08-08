import {
  assetMaintenanceRepository, CreateWarrantyClaimDTO, CreateDamageInvestigationDTO, CreatePayrollRecoveryDTO
} from '../repositories/assetMaintenanceRepository.js';

export class AssetMaintenanceService {
  async createWarrantyClaim(dto: CreateWarrantyClaimDTO, creatorId: number) {
    return assetMaintenanceRepository.createWarrantyClaim(dto, creatorId);
  }

  async getWarrantyClaims() {
    return assetMaintenanceRepository.getWarrantyClaims();
  }

  async createDamageInvestigation(dto: CreateDamageInvestigationDTO, creatorId: number) {
    return assetMaintenanceRepository.createDamageInvestigation(dto, creatorId);
  }

  async getDamageInvestigations() {
    return assetMaintenanceRepository.getDamageInvestigations();
  }

  async createPayrollRecovery(dto: CreatePayrollRecoveryDTO, creatorId: number) {
    return assetMaintenanceRepository.createPayrollRecovery(dto, creatorId);
  }

  async getPayrollRecoveries() {
    return assetMaintenanceRepository.getPayrollRecoveries();
  }

  async approvePayrollRecovery(recoveryId: number, approverId: number) {
    return assetMaintenanceRepository.approvePayrollRecovery(recoveryId, approverId);
  }
}

export const assetMaintenanceService = new AssetMaintenanceService();
