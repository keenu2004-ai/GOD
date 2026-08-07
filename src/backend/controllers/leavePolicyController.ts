import { Request, Response } from 'express';
import { leavePolicyService } from '../services/leavePolicyService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class LeavePolicyController {
  // POST /leave/seed-defaults
  async seedDefaults(req: Request, res: Response) {
    try {
      await leavePolicyService.seedDefaults();
      return res.json(sendSuccess(null, '19 Enterprise Leave Types seeded successfully'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /leave/types
  async getTypes(req: Request, res: Response) {
    try {
      const data = await leavePolicyService.getAllTypes();
      return res.json(sendSuccess(data, 'Leave types retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /leave/types
  async createType(req: Request, res: Response) {
    try {
      const data = await leavePolicyService.createType(req.body);
      return res.status(201).json(sendSuccess(data, 'Leave type created successfully'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /leave/policies
  async getPolicies(req: Request, res: Response) {
    try {
      const data = await leavePolicyService.getAllPolicies();
      return res.json(sendSuccess(data, 'Leave policies retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /leave/policies
  async createPolicy(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await leavePolicyService.createPolicy(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Leave policy created successfully'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // PATCH /leave/policies/:id
  async updatePolicy(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const data = await leavePolicyService.updatePolicy(id, req.body, user?.id || 1);
      return res.json(sendSuccess(data, 'Leave policy updated successfully'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // DELETE /leave/policies/:id
  async deletePolicy(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const data = await leavePolicyService.deletePolicy(id, user?.id || 1);
      return res.json(sendSuccess(data, 'Leave policy deleted'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /leave/policy/assign
  async assignPolicy(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await leavePolicyService.assignPolicy(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Leave policy assigned successfully'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /leave/assignments
  async getAssignments(req: Request, res: Response) {
    try {
      const data = await leavePolicyService.getAssignments();
      return res.json(sendSuccess(data, 'Policy assignments retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /leave/settings
  async getSettings(req: Request, res: Response) {
    try {
      const data = await leavePolicyService.getSettings();
      return res.json(sendSuccess(data, 'Leave settings retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /leave/settings
  async updateSettings(req: Request, res: Response) {
    try {
      const data = await leavePolicyService.updateSettings(req.body);
      return res.json(sendSuccess(data, 'Leave settings updated'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /leave/encash
  async requestEncashment(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { leave_type_id, days } = req.body;
      const data = await leavePolicyService.requestEncashment(user?.id || req.body.employee_id, parseInt(leave_type_id), parseFloat(days));
      return res.status(201).json(sendSuccess(data, 'Leave encashment request submitted'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /leave/encashments
  async getEncashments(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const empId = req.query.employeeId ? parseInt(req.query.employeeId as string) : (user?.role === 'EMPLOYEE' ? user?.id : undefined);
      const data = await leavePolicyService.getEncashments(empId);
      return res.json(sendSuccess(data, 'Encashments retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }
}

export const leavePolicyController = new LeavePolicyController();
