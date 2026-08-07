import { attendanceRepository } from '../repositories/attendanceRepository.js';

export interface ShiftInfo {
  code: string;
  name: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  graceMins: number;
  requiredHours: number;
}

export const SHIFTS: Record<string, ShiftInfo> = {
  GENERAL: { code: 'GENERAL', name: 'General Shift (9 AM - 6 PM)', startTime: '09:00', endTime: '18:00', graceMins: 15, requiredHours: 9 },
  MORNING: { code: 'MORNING', name: 'Morning Shift (6 AM - 3 PM)', startTime: '06:00', endTime: '15:00', graceMins: 15, requiredHours: 9 },
  EVENING: { code: 'EVENING', name: 'Evening Shift (2 PM - 11 PM)', startTime: '14:00', endTime: '23:00', graceMins: 15, requiredHours: 9 },
  NIGHT: { code: 'NIGHT', name: 'Night Shift (10 PM - 7 AM)', startTime: '22:00', endTime: '07:00', graceMins: 15, requiredHours: 9 },
  FLEXIBLE: { code: 'FLEXIBLE', name: 'Flexible Shift (9 Hours)', startTime: '09:00', endTime: '18:00', graceMins: 60, requiredHours: 9 },
};

export interface OfficeLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusMeters: number;
}

export const OFFICE_LOCATIONS: OfficeLocation[] = [
  { id: 'HQ', name: 'THEIAKSHI HQ Tech Park', lat: 12.9716, lng: 77.5946, radiusMeters: 500 },
  { id: 'BRANCH_1', name: 'THEIAKSHI Cyber City', lat: 28.4595, lng: 77.0266, radiusMeters: 500 },
];

