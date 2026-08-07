import { attendanceFinalizationRepository } from '../repositories/attendanceFinalizationRepository.js';

export class AttendanceFinalizationService {
  async getHealthScore(startDate?: string, endDate?: string) {
    return attendanceFinalizationRepository.calculateAttendanceHealthScore(startDate, endDate);
  }

  async getWeeklyPlannerIntegration(dateStr?: string) {
    const d = dateStr || new Date().toISOString().split('T')[0];
    return attendanceFinalizationRepository.getWeeklyPlannerAttendance(d);
  }

  async getOrgChartIntegration() {
    return attendanceFinalizationRepository.getOrgChartLiveStatus();
  }

  async getDashboardFeed() {
    return attendanceFinalizationRepository.getDashboardFeed();
  }

  async logEvent(actorId: number, event: string, details: string) {
    return attendanceFinalizationRepository.logAttendanceSystemEvent(actorId, event, details);
  }
}

export const attendanceFinalizationService = new AttendanceFinalizationService();
