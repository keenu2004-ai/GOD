import { Request, Response } from 'express';
import { shiftService } from '../services/shiftService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class ShiftController {
  // ---- Shift Templates CRUD ----
  async getAllShifts(req: Request, res: Response) {
    try {
      const data = await shiftService.getAllShifts();
      return res.json(sendSuccess(data, 'Shifts retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  async getShiftById(req: Request, res: Response) {
    try {
      const data = await shiftService.getShiftById(parseInt(req.params.id));
      if (!data) return res.status(404).json(sendError('Shift not found'));
      return res.json(sendSuccess(data, 'Shift retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  async createShift(req: Request, res: Response) {
    try {
      const adminId = (req as any).user?.id || 1;
      const data = await shiftService.createShift(req.body, adminId);
      return res.status(201).json(sendSuccess(data, 'Shift created successfully'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  async updateShift(req: Request, res: Response) {
    try {
      const adminId = (req as any).user?.id || 1;
      const data = await shiftService.updateShift(parseInt(req.params.id), req.body, adminId);
      return res.json(sendSuccess(data, 'Shift updated'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  async deleteShift(req: Request, res: Response) {
    try {
      await shiftService.deleteShift(parseInt(req.params.id));
      return res.json(sendSuccess(null, 'Shift deactivated'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  async seedDefaultShifts(req: Request, res: Response) {
    try {
      const adminId = (req as any).user?.id || 1;
      const data = await shiftService.seedDefaultShifts(adminId);
      return res.json(sendSuccess(data, '7 enterprise shift templates seeded successfully'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // ---- Assignments ----
  async assignShift(req: Request, res: Response) {
    try {
      const adminId = (req as any).user?.id || 1;
      const { employee_id, shift_id, effective_date, expiry_date } = req.body;
      const data = await shiftService.assignShift(
        Number(employee_id), Number(shift_id), effective_date, adminId, expiry_date
      );
      return res.status(201).json(sendSuccess(data, 'Shift assigned to employee'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  async bulkAssignShift(req: Request, res: Response) {
    try {
      const adminId = (req as any).user?.id || 1;
      const { employee_ids, shift_id, effective_date } = req.body;
      const data = await shiftService.bulkAssignShift(
        (employee_ids as number[]).map(Number), Number(shift_id), effective_date, adminId
      );
      return res.json(sendSuccess(data, `Shift bulk-assigned to ${employee_ids.length} employees`));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  async getMyShift(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const data = await shiftService.getEmployeeShift(userId);
      return res.json(sendSuccess(data, 'Current shift retrieved'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  async getEmployeeShift(req: Request, res: Response) {
    try {
      const data = await shiftService.getEmployeeShift(parseInt(req.params.employeeId));
      return res.json(sendSuccess(data, 'Employee shift retrieved'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  async getAllAssignments(req: Request, res: Response) {
    try {
      const { department_id, branch_id, shift_id } = req.query;
      const data = await shiftService.getAllAssignments({
        department_id: department_id ? Number(department_id) : undefined,
        branch_id: branch_id ? Number(branch_id) : undefined,
        shift_id: shift_id ? Number(shift_id) : undefined,
      });
      return res.json(sendSuccess(data, 'Assignments retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  async getShiftHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const employeeId = req.query.employee_id ? Number(req.query.employee_id) : userId;
      const data = await shiftService.getShiftHistory(employeeId);
      return res.json(sendSuccess(data, 'Shift history retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // ---- Shift Swap ----
  async requestSwap(req: Request, res: Response) {
    try {
      const requesterId = (req as any).user?.id;
      const data = await shiftService.requestShiftSwap({ ...req.body, requester_id: requesterId });
      return res.status(201).json(sendSuccess(data, 'Shift swap request submitted'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  async getSwapRequests(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const isManager = ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'DEPT_HEAD'].includes(user?.role);
      const data = await shiftService.getSwapRequests(user?.id, isManager);
      return res.json(sendSuccess(data, 'Swap requests retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  async processSwap(req: Request, res: Response) {
    try {
      const approverId = (req as any).user?.id;
      const { status } = req.body;
      const data = await shiftService.processSwapRequest(parseInt(req.params.id), status, approverId);
      return res.json(sendSuccess(data, `Swap request ${status.toLowerCase()}`));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // ---- Overtime ----
  async requestOvertime(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const data = await shiftService.requestOvertime({ ...req.body, employee_id: userId });
      return res.status(201).json(sendSuccess(data, 'Overtime request submitted'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  async getOvertimeRequests(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const isManager = ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'DEPT_HEAD'].includes(user?.role);
      const data = await shiftService.getOvertimeRequests(user?.id, isManager);
      return res.json(sendSuccess(data, 'Overtime requests retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  async processOvertime(req: Request, res: Response) {
    try {
      const approverId = (req as any).user?.id;
      const { status, approved_hours } = req.body;
      const data = await shiftService.processOvertimeRequest(
        parseInt(req.params.id), status, Number(approved_hours || 0), approverId
      );
      return res.json(sendSuccess(data, `Overtime request ${status.toLowerCase()}`));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // ---- Reports ----
  async getShiftUtilizationReport(req: Request, res: Response) {
    try {
      const data = await shiftService.getShiftUtilizationReport(
        req.query.startDate as string, req.query.endDate as string
      );
      return res.json(sendSuccess(data, 'Shift utilization report generated'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  async getOvertimeSummaryReport(req: Request, res: Response) {
    try {
      const data = await shiftService.getOvertimeSummary(
        req.query.startDate as string, req.query.endDate as string
      );
      return res.json(sendSuccess(data, 'Overtime summary report generated'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }
}

export const shiftController = new ShiftController();
