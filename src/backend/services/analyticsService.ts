import { analyticsRepository } from '../repositories/analyticsRepository.js';

const today = () => new Date().toISOString().split('T')[0];
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().split('T')[0];

export class AttendanceAnalyticsService {
  async getLiveDashboard() {
    return analyticsRepository.getLiveDashboardKPIs();
  }

  async getAttendanceTrend(days = 30) {
    return analyticsRepository.getAttendanceTrend(days);
  }

  async getDepartmentComparison(startDate?: string, endDate?: string) {
    return analyticsRepository.getDepartmentComparison(
      startDate || daysAgo(30), endDate || today()
    );
  }

  async getBranchComparison(startDate?: string, endDate?: string) {
    return analyticsRepository.getBranchComparison(
      startDate || daysAgo(30), endDate || today()
    );
  }

  async getMonthlyTrend(year?: number) {
    return analyticsRepository.getMonthlyTrend(year || new Date().getFullYear());
  }

  async getCalendar(employeeId: number | null, year?: number, month?: number) {
    const yr = year || new Date().getFullYear();
    const mth = month || new Date().getMonth() + 1;
    return analyticsRepository.getCalendarMonth(employeeId, yr, mth);
  }

  async getEmployeeReport(employeeId: number, startDate?: string, endDate?: string) {
    return analyticsRepository.getEmployeeDetailedReport(
      employeeId, startDate || daysAgo(30), endDate || today()
    );
  }

  async getLateReport(startDate?: string, endDate?: string, deptId?: number) {
    return analyticsRepository.getLateArrivalReport(
      startDate || daysAgo(30), endDate || today(), deptId
    );
  }

  async getOvertimeReport(startDate?: string, endDate?: string, deptId?: number) {
    return analyticsRepository.getOvertimeReport(
      startDate || daysAgo(30), endDate || today(), deptId
    );
  }

  async getAbsentReport(date?: string) {
    return analyticsRepository.getAbsentReport(date || today());
  }

  async getMonthlyAttendanceSummary(year?: number, month?: number, deptId?: number) {
    return analyticsRepository.getMonthlyAttendanceSummary(
      year || new Date().getFullYear(),
      month || new Date().getMonth() + 1,
      deptId
    );
  }

  async getPayrollSync(year?: number, month?: number, employeeId?: number) {
    return analyticsRepository.getPayrollAttendanceData(
      year || new Date().getFullYear(),
      month || new Date().getMonth() + 1,
      employeeId
    );
  }

  async getGPSCompliance(startDate?: string, endDate?: string) {
    return analyticsRepository.getGPSComplianceReport(
      startDate || daysAgo(30), endDate || today()
    );
  }

  async getPunchDistribution(startDate?: string, endDate?: string) {
    return analyticsRepository.getPunchDistribution(
      startDate || daysAgo(30), endDate || today()
    );
  }

  async getWorkHourDistribution(startDate?: string, endDate?: string) {
    return analyticsRepository.getWorkHourDistribution(
      startDate || daysAgo(30), endDate || today()
    );
  }

  async getAllChartsData(startDate?: string, endDate?: string) {
    const [trend, deptComp, branchComp, punchDist, hourDist] = await Promise.all([
      this.getAttendanceTrend(30),
      this.getDepartmentComparison(startDate, endDate),
      this.getBranchComparison(startDate, endDate),
      this.getPunchDistribution(startDate, endDate),
      this.getWorkHourDistribution(startDate, endDate),
    ]);
    return { trend, deptComp, branchComp, punchDist, hourDist };
  }

  async logExport(actorId: number, reportType: string, format: string, filters: object) {
    return analyticsRepository.logExport(actorId, reportType, format, JSON.stringify(filters));
  }
}

export const analyticsService = new AttendanceAnalyticsService();
