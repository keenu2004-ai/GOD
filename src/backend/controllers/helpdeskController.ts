import { Request, Response } from 'express';
import { helpdeskService } from '../services/helpdeskService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class HelpdeskController {
  // POST /helpdesk/tickets
  async createTicket(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await helpdeskService.createTicket(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Helpdesk ticket submitted'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /helpdesk/tickets
  async getTickets(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const role = user?.role || 'EMPLOYEE';
      const data = await helpdeskService.getTickets(role, user?.id || 1);
      return res.json(sendSuccess(data, 'Helpdesk tickets retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // PATCH /helpdesk/tickets/:id/assign
  async assignTicket(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const { agent_id } = req.body;
      const data = await helpdeskService.assignTicket(id, parseInt(agent_id), user?.id || 1);
      return res.json(sendSuccess(data, 'Ticket assigned to support agent'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // PATCH /helpdesk/tickets/:id/status
  async updateStatus(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const { status, resolution_notes } = req.body;
      const data = await helpdeskService.updateTicketStatus(id, status, resolution_notes, user?.id || 1);
      return res.json(sendSuccess(data, 'Ticket status updated'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /helpdesk/tickets/:id/reopen
  async reopenTicket(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const { reason } = req.body;
      const data = await helpdeskService.reopenTicket(id, reason || 'Issue persists', user?.id || 1);
      return res.json(sendSuccess(data, 'Ticket reopened'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /helpdesk/tickets/:id/comments
  async addComment(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const { comment_text, is_internal_note } = req.body;
      const data = await helpdeskService.addComment({ ticket_id: id, comment_text, is_internal_note }, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Comment added to ticket'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /helpdesk/tickets/:id/comments
  async getComments(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const role = user?.role || 'EMPLOYEE';
      const data = await helpdeskService.getComments(id, role);
      return res.json(sendSuccess(data, 'Ticket comments retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }
}

export const helpdeskController = new HelpdeskController();
