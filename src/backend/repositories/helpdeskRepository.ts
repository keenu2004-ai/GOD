import db from '../database/db.js';

export interface TicketDTO {
  requester_id: number;
  category: string;
  type: string;
  subject: string;
  description: string;
  priority: string;
}

class HelpdeskRepository {
  async createTicket(ticketNumber: string, dto: TicketDTO) {
    const res = await db.query(
      `INSERT INTO helpdesk_tickets (ticket_code, employee_id, category, type, subject, description, priority, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'OPEN')
       RETURNING *`,
      [ticketNumber, dto.requester_id, dto.category, dto.type, dto.subject, dto.description, dto.priority]
    );
    return res.rows[0];
  }

  async logHistory(ticketId: number, actorId: number, action: string, oldVal?: string, newVal?: string) {
    await db.query(
      `INSERT INTO helpdesk_ticket_history (ticket_id, actor_id, action, old_value, new_value)
       VALUES ($1, $2, $3, $4, $5)`,
      [ticketId, actorId, action, oldVal, newVal]
    );
  }

  async getAllTickets(filters: any) {
    let query = `
      SELECT t.*, t.ticket_code as ticket_number, t.employee_id as requester_id,
             u1.first_name as requester_first_name, u1.last_name as requester_last_name,
             u2.first_name as assignee_first_name, u2.last_name as assignee_last_name
      FROM helpdesk_tickets t
      JOIN employees u1 ON t.employee_id = u1.id
      LEFT JOIN employees u2 ON t.assigned_to = u2.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (filters.requester_id) {
      params.push(filters.requester_id);
      query += ` AND t.employee_id = $${params.length}`;
    }
    
    if (filters.assigned_to) {
      params.push(filters.assigned_to);
      query += ` AND t.assigned_to = $${params.length}`;
    }
    
    query += ` ORDER BY t.created_at DESC`;
    const res = await db.query(query, params);
    return res.rows;
  }

  async getTicketById(id: number) {
    const res = await db.query(
      `SELECT t.*, t.ticket_code as ticket_number, t.employee_id as requester_id,
              u1.first_name as requester_first_name, u1.last_name as requester_last_name,
              u2.first_name as assignee_first_name, u2.last_name as assignee_last_name
       FROM helpdesk_tickets t
       JOIN employees u1 ON t.employee_id = u1.id
       LEFT JOIN employees u2 ON t.assigned_to = u2.id
       WHERE t.id = $1`,
      [id]
    );
    return res.rows[0];
  }

  async updateStatus(id: number, status: string) {
    const resolvedAt = (status === 'RESOLVED' || status === 'CLOSED') ? new Date() : null;
    const res = await db.query(
      `UPDATE helpdesk_tickets 
       SET status = $1, resolved_at = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *, ticket_code as ticket_number, employee_id as requester_id`,
      [status, resolvedAt, id]
    );
    return res.rows[0];
  }

  async assignTicket(id: number, assigneeId: number) {
    const res = await db.query(
      `UPDATE helpdesk_tickets 
       SET assigned_to = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *, ticket_code as ticket_number, employee_id as requester_id`,
      [assigneeId, id]
    );
    return res.rows[0];
  }

  async addComment(ticketId: number, authorId: number, comment: string, isInternal: boolean) {
    const res = await db.query(
      `INSERT INTO ticket_comments (ticket_id, author_id, comment_text, is_internal_note)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [ticketId, authorId, comment, isInternal]
    );
    return res.rows[0];
  }

  async getComments(ticketId: number) {
    const res = await db.query(
      `SELECT c.*, c.author_id as employee_id, c.comment_text as comment, c.is_internal_note as is_internal,
              e.first_name, e.last_name, e.avatar_url, e.role
       FROM ticket_comments c
       JOIN employees e ON c.author_id = e.id
       WHERE c.ticket_id = $1
       ORDER BY c.created_at ASC`,
      [ticketId]
    );
    return res.rows;
  }
}

export const helpdeskRepository = new HelpdeskRepository();
