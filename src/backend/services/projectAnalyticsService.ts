import {
  projectAnalyticsRepository, CreateMilestoneDTO, CreateRiskDTO
} from '../repositories/projectAnalyticsRepository.js';

export class ProjectAnalyticsService {
  async getPortfolioKPIs() {
    return projectAnalyticsRepository.getPortfolioKPIs();
  }

  async createMilestone(dto: CreateMilestoneDTO, creatorId: number) {
    return projectAnalyticsRepository.createMilestone(dto, creatorId);
  }

  async getMilestones(projectId?: number) {
    return projectAnalyticsRepository.getMilestones(projectId);
  }

  async createRisk(dto: CreateRiskDTO, creatorId: number) {
    return projectAnalyticsRepository.createRisk(dto, creatorId);
  }

  async getRisks(projectId?: number) {
    return projectAnalyticsRepository.getRisks(projectId);
  }
}

export const projectAnalyticsService = new ProjectAnalyticsService();
