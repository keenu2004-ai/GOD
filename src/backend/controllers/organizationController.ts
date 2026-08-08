import { Request, Response } from 'express';
import { organizationService } from '../services/organizationService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class OrganizationController {
  // POST /org/branches
  async createBranch(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await organizationService.createBranch(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Branch created successfully'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /org/branches
  async getBranches(req: Request, res: Response) {
    try {
      const data = await organizationService.getBranches();
      return res.json(sendSuccess(data, 'Branches retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /org/transfers
  async transferEmployee(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { employee_id, to_branch_id, reason } = req.body;
      const data = await organizationService.transferEmployeeBranch(
        parseInt(employee_id), parseInt(to_branch_id), reason || 'Organizational Reassignment', user?.id || 1
      );
      return res.json(sendSuccess(data, 'Employee branch transferred'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /org/roles
  async getRoles(req: Request, res: Response) {
    try {
      const data = await organizationService.getRoles();
      return res.json(sendSuccess(data, 'Roles retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /org/roles/:id/permissions
  async getRolePermissions(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const data = await organizationService.getRolePermissions(id);
      return res.json(sendSuccess(data, 'Role permissions retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /org/hierarchy
  async getHierarchy(req: Request, res: Response) {
    try {
      const data = await organizationService.getOrganizationHierarchy();
      return res.json(sendSuccess(data, 'Organization hierarchy tree retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }
}

export const organizationController = new OrganizationController();
