import { projectTaskRepository } from '../repositories/projectTaskRepository.js';

export class ProjectTaskService {
  async submitDailyStandup(
    employeeId: number,
    standupDate: string,
    yesterdayWork: string,
    todayPlan: string,
    blockers: string | null,
    notes: string | null
  ) {
    return projectTaskRepository.submitDailyStandup(
      employeeId, standupDate, yesterdayWork, todayPlan, blockers, notes
    );
  }

  async getDailyStandups(filters: any) {
    return projectTaskRepository.getDailyStandups(filters);
  }
}

export const projectTaskService = new ProjectTaskService();
