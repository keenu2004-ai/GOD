import { Request, Response } from 'express';
import { attendanceService } from '../services/attendanceService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class AttendanceController {
  async punchIn(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || req.body.employee_id;
      const { latitude, longitude, shiftCode } = req.body;
      const data = await attendanceService.punchIn(userId, latitude, longitude, shiftCode);
      return res.json(sendSuccess(data, 'Punched in successfully'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }

  async punchOut(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || req.body.employee_id;
      const { latitude, longitude } = req.body;
      const data = await attendanceService.punchOut(userId, latitude, longitude);
      return res.json(sendSuccess(data, 'Punched out successfully'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }

  async updateBreak(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || req.body.employee_id;
      const { breakMinutes } = req.body;
      const mins = parseInt(breakMinutes, 10) || 15;
      const data = await attendanceService.updateBreak(userId, mins);
      return res.json(sendSuccess(data, `Break recorded (+${mins} mins)`));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }

  async getMyStatus(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const data = await attendanceService.getMyStatus(userId);
      return res.json(sendSuccess(data, 'Today attendance status retrieved'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }

  async getHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const data = await attendanceService.getHistory(userId);
      return res.json(sendSuccess(data, 'Attendance history retrieved'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }

  async getMonthlySummary(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const month = req.query.month ? parseInt(req.query.month as string, 10) : new Date().getMonth() + 1;
      const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
      const data = await attendanceService.getMonthlySummary(userId, year, month);
      return res.json(sendSuccess(data, 'Monthly attendance summary retrieved'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }

  async getLiveManagerDashboard(req: Request, res: Response) {
    try {
      const data = await attendanceService.getLiveManagerDashboard();
      return res.json(sendSuccess(data, 'Live manager attendance dashboard retrieved'));
    } catch (error: any) {
      return res.status(500).json(sendError(error.message));
    }
  }

  async getAnalytics(req: Request, res: Response) {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const data = await attendanceService.getAnalytics(startDate, endDate);
      return res.json(sendSuccess(data, 'Attendance analytics retrieved'));
    } catch (error: any) {
      return res.status(500).json(sendError(error.message));
    }
  }

  async getTodayAll(req: Request, res: Response) {
    try {
      const data = await attendanceService.getLiveManagerDashboard();
      return res.json(sendSuccess(data.todayRecords, 'Today all employees attendance retrieved'));
    } catch (error: any) {
      return res.status(500).json(sendError(error.message));
    }
  }
  async applyRegularization(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await attendanceService.applyRegularization({
        ...req.body,
        employee_id: user?.id || req.body.employee_id,
      });
      return res.status(201).json(sendSuccess(data, 'Attendance regularization request submitted successfully'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }

  async getRegularizations(req: Request, res: Response) {
    try {
      const empId = req.query.employeeId ? parseInt(req.query.employeeId as string, 10) : undefined;
      const data = await attendanceService.getRegularizations(empId);
      return res.json(sendSuccess(data, 'Attendance regularizations retrieved successfully'));
    } catch (error: any) {
      return res.status(500).json(sendError(error.message));
    }
  }

  async processRegularization(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const approverId = (req as any).user?.id || 1;
      const { status } = req.body;
      const data = await attendanceService.processRegularization(id, status, approverId);
      return res.json(sendSuccess(data, `Attendance regularization ${status.toLowerCase()}`));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }

  async getCalendar(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || 1;
      const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const data = await attendanceService.getCalendar(userId, year, month);
      return res.json(sendSuccess(data, 'Calendar attendance data retrieved'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }

  async getShifts(req: Request, res: Response) {
    try {
      const shifts = [
        { code: 'GENERAL', name: 'General Shift (9 AM - 6 PM)', startTime: '09:00', endTime: '18:00', graceMins: 15 },
        { code: 'MORNING', name: 'Morning Shift (6 AM - 3 PM)', startTime: '06:00', endTime: '15:00', graceMins: 15 },
        { code: 'EVENING', name: 'Evening Shift (2 PM - 11 PM)', startTime: '14:00', endTime: '23:00', graceMins: 15 },
        { code: 'NIGHT', name: 'Night Shift (10 PM - 7 AM)', startTime: '22:00', endTime: '07:00', graceMins: 15 },
        { code: 'FLEXIBLE', name: 'Flexible Shift (9 Hours Required)', startTime: '09:00', endTime: '18:00', graceMins: 60 },
        { code: 'HYBRID_WFH', name: 'Hybrid / WFH Remote Shift', startTime: '09:00', endTime: '18:00', graceMins: 30 },
      ];
      return res.json(sendSuccess(shifts, 'Enterprise shifts retrieved'));
    } catch (error: any) {
      return res.status(500).json(sendError(error.message));
    }
  }

  async requestShiftSwap(req: Request, res: Response) {
    try {
      const requesterId = (req as any).user?.id || 1;
      const { target_employee_id, shift_date, reason } = req.body;
      const data = {
        requester_id: requesterId,
        target_employee_id: Number(target_employee_id),
        shift_date,
        reason,
        status: 'PENDING',
        created_at: new Date().toISOString(),
      };
      return res.status(201).json(sendSuccess(data, 'Shift swap request submitted successfully'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }
}

export const attendanceController = new AttendanceController();
