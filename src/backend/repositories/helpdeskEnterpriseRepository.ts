import dbService from '../database/db.js';

export interface CreateEnterpriseTicketDTO {
  category: string;
  subject: string;
  description: string;
  priority?: string;
  asset_id?: number;
  project_id?: number;
  tags?: string[];
}

export interface TicketFilterDTO {
  status?: string;
  priority?: string;
  category?: string;
  assigned_to?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export class HelpdeskEnterpriseRepository {

  // ─── Ticket Creation with Auto-SLA & Auto-Assign ─────────────────────────
  async createTicket(dto: CreateEnterpriseTicketDTO, requesterId: number) {
    const num = Math.floor(100000 + Math.random() * 900000);
    const ticketCode = `TKT-${new Date().getFullYear()}-${num}`;
    const priority = dto.priority || 'MEDIUM';

    // SLA calculation based on priority
    let slaHours = 24;
    if (priority === 'CRITICAL') slaHours = 2;
    else if (priority === 'HIGH') slaHours = 8;
    else if (priority === 'LOW') slaHours = 48;
    else if (priority === 'URGENT') slaHours = 1;
    const slaDueDate = new Date(Date.now() + slaHours * 3600 * 1000).toISOString();

    const res = await dbService.query(
      `INSERT INTO helpdesk_tickets (ticket_code, employee_id, category, subject, description, priority, status, asset_id, sla_due_date)
       VALUES ($1, $2, $3, $4, $5, $6, 'OPEN', $7, $8) RETURNING *`,
      [ticketCode, requesterId, dto.category, dto.subject, dto.description, priority, dto.asset_id || null, slaDueDate]
    );
    const ticket = res.rows[0];

    // Insert tags if provided
    if (dto.tags && dto.tags.length > 0) {
      for (const tag of dto.tags) {
        await dbService.query(
          `INSERT INTO ticket_tags (ticket_id, tag_name) VALUES ($1, $2)`,
          [ticket.id, tag]
        );
      }
    }

    // Log activity
    await dbService.query(
      `INSERT INTO ticket_activity_log (ticket_id, actor_id, action_type, to_value, details)
       VALUES ($1, $2, 'TICKET_CREATED', 'OPEN', $3)`,
      [ticket.id, requesterId, `Ticket ${ticketCode} created: ${dto.subject}`]
    );

    // Audit log
    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'HELPDESK_TICKET_CREATED', 'HELPDESK', $2)`,
      [requesterId, `Created Enterprise Ticket ${ticketCode}: ${dto.subject} [Priority: ${priority}]`]
    );

    // Try auto-assign from category default
    try {
      const catRes = await dbService.query(
        `SELECT default_assignee_id FROM helpdesk_categories WHERE name = $1 AND default_assignee_id IS NOT NULL`,
        [dto.category]
      );
      if (catRes.rows.length > 0 && catRes.rows[0].default_assignee_id) {
        await dbService.query(
          `UPDATE helpdesk_tickets SET assigned_to = $1, status = 'ASSIGNED' WHERE id = $2`,
          [catRes.rows[0].default_assignee_id, ticket.id]
        );
        await dbService.query(
          `INSERT INTO ticket_activity_log (ticket_id, actor_id, action_type, to_value, details)
           VALUES ($1, $2, 'AUTO_ASSIGNED', $3, 'Auto-assigned based on category default')`,
          [ticket.id, requesterId, String(catRes.rows[0].default_assignee_id)]
        );
      }
    } catch (_) { /* Category may not exist yet */ }

    // Create notification for requester
    try {
      await dbService.query(
        `INSERT INTO notifications (employee_id, title, message, type, channel, priority, deep_link)
         VALUES ($1, $2, $3, 'HELPDESK', 'IN_APP', 'NORMAL', $4)`,
        [requesterId, 'Ticket Created', `Your support ticket ${ticketCode} has been submitted.`, `/helpdesk`]
      );
    } catch (_) {}

    return ticket;
  }

  // ─── Get Tickets with RBAC Scoping & Filters ────────────────────────────
  async getTickets(userRole: string, requesterId: number, filters?: TicketFilterDTO) {
    const isSupport = ['ADMIN', 'HR_MANAGER', 'IT_MANAGER', 'SUPER_ADMIN', 'SUPPORT_AGENT', 'DEPT_HEAD'].includes(userRole);
    let sql = `
      SELECT t.*,
             e.first_name as requester_first_name, e.last_name as requester_last_name,
             e.employee_code as requester_code, e.email as requester_email,
             e.department_id as requester_dept_id,
             d.name as requester_department,
             a.first_name as agent_first_name, a.last_name as agent_last_name,
             a.employee_code as agent_code,
             ast.asset_name, ast.asset_code,
             sr.rating as satisfaction_rating,
             sr.feedback as satisfaction_feedback,
             (SELECT COUNT(*) FROM ticket_comments tc WHERE tc.ticket_id = t.id AND tc.is_internal_note = false) as comment_count,
             (SELECT COUNT(*) FROM ticket_attachments ta WHERE ta.ticket_id = t.id) as attachment_count,
             CASE WHEN t.sla_due_date < CURRENT_TIMESTAMP AND t.status NOT IN ('RESOLVED', 'CLOSED') THEN true ELSE false END as sla_breached
      FROM helpdesk_tickets t
      JOIN employees e ON t.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN employees a ON t.assigned_to = a.id
      LEFT JOIN assets ast ON t.asset_id = ast.id
      LEFT JOIN ticket_satisfaction_ratings sr ON sr.ticket_id = t.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];
    let paramIdx = 1;

