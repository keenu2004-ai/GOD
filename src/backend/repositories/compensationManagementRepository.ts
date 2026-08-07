import dbService from '../database/db.js';

export interface CreateBonusDTO {
  bonus_name: string;
  bonus_type: 'PERFORMANCE' | 'FESTIVAL' | 'ANNUAL' | 'RETENTION' | 'REFERRAL' | 'JOINING' | 'PROJECT_COMPLETION' | 'SALES' | 'SPOT_AWARD';
  calculation_mode?: 'FIXED' | 'PERCENTAGE';
  formula_expression?: string;
}

export interface AssignBonusDTO {
  bonus_id?: number;
  employee_id: number;
  bonus_amount: number;
  payout_month: string;
  payout_year: number;
  reason?: string;
}

export interface AwardIncentiveDTO {
  employee_id: number;
  incentive_type: 'SALES' | 'PROJECT' | 'PERFORMANCE' | 'ATTENDANCE' | 'TARGET_ACHIEVEMENT';
  amount: number;
  payout_month: string;
  payout_year: number;
  reason?: string;
}

export interface ClaimReimbursementDTO {
  employee_id: number;
  claim_category: 'TRAVEL' | 'FUEL' | 'FOOD' | 'HOTEL' | 'MEDICAL' | 'OFFICE_SUPPLIES' | 'MOBILE' | 'INTERNET' | 'CLIENT_VISIT';
  claim_amount: number;
  receipt_url?: string;
  description: string;
}

export class CompensationManagementRepository {

  // ─── Seed Bonus Master ───────────────────────────────────────────────────
  async seedBonusMaster() {
    const bonuses = [
      { name: 'Annual Performance Bonus', type: 'PERFORMANCE', mode: 'PERCENTAGE', formula: 'BASIC * 0.15' },
      { name: 'Diwali / Festival Bonus', type: 'FESTIVAL', mode: 'FIXED', formula: '10000' },
      { name: 'Employee Referral Bonus', type: 'REFERRAL', mode: 'FIXED', formula: '25000' },
      { name: 'Key Talent Retention Bonus', type: 'RETENTION', mode: 'FIXED', formula: '50000' },
      { name: 'Joining / Sign-on Bonus', type: 'JOINING', mode: 'FIXED', formula: '30000' },
      { name: 'Spot Recognition Award', type: 'SPOT_AWARD', mode: 'FIXED', formula: '5000' },
      { name: 'Project Completion Bonus', type: 'PROJECT_COMPLETION', mode: 'FIXED', formula: '20000' },
      { name: 'Quarterly Sales Bonus', type: 'SALES', mode: 'PERCENTAGE', formula: 'SALES_REVENUE * 0.05' },
    ];

    for (const b of bonuses) {
      await dbService.query(
        `INSERT INTO bonus_master (bonus_name, bonus_type, calculation_mode, formula_expression, is_active)
         VALUES ($1, $2, $3, $4, true) ON CONFLICT DO NOTHING`,
        [b.name, b.type, b.mode, b.formula]
      );
    }
  }

  // ─── Bonus Master & Employee Bonus Engine ────────────────────────────────
  async getBonusMaster() {
    const res = await dbService.query(`SELECT * FROM bonus_master WHERE is_active = true ORDER BY bonus_name ASC`);
    return res.rows;
  }

  async assignBonus(dto: AssignBonusDTO, creatorId: number) {
    const res = await dbService.query(
      `INSERT INTO employee_bonuses (bonus_id, employee_id, bonus_amount, payout_month, payout_year, reason, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING') RETURNING *`,
      [dto.bonus_id || null, dto.employee_id, dto.bonus_amount, dto.payout_month, dto.payout_year, dto.reason || null]
    );

    await this._logAudit(creatorId, 'BONUS_ASSIGNED', `Assigned bonus of ₹${dto.bonus_amount} to Employee #${dto.employee_id}`);
    return res.rows[0];
  }

