import {
  employeeManagementRepository, CreateEmployeeDTO
} from '../repositories/employeeManagementRepository.js';

export class EmployeeManagementService {
  async createEmployee(dto: CreateEmployeeDTO, creatorId: number) {
    return employeeManagementRepository.createEmployee(dto, creatorId);
  }

  async getEmployees() {
    return employeeManagementRepository.getEmployees();
  }

  async getOrgChartTree() {
    return employeeManagementRepository.getOrgChartTree();
  }

  async getEmployeeProfile(employeeId: number, requesterId: number, requesterRole: string) {
    return employeeManagementRepository.getEmployeeProfile(employeeId, requesterId, requesterRole);
  }
}

export const employeeManagementService = new EmployeeManagementService();
