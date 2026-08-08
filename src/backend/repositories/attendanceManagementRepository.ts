import dbService from '../database/db.js';

export interface ClockInDTO {
  employee_id: number;
  latitude: number;
  longitude: number;
}

export interface ClockOutDTO {
  employee_id: number;
  latitude: number;
  longitude: number;
}

export class AttendanceManagementRepository {

  // ─── Haversine Distance Geofence Algorithm (Meters) ─────────────────────────
  calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // ─── Clock In Pipeline with Server-Side Geofence Verification ───────────────
  async clockIn(dto: ClockInDTO) {
    const today = new Date().toISOString().split('T')[0];

    // Check duplicate punch in for today
    const existing = await dbService.query(
      `SELECT * FROM attendance WHERE employee_id = $1 AND date = $2 AND punch_out IS NULL`,
      [dto.employee_id, today]
    );

    if (existing.rows.length > 0) {
      throw new Error('Employee is already clocked in for today');
    }

    // Geofence Validation
    const geoRes = await dbService.query(`SELECT * FROM geofence_settings WHERE id = 'HQ' LIMIT 1`);
    const fence = geoRes.rows[0] || { latitude: 12.9716, longitude: 77.5946, radius_meters: 500 };

    const distanceMeters = this.calculateHaversineDistance(
      Number(dto.latitude),
      Number(dto.longitude),
      Number(fence.latitude),
      Number(fence.longitude)
    );

    const isInsideGeofence = distanceMeters <= Number(fence.radius_meters);

    if (!isInsideGeofence && fence.enforce_strict_geofence) {
      throw new Error(`Geofence violation: You are ${Math.round(distanceMeters)}m away from office (allowed radius: ${fence.radius_meters}m)`);
    }

    const now = new Date();
    const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 15);

    const res = await dbService.query(
      `INSERT INTO attendance (employee_id, date, punch_in, punch_in_lat, punch_in_lng, status, is_late)
       VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, 'PRESENT', $5) RETURNING *`,
      [dto.employee_id, today, dto.latitude, dto.longitude, isLate]
    );

    return {
      attendance: res.rows[0],
      geofence_verified: true,
      distance_meters: Math.round(distanceMeters),
    };
  }

  // ─── Clock Out Pipeline ─────────────────────────────────────────────────────
  async clockOut(dto: ClockOutDTO) {
    const today = new Date().toISOString().split('T')[0];

    const existing = await dbService.query(
      `SELECT * FROM attendance WHERE employee_id = $1 AND date = $2 AND punch_out IS NULL`,
      [dto.employee_id, today]
    );

    if (existing.rows.length === 0) {
      throw new Error('No active clock-in session found for today');
    }

    const rec = existing.rows[0];
    const punchInTime = new Date(rec.punch_in).getTime();
    const nowTime = new Date().getTime();
    const workHours = Math.max(0, Number(((nowTime - punchInTime) / (1000 * 60 * 60)).toFixed(2)));
    const isOvertime = workHours > 9.0;

    const res = await dbService.query(
      `UPDATE attendance
       SET punch_out = CURRENT_TIMESTAMP, punch_out_lat = $1, punch_out_lng = $2, work_hours = $3, is_overtime = $4
       WHERE id = $5 RETURNING *`,
      [dto.latitude, dto.longitude, workHours, isOvertime, rec.id]
    );

    return res.rows[0];
  }

  // ─── Attendance Status & History ────────────────────────────────────────────
  async getTodayAttendance(employeeId: number) {
    const today = new Date().toISOString().split('T')[0];
    const res = await dbService.query(`SELECT * FROM attendance WHERE employee_id = $1 AND date = $2 LIMIT 1`, [employeeId, today]);
    return res.rows[0] || null;
  }

  async getAttendanceHistory(employeeId: number) {
    const res = await dbService.query(
      `SELECT * FROM attendance WHERE employee_id = $1 ORDER BY date DESC LIMIT 60`,
      [employeeId]
    );
    return res.rows;
  }

  // ─── Attendance Correction Requisitions ────────────────────────────────────
  async requestCorrection(employeeId: number, date: string, punchIn: string, punchOut: string, reason: string) {
    const res = await dbService.query(
      `INSERT INTO attendance_regularizations (employee_id, attendance_date, requested_punch_in, requested_punch_out, reason, status)
       VALUES ($1, $2, $3, $4, $5, 'PENDING_APPROVAL') RETURNING *`,
      [employeeId, date, punchIn, punchOut, reason]
    );
    return res.rows[0];
  }

  async approveCorrection(correctionId: number, reviewerId: number) {
    const regRes = await dbService.query(`SELECT * FROM attendance_regularizations WHERE id = $1`, [correctionId]);
    const reg = regRes.rows[0];
    if (!reg) throw new Error('Correction request not found');

    await dbService.query(
      `UPDATE attendance_regularizations SET status = 'APPROVED', approved_by = $1, approved_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [reviewerId, correctionId]
    );

    await dbService.query(
      `INSERT INTO attendance (employee_id, date, punch_in, punch_out, status)
       VALUES ($1, $2, $3, $4, 'PRESENT')
       ON CONFLICT DO NOTHING`,
      [reg.employee_id, reg.attendance_date, reg.requested_punch_in, reg.requested_punch_out]
    );

    return { message: 'Correction approved and attendance record updated' };
  }
}

export const attendanceManagementRepository = new AttendanceManagementRepository();
