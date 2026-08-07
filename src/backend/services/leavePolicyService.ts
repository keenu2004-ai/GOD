import { leavePolicyRepository, LeavePolicyDTO, PolicyAssignDTO } from '../repositories/leavePolicyRepository.js';

export class LeavePolicyService {
  async seedDefaults() {
    return leavePolicyRepository.seedDefaultLeaveTypes();
  }

  async getAllTypes() {
    return leavePolicyRepository.getAllTypes();
  }

  async createType(data: any) {
    return leavePolicyRepository.createType(data);
  }

  async getAllPolicies() {
    return leavePolicyRepository.getAllPolicies();
  }

  async getPolicyById(id: number) {
    const policy = await leavePolicyRepository.getPolicyById(id);
    if (!policy) throw new Error('Leave policy not found');
    return policy;
  }

  async createPolicy(dto: LeavePolicyDTO, creatorId: number) {
    return leavePolicyRepository.createPolicy(dto, creatorId);
  }

  async updatePolicy(id: number, dto: Partial<LeavePolicyDTO>, updaterId: number) {
    return leavePolicyRepository.updatePolicy(id, dto, updaterId);
  }

  async deletePolicy(id: number, deleterId: number) {
    return leavePolicyRepository.deletePolicy(id, deleterId);
  }

  async assignPolicy(dto: PolicyAssignDTO, creatorId: number) {
    return leavePolicyRepository.assignPolicy(dto, creatorId);
  }

  async getAssignments() {
    return leavePolicyRepository.getAssignments();
  }

  async getSettings() {
    return leavePolicyRepository.getSettings();
  }

  async updateSettings(data: any) {
    return leavePolicyRepository.updateSettings(data);
  }

  async requestEncashment(employeeId: number, leaveTypeId: number, days: number) {
    return leavePolicyRepository.requestEncashment(employeeId, leaveTypeId, days);
  }

  async getEncashments(employeeId?: number) {
    return leavePolicyRepository.getEncashments(employeeId);
  }
}

export const leavePolicyService = new LeavePolicyService();
