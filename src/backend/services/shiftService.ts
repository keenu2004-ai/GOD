import { shiftRepository, ShiftDTO } from '../repositories/shiftRepository.js';

// Default system shifts seeded on startup
export const DEFAULT_SHIFTS: ShiftDTO[] = [
  {
    name: 'General Shift', code: 'GENERAL', start_time: '09:00', end_time: '18:00',
    grace_mins: 15, late_threshold_mins: 30, half_day_threshold_hours: 4,
    early_exit_threshold_mins: 60, break_duration_mins: 60, max_work_hours: 12,
    min_work_hours: 4, overtime_eligible: true, is_night_shift: false, is_wfh: false,
    auto_clockout_after_hours: 14, shift_type: 'GENERAL', color: '#3B82F6',
  },
  {
    name: 'Morning Shift', code: 'MORNING', start_time: '06:00', end_time: '15:00',
    grace_mins: 15, late_threshold_mins: 30, half_day_threshold_hours: 4,
    early_exit_threshold_mins: 60, break_duration_mins: 60, max_work_hours: 12,
    min_work_hours: 4, overtime_eligible: true, is_night_shift: false, is_wfh: false,
    auto_clockout_after_hours: 14, shift_type: 'MORNING', color: '#F59E0B',
  },
  {
    name: 'Evening Shift', code: 'EVENING', start_time: '14:00', end_time: '23:00',
    grace_mins: 15, late_threshold_mins: 30, half_day_threshold_hours: 4,
    early_exit_threshold_mins: 60, break_duration_mins: 60, max_work_hours: 12,
    min_work_hours: 4, overtime_eligible: true, is_night_shift: false, is_wfh: false,
    auto_clockout_after_hours: 14, shift_type: 'EVENING', color: '#8B5CF6',
  },
  {
    name: 'Night Shift', code: 'NIGHT', start_time: '22:00', end_time: '07:00',
    grace_mins: 15, late_threshold_mins: 30, half_day_threshold_hours: 4,
    early_exit_threshold_mins: 60, break_duration_mins: 60, max_work_hours: 12,
    min_work_hours: 4, overtime_eligible: true, is_night_shift: true, is_wfh: false,
    auto_clockout_after_hours: 14, shift_type: 'NIGHT', color: '#1E293B',
  },
  {
    name: 'Flexible Shift', code: 'FLEXIBLE', start_time: '09:00', end_time: '18:00',
    grace_mins: 60, late_threshold_mins: 90, half_day_threshold_hours: 4,
    early_exit_threshold_mins: 0, break_duration_mins: 60, max_work_hours: 12,
    min_work_hours: 9, overtime_eligible: true, is_night_shift: false, is_wfh: false,
    auto_clockout_after_hours: 14, shift_type: 'FLEXIBLE', color: '#10B981',
  },
  {
    name: 'WFH / Remote Shift', code: 'WFH', start_time: '09:00', end_time: '18:00',
    grace_mins: 30, late_threshold_mins: 60, half_day_threshold_hours: 4,
    early_exit_threshold_mins: 0, break_duration_mins: 60, max_work_hours: 12,
    min_work_hours: 8, overtime_eligible: false, is_night_shift: false, is_wfh: true,
    auto_clockout_after_hours: 14, shift_type: 'WFH', color: '#06B6D4',
  },
  {
    name: 'Hybrid Shift', code: 'HYBRID', start_time: '09:00', end_time: '18:00',
    grace_mins: 30, late_threshold_mins: 60, half_day_threshold_hours: 4,
    early_exit_threshold_mins: 0, break_duration_mins: 60, max_work_hours: 12,
    min_work_hours: 8, overtime_eligible: true, is_night_shift: false, is_wfh: true,
    auto_clockout_after_hours: 14, shift_type: 'HYBRID', color: '#F97316',
  },
];

export class ShiftService {
  // ---- Shift Management ----
  async seedDefaultShifts(adminId: number) {
    const results = [];
    for (const shift of DEFAULT_SHIFTS) {
      const r = await shiftRepository.createShift(shift, adminId);
      results.push(r);
    }
    return results;
  }

  async getAllShifts() {
    return await shiftRepository.getAllShifts();
  }

  async getShiftById(id: number) {
    return await shiftRepository.getShiftById(id);
  }

  async createShift(dto: ShiftDTO, adminId: number) {
    return await shiftRepository.createShift(dto, adminId);
  }

  async updateShift(id: number, dto: Partial<ShiftDTO>, adminId: number) {
    return await shiftRepository.updateShift(id, dto, adminId);
  }

  async deleteShift(id: number) {
    return await shiftRepository.softDeleteShift(id);
  }

  // ---- Assignments ----
  async assignShift(employeeId: number, shiftId: number, effectiveDate: string, adminId: number, expiryDate?: string) {
    return await shiftRepository.assignShift({
      employee_id: employeeId,
      shift_id: shiftId,
      effective_date: effectiveDate,
      expiry_date: expiryDate,
      assigned_by: adminId,
    });
  }

  async bulkAssignShift(employeeIds: number[], shiftId: number, effectiveDate: string, adminId: number) {
    return await shiftRepository.bulkAssignShift(employeeIds, shiftId, effectiveDate, adminId);
  }

  async getEmployeeShift(employeeId: number) {
    return await shiftRepository.getEmployeeCurrentShift(employeeId);
  }

  async getAllAssignments(filters: { department_id?: number; branch_id?: number; shift_id?: number }) {
    return await shiftRepository.getAllAssignments(filters);
  }

  async getShiftHistory(employeeId: number) {
    return await shiftRepository.getShiftHistory(employeeId);
  }

  // ---- Swap Requests ----
  async requestShiftSwap(data: {
    requester_id: number;
    target_employee_id: number;
    requester_shift_id: number;
    target_shift_id: number;
    shift_date: string;
    reason: string;
  }) {
    return await shiftRepository.createSwapRequest(data);
  }

  async getSwapRequests(employeeId?: number, isManager = false) {
    return await shiftRepository.getSwapRequests(employeeId, isManager);
  }

  async processSwapRequest(id: number, status: string, approverId: number) {
    return await shiftRepository.approveSwapRequest(id, status, approverId);
  }

  // ---- Overtime ----
  async requestOvertime(data: {
    employee_id: number;
    date: string;
    expected_overtime_hours: number;
    reason: string;
  }) {
    return await shiftRepository.createOvertimeRequest(data);
  }

  async getOvertimeRequests(employeeId?: number, isManager = false) {
    return await shiftRepository.getOvertimeRequests(employeeId, isManager);
  }

  async processOvertimeRequest(id: number, status: string, approvedHours: number, approverId: number) {
    return await shiftRepository.approveOvertimeRequest(id, status, approvedHours, approverId);
  }

  // ---- Analytics / Reports ----
  async getShiftUtilizationReport(startDate?: string, endDate?: string) {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];
    return await shiftRepository.getShiftUtilizationReport(start, end);
  }

  async getOvertimeSummary(startDate?: string, endDate?: string) {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];
    return await shiftRepository.getOvertimeSummary(start, end);
  }

  // ---- Overtime calculation helper (used by Payroll) ----
  calculateOvertimePay(basicSalary: number, overtimeHours: number, multiplier = 1.5): number {
    const hourlyRate = basicSalary / (26 * 9); // 26 working days * 9 hours
    return Math.round(hourlyRate * overtimeHours * multiplier);
  }
}

export const shiftService = new ShiftService();
