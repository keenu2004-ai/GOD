import {
  assetManagementRepository, CreateAssetDTO, CreateAssetRequestDTO
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

  async createAssetRequest(dto: CreateAssetRequestDTO, employeeId: number) {
    return assetManagementRepository.createAssetRequest(dto, employeeId);
  }

  async getAssetRequests(employeeId?: number, isManager = false) {
    return assetManagementRepository.getAssetRequests(employeeId, isManager);
  }

  async reviewAssetRequest(requestId: number, status: 'APPROVED' | 'REJECTED' | 'IN_PROCUREMENT', reviewerId: number) {
    return assetManagementRepository.reviewAssetRequest(requestId, status, reviewerId);
  }

  async addVendorQuotation(requestId: number, vendorName: string, amount: number, deliveryDays?: number) {
    return assetManagementRepository.addVendorQuotation(requestId, vendorName, amount, deliveryDays);
  }

  async getVendorQuotations(requestId: number) {
    return assetManagementRepository.getVendorQuotations(requestId);
  }

  async createPurchaseOrder(requestId: number, vendorName: string, totalAmount: number, expectedDelivery: string, creatorId: number) {
    return assetManagementRepository.createPurchaseOrder(requestId, vendorName, totalAmount, expectedDelivery, creatorId);
  }

  async getPurchaseOrders() {
    return assetManagementRepository.getPurchaseOrders();
  }

  async receivePurchaseOrder(poId: number, creatorId: number) {
    return assetManagementRepository.receivePurchaseOrder(poId, creatorId);
  }
}

export const assetManagementService = new AssetManagementService();
