import { Request, Response } from 'express';
import { helpdeskService } from '../services/helpdeskService.js';

// Standardized payload format based on existing architecture
const sendSuccess = (data: any, message = 'Success') => ({ status: 'success', message, data });
const sendError = (message: string) => ({ status: 'error', message });

class HelpdeskController {
  async createTicket(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!req.body.subject || !req.body.description || !req.body.category || !req.body.type) {
        return res.status(400).json(sendError('Missing required fields: subject, description, category, type'));
      }
      const data = await helpdeskService.createTicket(req.body, user.id);
      return res.status(201).json(sendSuccess(data, 'Ticket created successfully'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  async getTickets(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await helpdeskService.getAllTickets(user.role, user.id);
      return res.json(sendSuccess(data, 'Tickets retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  async getTicket(req: Request, res: Response) {
    try {
      const data = await helpdeskService.getTicketById(parseInt(req.params.id));
      if (!data) return res.status(404).json(sendError('Ticket not found'));
      return res.json(sendSuccess(data, 'Ticket retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!req.body.status) return res.status(400).json(sendError('Missing status'));
      const data = await helpdeskService.updateStatus(parseInt(req.params.id), req.body.status, user.id);
      return res.json(sendSuccess(data, 'Ticket status updated'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  async assignTicket(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!req.body.assigned_to) return res.status(400).json(sendError('Missing assigned_to'));
      const data = await helpdeskService.assignTicket(parseInt(req.params.id), parseInt(req.body.assigned_to), user.id);
      return res.json(sendSuccess(data, 'Ticket assigned'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  async addComment(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!req.body.comment) return res.status(400).json(sendError('Missing comment'));
      const data = await helpdeskService.addComment(parseInt(req.params.id), user.id, req.body.comment, !!req.body.is_internal);
      return res.status(201).json(sendSuccess(data, 'Comment added'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  async getComments(req: Request, res: Response) {
    try {
      const data = await helpdeskService.getComments(parseInt(req.params.id));
      return res.json(sendSuccess(data, 'Comments retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }
}

export const helpdeskController = new HelpdeskController();
