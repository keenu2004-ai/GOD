import {
  projectAutomationRepository, BulkTaskUpdateDTO
} from '../repositories/projectAutomationRepository.js';

export class ProjectAutomationService {
  async checkAndNotifyTaskDeadlines() {
    return projectAutomationRepository.checkAndNotifyTaskDeadlines();
  }

  async recalculateProjectHealth(projectId: number) {
    return projectAutomationRepository.recalculateProjectHealth(projectId);
  }

  async bulkUpdateTasks(dto: BulkTaskUpdateDTO, managerId: number) {
    return projectAutomationRepository.bulkUpdateTasks(dto, managerId);
  }

  async globalSearch(query: string, userId?: number) {
    return projectAutomationRepository.globalSearch(query, userId);
  }
}

export const projectAutomationService = new ProjectAutomationService();
