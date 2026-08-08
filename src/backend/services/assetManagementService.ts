import {
  assetManagementRepository, CreateAssetDTO
} from '../repositories/assetManagementRepository.js';

export class AssetManagementService {
  async createAsset(dto: CreateAssetDTO, creatorId: number) {
    return assetManagementRepository.createAsset(dto, creatorId);
  }

  async getAssets() {
    return assetManagementRepository.getAssets();
  }

  async assignAsset(assetId: number, employeeId: number, assignerId: number) {
    return assetManagementRepository.assignAsset(assetId, employeeId, assignerId);
  }

  async transferAsset(assetId: number, fromEmpId: number, toEmpId: number, reason: string, transferrerId: number) {
    return assetManagementRepository.transferAsset(assetId, fromEmpId, toEmpId, reason, transferrerId);
  }

  async getMyAssignedAssets(employeeId: number) {
    return assetManagementRepository.getMyAssignedAssets(employeeId);
  }
}

export const assetManagementService = new AssetManagementService();
