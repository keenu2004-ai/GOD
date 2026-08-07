import { Request, Response } from 'express';
import { salaryComponentEngineService } from '../services/salaryComponentEngineService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class SalaryComponentEngineController {
  // POST /payroll/components/seed
  async seedComponents(req: Request, res: Response) {
    try {
      await salaryComponentEngineService.seedComponentMaster();
      return res.json(sendSuccess(null, 'Standard 25+ salary components pre-seeded'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /payroll/components
  async getComponents(req: Request, res: Response) {
    try {
      const data = await salaryComponentEngineService.getComponentMaster();
      return res.json(sendSuccess(data, 'Salary components master retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /payroll/components
  async createComponent(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await salaryComponentEngineService.createCustomComponent(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Custom salary component created successfully'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /payroll/loans/request
  async requestLoan(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const dto = { ...req.body, employee_id: user?.role === 'EMPLOYEE' ? user?.id : (req.body.employee_id || user?.id) };
      const data = await salaryComponentEngineService.requestLoan(dto);
      return res.status(201).json(sendSuccess(data, 'Loan request submitted'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // PATCH /payroll/loans/:id/approve
  async approveLoan(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const data = await salaryComponentEngineService.approveLoan(id, user?.id || 1);
      return res.json(sendSuccess(data, 'Loan approved and EMI active'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /payroll/loans
  async getLoans(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const empId = req.query.employeeId ? parseInt(req.query.employeeId as string) : (user?.role === 'EMPLOYEE' ? user?.id : undefined);
      const data = await salaryComponentEngineService.getLoans(empId);
      return res.json(sendSuccess(data, 'Loans retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /payroll/advances/request
  async requestAdvance(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const dto = { ...req.body, employee_id: user?.role === 'EMPLOYEE' ? user?.id : (req.body.employee_id || user?.id) };
      const data = await salaryComponentEngineService.requestAdvance(dto);
      return res.status(201).json(sendSuccess(data, 'Salary advance requested'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // PATCH /payroll/advances/:id/approve
  async approveAdvance(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const data = await salaryComponentEngineService.approveAdvance(id, user?.id || 1);
      return res.json(sendSuccess(data, 'Salary advance approved'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /payroll/advances
  async getAdvances(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const empId = req.query.employeeId ? parseInt(req.query.employeeId as string) : (user?.role === 'EMPLOYEE' ? user?.id : undefined);
      const data = await salaryComponentEngineService.getAdvances(empId);
      return res.json(sendSuccess(data, 'Salary advances retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /payroll/bank-details
  async saveBankDetails(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await salaryComponentEngineService.saveBankDetails(req.body, user?.id || 1);
      return res.json(sendSuccess(data, 'Bank details updated successfully'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /payroll/bank-details/:employeeId
  async getBankDetails(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const empId = req.params.employeeId ? parseInt(req.params.employeeId) : user?.id;
      const data = await salaryComponentEngineService.getBankDetails(empId);
      return res.json(sendSuccess(data, 'Bank details retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /payroll/bank-details
  async getAllBankDetails(req: Request, res: Response) {
    try {
      const data = await salaryComponentEngineService.getAllBankDetails();
      return res.json(sendSuccess(data, 'All bank details retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /payroll/benefits
  async assignBenefit(req: Request, res: Response) {
    try {
      const data = await salaryComponentEngineService.assignBenefit(req.body);
      return res.status(201).json(sendSuccess(data, 'Employee benefit assigned'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /payroll/benefits
  async getBenefits(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const empId = req.query.employeeId ? parseInt(req.query.employeeId as string) : (user?.role === 'EMPLOYEE' ? user?.id : undefined);
      const data = await salaryComponentEngineService.getBenefits(empId);
      return res.json(sendSuccess(data, 'Employee benefits retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }
}

export const salaryComponentEngineController = new SalaryComponentEngineController();
