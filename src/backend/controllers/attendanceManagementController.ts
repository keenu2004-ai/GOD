import { Request, Response } from 'express';
import { attendanceManagementService } from '../services/attendanceManagementService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class AttendanceManagementController {
  // POST /attendance/clock-in
  async clockIn(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { latitude, longitude } = req.body;
      const data = await attendanceManagementService.clockIn({
        employee_id: user?.id || 1,
        latitude: Number(latitude || 12.9716),
        longitude: Number(longitude || 77.5946),
      });
      return res.status(201).json(sendSuccess(data, 'Clock In successful (GPS Geofence Verified)'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /attendance/clock-out
  async clockOut(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { latitude, longitude } = req.body;
      const data = await attendanceManagementService.clockOut({
        employee_id: user?.id || 1,
        latitude: Number(latitude || 12.9716),
        longitude: Number(longitude || 77.5946),
      });
      return res.json(sendSuccess(data, 'Clock Out successful'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /attendance/today
  async getToday(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await attendanceManagementService.getTodayAttendance(user?.id || 1);
      return res.json(sendSuccess(data, 'Today attendance retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /attendance/my-history
  async getMyHistory(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await attendanceManagementService.getAttendanceHistory(user?.id || 1);
      return res.json(sendSuccess(data, 'Attendance history retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /attendance/corrections
  async requestCorrection(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { date, requested_punch_in, requested_punch_out, reason } = req.body;
      const data = await attendanceManagementService.requestCorrection(
        user?.id || 1, date, requested_punch_in, requested_punch_out, reason
      );
      return res.status(201).json(sendSuccess(data, 'Attendance correction requested'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // PATCH /attendance/corrections/:id/approve
  async approveCorrection(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const data = await attendanceManagementService.approveCorrection(id, user?.id || 1);
      return res.json(sendSuccess(data, 'Attendance correction approved'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }
}

export const attendanceManagementController = new AttendanceManagementController();
