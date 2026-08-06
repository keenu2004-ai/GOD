import dbService from '../database/db.js';

export class AnnouncementRepository {
  async getAll() {
    const sql = `
      SELECT a.*, e.first_name as author_first_name, e.last_name as author_last_name, e.avatar_url as author_avatar
      FROM announcements a
      JOIN employees e ON a.posted_by = e.id
      ORDER BY a.is_pinned DESC, a.id DESC
    `;
    const res = await dbService.query(sql);
    return res.rows;
  }

  async create(title: string, content: string, category: string, isPinned: boolean, postedBy: number) {
    const res = await dbService.query(
      `INSERT INTO announcements (title, content, category, is_pinned, posted_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, content, category || 'GENERAL', isPinned || false, postedBy]
    );
    return res.rows[0];
  }
}

export const announcementRepository = new AnnouncementRepository();
