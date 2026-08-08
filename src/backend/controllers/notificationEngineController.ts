import { Request, Response } from 'express';
import { notificationEngineService } from '../services/notificationEngineService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class NotificationEngineController {
  // POST /notifications/dispatch
  async dispatchNotification(req: Request, res: Response) {
    try {
      const data = await notificationEngineService.dispatchNotification(req.body);
      return res.status(201).json(sendSuccess(data, 'Notification dispatched successfully'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // GET /notifications/my-notifications
  async getNotifications(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await notificationEngineService.getNotifications(user?.id || 1);
      return res.json(sendSuccess(data, 'In-app notifications retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // GET /notifications/unread-count
  async getUnreadCount(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const unread = await notificationEngineService.getUnreadCount(user?.id || 1);
      return res.json(sendSuccess({ unread_count: unread }, 'Unread count retrieved'));
    } catch (e: any) {
      return res.status(500).json(sendError(e.message));
    }
  }

  // PATCH /notifications/:id/read
  async markAsRead(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const notifId = parseInt(req.params.id);
      const data = await notificationEngineService.markAsRead(notifId, user?.id || 1);
      return res.json(sendSuccess(data, 'Notification marked as read'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /notifications/mark-all-read
  async markAllAsRead(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await notificationEngineService.markAllAsRead(user?.id || 1);
      return res.json(sendSuccess(data, 'All notifications marked as read'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }

  // POST /notifications/devices/register
  async registerDevice(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { device_token, platform } = req.body;
      const data = await notificationEngineService.registerDevice(user?.id || 1, device_token, platform);
      return res.status(201).json(sendSuccess(data, 'Push device registered'));
    } catch (e: any) {
      return res.status(400).json(sendError(e.message));
    }
  }
}

export const notificationEngineController = new NotificationEngineController();
