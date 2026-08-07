import dbService from '../database/db.js';

export interface HolidayDTO {
  name: string;
  date: string;
  type: string; // 'NATIONAL' | 'NORTH_INDIA' | 'SOUTH_INDIA' | 'WEST_INDIA' | 'EAST_INDIA' | 'BRANCH' | 'OPTIONAL'
  region_code?: string;
  branch_id?: number;
  is_optional?: boolean;
  description?: string;
}

export interface CompanyEventDTO {
  title: string;
  description?: string;
  event_date: string;
  event_type: 'TOWNHALL' | 'TRAINING' | 'FESTIVAL' | 'SPORTS_DAY' | 'HACKATHON' | 'OFFICE_PARTY';
  branch_id?: number;
  department_id?: number;
}

export class HolidayEngineRepository {

  // ─── Seed Default 2026 Indian Regional & Festival Holidays ────────────────
  async seedDefaultHolidays() {
    const defaultHolidays = [
      { name: 'Republic Day', date: '2026-01-26', type: 'NATIONAL', region_code: 'COMMON', is_optional: false, description: 'National Holiday' },
      { name: 'Maha Shivratri', date: '2026-02-15', type: 'FESTIVAL', region_code: 'COMMON', is_optional: false, description: 'Common Festival Holiday' },
      { name: 'Holi', date: '2026-03-04', type: 'FESTIVAL', region_code: 'NORTH_INDIA', is_optional: false, description: 'North & West India Festival' },
      { name: 'Good Friday', date: '2026-04-03', type: 'NATIONAL', region_code: 'COMMON', is_optional: false, description: 'National Holiday' },
      { name: 'Ugadi / Gudi Padwa', date: '2026-04-10', type: 'FESTIVAL', region_code: 'SOUTH_INDIA', is_optional: false, description: 'South & West New Year Festival' },
      { name: 'Dr. B.R. Ambedkar Jayanti', date: '2026-04-14', type: 'NATIONAL', region_code: 'COMMON', is_optional: false, description: 'National Holiday' },
      { name: 'May Day / Labor Day', date: '2026-05-01', type: 'REGIONAL', region_code: 'SOUTH_INDIA', is_optional: false, description: 'International Workers Day' },
      { name: 'Eid-ul-Fitr', date: '2026-03-20', type: 'RESTRICTED', region_code: 'COMMON', is_optional: true, description: 'Optional Festival Holiday' },
      { name: 'Independence Day', date: '2026-08-15', type: 'NATIONAL', region_code: 'COMMON', is_optional: false, description: 'National Independence Day' },
      { name: 'Ganesh Chaturthi', date: '2026-09-14', type: 'FESTIVAL', region_code: 'WEST_INDIA', is_optional: false, description: 'Ganesh Festival' },
      { name: 'Mahatma Gandhi Jayanti', date: '2026-10-02', type: 'NATIONAL', region_code: 'COMMON', is_optional: false, description: 'National Holiday' },
      { name: 'Dussehra / Vijayadashami', date: '2026-10-20', type: 'NATIONAL', region_code: 'COMMON', is_optional: false, description: 'Vijayadashami Festival' },
      { name: 'Kannada Rajyotsava', date: '2026-11-01', type: 'REGIONAL', region_code: 'SOUTH_INDIA', is_optional: false, description: 'Karnataka State Formation Day' },
      { name: 'Diwali / Deepavali', date: '2026-11-08', type: 'NATIONAL', region_code: 'COMMON', is_optional: false, description: 'Festival of Lights' },
      { name: 'Guru Nanak Jayanti', date: '2026-11-24', type: 'FESTIVAL', region_code: 'NORTH_INDIA', is_optional: false, description: 'North India Festival' },
      { name: 'Christmas Day', date: '2026-12-25', type: 'NATIONAL', region_code: 'COMMON', is_optional: false, description: 'Christmas Celebration' },
      { name: 'New Year Day', date: '2026-01-01', type: 'RESTRICTED', region_code: 'COMMON', is_optional: true, description: 'Optional New Year Holiday' },
    ];

    for (const h of defaultHolidays) {
      await dbService.query(
        `INSERT INTO holidays (name, date, type, region_code, is_optional, description, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         ON CONFLICT DO NOTHING`,
        [h.name, h.date, h.type, h.region_code, h.is_optional, h.description]
      );
    }
  }

