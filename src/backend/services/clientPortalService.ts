import {
  clientPortalRepository, CreateClientOrgDTO, CreateDeliverableDTO, CreateChangeRequestDTO
} from '../repositories/clientPortalRepository.js';

export class ClientPortalService {
  async createClientOrganization(dto: CreateClientOrgDTO) {
    return clientPortalRepository.createClientOrganization(dto);
  }

  async grantProjectAccess(clientOrgId: number, projectId: number, accessLevel?: string, grantedBy?: number) {
    return clientPortalRepository.grantProjectAccess(clientOrgId, projectId, accessLevel, grantedBy);
  }

  async getClientProjects(clientOrgId?: number) {
    return clientPortalRepository.getClientProjects(clientOrgId);
  }

  async createDeliverable(dto: CreateDeliverableDTO) {
    return clientPortalRepository.createDeliverable(dto);
  }

  async getDeliverables(projectId?: number) {
    return clientPortalRepository.getDeliverables(projectId);
  }

  async reviewDeliverable(deliverableId: number, status: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED', clientComments?: string, clientUserId?: number) {
    return clientPortalRepository.reviewDeliverable(deliverableId, status, clientComments, clientUserId);
  }

  async createChangeRequest(dto: CreateChangeRequestDTO, clientUserId?: number) {
    return clientPortalRepository.createChangeRequest(dto, clientUserId);
  }

  async getChangeRequests(projectId?: number) {
    return clientPortalRepository.getChangeRequests(projectId);
  }
}

export const clientPortalService = new ClientPortalService();
