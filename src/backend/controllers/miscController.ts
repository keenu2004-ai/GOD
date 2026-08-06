import { Request, Response } from 'express';
import { miscService } from '../services/miscServices.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class MiscController {
  // Recruitments
  async getJobOpenings(req: Request, res: Response) {
    try {
      const data = await miscService.getJobOpenings();
      return res.json(sendSuccess(data, 'Job openings retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  async createJobOpening(req: Request, res: Response) {
    try {
      const data = await miscService.createJobOpening(req.body);
      return res.status(201).json(sendSuccess(data, 'Job opening posted'));
    } catch (e: any) { return res.status(400).json(sendError(e.message)); }
  }

  async getCandidates(req: Request, res: Response) {
    try {
      const jobId = parseInt(req.params.jobId, 10);
      const data = await miscService.getCandidates(jobId);
      return res.json(sendSuccess(data, 'Candidates retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  async createCandidate(req: Request, res: Response) {
    try {
      const data = await miscService.createCandidate(req.body);
      return res.status(201).json(sendSuccess(data, 'Candidate application submitted'));
    } catch (e: any) { return res.status(400).json(sendError(e.message)); }
  }

  async updateCandidateStatus(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const { status, feedback } = req.body;
      const data = await miscService.updateCandidateStatus(id, status, feedback);
      return res.json(sendSuccess(data, 'Candidate status updated'));
    } catch (e: any) { return res.status(400).json(sendError(e.message)); }
  }

  // Assets
  async getAllAssets(req: Request, res: Response) {
    try {
      const data = await miscService.getAllAssets();
      return res.json(sendSuccess(data, 'Assets retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  async createAsset(req: Request, res: Response) {
    try {
      const data = await miscService.createAsset(req.body);
      return res.status(201).json(sendSuccess(data, 'Asset registered'));
    } catch (e: any) { return res.status(400).json(sendError(e.message)); }
  }

  // Notifications
  async getNotifications(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || req.query.employeeId || 1;
      const data = await miscService.getNotifications(Number(userId));
      return res.json(sendSuccess(data, 'Notifications retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  async markNotificationRead(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      await miscService.markNotificationRead(id);
      return res.json(sendSuccess(null, 'Notification marked as read'));
    } catch (e: any) { return res.status(400).json(sendError(e.message)); }
  }

  // Announcements
  async getAnnouncements(req: Request, res: Response) {
    try {
      const data = await miscService.getAllAnnouncements();
      return res.json(sendSuccess(data, 'Announcements retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  async createAnnouncement(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || req.body.posted_by || 1;
      const data = await miscService.createAnnouncement({ ...req.body, posted_by: userId });
      return res.status(201).json(sendSuccess(data, 'Announcement published'));
    } catch (e: any) { return res.status(400).json(sendError(e.message)); }
  }

  // Helpdesk
  async getHelpdeskTickets(req: Request, res: Response) {
    try {
      const empId = req.query.employeeId ? parseInt(req.query.employeeId as string, 10) : undefined;
      const data = await miscService.getHelpdeskTickets(empId);
      return res.json(sendSuccess(data, 'Helpdesk tickets retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  async createTicket(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || req.body.employee_id || 1;
      const data = await miscService.createTicket({ ...req.body, employee_id: userId });
      return res.status(201).json(sendSuccess(data, 'Helpdesk ticket submitted'));
    } catch (e: any) { return res.status(400).json(sendError(e.message)); }
  }

  async updateTicketStatus(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const { status, assigned_to } = req.body;
      const data = await miscService.updateTicketStatus(id, status, assigned_to);
      return res.json(sendSuccess(data, 'Ticket status updated'));
    } catch (e: any) { return res.status(400).json(sendError(e.message)); }
  }

  // Branches
  async getBranches(req: Request, res: Response) {
    try {
      const data = await miscService.getAllBranches();
      return res.json(sendSuccess(data, 'Branches list retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  // Documents
  async getDocuments(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || parseInt(req.params.employeeId, 10);
      const data = await miscService.getDocuments(userId);
      return res.json(sendSuccess(data, 'Documents retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  async createDocument(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || req.body.employee_id || 1;
      const data = await miscService.createDocument({ ...req.body, employee_id: userId });
      return res.status(201).json(sendSuccess(data, 'Document uploaded'));
    } catch (e: any) { return res.status(400).json(sendError(e.message)); }
  }

  // Timesheets
  async getTimesheets(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || parseInt(req.params.employeeId, 10) || 1;
      const data = await miscService.getTimesheets(userId);
      return res.json(sendSuccess(data, 'Timesheet entries retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  async logTimesheet(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || req.body.employee_id || 1;
      const data = await miscService.logTimesheet({ ...req.body, employee_id: userId });
      return res.status(201).json(sendSuccess(data, 'Timesheet hours logged'));
    } catch (e: any) { return res.status(400).json(sendError(e.message)); }
  }

  // Performance Reviews
  async getPerformanceReviews(req: Request, res: Response) {
    try {
      const data = await miscService.getPerformanceReviews();
      return res.json(sendSuccess(data, 'Performance reviews retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  async createPerformanceReview(req: Request, res: Response) {
    try {
      const reviewerId = (req as any).user?.id || req.body.reviewer_id || 1;
      const data = await miscService.createPerformanceReview({ ...req.body, reviewer_id: reviewerId });
      return res.status(201).json(sendSuccess(data, 'Performance review submitted'));
    } catch (e: any) { return res.status(400).json(sendError(e.message)); }
  }

  // Weekly Planner
  async getWeeklyPlanner(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || parseInt(req.params.employeeId, 10) || 1;
      const data = await miscService.getWeeklyPlanner(userId);
      return res.json(sendSuccess(data, 'Weekly planner tasks retrieved'));
    } catch (e: any) { return res.status(500).json(sendError(e.message)); }
  }

  async createWeeklyPlannerTask(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || req.body.employee_id || 1;
      const data = await miscService.createWeeklyPlannerTask({ ...req.body, employee_id: userId });
      return res.status(201).json(sendSuccess(data, 'Task added to weekly planner'));
    } catch (e: any) { return res.status(400).json(sendError(e.message)); }
  }

  async updatePlannerStatus(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id, 10);
      const { status } = req.body;
      const data = await miscService.updatePlannerStatus(id, status);
      return res.json(sendSuccess(data, 'Planner status updated'));
    } catch (e: any) { return res.status(400).json(sendError(e.message)); }
  }
}

export const miscController = new MiscController();
