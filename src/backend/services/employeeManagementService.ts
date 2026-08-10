import {
  employeeManagementRepository, CreateEmployeeDTO
} from '../repositories/employeeManagementRepository.js';

export class EmployeeManagementService {
  async createEmployee(dto: CreateEmployeeDTO, creatorId: number, organizationId?: number) {
    return employeeManagementRepository.createEmployee({ ...dto, organization_id: organizationId }, creatorId);
  }

  async getEmployees(organizationId?: number) {
    return employeeManagementRepository.getEmployees(organizationId);
  }

  async getOrgChartTree(organizationId?: number) {
    return employeeManagementRepository.getOrgChartTree(organizationId);
  }

  async getEmployeeProfile(employeeId: number, requesterId: number, requesterRole: string, requesterOrgId?: number) {
    return employeeManagementRepository.getEmployeeProfile(employeeId, requesterId, requesterRole, requesterOrgId);
  }
}

export const employeeManagementService = new EmployeeManagementService();
