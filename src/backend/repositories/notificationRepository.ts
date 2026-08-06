import dbService from '../database/db.js';

export class NotificationRepository {
  async getByEmployee(employeeId: number) {
    const res = await dbService.query(
      'SELECT * FROM notifications WHERE employee_id = $1 ORDER BY id DESC LIMIT 20',
      [employeeId]
    );
    return res.rows;
  }

  async markAsRead(id: number) {
    await dbService.query('UPDATE notifications SET is_read = true WHERE id = $1', [id]);
    return true;
  }

  async create(employeeId: number, title: string, message: string, type: string = 'INFO') {
    const res = await dbService.query(
      `INSERT INTO notifications (employee_id, title, message, type) VALUES ($1, $2, $3, $4) RETURNING *`,
      [employeeId, title, message, type]
    );
    return res.rows[0];
  }
}

export const notificationRepository = new NotificationRepository();
