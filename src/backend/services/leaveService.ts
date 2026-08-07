import { leaveRepository, LeaveRequestDTO } from '../repositories/leaveRepository.js';

export class LeaveService {
  async getLeaveTypes() {
    return await leaveRepository.getLeaveTypes();
  }

  async getLeaveBalances(employeeId: number) {
    return await leaveRepository.getLeaveBalances(employeeId);
  }

  async getAllLeaves(employeeId?: number, status?: string) {
    return await leaveRepository.getAllLeaves(employeeId, status);
  }

  async getHolidays() {
    return await leaveRepository.getHolidays();
  }

  async getLeaveCalendar(month: number, year: number) {
    const leaves = await leaveRepository.getCalendarLeaves(month, year);
    const holidays = await leaveRepository.getHolidays();
    return {
      month,
      year,
      approvedLeaves: leaves,
      companyHolidays: holidays,
    };
  }

  async applyLeave(dto: LeaveRequestDTO) {
    // 1. Basic validation
    if (!dto.start_date || !dto.end_date) {
      throw new Error('Start date and end date are required');
    }

    const start = new Date(dto.start_date);
    const end = new Date(dto.end_date);

    if (end < start) {
      throw new Error('End date cannot be prior to start date');
    }

    // 2. Prevent past leaves
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) {
      throw new Error('Cannot apply leave for past dates');
    }

    // 3. Check overlaps
    const hasOverlap = await leaveRepository.checkOverlap(dto.employee_id, dto.start_date, dto.end_date);
    if (hasOverlap) {
      throw new Error('You already have a pending or approved leave request during these dates');
    }

    // 4. Calculate total days & sandwich rule check
    const diffTime = Math.abs(end.getTime() - start.getTime());
    let totalDays = dto.is_half_day ? 0.5 : Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const isSandwich = await leaveRepository.checkSandwichRule(dto.employee_id, dto.start_date, dto.end_date);
    if (isSandwich && !dto.is_half_day) {
      totalDays += 1; // Sandwich rule adjustment
    }

    // 5. Balance check
    const balance = await leaveRepository.getLeaveBalanceForType(dto.employee_id, dto.leave_type_id);
    if (balance && balance.remaining_days < totalDays) {
      throw new Error(`Insufficient leave balance. Required: ${totalDays} days, Available: ${balance.remaining_days} days`);
    }

    // 6. Create leave request with initial status MANAGER_PENDING
    const initialStatus = dto.status || 'MANAGER_PENDING';
    const request = await leaveRepository.createLeaveRequest({
      ...dto,
      total_days: totalDays,
      status: initialStatus,
    });

    return request;
  }

  async updateLeave(id: number, userId: number, dto: Partial<LeaveRequestDTO>) {
    const existing = await leaveRepository.getLeaveById(id);
    if (!existing) {
      throw new Error('Leave application not found');
    }

    if (existing.employee_id !== userId) {
      throw new Error('Unauthorized to modify this leave application');
    }

    if (!['DRAFT', 'SUBMITTED', 'MANAGER_PENDING', 'PENDING'].includes(existing.status)) {
      throw new Error(`Cannot edit leave application in ${existing.status} status`);
    }

    if (dto.start_date && dto.end_date) {
      const start = new Date(dto.start_date);
      const end = new Date(dto.end_date);
      if (end < start) throw new Error('End date cannot be prior to start date');

      const diffTime = Math.abs(end.getTime() - start.getTime());
      dto.total_days = dto.is_half_day ? 0.5 : Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const hasOverlap = await leaveRepository.checkOverlap(userId, dto.start_date, dto.end_date, id);
      if (hasOverlap) throw new Error('Updated dates overlap with another existing leave request');
    }

    return await leaveRepository.updateLeaveRequest(id, dto);
  }

  async cancelLeave(id: number, userId: number) {
    const leave = await leaveRepository.getLeaveById(id);
    if (!leave) throw new Error('Leave application not found');

    if (leave.status === 'CANCELLED') {
      throw new Error('Leave application is already cancelled');
    }

    const updated = await leaveRepository.updateLeaveStatus(id, 'CANCELLED', userId, 'Cancelled by employee');

    if (leave.status === 'APPROVED') {
      await leaveRepository.restoreLeaveBalance(leave.employee_id, leave.leave_type_id, leave.total_days);
      await leaveRepository.recordLedgerEntry(
        leave.employee_id,
        leave.leave_type_id,
        leave.total_days,
        0,
        `Leave cancelled by employee for dates ${leave.start_date} to ${leave.end_date}`
      );
    }

    return updated;
  }

  async processLeaveApproval(id: number, action: 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'HR_PENDING', approverId: number, rejectionReason?: string) {
    const leave = await leaveRepository.getLeaveById(id);
    if (!leave) {
      throw new Error('Leave application not found');
    }

    if (leave.status === action) {
      throw new Error(`Leave application is already in status ${action}`);
    }

    // Prevent self approval
    if (leave.employee_id === approverId && ['APPROVED', 'HR_PENDING'].includes(action)) {
      throw new Error('Managers cannot approve their own leave applications');
    }

    // Enterprise Workflow Step: MANAGER_PENDING -> HR_PENDING -> APPROVED
    let nextStatus: string = action;
    if (action === 'APPROVED' && leave.status === 'MANAGER_PENDING') {
      // Transition to HR_PENDING for 2-step enterprise approval
      nextStatus = 'HR_PENDING';
    }

    const updated = await leaveRepository.updateLeaveStatus(id, nextStatus, approverId, rejectionReason);

    // Balance adjustment on final approval
    if (nextStatus === 'APPROVED' && leave.status !== 'APPROVED') {
      await leaveRepository.deductLeaveBalance(leave.employee_id, leave.leave_type_id, leave.total_days);
      await leaveRepository.recordLedgerEntry(
        leave.employee_id,
        leave.leave_type_id,
        -leave.total_days,
        0,
        `Leave approved for dates ${leave.start_date} to ${leave.end_date}`
      );
    } else if (nextStatus === 'CANCELLED' && leave.status === 'APPROVED') {
      await leaveRepository.restoreLeaveBalance(leave.employee_id, leave.leave_type_id, leave.total_days);
      await leaveRepository.recordLedgerEntry(
        leave.employee_id,
        leave.leave_type_id,
        leave.total_days,
        0,
        `Leave cancelled for dates ${leave.start_date} to ${leave.end_date}`
      );
    }

    return updated;
  }

  async bulkProcessApprovals(ids: number[], action: 'APPROVED' | 'REJECTED', approverId: number, rejectionReason?: string) {
    const results = [];
    for (const id of ids) {
      try {
        const res = await this.processLeaveApproval(id, action, approverId, rejectionReason);
        results.push({ id, success: true, result: res });
      } catch (err: any) {
        results.push({ id, success: false, error: err.message });
      }
    }
    return results;
  }

  // --- Policy Engine Interfaces ---
  async executeMonthlyAccrual(employeeId: number, leaveTypeId: number, accruedDays: number) {
    return await leaveRepository.accrueMonthlyBalance(employeeId, leaveTypeId, accruedDays);
  }

  async executeCarryForward(employeeId: number, leaveTypeId: number, maxCarryForwardDays: number) {
    return await leaveRepository.calculateCarryForward(employeeId, leaveTypeId, maxCarryForwardDays);
  }

  async updateLeaveBalance(employeeId: number, leaveTypeId: number, totalDays: number, remainingDays: number) {
    return await leaveRepository.updateLeaveBalance(employeeId, leaveTypeId, totalDays, remainingDays);
  }
}

export const leaveService = new LeaveService();
