import {
  assetAnalyticsRepository, CalculateDepreciationDTO
} from '../repositories/assetAnalyticsRepository.js';

export class AssetAnalyticsService {
  async getFinancialAnalytics() {
    return assetAnalyticsRepository.getFinancialAnalytics();
  }

  async calculateDepreciation(dto: CalculateDepreciationDTO, creatorId: number) {
    return assetAnalyticsRepository.calculateDepreciation(dto, creatorId);
  }

  async getDepreciationSchedules() {
    return assetAnalyticsRepository.getDepreciationSchedules();
  }

  async createInventoryAudit(auditName: string, auditorId: number) {
    return assetAnalyticsRepository.createInventoryAudit(auditName, auditorId);
  }

  async getInventoryAudits() {
    return assetAnalyticsRepository.getInventoryAudits();
  }

  async recordAuditFinding(auditId: number, assetId: number, discrepancyType: string, actualLocation?: string) {
    return assetAnalyticsRepository.recordAuditFinding(auditId, assetId, discrepancyType, actualLocation);
  }

  async getAuditFindings(auditId?: number) {
    return assetAnalyticsRepository.getAuditFindings(auditId);
  }

  async reconcileFinding(findingId: number, action: string, reviewerId: number) {
    return assetAnalyticsRepository.reconcileFinding(findingId, action, reviewerId);
  }
}

export const assetAnalyticsService = new AssetAnalyticsService();
