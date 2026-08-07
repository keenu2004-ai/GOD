import { leaveBalanceEngineRepository, BalanceAdjustmentDTO } from '../repositories/leaveBalanceEngineRepository.js';

export class LeaveBalanceEngineService {
  async adjustBalance(dto: BalanceAdjustmentDTO, adminId: number) {
    return leaveBalanceEngineRepository.adjustBalance(dto, adminId);
  }

  async runMonthlyAccrual(periodStr: string, executorId = 1) {
    return leaveBalanceEngineRepository.runMonthlyAccrual(periodStr, executorId);
  }

  async requestCompOff(employeeId: number, dateWorked: string, days = 1.0, reason: string) {
    return leaveBalanceEngineRepository.requestCompOff(employeeId, dateWorked, days, reason);
  }

  async approveCompOff(compOffId: number, approverId: number) {
    return leaveBalanceEngineRepository.approveCompOff(compOffId, approverId);
  }

  async runYearEndCarryForward(year: number, executorId = 1) {
    return leaveBalanceEngineRepository.runYearEndCarryForward(year, executorId);
  }

  async getLedgerTransactions(employeeId?: number, leaveTypeId?: number) {
    return leaveBalanceEngineRepository.getLedgerTransactions(employeeId, leaveTypeId);
  }

  async getAdjustments(employeeId?: number) {
    return leaveBalanceEngineRepository.getAdjustments(employeeId);
  }

  async getCompOffs(employeeId?: number) {
    return leaveBalanceEngineRepository.getCompOffs(employeeId);
  }
}

export const leaveBalanceEngineService = new LeaveBalanceEngineService();
