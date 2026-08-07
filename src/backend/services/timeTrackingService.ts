import {
  timeTrackingRepository, LogTimeEntryDTO
} from '../repositories/timeTrackingRepository.js';

export class TimeTrackingService {
  async startTimer(employeeId: number, projectId?: number, taskId?: number) {
    return timeTrackingRepository.startTimer(employeeId, projectId, taskId);
  }

  async stopTimer(employeeId: number, description?: string) {
    return timeTrackingRepository.stopTimer(employeeId, description);
  }

  async getActiveTimer(employeeId: number) {
    return timeTrackingRepository.getActiveTimer(employeeId);
  }

  async logTimeEntry(dto: LogTimeEntryDTO) {
    return timeTrackingRepository.logTimeEntry(dto);
  }

  async getTimesheetEntries(employeeId: number, startDate: string, endDate: string) {
    return timeTrackingRepository.getTimesheetEntries(employeeId, startDate, endDate);
  }

  async submitTimesheet(employeeId: number, weekNumber: number, year: number, totalHours: number, billableHours: number) {
    return timeTrackingRepository.submitTimesheet(employeeId, weekNumber, year, totalHours, billableHours);
  }

  async approveTimesheet(approvalId: number, managerId: number) {
    return timeTrackingRepository.approveTimesheet(approvalId, managerId);
  }

  async getPendingTimesheets() {
    return timeTrackingRepository.getPendingTimesheets();
  }

  async getProductivityKPIs(employeeId?: number) {
    return timeTrackingRepository.getProductivityKPIs(employeeId);
  }
}

export const timeTrackingService = new TimeTrackingService();