  // ─── Holidays CRUD ───────────────────────────────────────────────────────
  async getAllHolidays(regionCode?: string, branchId?: number, year?: number) {
    const conditions: string[] = ['deleted_at IS NULL', 'is_active = true'];
    const params: any[] = [];
    let idx = 1;

    if (regionCode && regionCode !== 'ALL') {
      conditions.push(`(region_code = $${idx} OR region_code = 'COMMON')`);
      params.push(regionCode);
      idx++;
    }

    if (branchId) {
      conditions.push(`(branch_id = $${idx} OR branch_id IS NULL)`);
      params.push(branchId);
      idx++;
    }

    if (year) {
      conditions.push(`EXTRACT(YEAR FROM date) = $${idx}`);
      params.push(year);
      idx++;
    }

    const res = await dbService.query(
      `SELECT h.*, b.name as branch_name
       FROM holidays h
       LEFT JOIN branches b ON h.branch_id = b.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY h.date ASC`,
      params
    );
    return res.rows;
  }

  async createHoliday(dto: HolidayDTO, creatorId: number) {
    const res = await dbService.query(
      `INSERT INTO holidays (name, date, type, region_code, branch_id, is_optional, description, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8) RETURNING *`,
      [
        dto.name, dto.date, dto.type, dto.region_code || 'COMMON',
        dto.branch_id || null, dto.is_optional || false,
        dto.description || null, creatorId,
      ]
    );

    await this._logAudit(creatorId, 'HOLIDAY_CREATED', `Created holiday: ${dto.name} on ${dto.date}`);
    return res.rows[0];
  }

