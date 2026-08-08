import { Request, Response } from 'express';
import { helpdeskEnterpriseService } from '../services/helpdeskEnterpriseService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class HelpdeskEnterpriseController {

  async createTicket(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await helpdeskEnterpriseService.createTicket(req.body, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Helpdesk ticket submitted successfully'));
    } catch (e: any) { return res.status(400).json(sendError(e.message)); }
  }

  async getTickets(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const filters = {
        status: req.query.status as string,
        priority: req.query.priority as string,
        category: req.query.category as string,
        assigned_to: req.query.assigned_to ? parseInt(req.query.assigned_to as string) : undefined,
        date_from: req.query.date_from as string,
        date_to: req.query.date_to as string,
        search: req.query.search as string
      };
      const data = await helpdeskEnterpriseService.getTickets(user?.role || 'EMPLOYEE', user?.id || 1, filters);
      return res.json(sendSuccess(data, 'Tickets retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  async getTicketById(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const data = await helpdeskEnterpriseService.getTicketById(id, user?.role || 'EMPLOYEE', user?.id || 1);
      return res.json(sendSuccess(data, 'Ticket detail retrieved'));
    } catch (e: any) { return res.status(400).json(sendError(e.message)); }
  }

  async assignTicket(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const { agent_id } = req.body;
      const data = await helpdeskEnterpriseService.assignTicket(id, parseInt(agent_id), user?.id || 1);
      return res.json(sendSuccess(data, 'Ticket assigned to agent'));
    } catch (e: any) { return res.status(400).json(sendError(e.message)); }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const { status, resolution_notes } = req.body;
      const data = await helpdeskEnterpriseService.updateStatus(id, status, resolution_notes, user?.id || 1);
      return res.json(sendSuccess(data, `Ticket status updated to ${status}`));
    } catch (e: any) { return res.status(400).json(sendError(e.message)); }
  }

  async escalateTicket(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const { escalate_to, reason } = req.body;
      const data = await helpdeskEnterpriseService.escalateTicket(id, escalate_to || null, reason || 'Escalated by agent', user?.id || 1);
      return res.json(sendSuccess(data, 'Ticket escalated'));
    } catch (e: any) { return res.status(400).json(sendError(e.message)); }
  }

  async reopenTicket(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const { reason } = req.body;
      const data = await helpdeskEnterpriseService.reopenTicket(id, reason || 'Issue persists', user?.id || 1);
      return res.json(sendSuccess(data, 'Ticket reopened'));
    } catch (e: any) { return res.status(400).json(sendError(e.message)); }
  }

  async addComment(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const { message, comment_text, is_internal_note } = req.body;
      const text = message || comment_text || '';
      const data = await helpdeskEnterpriseService.addComment(id, user?.id || 1, text, Boolean(is_internal_note), user?.role || 'EMPLOYEE');
      return res.status(201).json(sendSuccess(data, 'Comment added'));
    } catch (e: any) { return res.status(400).json(sendError(e.message)); }
  }

  async getComments(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const data = await helpdeskEnterpriseService.getComments(id, user?.role || 'EMPLOYEE');
      return res.json(sendSuccess(data, 'Comments retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  async addWatcher(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const { employee_id } = req.body;
      const data = await helpdeskEnterpriseService.addWatcher(id, parseInt(employee_id), user?.id || 1);
      return res.json(sendSuccess(data, 'Watcher added'));
    } catch (e: any) { return res.status(400).json(sendError(e.message)); }
  }

  async removeWatcher(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const empId = parseInt(req.params.employeeId);
      const data = await helpdeskEnterpriseService.removeWatcher(id, empId);
      return res.json(sendSuccess(data, 'Watcher removed'));
    } catch (e: any) { return res.status(400).json(sendError(e.message)); }
  }

  async addTag(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { tag_name } = req.body;
      const data = await helpdeskEnterpriseService.addTag(id, tag_name);
      return res.json(sendSuccess(data, 'Tag added'));
    } catch (e: any) { return res.status(400).json(sendError(e.message)); }
  }

  async removeTag(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { tag_name } = req.body;
      const data = await helpdeskEnterpriseService.removeTag(id, tag_name);
      return res.json(sendSuccess(data, 'Tag removed'));
    } catch (e: any) { return res.status(400).json(sendError(e.message)); }
  }

  async rateSatisfaction(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const id = parseInt(req.params.id);
      const { rating, feedback } = req.body;
      const data = await helpdeskEnterpriseService.rateSatisfaction(id, user?.id || 1, parseInt(rating), feedback || '');
      return res.json(sendSuccess(data, 'Satisfaction rating submitted'));
    } catch (e: any) { return res.status(400).json(sendError(e.message)); }
  }

  async createArticle(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { title, content, category_id, tags } = req.body;
      const data = await helpdeskEnterpriseService.createArticle(title, content, category_id || null, tags || '', user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Knowledge base article created'));
    } catch (e: any) { return res.status(400).json(sendError(e.message)); }
  }

  async getArticles(req: Request, res: Response) {
    try {
      const search = req.query.search as string;
      const data = await helpdeskEnterpriseService.getArticles(search);
      return res.json(sendSuccess(data, 'Articles retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  async viewArticle(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const data = await helpdeskEnterpriseService.viewArticle(id);
      return res.json(sendSuccess(data, 'Article retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  async createCannedResponse(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { title, response_text, category, shortcut_code } = req.body;
      const data = await helpdeskEnterpriseService.createCannedResponse(title, response_text, category, shortcut_code, user?.id || 1);
      return res.status(201).json(sendSuccess(data, 'Canned response created'));
    } catch (e: any) { return res.status(400).json(sendError(e.message)); }
  }

  async getCannedResponses(req: Request, res: Response) {
    try {
      const category = req.query.category as string;
      const data = await helpdeskEnterpriseService.getCannedResponses(category);
      return res.json(sendSuccess(data, 'Canned responses retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  async useCannedResponse(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const data = await helpdeskEnterpriseService.useCannedResponse(id);
      return res.json(sendSuccess(data, 'Canned response loaded'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  async getCategories(req: Request, res: Response) {
    try {
      const data = await helpdeskEnterpriseService.getCategories();
      return res.json(sendSuccess(data, 'Categories retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  async createCategory(req: Request, res: Response) {
    try {
      const { name, code, description, department_id, default_assignee_id } = req.body;
      const data = await helpdeskEnterpriseService.createCategory(name, code, description || '', department_id || null, default_assignee_id || null);
      return res.status(201).json(sendSuccess(data, 'Category created'));
    } catch (e: any) { return res.status(400).json(sendError(e.message)); }
  }

  async getSLARules(req: Request, res: Response) {
    try {
      const data = await helpdeskEnterpriseService.getSLARules();
      return res.json(sendSuccess(data, 'SLA rules retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  async createSLARule(req: Request, res: Response) {
    try {
      const { category, priority, resolution_hours } = req.body;
      const data = await helpdeskEnterpriseService.createSLARule(category, priority, parseInt(resolution_hours));
      return res.status(201).json(sendSuccess(data, 'SLA rule created'));
    } catch (e: any) { return res.status(400).json(sendError(e.message)); }
  }

  async getEscalationRules(req: Request, res: Response) {
    try {
      const data = await helpdeskEnterpriseService.getEscalationRules();
      return res.json(sendSuccess(data, 'Escalation rules retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  async createEscalationRule(req: Request, res: Response) {
    try {
      const { category_id, priority, escalation_after_hours, escalate_to_role, escalate_to_employee_id } = req.body;
      const data = await helpdeskEnterpriseService.createEscalationRule(
        parseInt(category_id), priority, parseInt(escalation_after_hours),
        escalate_to_role || 'HR_MANAGER', escalate_to_employee_id ? parseInt(escalate_to_employee_id) : null
      );
      return res.status(201).json(sendSuccess(data, 'Escalation rule created'));
    } catch (e: any) { return res.status(400).json(sendError(e.message)); }
  }

  async getAnalytics(req: Request, res: Response) {
    try {
      const data = await helpdeskEnterpriseService.getAnalytics();
      return res.json(sendSuccess(data, 'Helpdesk analytics retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  async bulkAssign(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { ticket_ids, agent_id } = req.body;
      const data = await helpdeskEnterpriseService.bulkAssign(ticket_ids, parseInt(agent_id), user?.id || 1);
      return res.json(sendSuccess(data, `${ticket_ids.length} tickets assigned`));
    } catch (e: any) { return res.status(400).json(sendError(e.message)); }
  }

  async bulkClose(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { ticket_ids, reason } = req.body;
      const data = await helpdeskEnterpriseService.bulkClose(ticket_ids, reason || 'Bulk closure', user?.id || 1);
      return res.json(sendSuccess(data, `${ticket_ids.length} tickets closed`));
    } catch (e: any) { return res.status(400).json(sendError(e.message)); }
  }

  async getMyTickets(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await helpdeskEnterpriseService.getMyTickets(user?.id || 1);
      return res.json(sendSuccess(data, 'My tickets retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  async getAgentQueue(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await helpdeskEnterpriseService.getAgentQueue(user?.id || 1);
      return res.json(sendSuccess(data, 'Agent queue retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  async seedCategories(req: Request, res: Response) {
    try {
      const data = await helpdeskEnterpriseService.seedCategories();
      return res.json(sendSuccess(data, 'Helpdesk categories and SLA rules seeded'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }
}

export const helpdeskEnterpriseController = new HelpdeskEnterpriseController();
