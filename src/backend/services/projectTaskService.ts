import {
  projectTaskRepository, CreateProjectDTO, CreateTaskDTO
} from '../repositories/projectTaskRepository.js';

export class ProjectTaskService {
  async createProject(dto: CreateProjectDTO, creatorId: number) {
    return projectTaskRepository.createProject(dto, creatorId);
  }

  async getProjects() {
    return projectTaskRepository.getProjects();
  }

  async createTask(dto: CreateTaskDTO, creatorId: number) {
    return projectTaskRepository.createTask(dto, creatorId);
  }

  async getTasks(projectId?: number) {
    return projectTaskRepository.getTasks(projectId);
  }

  async updateTaskStatus(taskId: number, status: string, userRole: string) {
    return projectTaskRepository.updateTaskStatus(taskId, status, userRole);
  }

  async submitWorkUpdate(taskId: number, employeeId: number, workCompleted: string, hoursWorked: number, progressPct: number, blockers?: string) {
    return projectTaskRepository.submitWorkUpdate(taskId, employeeId, workCompleted, hoursWorked, progressPct, blockers);
  }

  async getWorkUpdates(taskId: number) {
    return projectTaskRepository.getWorkUpdates(taskId);
  }
}

export const projectTaskService = new ProjectTaskService();
