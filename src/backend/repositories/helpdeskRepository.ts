import dbService from '../database/db.js';

export interface CreateTicketDTO {
  category: string;
  subject: string;
  description: string;
  priority?: string;
  asset_id?: number;
}

export interface AddCommentDTO {
  ticket_id: number;
  comment_text: string;
  is_internal_note?: boolean;
}

export class HelpdeskRepository {

  // ─── Create Ticket ────────────────────────────────────────────────────────
  async createTicket(dto: CreateTicketDTO, requesterId: number) {
    const ticketCode = `TKT-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const slaHours = dto.priority === 'URGENT' ? 4 : (dto.priority === 'HIGH' ? 8 : 24);
    const slaDueDate = new Date(Date.now() + slaHours * 3600 * 1000).toISOString();

    const res = await dbService.query(
      `INSERT INTO helpdesk_tickets (
        ticket_code, employee_id, category, subject, description, priority, status, asset_id, sla_due_date
      ) VALUES ($1, $2, $3, $4, $5, $6, 'NEW', $7, $8) RETURNING *`,
      [
        ticketCode, requesterId, dto.category, dto.subject, dto.description,
        dto.priority || 'MEDIUM', dto.asset_id || null, slaDueDate
      ]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'HELPDESK_TICKET_CREATED', 'HELPDESK', $2)`,
      [requesterId, `Created Helpdesk Ticket ${ticketCode}: ${dto.subject}`]
    );

    return res.rows[0];
  }

  // ─── Get Tickets (RBAC Scoped) ────────────────────────────────────────────
  async getTickets(userRole: string, requesterId: number) {
    const isSupport = ['ADMIN', 'HR_MANAGER', 'IT_MANAGER', 'SUPER_ADMIN', 'SUPPORT_AGENT'].includes(userRole);
    let sql = `
      SELECT t.*, e.first_name as req_first_name, e.last_name as req_last_name, e.employee_code as req_emp_code,
             a.first_name as agent_first_name, a.last_name as agent_last_name,
             ast.asset_name, ast.asset_code
      FROM helpdesk_tickets t
      JOIN employees e ON t.employee_id = e.id
      LEFT JOIN employees a ON t.assigned_to = a.id
      LEFT JOIN assets ast ON t.asset_id = ast.id
    `;
    const params: any[] = [];
    if (!isSupport) {
      sql += ` WHERE t.employee_id = $1`;
      params.push(requesterId);
    }
    sql += ` ORDER BY t.created_at DESC`;

    const res = await dbService.query(sql, params);
    return res.rows;
  }

  // ─── Assign Ticket ────────────────────────────────────────────────────────
  async assignTicket(ticketId: number, agentId: number, assignerId: number) {
    const res = await dbService.query(
      `UPDATE helpdesk_tickets
       SET assigned_to = $1, status = 'ASSIGNED', updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [agentId, ticketId]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'HELPDESK_TICKET_ASSIGNED', 'HELPDESK', $2)`,
      [assignerId, `Assigned Helpdesk Ticket #${ticketId} to Agent #${agentId}`]
    );

    return res.rows[0];
  }

  // ─── Update Status & Resolution ──────────────────────────────────────────
  async updateTicketStatus(ticketId: number, status: string, resolutionNotes: string | undefined, agentId: number) {
    const res = await dbService.query(
      `UPDATE helpdesk_tickets
       SET status = $1, resolution_notes = COALESCE($2, resolution_notes), updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [status, resolutionNotes || null, ticketId]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'HELPDESK_STATUS_UPDATED', 'HELPDESK', $2)`,
      [agentId, `Updated Ticket #${ticketId} status to ${status}`]
    );

    return res.rows[0];
  }

  // ─── Reopen Ticket ────────────────────────────────────────────────────────
  async reopenTicket(ticketId: number, reason: string, requesterId: number) {
    const res = await dbService.query(
      `UPDATE helpdesk_tickets
       SET status = 'REOPENED', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [ticketId]
    );

    await dbService.query(
      `INSERT INTO ticket_comments (ticket_id, author_id, comment_text, is_internal_note)
       VALUES ($1, $2, $3, false)`,
      [ticketId, requesterId, `[REOPENED TICKET]: ${reason}`]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'HELPDESK_TICKET_REOPENED', 'HELPDESK', $2)`,
      [requesterId, `Reopened Helpdesk Ticket #${ticketId}`]
    );

    return res.rows[0];
  }

  // ─── Threaded Discussion & Internal Notes ─────────────────────────────────
  async addComment(dto: AddCommentDTO, authorId: number) {
    const res = await dbService.query(
      `INSERT INTO ticket_comments (ticket_id, author_id, comment_text, is_internal_note)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [dto.ticket_id, authorId, dto.comment_text, dto.is_internal_note || false]
    );

    await dbService.query(
      `UPDATE helpdesk_tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [dto.ticket_id]
    );

    return res.rows[0];
  }

  async getComments(ticketId: number, userRole: string) {
    const isSupport = ['ADMIN', 'HR_MANAGER', 'IT_MANAGER', 'SUPER_ADMIN', 'SUPPORT_AGENT'].includes(userRole);
    let sql = `
      SELECT c.*, e.first_name, e.last_name, e.employee_code
      FROM ticket_comments c
      JOIN employees e ON c.author_id = e.id
      WHERE c.ticket_id = $1
    `;
    if (!isSupport) {
      sql += ` AND c.is_internal_note = false`;
    }
    sql += ` ORDER BY c.created_at ASC`;

    const res = await dbService.query(sql, [ticketId]);
    return res.rows;
  }
}

export const helpdeskRepository = new HelpdeskRepository();