    if (!isSupport) {
      conditions.push(`t.employee_id = $${paramIdx++}`);
      params.push(requesterId);
    }

    if (filters?.status) {
      conditions.push(`t.status = $${paramIdx++}`);
      params.push(filters.status);
    }
    if (filters?.priority) {
      conditions.push(`t.priority = $${paramIdx++}`);
      params.push(filters.priority);
    }
    if (filters?.category) {
      conditions.push(`t.category = $${paramIdx++}`);
      params.push(filters.category);
    }
    if (filters?.assigned_to) {
      conditions.push(`t.assigned_to = $${paramIdx++}`);
      params.push(filters.assigned_to);
    }
    if (filters?.date_from) {
      conditions.push(`t.created_at >= $${paramIdx++}`);
      params.push(filters.date_from);
    }
    if (filters?.date_to) {
      conditions.push(`t.created_at <= $${paramIdx++}`);
      params.push(filters.date_to + 'T23:59:59');
    }
    if (filters?.search) {
      conditions.push(`(t.subject ILIKE $${paramIdx} OR t.description ILIKE $${paramIdx} OR t.ticket_code ILIKE $${paramIdx})`);
      params.push(`%${filters.search}%`);
      paramIdx++;
    }

    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(' AND ');
    }
    sql += ` ORDER BY CASE t.priority WHEN 'CRITICAL' THEN 1 WHEN 'URGENT' THEN 2 WHEN 'HIGH' THEN 3 WHEN 'MEDIUM' THEN 4 ELSE 5 END, t.created_at DESC`;

    const res = await dbService.query(sql, params);
    return res.rows;
  }

  // ─── Get Single Ticket Detail ──────────────────────────────────────────
  async getTicketById(ticketId: number, userRole: string, requesterId: number) {
    const isSupport = ['ADMIN', 'HR_MANAGER', 'IT_MANAGER', 'SUPER_ADMIN', 'SUPPORT_AGENT', 'DEPT_HEAD'].includes(userRole);
    const ticket = await dbService.query(
      `SELECT t.*,
              e.first_name as requester_first_name, e.last_name as requester_last_name,
              e.employee_code as requester_code, e.email as requester_email,
              d.name as requester_department,
              a.first_name as agent_first_name, a.last_name as agent_last_name,
              ast.asset_name, ast.asset_code,
              sr.rating as satisfaction_rating, sr.feedback as satisfaction_feedback
       FROM helpdesk_tickets t
       JOIN employees e ON t.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN employees a ON t.assigned_to = a.id
       LEFT JOIN assets ast ON t.asset_id = ast.id
       LEFT JOIN ticket_satisfaction_ratings sr ON sr.ticket_id = t.id
       WHERE t.id = $1`,
      [ticketId]
    );
    if (!ticket.rows.length) throw new Error('Ticket not found');
    if (!isSupport && ticket.rows[0].employee_id !== requesterId) {
      // Check if watcher
      const watcher = await dbService.query(
        `SELECT id FROM ticket_watchers WHERE ticket_id = $1 AND employee_id = $2`, [ticketId, requesterId]
      );
      if (!watcher.rows.length) throw new Error('Access denied: You are not the requester or a watcher of this ticket');
    }

    const comments = await dbService.query(
      `SELECT c.*, e.first_name, e.last_name, e.employee_code
       FROM ticket_comments c JOIN employees e ON c.author_id = e.id
       WHERE c.ticket_id = $1 ${!isSupport ? 'AND c.is_internal_note = false' : ''}
       ORDER BY c.created_at ASC`,
      [ticketId]
    );

    const activity = await dbService.query(
      `SELECT al.*, e.first_name, e.last_name
       FROM ticket_activity_log al JOIN employees e ON al.actor_id = e.id
       WHERE al.ticket_id = $1 ORDER BY al.created_at DESC LIMIT 50`,
      [ticketId]
    );

    const tags = await dbService.query(
      `SELECT tag_name FROM ticket_tags WHERE ticket_id = $1`, [ticketId]
    );

    const watchers = await dbService.query(
      `SELECT w.*, e.first_name, e.last_name, e.employee_code
       FROM ticket_watchers w JOIN employees e ON w.employee_id = e.id
       WHERE w.ticket_id = $1`, [ticketId]
    );

    const attachments = await dbService.query(
      `SELECT * FROM ticket_attachments WHERE ticket_id = $1 ORDER BY created_at DESC`, [ticketId]
    );

    return {
      ...ticket.rows[0],
      comments: comments.rows,
      activity: activity.rows,
      tags: tags.rows.map((t: any) => t.tag_name),
      watchers: watchers.rows,
      attachments: attachments.rows
    };
  }

  // ─── Assign Ticket to Agent ────────────────────────────────────────────
  async assignTicket(ticketId: number, agentId: number, assignerId: number) {
    const prev = await dbService.query(`SELECT assigned_to, status FROM helpdesk_tickets WHERE id = $1`, [ticketId]);
    const prevAgent = prev.rows[0]?.assigned_to;

    const res = await dbService.query(
      `UPDATE helpdesk_tickets SET assigned_to = $1, status = 'ASSIGNED', updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [agentId, ticketId]
    );

    await dbService.query(
      `INSERT INTO ticket_activity_log (ticket_id, actor_id, action_type, from_value, to_value, details)
       VALUES ($1, $2, 'ASSIGNED', $3, $4, 'Ticket assigned to agent')`,
      [ticketId, assignerId, prevAgent ? String(prevAgent) : 'Unassigned', String(agentId)]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'HELPDESK_TICKET_ASSIGNED', 'HELPDESK', $2)`,
      [assignerId, `Assigned Ticket #\${ticketId} to Agent #\${agentId}`]
    );

    // Notify the assigned agent
    try {
      await dbService.query(
        `INSERT INTO notifications (employee_id, title, message, type, channel, priority, deep_link)
         VALUES ($1, 'Ticket Assigned', $2, 'HELPDESK', 'IN_APP', 'HIGH', '/helpdesk')`,
        [agentId, `You have been assigned helpdesk ticket #\${ticketId}.`]
      );
    } catch (_) {}

    return res.rows[0];
  }

  // ─── Update Ticket Status ──────────────────────────────────────────────
  async updateStatus(ticketId: number, status: string, resolutionNotes: string | undefined, actorId: number) {
    const prev = await dbService.query(`SELECT status, employee_id FROM helpdesk_tickets WHERE id = $1`, [ticketId]);
    const prevStatus = prev.rows[0]?.status;
    const requesterId = prev.rows[0]?.employee_id;

    const validTransitions: Record<string, string[]> = {
      'OPEN': ['ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'CLOSED'],
      'ASSIGNED': ['IN_PROGRESS', 'ON_HOLD', 'CLOSED'],
      'IN_PROGRESS': ['ON_HOLD', 'WAITING_ON_REQUESTER', 'RESOLVED', 'CLOSED', 'ESCALATED'],
      'ON_HOLD': ['IN_PROGRESS', 'CLOSED'],
      'WAITING_ON_REQUESTER': ['IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      'ESCALATED': ['IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      'RESOLVED': ['REOPENED', 'CLOSED'],
      'REOPENED': ['IN_PROGRESS', 'ASSIGNED', 'RESOLVED', 'CLOSED'],
      'CLOSED': ['REOPENED']
    };

    if (prevStatus && validTransitions[prevStatus] && !validTransitions[prevStatus].includes(status)) {
      throw new Error(`Invalid status transition from \${prevStatus} to \${status}`);
    }

    const res = await dbService.query(
      `UPDATE helpdesk_tickets SET status = $1, resolution_notes = COALESCE($2, resolution_notes), updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
      [status, resolutionNotes || null, ticketId]
    );

    await dbService.query(
      `INSERT INTO ticket_activity_log (ticket_id, actor_id, action_type, from_value, to_value, details)
       VALUES ($1, $2, 'STATUS_CHANGED', $3, $4, $5)`,
      [ticketId, actorId, prevStatus, status, resolutionNotes || `Status changed to \${status}`]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'HELPDESK_STATUS_UPDATED', 'HELPDESK', $2)`,
      [actorId, `Updated Ticket #\${ticketId} status: \${prevStatus} → \${status}`]
    );

    // Notify requester on resolution
    if (status === 'RESOLVED' && requesterId) {
      try {
        await dbService.query(
          `INSERT INTO notifications (employee_id, title, message, type, channel, priority, deep_link)
           VALUES ($1, 'Ticket Resolved', $2, 'HELPDESK', 'IN_APP', 'NORMAL', '/helpdesk')`,
          [requesterId, `Your helpdesk ticket #\${ticketId} has been resolved. Please rate your experience.`]
        );
      } catch (_) {}
    }

    return res.rows[0];
  }

  // ─── Escalate Ticket ───────────────────────────────────────────────────
  async escalateTicket(ticketId: number, escalateTo: number | null, reason: string, actorId: number) {
    const res = await dbService.query(
      `UPDATE helpdesk_tickets SET status = 'ESCALATED', assigned_to = COALESCE($1, assigned_to), updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [escalateTo, ticketId]
    );

    await dbService.query(
      `INSERT INTO ticket_activity_log (ticket_id, actor_id, action_type, to_value, details)
       VALUES ($1, $2, 'ESCALATED', 'ESCALATED', $3)`,
      [ticketId, actorId, reason]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'HELPDESK_TICKET_ESCALATED', 'HELPDESK', $2)`,
      [actorId, `Escalated Ticket #\${ticketId}: \${reason}`]
    );

    return res.rows[0];
  }

  // ─── Reopen Ticket ─────────────────────────────────────────────────────
  async reopenTicket(ticketId: number, reason: string, requesterId: number) {
    const res = await dbService.query(
      `UPDATE helpdesk_tickets SET status = 'REOPENED', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [ticketId]
    );

    await dbService.query(
      `INSERT INTO ticket_comments (ticket_id, author_id, comment_text, is_internal_note)
       VALUES ($1, $2, $3, false)`,
      [ticketId, requesterId, `[TICKET REOPENED]: \${reason}`]
    );

    await dbService.query(
      `INSERT INTO ticket_activity_log (ticket_id, actor_id, action_type, from_value, to_value, details)
       VALUES ($1, $2, 'REOPENED', 'RESOLVED', 'REOPENED', $3)`,
      [ticketId, requesterId, reason]
    );

    return res.rows[0];
  }

  // ─── Threaded Comments & Internal Notes ────────────────────────────────
  async addComment(ticketId: number, authorId: number, text: string, isInternal: boolean, userRole: string) {
    if (isInternal && !['ADMIN', 'HR_MANAGER', 'IT_MANAGER', 'SUPER_ADMIN', 'SUPPORT_AGENT'].includes(userRole)) {
      throw new Error('Unauthorized: Only support staff can create internal notes');
    }

    const res = await dbService.query(
      `INSERT INTO ticket_comments (ticket_id, author_id, comment_text, is_internal_note)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [ticketId, authorId, text, isInternal]
    );

    await dbService.query(
      `UPDATE helpdesk_tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [ticketId]
    );

    await dbService.query(
      `INSERT INTO ticket_activity_log (ticket_id, actor_id, action_type, details)
       VALUES ($1, $2, $3, $4)`,
      [ticketId, authorId, isInternal ? 'INTERNAL_NOTE_ADDED' : 'COMMENT_ADDED', text.substring(0, 100)]
    );

    return res.rows[0];
  }

  async getComments(ticketId: number, userRole: string) {
    const isSupport = ['ADMIN', 'HR_MANAGER', 'IT_MANAGER', 'SUPER_ADMIN', 'SUPPORT_AGENT'].includes(userRole);
    let sql = `
      SELECT c.*, e.first_name, e.last_name, e.employee_code, e.avatar_url
      FROM ticket_comments c JOIN employees e ON c.author_id = e.id
      WHERE c.ticket_id = $1
    `;
    if (!isSupport) sql += ` AND c.is_internal_note = false`;
    sql += ` ORDER BY c.created_at ASC`;
    const res = await dbService.query(sql, [ticketId]);
    return res.rows;
  }

  // ─── Ticket Watchers ───────────────────────────────────────────────────
  async addWatcher(ticketId: number, employeeId: number, addedBy: number) {
    const res = await dbService.query(
      `INSERT INTO ticket_watchers (ticket_id, employee_id, added_by) VALUES ($1, $2, $3)
       ON CONFLICT (ticket_id, employee_id) DO NOTHING RETURNING *`,
      [ticketId, employeeId, addedBy]
    );
    return res.rows[0] || { message: 'Already watching' };
  }

  async removeWatcher(ticketId: number, employeeId: number) {
    await dbService.query(
      `DELETE FROM ticket_watchers WHERE ticket_id = $1 AND employee_id = $2`,
      [ticketId, employeeId]
    );
    return { removed: true };
  }

  // ─── Tags Management ───────────────────────────────────────────────────
  async addTag(ticketId: number, tagName: string) {
    const res = await dbService.query(
      `INSERT INTO ticket_tags (ticket_id, tag_name) VALUES ($1, $2) RETURNING *`,
      [ticketId, tagName]
    );
    return res.rows[0];
  }

  async removeTag(ticketId: number, tagName: string) {
    await dbService.query(
      `DELETE FROM ticket_tags WHERE ticket_id = $1 AND tag_name = $2`,
      [ticketId, tagName]
    );
    return { removed: true };
  }

  // ─── Satisfaction Rating ───────────────────────────────────────────────
  async rateSatisfaction(ticketId: number, employeeId: number, rating: number, feedback: string) {
    if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5');
    const res = await dbService.query(
      `INSERT INTO ticket_satisfaction_ratings (ticket_id, employee_id, rating, feedback)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (ticket_id) DO UPDATE SET rating = $3, feedback = $4 RETURNING *`,
      [ticketId, employeeId, rating, feedback]
    );
    return res.rows[0];
  }

  // ─── Knowledge Base ────────────────────────────────────────────────────
  async createArticle(title: string, content: string, categoryId: number | null, tags: string, createdBy: number) {
    const res = await dbService.query(
      `INSERT INTO helpdesk_knowledge_base (title, content, category_id, tags, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, content, categoryId, tags, createdBy]
    );
    return res.rows[0];
  }

  async getArticles(search?: string) {
    let sql = `SELECT kb.*, e.first_name, e.last_name FROM helpdesk_knowledge_base kb LEFT JOIN employees e ON kb.created_by = e.id WHERE kb.is_published = true`;
    const params: any[] = [];
    if (search) {
      sql += ` AND (kb.title ILIKE $1 OR kb.content ILIKE $1 OR kb.tags ILIKE $1)`;
      params.push(`%\${search}%`);
    }
    sql += ` ORDER BY kb.views_count DESC, kb.created_at DESC`;
    const res = await dbService.query(sql, params);
    return res.rows;
  }

  async viewArticle(articleId: number) {
    await dbService.query(`UPDATE helpdesk_knowledge_base SET views_count = views_count + 1 WHERE id = $1`, [articleId]);
    const res = await dbService.query(`SELECT * FROM helpdesk_knowledge_base WHERE id = $1`, [articleId]);
    return res.rows[0];
  }

  // ─── Canned Responses ──────────────────────────────────────────────────
  async createCannedResponse(title: string, responseText: string, category: string, shortcutCode: string, createdBy: number) {
    const res = await dbService.query(
      `INSERT INTO helpdesk_canned_responses (title, response_text, category, shortcut_code, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, responseText, category, shortcutCode, createdBy]
    );
    return res.rows[0];
  }

  async getCannedResponses(category?: string) {
    let sql = `SELECT * FROM helpdesk_canned_responses WHERE is_active = true`;
    const params: any[] = [];
    if (category) {
      sql += ` AND category = $1`;
      params.push(category);
    }
    sql += ` ORDER BY usage_count DESC`;
    const res = await dbService.query(sql, params);
    return res.rows;
  }

  async useCannedResponse(responseId: number) {
    await dbService.query(`UPDATE helpdesk_canned_responses SET usage_count = usage_count + 1 WHERE id = $1`, [responseId]);
    const res = await dbService.query(`SELECT * FROM helpdesk_canned_responses WHERE id = $1`, [responseId]);
    return res.rows[0];
  }

  // ─── Categories Management ─────────────────────────────────────────────
  async getCategories() {
    const res = await dbService.query(
      `SELECT hc.*, d.name as department_name, e.first_name as assignee_first, e.last_name as assignee_last
       FROM helpdesk_categories hc
       LEFT JOIN departments d ON hc.department_id = d.id
       LEFT JOIN employees e ON hc.default_assignee_id = e.id
       WHERE hc.is_active = true ORDER BY hc.name`
    );
    return res.rows;
  }

  async createCategory(name: string, code: string, description: string, departmentId: number | null, defaultAssigneeId: number | null) {
    const res = await dbService.query(
      `INSERT INTO helpdesk_categories (name, code, description, department_id, default_assignee_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, code, description, departmentId, defaultAssigneeId]
    );
    return res.rows[0];
  }

  // ─── SLA Rules Management ─────────────────────────────────────────────
  async getSLARules() {
    const res = await dbService.query(
      `SELECT * FROM ticket_sla_rules ORDER BY category, priority`
    );
    return res.rows;
  }

  async createSLARule(category: string, priority: string, resolutionHours: number) {
    const res = await dbService.query(
      `INSERT INTO ticket_sla_rules (category, priority, resolution_hours)
       VALUES ($1, $2, $3) RETURNING *`,
      [category, priority, resolutionHours]
    );
    return res.rows[0];
  }

  // ─── Escalation Rules ─────────────────────────────────────────────────
  async getEscalationRules() {
    const res = await dbService.query(
      `SELECT er.*, hc.name as category_name, e.first_name, e.last_name
       FROM ticket_escalation_rules er
       LEFT JOIN helpdesk_categories hc ON er.category_id = hc.id
       LEFT JOIN employees e ON er.escalate_to_employee_id = e.id
       ORDER BY er.priority`
    );
    return res.rows;
  }

  async createEscalationRule(categoryId: number, priority: string, escalationAfterHours: number, escalateToRole: string, escalateToEmployeeId: number | null) {
    const res = await dbService.query(
      `INSERT INTO ticket_escalation_rules (category_id, priority, escalation_after_hours, escalate_to_role, escalate_to_employee_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [categoryId, priority, escalationAfterHours, escalateToRole, escalateToEmployeeId]
    );
    return res.rows[0];
  }

  // ─── Helpdesk Analytics & KPIs ─────────────────────────────────────────
  async getAnalytics() {
    const total = await dbService.query(`SELECT COUNT(*) as count FROM helpdesk_tickets`);
    const open = await dbService.query(`SELECT COUNT(*) as count FROM helpdesk_tickets WHERE status IN ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED')`);
    const resolved = await dbService.query(`SELECT COUNT(*) as count FROM helpdesk_tickets WHERE status = 'RESOLVED'`);
    const closed = await dbService.query(`SELECT COUNT(*) as count FROM helpdesk_tickets WHERE status = 'CLOSED'`);
    const escalated = await dbService.query(`SELECT COUNT(*) as count FROM helpdesk_tickets WHERE status = 'ESCALATED'`);
    const slaBreached = await dbService.query(`SELECT COUNT(*) as count FROM helpdesk_tickets WHERE sla_due_date < CURRENT_TIMESTAMP AND status NOT IN ('RESOLVED', 'CLOSED')`);
    const avgRating = await dbService.query(`SELECT ROUND(AVG(rating)::numeric, 1) as avg_rating, COUNT(*) as total_ratings FROM ticket_satisfaction_ratings`);

    const byPriority = await dbService.query(
      `SELECT priority, COUNT(*) as count FROM helpdesk_tickets GROUP BY priority ORDER BY CASE priority WHEN 'CRITICAL' THEN 1 WHEN 'URGENT' THEN 2 WHEN 'HIGH' THEN 3 WHEN 'MEDIUM' THEN 4 ELSE 5 END`
    );
    const byCategory = await dbService.query(
      `SELECT category, COUNT(*) as count FROM helpdesk_tickets GROUP BY category ORDER BY count DESC`
    );
    const byStatus = await dbService.query(
      `SELECT status, COUNT(*) as count FROM helpdesk_tickets GROUP BY status ORDER BY count DESC`
    );
    const avgResolutionTime = await dbService.query(
      `SELECT ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600)::numeric, 1) as avg_hours
       FROM helpdesk_tickets WHERE status IN ('RESOLVED', 'CLOSED')`
    );

    const recentTrend = await dbService.query(
      `SELECT DATE(created_at) as date, COUNT(*) as tickets_created,
              SUM(CASE WHEN status IN ('RESOLVED', 'CLOSED') THEN 1 ELSE 0 END) as tickets_resolved
       FROM helpdesk_tickets
       WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY DATE(created_at) ORDER BY date`
    );

    const topAgents = await dbService.query(
      `SELECT e.first_name, e.last_name, COUNT(t.id) as tickets_handled,
              SUM(CASE WHEN t.status IN ('RESOLVED', 'CLOSED') THEN 1 ELSE 0 END) as tickets_resolved,
              ROUND(AVG(sr.rating)::numeric, 1) as avg_rating
       FROM helpdesk_tickets t
       JOIN employees e ON t.assigned_to = e.id
       LEFT JOIN ticket_satisfaction_ratings sr ON sr.ticket_id = t.id
       GROUP BY e.id, e.first_name, e.last_name
       ORDER BY tickets_resolved DESC LIMIT 10`
    );

    const slaCompliance = (() => {
      const totalNum = parseInt(total.rows[0].count) || 1;
      const breachedNum = parseInt(slaBreached.rows[0].count) || 0;
      return ((totalNum - breachedNum) / totalNum * 100).toFixed(1);
    })();

    return {
      total: parseInt(total.rows[0].count),
      open: parseInt(open.rows[0].count),
      resolved: parseInt(resolved.rows[0].count),
      closed: parseInt(closed.rows[0].count),
      escalated: parseInt(escalated.rows[0].count),
      sla_breached: parseInt(slaBreached.rows[0].count),
      sla_compliance_percentage: parseFloat(slaCompliance),
      avg_satisfaction_rating: parseFloat(avgRating.rows[0].avg_rating) || 0,
      total_ratings: parseInt(avgRating.rows[0].total_ratings),
      avg_resolution_hours: parseFloat(avgResolutionTime.rows[0].avg_hours) || 0,
      by_priority: byPriority.rows,
      by_category: byCategory.rows,
      by_status: byStatus.rows,
      recent_trend: recentTrend.rows,
      top_agents: topAgents.rows
    };
  }

  // ─── Bulk Operations ───────────────────────────────────────────────────
  async bulkAssign(ticketIds: number[], agentId: number, assignerId: number) {
    const results = [];
    for (const id of ticketIds) {
      const res = await this.assignTicket(id, agentId, assignerId);
      results.push(res);
    }
    return results;
  }

  async bulkClose(ticketIds: number[], reason: string, actorId: number) {
    const results = [];
    for (const id of ticketIds) {
      const res = await this.updateStatus(id, 'CLOSED', reason, actorId);
      results.push(res);
    }
    return results;
  }

  // ─── My Tickets (Employee Self-Service) ────────────────────────────────
  async getMyTickets(employeeId: number) {
    const res = await dbService.query(
      `SELECT t.*, a.first_name as agent_first_name, a.last_name as agent_last_name,
              sr.rating as satisfaction_rating,
              CASE WHEN t.sla_due_date < CURRENT_TIMESTAMP AND t.status NOT IN ('RESOLVED', 'CLOSED') THEN true ELSE false END as sla_breached
       FROM helpdesk_tickets t
       LEFT JOIN employees a ON t.assigned_to = a.id
       LEFT JOIN ticket_satisfaction_ratings sr ON sr.ticket_id = t.id
       WHERE t.employee_id = $1
       ORDER BY t.created_at DESC`,
      [employeeId]
    );
    return res.rows;
  }

  // ─── Agent Queue ───────────────────────────────────────────────────────
  async getAgentQueue(agentId: number) {
    const res = await dbService.query(
      `SELECT t.*, e.first_name as requester_first_name, e.last_name as requester_last_name,
              e.employee_code as requester_code,
              CASE WHEN t.sla_due_date < CURRENT_TIMESTAMP THEN true ELSE false END as sla_breached
       FROM helpdesk_tickets t
       JOIN employees e ON t.employee_id = e.id
       WHERE t.assigned_to = $1 AND t.status NOT IN ('RESOLVED', 'CLOSED')
       ORDER BY CASE t.priority WHEN 'CRITICAL' THEN 1 WHEN 'URGENT' THEN 2 WHEN 'HIGH' THEN 3 WHEN 'MEDIUM' THEN 4 ELSE 5 END, t.sla_due_date ASC`,
      [agentId]
    );
    return res.rows;
  }

  // ─── Seed Default Categories ───────────────────────────────────────────
  async seedCategories() {
    const categories = [
      { name: 'IT Support', code: 'IT_SUPPORT', description: 'IT infrastructure, software, and hardware issues' },
      { name: 'HR Support', code: 'HR_SUPPORT', description: 'HR policies, benefits, and employee relations' },
      { name: 'Finance & Payroll', code: 'FINANCE_PAYROLL', description: 'Salary, reimbursement, and financial queries' },
      { name: 'Asset Maintenance', code: 'ASSET_MAINT', description: 'Asset repair, replacement, and maintenance requests' },
      { name: 'Facilities', code: 'FACILITIES', description: 'Office facilities, access cards, and workspace issues' },
      { name: 'Admin Support', code: 'ADMIN_SUPPORT', description: 'Administrative requests and general support' },
      { name: 'Security', code: 'SECURITY', description: 'Security concerns, access control, and safety' },
      { name: 'Project Issue', code: 'PROJECT_ISSUE', description: 'Project-related blockers, escalations, and issues' }
    ];

    for (const cat of categories) {
      await dbService.query(
        `INSERT INTO helpdesk_categories (name, code, description) VALUES ($1, $2, $3) ON CONFLICT (code) DO NOTHING`,
        [cat.name, cat.code, cat.description]
      );
    }

    // Seed default SLA rules
    const slaRules = [
      { category: 'IT Support', priority: 'CRITICAL', hours: 2 },
      { category: 'IT Support', priority: 'HIGH', hours: 4 },
      { category: 'IT Support', priority: 'MEDIUM', hours: 24 },
      { category: 'IT Support', priority: 'LOW', hours: 48 },
      { category: 'HR Support', priority: 'CRITICAL', hours: 4 },
      { category: 'HR Support', priority: 'HIGH', hours: 8 },
      { category: 'HR Support', priority: 'MEDIUM', hours: 24 },
      { category: 'HR Support', priority: 'LOW', hours: 72 },
      { category: 'Finance & Payroll', priority: 'CRITICAL', hours: 2 },
      { category: 'Finance & Payroll', priority: 'HIGH', hours: 8 },
      { category: 'Finance & Payroll', priority: 'MEDIUM', hours: 24 },
      { category: 'Finance & Payroll', priority: 'LOW', hours: 48 },
    ];

    for (const rule of slaRules) {
      await dbService.query(
        `INSERT INTO ticket_sla_rules (category, priority, resolution_hours) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [rule.category, rule.priority, rule.hours]
      );
    }

    return { seeded: true, categories: categories.length, sla_rules: slaRules.length };
  }
}

export const helpdeskEnterpriseRepository = new HelpdeskEnterpriseRepository();
