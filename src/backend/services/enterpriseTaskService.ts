import {
  enterpriseTaskRepository,
  CreateSprintDTO, CreateTaskDTO
} from '../repositories/enterpriseTaskRepository.js';

export class EnterpriseTaskService {
  async createSprint(dto: CreateSprintDTO, creatorId: number) {
    return enterpriseTaskRepository.createSprint(dto, creatorId);
  }

  async getSprints(projectId?: number) {
    return enterpriseTaskRepository.getSprints(projectId);
  }

  async createTask(dto: CreateTaskDTO, creatorId: number) {
    return enterpriseTaskRepository.createTask(dto, creatorId);
  }

  async updateTaskStatus(taskId: number, status: string, updatedById: number) {
    return enterpriseTaskRepository.updateTaskStatus(taskId, status, updatedById);
  }

  async getTasks(projectId?: number, sprintId?: number, status?: string, assigneeId?: number) {
    return enterpriseTaskRepository.getTasks(projectId, sprintId, status, assigneeId);
  }

  async addChecklistItem(taskId: number, itemText: string) {
    return enterpriseTaskRepository.addChecklistItem(taskId, itemText);
  }

  async toggleChecklistItem(itemId: number) {
    return enterpriseTaskRepository.toggleChecklistItem(itemId);
  }
}

export const enterpriseTaskService = new EnterpriseTaskService();