export class AttendanceService {
  // Haversine formula for Geofencing distance
  private calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  }

  public checkGeofence(lat?: number, lng?: number): { distanceMeters: number; insideGeofence: boolean; allowed: boolean; locationName: string } {
    if (!lat || !lng) {
      // Default fallback if GPS is disabled on client or remote work
      return { distanceMeters: 0, insideGeofence: true, allowed: true, locationName: 'Remote / Field' };
    }

    let minDistance = Infinity;
    let matchedLocation = OFFICE_LOCATIONS[0];

    for (const loc of OFFICE_LOCATIONS) {
      const dist = this.calculateDistanceMeters(lat, lng, loc.lat, loc.lng);
      if (dist < minDistance) {
        minDistance = dist;
        matchedLocation = loc;
      }
    }

    const insideGeofence = minDistance <= matchedLocation.radiusMeters;
    return {
      distanceMeters: minDistance,
      insideGeofence,
      allowed: true, // Allow punches with location tracking flag
      locationName: matchedLocation.name,
    };
  }

  async punchIn(employeeId: number, lat?: number, lng?: number, shiftCode = 'GENERAL') {
    const todayStr = new Date().toISOString().split('T')[0];
    const existing = await attendanceRepository.findTodayRecord(employeeId, todayStr);

    if (existing && existing.punch_in) {
      throw new Error('Employee has already punched in for today');
    }

    const shift = SHIFTS[shiftCode] || SHIFTS.GENERAL;
    const now = new Date();

    // Determine late status
    const [shiftHour, shiftMin] = shift.startTime.split(':').map(Number);
    const shiftStartTime = new Date();
    shiftStartTime.setHours(shiftHour, shiftMin + shift.graceMins, 0, 0);

    const isLate = now > shiftStartTime;
    const status = isLate ? 'LATE' : 'PRESENT';

    const geofence = this.checkGeofence(lat, lng);

    const created = await attendanceRepository.createPunchIn({
      employeeId,
      date: todayStr,
      punchInTime: now,
      lat,
      lng,
      shiftName: shift.name,
      isLate,
      status,
    });

    await attendanceRepository.createAuditLog(
      employeeId,
      'PUNCH_IN',
      `Punched in at ${now.toLocaleTimeString()} (Shift: ${shift.code}, Distance: ${geofence.distanceMeters}m)`
    );

    return {
      record: created,
      geofence,
      shift,
    };
  }

  async punchOut(employeeId: number, lat?: number, lng?: number) {
    const todayStr = new Date().toISOString().split('T')[0];
    const record = await attendanceRepository.findTodayRecord(employeeId, todayStr);

    if (!record || !record.punch_in) {
      throw new Error('No active punch-in record found for today');
    }

    if (record.punch_out) {
      throw new Error('Employee has already punched out for today');
    }

    const punchInTime = new Date(record.punch_in);
    const punchOutTime = new Date();

    // Calculate gross work hours
    const diffMs = punchOutTime.getTime() - punchInTime.getTime();
    const breakMins = record.break_duration_mins || 0;
    const netMs = Math.max(0, diffMs - breakMins * 60 * 1000);
    const workHours = parseFloat((netMs / (1000 * 60 * 60)).toFixed(2));

    const isOvertime = workHours > 9.0;
    let status = record.status || 'PRESENT';

    if (workHours < 4.0) {
      status = 'HALF_DAY';
    }

    const geofence = this.checkGeofence(lat, lng);

    const updated = await attendanceRepository.updatePunchOut({
      attendanceId: record.id,
      punchOutTime,
      lat,
      lng,
      workHours,
      isOvertime,
      status,
    });

    await attendanceRepository.createAuditLog(
      employeeId,
      'PUNCH_OUT',
      `Punched out at ${punchOutTime.toLocaleTimeString()} (Work Hours: ${workHours}h)`
    );

    return {
      record: updated,
      geofence,
      workHours,
    };
  }

  async updateBreak(employeeId: number, additionalBreakMins: number) {
    const todayStr = new Date().toISOString().split('T')[0];
    const record = await attendanceRepository.findTodayRecord(employeeId, todayStr);

    if (!record || !record.punch_in) {
      throw new Error('No active punch-in record found for today');
    }

    const currentMins = record.break_duration_mins || 0;
    const totalMins = currentMins + additionalBreakMins;

    const updated = await attendanceRepository.updateBreakDuration(record.id, totalMins);

    await attendanceRepository.createAuditLog(
      employeeId,
      'BREAK_UPDATE',
      `Updated break duration by ${additionalBreakMins} mins (Total: ${totalMins} mins)`
    );

    return updated;
  }

  async getMyStatus(employeeId: number) {
    const todayStr = new Date().toISOString().split('T')[0];
    const record = await attendanceRepository.findTodayRecord(employeeId, todayStr);

    let currentWorkSeconds = 0;
    let currentBreakSeconds = (record?.break_duration_mins || 0) * 60;
    let remainingShiftSeconds = 9 * 3600; // 9 hours standard shift

    if (record?.punch_in && !record?.punch_out) {
      const diffMs = Date.now() - new Date(record.punch_in).getTime();
      const elapsedSeconds = Math.floor(diffMs / 1000);
      currentWorkSeconds = Math.max(0, elapsedSeconds - currentBreakSeconds);
      remainingShiftSeconds = Math.max(0, 9 * 3600 - currentWorkSeconds);
    } else if (record?.punch_out) {
      currentWorkSeconds = Math.round((record.work_hours || 0) * 3600);
      remainingShiftSeconds = 0;
    }

    return {
      record,
      todayStr,
      currentWorkSeconds,
      currentBreakSeconds,
      remainingShiftSeconds,
      shifts: Object.values(SHIFTS),
      officeLocations: OFFICE_LOCATIONS,
    };
  }

  async getHistory(employeeId: number) {
    return await attendanceRepository.getAttendanceHistory(employeeId);
  }

  async getMonthlySummary(employeeId: number, year: number, month: number) {
    return await attendanceRepository.getMonthlyRecords(employeeId, year, month);
  }

  async getLiveManagerDashboard() {
    const todayStr = new Date().toISOString().split('T')[0];
    return await attendanceRepository.getLiveManagerStats(todayStr);
  }

  async getAnalytics(startDate?: string, endDate?: string) {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];
    return await attendanceRepository.getAnalytics(start, end);
  }
  async applyRegularization(data: {
    employee_id: number;
    attendance_date: string;
    requested_punch_in?: string;
    requested_punch_out?: string;
    reason: string;
  }) {
    return await attendanceRepository.createRegularizationRequest(data);
  }

  async getRegularizations(employeeId?: number) {
    return await attendanceRepository.getRegularizations(employeeId);
  }

  async processRegularization(id: number, status: string, approverId: number) {
    return await attendanceRepository.approveRegularization(id, status, approverId);
  }

  async getCalendar(employeeId: number, year?: number, month?: number) {
    const yr = year || new Date().getFullYear();
    const mth = month || new Date().getMonth() + 1;
    return await attendanceRepository.getCalendarView(employeeId, yr, mth);
  }
}

export const attendanceService = new AttendanceService();
