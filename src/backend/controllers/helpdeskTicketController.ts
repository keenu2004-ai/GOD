import { Request, Response } from 'express';
import { helpdeskTicketService } from '../services/helpdeskTicketService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class HelpdeskTicketController {
  // POST /helpdesk/create
  async createTicket(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await helpdeskTicketService.createTicket(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Ticket created successfully'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /helpdesk/all
  async getTickets(req: Request, res: Response) {
    try {
      const data = await helpdeskTicketService.getTickets();
      return res.json(sendSuccess(data, 'Tickets retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // PATCH /helpdesk/tickets/:id/assign
  async assignTicket(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const ticketId = parseInt(req.params.id);
      const { agent_id } = req.body;
      const data = await helpdeskTicketService.assignTicket(ticketId, parseInt(agent_id), user?.id || 1);
      return res.json(sendSuccess(data, 'Ticket assigned to agent'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // PATCH /helpdesk/tickets/:id/resolve
  async resolveTicket(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const ticketId = parseInt(req.params.id);
      const { resolution_notes } = req.body;
      const data = await helpdeskTicketService.resolveTicket(ticketId, resolution_notes || 'Resolved by agent', user?.id || 1);
      return res.json(sendSuccess(data, 'Ticket resolved'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /helpdesk/tickets/:id/comments
  async addComment(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const ticketId = parseInt(req.params.id);
      const { message, is_internal_note } = req.body;
      const data = await helpdeskTicketService.addComment(ticketId, user?.id || 1, message, Boolean(is_internal_note), user?.role || 'EMPLOYEE');
      return res.status(201).json(sendSuccess(data, 'Comment added'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /helpdesk/tickets/:id/comments
  async getComments(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const ticketId = parseInt(req.params.id);
      const data = await helpdeskTicketService.getComments(ticketId, user?.id || 1, user?.role || 'EMPLOYEE');
      return res.json(sendSuccess(data, 'Comments retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }
}

export const helpdeskTicketController = new HelpdeskTicketController();
