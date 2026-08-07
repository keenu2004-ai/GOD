import {
  enterpriseProjectRepository,
  CreateProjectDTO, AddProjectMemberDTO, AddProjectDocumentDTO, CreateProjectNoteDTO
} from '../repositories/enterpriseProjectRepository.js';

export class EnterpriseProjectService {
  async seedCategoriesAndClients() {
    return enterpriseProjectRepository.seedCategoriesAndClients();
  }

  async createProject(dto: CreateProjectDTO, creatorId: number) {
    return enterpriseProjectRepository.createProject(dto, creatorId);
  }

  async getProjects(statusFilter?: string) {
    return enterpriseProjectRepository.getProjects(statusFilter);
  }

  async getProjectDetails(projectId: number) {
    return enterpriseProjectRepository.getProjectDetails(projectId);
  }

  async addMember(dto: AddProjectMemberDTO, assignerId: number) {
    return enterpriseProjectRepository.addMember(dto, assignerId);
  }

  async removeMember(projectId: number, employeeId: number) {
    return enterpriseProjectRepository.removeMember(projectId, employeeId);
  }

  async addDocument(dto: AddProjectDocumentDTO, uploaderId: number) {
    return enterpriseProjectRepository.addDocument(dto, uploaderId);
  }

  async createNote(dto: CreateProjectNoteDTO, authorId: number) {
    return enterpriseProjectRepository.createNote(dto, authorId);
  }

  async getProjectDashboardKPIs() {
    return enterpriseProjectRepository.getProjectDashboardKPIs();
  }
}

export const enterpriseProjectService = new EnterpriseProjectService();
