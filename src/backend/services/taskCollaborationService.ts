import {
  taskCollaborationRepository, SubmitDailyReportDTO
} from '../repositories/taskCollaborationRepository.js';

export class TaskCollaborationService {
  async submitDailyReport(dto: SubmitDailyReportDTO) {
    return taskCollaborationRepository.submitDailyReport(dto);
  }

  async reviewDailyReport(reportId: number, status: 'APPROVED' | 'REJECTED', feedback: string, managerId: number) {
    return taskCollaborationRepository.reviewDailyReport(reportId, status, feedback, managerId);
  }

  async getDailyReports(employeeId?: number, date?: string) {
    return taskCollaborationRepository.getDailyReports(employeeId, date);
  }

  async addComment(taskId: number, commentText: string, authorId: number) {
    return taskCollaborationRepository.addComment(taskId, commentText, authorId);
  }

  async getComments(taskId: number) {
    return taskCollaborationRepository.getComments(taskId);
  }

  async getActivityFeed(taskId: number) {
    return taskCollaborationRepository.getActivityFeed(taskId);
  }
}

export const taskCollaborationService = new TaskCollaborationService();