  async deleteHoliday(id: number, deleterId: number) {
    await dbService.query(`UPDATE holidays SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);
    await this._logAudit(deleterId, 'HOLIDAY_DELETED', `Deleted holiday #${id}`);
    return { success: true };
  }

  // ─── Optional Holiday Engine ──────────────────────────────────────────────
  async selectOptionalHoliday(employeeId: number, holidayId: number, year: number) {
    // Check policy limit (max 2 optional holidays per year)
    const countRes = await dbService.query(
      `SELECT COUNT(*) as cnt FROM optional_holiday_selections WHERE employee_id = $1 AND year = $2`,
      [employeeId, year]
    );
    const count = parseInt(countRes.rows[0]?.cnt || '0', 10);
    if (count >= 2) throw new Error('Maximum optional holiday quota (2 per year) reached.');

    const res = await dbService.query(
      `INSERT INTO optional_holiday_selections (employee_id, holiday_id, year, status)
       VALUES ($1, $2, $3, 'APPROVED') RETURNING *`,
      [employeeId, holidayId, year]
    );

    await this._logAudit(employeeId, 'OPTIONAL_HOLIDAY_SELECTED', `Selected optional holiday #${holidayId} for year ${year}`);
    return res.rows[0];
  }

  async getMyOptionalHolidays(employeeId: number, year: number) {
    const res = await dbService.query(
      `SELECT ohs.*, h.name as holiday_name, h.date as holiday_date, h.description
       FROM optional_holiday_selections ohs
       JOIN holidays h ON ohs.holiday_id = h.id
       WHERE ohs.employee_id = $1 AND ohs.year = $2`,
      [employeeId, year]
    );
    return res.rows;
  }

  // ─── Company Events CRUD ─────────────────────────────────────────────────
  async getCompanyEvents(year?: number, month?: number) {
    let sql = `
      SELECT ce.*, b.name as branch_name, d.name as department_name,
        e.first_name as creator_first, e.last_name as creator_last
      FROM company_events ce
      LEFT JOIN branches b ON ce.branch_id = b.id
      LEFT JOIN departments d ON ce.department_id = d.id
      LEFT JOIN employees e ON ce.created_by = e.id
      WHERE ce.is_active = true
    `;
    const params: any[] = [];
    if (year && month) {
      sql += ` AND EXTRACT(YEAR FROM ce.event_date) = $1 AND EXTRACT(MONTH FROM ce.event_date) = $2`;
      params.push(year, month);
    }
    sql += ` ORDER BY ce.event_date ASC`;

    const res = await dbService.query(sql, params);
    return res.rows;
  }

  async createCompanyEvent(dto: CompanyEventDTO, creatorId: number) {
    const res = await dbService.query(
      `INSERT INTO company_events (title, description, event_date, event_type, branch_id, department_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        dto.title, dto.description || null, dto.event_date, dto.event_type,
        dto.branch_id || null, dto.department_id || null, creatorId,
      ]
    );

    await this._logAudit(creatorId, 'COMPANY_EVENT_CREATED', `Created company event: ${dto.title} on ${dto.event_date}`);
    return res.rows[0];
  }

  // ─── Unified Enterprise Calendar Feed ─────────────────────────────────────
  async getUnifiedCalendarFeed(employeeId: number, year: number, month: number) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    // Fetch employee branch & department info
    const empRes = await dbService.query(`SELECT branch_id, department_id FROM employees WHERE id = $1`, [employeeId]);
    const emp = empRes.rows[0] || {};

    const [holRes, eventsRes, bdayRes, annivRes, leavesRes] = await Promise.all([
      dbService.query(
        `SELECT id, name, date, type, region_code, is_optional, description
         FROM holidays
         WHERE date >= $1 AND date <= $2 AND is_active = true AND deleted_at IS NULL
           AND (branch_id = $3 OR branch_id IS NULL)
         ORDER BY date ASC`,
        [startDate, endDate, emp.branch_id || null]
      ),
      dbService.query(
        `SELECT id, title, description, event_date, event_type
         FROM company_events
         WHERE event_date >= $1 AND event_date <= $2 AND is_active = true
         ORDER BY event_date ASC`,
        [startDate, endDate]
      ),
      dbService.query(
        `SELECT id, first_name, last_name, employee_code, date_of_birth
         FROM employees
         WHERE is_deleted = false AND date_of_birth IS NOT NULL
           AND EXTRACT(MONTH FROM date_of_birth) = $1`,
        [month]
      ),
      dbService.query(
        `SELECT id, first_name, last_name, employee_code, joining_date,
          (EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM joining_date)) as milestone_years
         FROM employees
         WHERE is_deleted = false AND joining_date IS NOT NULL
           AND EXTRACT(MONTH FROM joining_date) = $1
           AND EXTRACT(YEAR FROM joining_date) < $2`,
        [month, year]
      ),
      dbService.query(
        `SELECT la.id, la.start_date, la.end_date, la.status, lt.name as leave_type_name, lt.color,
          e.first_name, e.last_name, e.employee_code
         FROM leave_applications la
         JOIN leave_types lt ON la.leave_type_id = lt.id
         JOIN employees e ON la.employee_id = e.id
         WHERE la.status = 'APPROVED' AND la.deleted_at IS NULL
           AND (la.start_date <= $2 AND la.end_date >= $1)
         ORDER BY la.start_date ASC`,
        [startDate, endDate]
      ),
    ]);

    return {
      holidays: holRes.rows,
      company_events: eventsRes.rows,
      birthdays: bdayRes.rows,
      work_anniversaries: annivRes.rows,
      approved_leaves: leavesRes.rows,
    };
  }

  private async _logAudit(actorId: number, action: string, details: string) {
    try {
      await dbService.query(
        `INSERT INTO audit_logs (employee_id, action, module, details) VALUES ($1, $2, 'HOLIDAY_ENGINE', $3)`,
        [actorId, action, details]
      );
    } catch { /* non-fatal */ }
  }
}

export const holidayEngineRepository = new HolidayEngineRepository();
