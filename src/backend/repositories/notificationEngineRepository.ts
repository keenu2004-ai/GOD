import dbService from '../database/db.js';

export interface DispatchNotificationDTO {
  recipient_id: number;
  type: string;
  title: string;
  message: string;
  deep_link?: string;
  priority?: string;
  channel?: string;
}

export class NotificationEngineRepository {

  // ─── Central Event Dispatcher ─────────────────────────────────────────────
  async dispatchNotification(dto: DispatchNotificationDTO) {
    const res = await dbService.query(
      `INSERT INTO notifications (employee_id, title, message, type, channel, priority, deep_link, is_read)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false) RETURNING *`,
      [
        dto.recipient_id, dto.title, dto.message, dto.type,
        dto.channel || 'IN_APP', dto.priority || 'NORMAL', dto.deep_link || null
      ]
    );

    return res.rows[0];
  }

  // ─── In-App Notifications & Unread Count Manager ──────────────────────────
  async getNotifications(employeeId: number) {
    const res = await dbService.query(
      `SELECT * FROM notifications WHERE employee_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [employeeId]
    );
    return res.rows;
  }

  async getUnreadCount(employeeId: number) {
    const res = await dbService.query(
      `SELECT COUNT(*)::int as unread_count FROM notifications WHERE employee_id = $1 AND is_read = false`,
      [employeeId]
    );
    return res.rows[0]?.unread_count || 0;
  }

  async markAsRead(notificationId: number, employeeId: number) {
    const res = await dbService.query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND employee_id = $2 RETURNING *`,
      [notificationId, employeeId]
    );
    return res.rows[0];
  }

  async markAllAsRead(employeeId: number) {
    await dbService.query(
      `UPDATE notifications SET is_read = true WHERE employee_id = $1`,
      [employeeId]
    );
    return { success: true };
  }

  // ─── Device Registration Engine ───────────────────────────────────────────
  async registerDevice(employeeId: number, deviceToken: string, platform: string = 'ANDROID') {
    const res = await dbService.query(
      `INSERT INTO notification_devices (employee_id, device_token, platform, is_active, last_seen)
       VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP)
       RETURNING *`,
      [employeeId, deviceToken, platform]
    );
    return res.rows[0];
  }
}

export const notificationEngineRepository = new NotificationEngineRepository();
