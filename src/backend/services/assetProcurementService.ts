import {
  assetProcurementRepository, CreateAssetRequestDTO
} from '../repositories/assetProcurementRepository.js';

export class AssetProcurementService {
  async createAssetRequest(dto: CreateAssetRequestDTO, employeeId: number) {
    return assetProcurementRepository.createAssetRequest(dto, employeeId);
  }

  async getAssetRequests(employeeId?: number, isManager = false) {
    return assetProcurementRepository.getAssetRequests(employeeId, isManager);
  }

  async reviewAssetRequest(requestId: number, status: 'APPROVED' | 'REJECTED' | 'IN_PROCUREMENT', reviewerId: number) {
    return assetProcurementRepository.reviewAssetRequest(requestId, status, reviewerId);
  }

  async addVendorQuotation(requestId: number, vendorName: string, amount: number, deliveryDays?: number) {
    return assetProcurementRepository.addVendorQuotation(requestId, vendorName, amount, deliveryDays);
  }

  async getVendorQuotations(requestId: number) {
    return assetProcurementRepository.getVendorQuotations(requestId);
  }

  async createPurchaseOrder(requestId: number, vendorName: string, totalAmount: number, expectedDelivery: string, creatorId: number) {
    return assetProcurementRepository.createPurchaseOrder(requestId, vendorName, totalAmount, expectedDelivery, creatorId);
  }

  async getPurchaseOrders() {
    return assetProcurementRepository.getPurchaseOrders();
  }

  async receivePurchaseOrder(poId: number, creatorId: number) {
    return assetProcurementRepository.receivePurchaseOrder(poId, creatorId);
  }
}

export const assetProcurementService = new AssetProcurementService();