  async approveBonus(bonusId: number, approverId: number) {
    const res = await dbService.query(
      `UPDATE employee_bonuses
       SET status = 'APPROVED', approved_by = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [approverId, bonusId]
    );

    await this._logAudit(approverId, 'BONUS_APPROVED', `Approved bonus #${bonusId}`);
    return res.rows[0];
  }

  async getBonuses(employeeId?: number) {
    let sql = `
      SELECT eb.*, e.first_name, e.last_name, e.employee_code, bm.bonus_name, bm.bonus_type
      FROM employee_bonuses eb
      JOIN employees e ON eb.employee_id = e.id
      LEFT JOIN bonus_master bm ON eb.bonus_id = bm.id
    `;
    const params: any[] = [];
    if (employeeId) {
      sql += ` WHERE eb.employee_id = $1`;
      params.push(employeeId);
    }
    sql += ` ORDER BY eb.created_at DESC`;

    const res = await dbService.query(sql, params);
    return res.rows;
  }

  // ─── Incentive Engine ─────────────────────────────────────────────────────
  async awardIncentive(dto: AwardIncentiveDTO, creatorId: number) {
    const res = await dbService.query(
      `INSERT INTO employee_incentives (employee_id, incentive_type, amount, payout_month, payout_year, reason, status, approved_by)
       VALUES ($1, $2, $3, $4, $5, $6, 'APPROVED', $7) RETURNING *`,
      [dto.employee_id, dto.incentive_type, dto.amount, dto.payout_month, dto.payout_year, dto.reason || null, creatorId]
    );

    await this._logAudit(creatorId, 'INCENTIVE_AWARDED', `Awarded ${dto.incentive_type} incentive of ₹${dto.amount} to Employee #${dto.employee_id}`);
    return res.rows[0];
  }

  async getIncentives(employeeId?: number) {
    let sql = `
      SELECT ei.*, e.first_name, e.last_name, e.employee_code
      FROM employee_incentives ei
      JOIN employees e ON ei.employee_id = e.id
    `;
    const params: any[] = [];
    if (employeeId) {
      sql += ` WHERE ei.employee_id = $1`;
      params.push(employeeId);
    }
    sql += ` ORDER BY ei.created_at DESC`;

    const res = await dbService.query(sql, params);
    return res.rows;
  }

  // ─── Multi-Level Reimbursement Engine ────────────────────────────────────
  async submitClaim(dto: ClaimReimbursementDTO) {
    const res = await dbService.query(
      `INSERT INTO reimbursement_requests (employee_id, claim_category, claim_amount, receipt_url, description, status)
       VALUES ($1, $2, $3, $4, $5, 'PENDING') RETURNING *`,
      [dto.employee_id, dto.claim_category, dto.claim_amount, dto.receipt_url || null, dto.description]
    );

    await this._logAudit(dto.employee_id, 'REIMBURSEMENT_CLAIM_SUBMITTED', `Submitted ${dto.claim_category} claim of ₹${dto.claim_amount}`);
    return res.rows[0];
  }

  async approveClaim(claimId: number, approverId: number, role = 'FINANCE') {
    const isFinance = ['FINANCE_MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(role);
    const status = isFinance ? 'PAID' : 'MANAGER_APPROVED';

    const res = await dbService.query(
      `UPDATE reimbursement_requests
       SET status = $1, ${isFinance ? 'finance_approved = true' : 'manager_approved = true'}, approved_by = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [status, approverId, claimId]
    );

    await this._logAudit(approverId, 'REIMBURSEMENT_CLAIM_APPROVED', `Approved claim #${claimId} status: ${status}`);
    return res.rows[0];
  }

  async getClaims(employeeId?: number) {
    let sql = `
      SELECT rr.*, e.first_name, e.last_name, e.employee_code
      FROM reimbursement_requests rr
      JOIN employees e ON rr.employee_id = e.id
    `;
    const params: any[] = [];
    if (employeeId) {
      sql += ` WHERE rr.employee_id = $1`;
      params.push(employeeId);
    }
    sql += ` ORDER BY rr.created_at DESC`;

    const res = await dbService.query(sql, params);
    return res.rows;
  }

  // ─── Compensation Analytics BI Aggregator ─────────────────────────────────
  async getCompensationAnalytics() {
    const [bonRes, incRes, claimRes, benRes] = await Promise.all([
      dbService.query(`SELECT COALESCE(SUM(bonus_amount), 0) as total FROM employee_bonuses WHERE status = 'APPROVED'`),
      dbService.query(`SELECT COALESCE(SUM(amount), 0) as total FROM employee_incentives WHERE status = 'APPROVED'`),
      dbService.query(`SELECT COALESCE(SUM(claim_amount), 0) as total FROM reimbursement_requests WHERE status = 'PAID'`),
      dbService.query(`SELECT COALESCE(SUM(monthly_employer_cost), 0) as total FROM employee_benefits WHERE status = 'ACTIVE'`),
    ]);

    return {
      total_bonuses_paid: parseFloat(bonRes.rows[0]?.total || '0'),
      total_incentives_paid: parseFloat(incRes.rows[0]?.total || '0'),
      total_claims_disbursed: parseFloat(claimRes.rows[0]?.total || '0'),
      monthly_benefits_cost: parseFloat(benRes.rows[0]?.total || '0'),
    };
  }

  private async _logAudit(actorId: number, action: string, details: string) {
    try {
      await dbService.query(
        `INSERT INTO audit_logs (employee_id, action, module, details)
         VALUES ($1, $2, 'COMPENSATION_ENGINE', $3)`,
        [actorId, action, details]
      );
    } catch { /* non-fatal */ }
  }
}

export const compensationManagementRepository = new CompensationManagementRepository();
