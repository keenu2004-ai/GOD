import {
  assetManagementRepository, CreateAssetDTO
} from '../repositories/assetManagementRepository.js';

export class AssetManagementService {
  async getAssetKPIs() {
    return assetManagementRepository.getAssetKPIs();
  }

  async createAsset(dto: CreateAssetDTO, creatorId: number) {
    return assetManagementRepository.createAsset(dto, creatorId);
  }

  async getAssets(category?: string, status?: string) {
    return assetManagementRepository.getAssets(category, status);
  }

  async assignAsset(assetId: number, employeeId: number, assignerId: number) {
    return assetManagementRepository.assignAsset(assetId, employeeId, assignerId);
  }

  async acknowledgeAsset(assignmentId: number, employeeId: number) {
    return assetManagementRepository.acknowledgeAsset(assignmentId, employeeId);
  }

  async returnAsset(assetId: number, returnerId: number) {
    return assetManagementRepository.returnAsset(assetId, returnerId);
  }

  async scheduleMaintenance(assetId: number, maintenanceType: string, description: string, cost: number, startDate: string, creatorId: number) {
    return assetManagementRepository.scheduleMaintenance(assetId, maintenanceType, description, cost, startDate, creatorId);
  }

  async reportIssue(assetId: number, reportedBy: number, issueType: string, description: string, severity: string) {
    return assetManagementRepository.reportIssue(assetId, reportedBy, issueType, description, severity);
  }
}

export const assetManagementService = new AssetManagementService();
