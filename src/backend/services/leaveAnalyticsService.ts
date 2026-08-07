import { leaveAnalyticsRepository } from '../repositories/leaveAnalyticsRepository.js';

export class LeaveAnalyticsService {
  async getExecutiveKPIs() {
    return leaveAnalyticsRepository.getExecutiveKPIs();
  }

  async getMonthlyLeaveTrend(year?: number) {
    return leaveAnalyticsRepository.getMonthlyLeaveTrend(year);
  }

  async getDepartmentLeaveAnalytics() {
    return leaveAnalyticsRepository.getDepartmentLeaveAnalytics();
  }

  async getBranchLeaveAnalytics() {
    return leaveAnalyticsRepository.getBranchLeaveAnalytics();
  }

  async getLeaveHeatmap(year?: number, month?: number) {
    return leaveAnalyticsRepository.getLeaveHeatmap(year, month);
  }

  async getLeaveForecast() {
    return leaveAnalyticsRepository.getLeaveForecast();
  }

  async logReportExport(actorId: number, reportType: string, filename: string) {
    return leaveAnalyticsRepository.logReportExport(actorId, reportType, filename);
  }
}

export const leaveAnalyticsService = new LeaveAnalyticsService();
