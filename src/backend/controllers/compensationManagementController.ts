import { Request, Response } from 'express';
import { compensationManagementService } from '../services/compensationManagementService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class CompensationManagementController {
  // POST /compensation/bonus/seed
  async seedBonus(req: Request, res: Response) {
    try {
      await compensationManagementService.seedBonusMaster();
      return res.json(sendSuccess(null, 'Standard bonus types pre-seeded'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /compensation/bonus/types
  async getBonusMaster(req: Request, res: Response) {
    try {
      const data = await compensationManagementService.getBonusMaster();
      return res.json(sendSuccess(data, 'Bonus master retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /bonus
  async assignBonus(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await compensationManagementService.assignBonus(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Bonus assigned to employee'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // PATCH /bonus/:id/approve
  async approveBonus(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const data = await compensationManagementService.approveBonus(id, user?.id || 1);
      return res.json(sendSuccess(data, 'Bonus approved'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /bonus
  async getBonuses(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const empId = req.query.employeeId ? parseInt(req.query.employeeId as string) : (user?.role === 'EMPLOYEE' ? user?.id : undefined);
      const data = await compensationManagementService.getBonuses(empId);
      return res.json(sendSuccess(data, 'Employee bonuses retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /incentive
  async awardIncentive(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await compensationManagementService.awardIncentive(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Incentive awarded'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /incentives
  async getIncentives(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const empId = req.query.employeeId ? parseInt(req.query.employeeId as string) : (user?.role === 'EMPLOYEE' ? user?.id : undefined);
      const data = await compensationManagementService.getIncentives(empId);
      return res.json(sendSuccess(data, 'Employee incentives retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /reimbursement
  async submitClaim(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const dto = { ...req.body, employee_id: user?.role === 'EMPLOYEE' ? user?.id : (req.body.employee_id || user?.id) };
      const data = await compensationManagementService.submitClaim(dto);
      return res.status(201).json(sendSuccess(data, 'Reimbursement claim submitted'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // PATCH /reimbursement/:id/approve
  async approveClaim(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const data = await compensationManagementService.approveClaim(id, user?.id || 1, user?.role);
      return res.json(sendSuccess(data, 'Reimbursement claim approved'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /reimbursements
  async getClaims(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const empId = req.query.employeeId ? parseInt(req.query.employeeId as string) : (user?.role === 'EMPLOYEE' ? user?.id : undefined);
      const data = await compensationManagementService.getClaims(empId);
      return res.json(sendSuccess(data, 'Reimbursement claims retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /compensation/analytics
  async getAnalytics(req: Request, res: Response) {
    try {
      const data = await compensationManagementService.getCompensationAnalytics();
      return res.json(sendSuccess(data, 'Compensation BI analytics retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }
}

export const compensationManagementController = new CompensationManagementController();
