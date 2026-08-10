import { Request, Response } from 'express';
import { employeeService } from '../services/employeeService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class EmployeeController {
  async getAll(req: Request, res: Response) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const search = req.query.search as string;
      const departmentId = req.query.departmentId ? parseInt(req.query.departmentId as string, 10) : undefined;
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string, 10) : undefined;
      const role = req.query.role as string;
      const status = req.query.status as string;
      const includeDeleted = req.query.includeDeleted === 'true';
      const sortBy = req.query.sortBy as string;
      const sortOrder = req.query.sortOrder === 'ASC' ? 'ASC' : 'DESC';
      const user = (req as any).user;

      const data = await employeeService.getAllEmployees({
        page, limit, search, departmentId, branchId, role, status, includeDeleted, sortBy, sortOrder,
        organizationId: user?.organization_id
      });

      return res.json(sendSuccess(data, 'Employees retrieved successfully'));
    } catch (error: any) {
      return res.status(500).json(sendError(error.message));
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json(sendError('Invalid employee ID parameter'));
      }
      const user = (req as any).user;
      const data = await employeeService.getEmployeeById(id, user?.organization_id);
      return res.json(sendSuccess(data, 'Employee details retrieved'));
    } catch (error: any) {
      return res.status(404).json(sendError(error.message));
    }
  }

  async create(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await employeeService.createEmployee(req.body, user?.organization_id);
      return res.status(201).json(sendSuccess(data, 'Employee created successfully'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json(sendError('Invalid employee ID parameter'));
      }
      const user = (req as any).user;
      const data = await employeeService.updateEmployee(id, req.body, user?.organization_id);
      return res.json(sendSuccess(data, 'Employee updated successfully'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }

  async softDelete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json(sendError('Invalid employee ID parameter'));
      }
      const user = (req as any).user;
      await employeeService.softDeleteEmployee(id, user?.organization_id);
      return res.json(sendSuccess(null, 'Employee deactivated / soft deleted'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }

  async restore(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json(sendError('Invalid employee ID parameter'));
      }
      const user = (req as any).user;
      await employeeService.restoreEmployee(id, user?.organization_id);
      return res.json(sendSuccess(null, 'Employee restored successfully'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }

  async updateRole(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const { role } = req.body;
      if (!role) return res.status(400).json(sendError('Role is required'));
      const user = (req as any).user;
      await employeeService.updateRole(id, role, user?.organization_id);
      return res.json(sendSuccess(null, `Employee role updated to ${role}`));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }

  async permanentDelete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const user = (req as any).user;
      await employeeService.permanentDeleteEmployee(id, user?.organization_id);
      return res.json(sendSuccess(null, 'Employee permanently deleted from database'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }

  async addEducation(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const data = await employeeService.addEducation(id, req.body);
      return res.status(201).json(sendSuccess(data, 'Education record added successfully'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }

  async addExperience(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const data = await employeeService.addExperience(id, req.body);
      return res.status(201).json(sendSuccess(data, 'Experience record added successfully'));
    } catch (error: any) {
      return res.status(400).json(sendError(error.message));
    }
  }
}

export const employeeController = new EmployeeController();
