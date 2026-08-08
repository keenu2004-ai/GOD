import {
  organizationRepository, CreateBranchDTO
} from '../repositories/organizationRepository.js';

export class OrganizationService {
  async createBranch(dto: CreateBranchDTO, creatorId: number) {
    return organizationRepository.createBranch(dto, creatorId);
  }

  async getBranches() {
    return organizationRepository.getBranches();
  }

  async transferEmployeeBranch(employeeId: number, toBranchId: number, reason: string, transferredBy: number) {
    return organizationRepository.transferEmployeeBranch(employeeId, toBranchId, reason, transferredBy);
  }

  async getRoles() {
    return organizationRepository.getRoles();
  }

  async getRolePermissions(roleId: number) {
    return organizationRepository.getRolePermissions(roleId);
  }

  async getOrganizationHierarchy() {
    return organizationRepository.getOrganizationHierarchy();
  }
}

export const organizationService = new OrganizationService();
