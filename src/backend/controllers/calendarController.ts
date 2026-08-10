import { Request, Response } from 'express';
import { calendarService } from '../services/calendarService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class CalendarController {
  async getEvents(req: Request, res: Response) {
    try {
      const { start, end, employeeId, eventTypes } = req.query;
      const empId = employeeId ? parseInt(employeeId as string, 10) : undefined;
      const types = eventTypes ? (eventTypes as string).split(',') : undefined;

      const events = await calendarService.getUnifiedEvents(
        start as string,
        end as string,
        empId,
        types
      );
      return res.json(sendSuccess(events, 'Unified calendar events retrieved successfully'));
    } catch (err: any) {
      return res.status(500).json(sendError(err.message));
    }
  }

  async getTasks(req: Request, res: Response) {
    try {
      const { assignedTo, startDate, endDate } = req.query;
      const empId = assignedTo ? parseInt(assignedTo as string, 10) : (req as any).user?.id;
      const tasks = await calendarService.getTasks(empId, startDate as string, endDate as string);
      return res.json(sendSuccess(tasks, 'Calendar tasks retrieved successfully'));
    } catch (err: any) {
      return res.status(500).json(sendError(err.message));
    }
  }

  async getTaskById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const task = await calendarService.getTaskById(id);
      return res.json(sendSuccess(task, 'Calendar task retrieved successfully'));
    } catch (err: any) {
      return res.status(404).json(sendError(err.message));
    }
  }

  async createTask(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || 1;
      const dto = {
        ...req.body,
        created_by: userId,
        assigned_to: req.body.assigned_to ? parseInt(req.body.assigned_to, 10) : userId,
      };
      const task = await calendarService.createTask(dto);
      return res.status(201).json(sendSuccess(task, 'Calendar task created successfully'));
    } catch (err: any) {
      return res.status(400).json(sendError(err.message));
    }
  }

  async updateTask(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await calendarService.updateTask(id, req.body);
      return res.json(sendSuccess(updated, 'Calendar task updated successfully'));
    } catch (err: any) {
      return res.status(400).json(sendError(err.message));
    }
  }

  async deleteTask(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      await calendarService.deleteTask(id);
      return res.json(sendSuccess(null, 'Calendar task deleted successfully'));
    } catch (err: any) {
      return res.status(400).json(sendError(err.message));
    }
  }
}

export const calendarController = new CalendarController();
