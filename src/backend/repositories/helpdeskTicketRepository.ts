import dbService from '../database/db.js';

export interface CreateTicketDTO {
  category: string;
  subject: string;
  description: string;
  priority: string;
  asset_id?: number;
}

export class HelpdeskTicketRepository {

  // ─── Ticket Creation Engine ────────────────────────────────────────────────
  async createTicket(dto: CreateTicketDTO, requesterId: number) {
    const num = Math.floor(100000 + Math.random() * 900000);
    const ticketCode = `TKT-2026-${num}`;

    let slaHours = 24;
    if (dto.priority === 'CRITICAL') slaHours = 2;
    else if (dto.priority === 'HIGH') slaHours = 8;
    else if (dto.priority === 'LOW') slaHours = 48;

    const slaDueDate = new Date(Date.now() + slaHours * 3600 * 1000).toISOString();

    const res = await dbService.query(
      `INSERT INTO helpdesk_tickets (ticket_code, employee_id, category, subject, description, priority, status, asset_id, sla_due_date)
       VALUES ($1, $2, $3, $4, $5, $6, 'OPEN', $7, $8) RETURNING *`,
      [ticketCode, requesterId, dto.category, dto.subject, dto.description, dto.priority, dto.asset_id || null, slaDueDate]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'HELPDESK_TICKET_CREATED', 'HELPDESK', $2)`,
      [requesterId, `Created Helpdesk Ticket ${ticketCode}: ${dto.subject}`]
    );

    return res.rows[0];
  }

  async getTickets() {
    const res = await dbService.query(
      `SELECT t.*, e.first_name as req_first, e.last_name as req_last, a.first_name as agent_first, a.last_name as agent_last
       FROM helpdesk_tickets t
       JOIN employees e ON t.employee_id = e.id
       LEFT JOIN employees a ON t.assigned_to = a.id
       ORDER BY t.created_at DESC`
    );
    return res.rows;
  }

  // ─── Agent Queue & Resolution ─────────────────────────────────────────────
  async assignTicket(ticketId: number, agentId: number, assignerId: number) {
    const res = await dbService.query(
      `UPDATE helpdesk_tickets SET assigned_to = $1, status = 'IN_PROGRESS' WHERE id = $2 RETURNING *`,
      [agentId, ticketId]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'HELPDESK_TICKET_ASSIGNED', 'HELPDESK', $2)`,
      [assignerId, `Assigned Ticket #${ticketId} to Agent #${agentId}`]
    );

    return res.rows[0];
  }

  async resolveTicket(ticketId: number, notes: string, resolverId: number) {
    const res = await dbService.query(
      `UPDATE helpdesk_tickets SET status = 'RESOLVED', resolution_notes = $1 WHERE id = $2 RETURNING *`,
      [notes, ticketId]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'HELPDESK_TICKET_RESOLVED', 'HELPDESK', $2)`,
      [resolverId, `Resolved Ticket #${ticketId}: ${notes}`]
    );

    return res.rows[0];
  }

  // ─── IDOR Secure Comments & Internal Notes ─────────────────────────────────
  async addComment(ticketId: number, authorId: number, text: string, isInternal: boolean, userRole: string) {
    if (isInternal && !['ADMIN', 'HR_MANAGER', 'IT_MANAGER', 'SUPER_ADMIN'].includes(userRole)) {
      throw new Error('Unauthorized: Ordinary employees cannot create internal notes');
    }

    const res = await dbService.query(
      `INSERT INTO ticket_comments (ticket_id, author_id, comment_text, is_internal_note)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [ticketId, authorId, text, isInternal]
    );

    return res.rows[0];
  }

  async getComments(ticketId: number, requesterId: number, userRole: string) {
    const isSupport = ['ADMIN', 'HR_MANAGER', 'IT_MANAGER', 'SUPER_ADMIN'].includes(userRole);

    let sql = `SELECT c.*, e.first_name, e.last_name FROM ticket_comments c JOIN employees e ON c.author_id = e.id WHERE c.ticket_id = $1`;
    if (!isSupport) {
      sql += ` AND c.is_internal_note = false`;
    }
    sql += ` ORDER BY c.created_at ASC`;

    const res = await dbService.query(sql, [ticketId]);
    return res.rows;
  }
}

export const helpdeskTicketRepository = new HelpdeskTicketRepository();
