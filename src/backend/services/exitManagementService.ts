import {
  exitManagementRepository,
  SubmitResignationDTO, DepartmentClearanceDTO
} from '../repositories/exitManagementRepository.js';

export class ExitManagementService {
  async submitResignation(dto: SubmitResignationDTO) {
    return exitManagementRepository.submitResignation(dto);
  }

  async approveResignation(resignationId: number, approverId: number) {
    return exitManagementRepository.approveResignation(resignationId, approverId);
  }

  async getResignations(employeeId?: number) {
    return exitManagementRepository.getResignations(employeeId);
  }

  async clearDepartment(dto: DepartmentClearanceDTO, clearedById: number) {
    return exitManagementRepository.clearDepartment(dto, clearedById);
  }

  async getClearances(resignationId: number) {
    return exitManagementRepository.getClearances(resignationId);
  }

  async calculateFnFSettlement(resignationId: number, creatorId: number) {
    return exitManagementRepository.calculateFnFSettlement(resignationId, creatorId);
  }

  async approveFnFSettlement(settlementId: number, approverId: number) {
    return exitManagementRepository.approveFnFSettlement(settlementId, approverId);
  }

  async getFnFSettlement(resignationId: number) {
    return exitManagementRepository.getFnFSettlement(resignationId);
  }
}

export const exitManagementService = new ExitManagementService();
