import {
  weeklyPlannerRepository, AddWeeklyTaskDTO
} from '../repositories/weeklyPlannerRepository.js';

export class WeeklyPlannerService {
  async addWeeklyTaskItem(dto: AddWeeklyTaskDTO, creatorId: number) {
    return weeklyPlannerRepository.addWeeklyTaskItem(dto, creatorId);
  }

  async updatePlanItemStatus(itemId: number, status: string, actualHours?: number) {
    return weeklyPlannerRepository.updatePlanItemStatus(itemId, status, actualHours);
  }

  async getPlanDetails(employeeId: number, weekNumber: number, year: number) {
    return weeklyPlannerRepository.getPlanDetails(employeeId, weekNumber, year);
  }

  async getTeamCapacityPlan(departmentId?: number, weekNumber?: number, year?: number) {
    return weeklyPlannerRepository.getTeamCapacityPlan(departmentId, weekNumber, year);
  }

  async exportScheduleCSV(weekNumber: number, year: number) {
    return weeklyPlannerRepository.exportScheduleCSV(weekNumber, year);
  }
}

export const weeklyPlannerService = new WeeklyPlannerService();
