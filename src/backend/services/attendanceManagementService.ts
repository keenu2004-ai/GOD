import {
  attendanceManagementRepository, ClockInDTO, ClockOutDTO
} from '../repositories/attendanceManagementRepository.js';

export class AttendanceManagementService {
  async clockIn(dto: ClockInDTO) {
    return attendanceManagementRepository.clockIn(dto);
  }

  async clockOut(dto: ClockOutDTO) {
    return attendanceManagementRepository.clockOut(dto);
  }

  async getTodayAttendance(employeeId: number) {
    return attendanceManagementRepository.getTodayAttendance(employeeId);
  }

  async getAttendanceHistory(employeeId: number) {
    return attendanceManagementRepository.getAttendanceHistory(employeeId);
  }

  async requestCorrection(employeeId: number, date: string, punchIn: string, punchOut: string, reason: string) {
    return attendanceManagementRepository.requestCorrection(employeeId, date, punchIn, punchOut, reason);
  }

  async approveCorrection(correctionId: number, reviewerId: number) {
    return attendanceManagementRepository.approveCorrection(correctionId, reviewerId);
  }
}

export const attendanceManagementService = new AttendanceManagementService();
