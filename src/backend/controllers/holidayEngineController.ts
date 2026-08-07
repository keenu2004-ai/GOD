import { Request, Response } from 'express';
import { holidayEngineService } from '../services/holidayEngineService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class HolidayEngineController {
  // POST /holidays/seed-defaults
  async seedDefaults(req: Request, res: Response) {
    try {
      await holidayEngineService.seedDefaults();
      return res.json(sendSuccess(null, '2026 Regional Indian & Festival Holidays seeded'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /holidays
  async getHolidays(req: Request, res: Response) {
    try {
      const regionCode = req.query.regionCode as string;
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string) : undefined;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;

      const data = await holidayEngineService.getAllHolidays(regionCode, branchId, year);
      return res.json(sendSuccess(data, 'Holidays retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /holidays
  async createHoliday(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await holidayEngineService.createHoliday(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Holiday created successfully'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // DELETE /holidays/:id
  async deleteHoliday(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const data = await holidayEngineService.deleteHoliday(id, user?.id || 1);
      return res.json(sendSuccess(data, 'Holiday deleted'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /holidays/optional/select
  async selectOptionalHoliday(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { holiday_id, year = new Date().getFullYear() } = req.body;
      const data = await holidayEngineService.selectOptionalHoliday(user?.id || req.body.employee_id, parseInt(holiday_id), parseInt(year));
      return res.status(201).json(sendSuccess(data, 'Optional holiday selected'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /holidays/optional/my
  async getMyOptionalHolidays(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      const data = await holidayEngineService.getMyOptionalHolidays(user?.id || 1, year);
      return res.json(sendSuccess(data, 'Optional holiday selections retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /company-events
  async getCompanyEvents(req: Request, res: Response) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const data = await holidayEngineService.getCompanyEvents(year, month);
      return res.json(sendSuccess(data, 'Company events retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // POST /company-events
  async createCompanyEvent(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await holidayEngineService.createCompanyEvent(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Company event created'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /calendar/unified-feed
  async getUnifiedCalendarFeed(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const empId = req.query.employeeId ? parseInt(req.query.employeeId as string) : user?.id;

      const data = await holidayEngineService.getUnifiedCalendarFeed(empId, year, month);
      return res.json(sendSuccess(data, 'Unified enterprise calendar feed retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }
}

export const holidayEngineController = new HolidayEngineController();
