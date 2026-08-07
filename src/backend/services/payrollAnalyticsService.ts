import { payrollAnalyticsRepository, SetBudgetDTO } from '../repositories/payrollAnalyticsRepository.js';

export class PayrollAnalyticsService {
  async getExecutiveKPIs() {
    return payrollAnalyticsRepository.getExecutiveKPIs();
  }

  async getDepartmentCostBreakup() {
    return payrollAnalyticsRepository.getDepartmentCostBreakup();
  }

  async getBranchCostBreakup() {
    return payrollAnalyticsRepository.getBranchCostBreakup();
  }

  async get12MonthPayrollTrend() {
    return payrollAnalyticsRepository.get12MonthPayrollTrend();
  }

  async getPredictivePayrollForecast() {
    return payrollAnalyticsRepository.getPredictivePayrollForecast();
  }

  async setDepartmentBudget(dto: SetBudgetDTO, creatorId: number) {
    return payrollAnalyticsRepository.setDepartmentBudget(dto, creatorId);
  }

  async getDepartmentBudgets(year?: number) {
    return payrollAnalyticsRepository.getDepartmentBudgets(year);
  }
}

export const payrollAnalyticsService = new PayrollAnalyticsService();
