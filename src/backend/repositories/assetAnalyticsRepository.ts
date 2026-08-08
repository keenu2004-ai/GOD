import dbService from '../database/db.js';

export interface CalculateDepreciationDTO {
  asset_id: number;
  purchase_cost: number;
  residual_value?: number;
  useful_life_years?: number;
}

export class AssetAnalyticsRepository {

  // ─── Financial Analytics & Valuation Summary ──────────────────────────────
  async getFinancialAnalytics() {
    const [valRes, depRes, maintRes] = await Promise.all([
      dbService.query(`SELECT COALESCE(SUM(value), 0) as total_purchase_value FROM assets`),
      dbService.query(`SELECT COALESCE(SUM(annual_depreciation), 0) as accum_dep, COALESCE(SUM(current_book_value), 0) as book_val FROM asset_depreciation_schedules`),
      dbService.query(`SELECT COALESCE(SUM(cost), 0) as total_maint_cost FROM asset_maintenance`),
    ]);

    const totalPurchaseValue = parseFloat(valRes.rows[0]?.total_purchase_value || '0');
    const accumDep = parseFloat(depRes.rows[0]?.accum_dep || '0');
    const currentBookValue = parseFloat(depRes.rows[0]?.book_val || '0') || (totalPurchaseValue - accumDep);
    const totalMaintCost = parseFloat(maintRes.rows[0]?.total_maint_cost || '0');

    return {
      total_purchase_value: totalPurchaseValue,
      accumulated_depreciation: accumDep,
      current_book_value: Math.max(0, currentBookValue),
      total_maintenance_cost: totalMaintCost,
    };
  }

  // ─── Straight-Line Depreciation Calculation Engine ────────────────────────
  async calculateDepreciation(dto: CalculateDepreciationDTO, creatorId: number) {
    const cost = dto.purchase_cost;
    const residual = dto.residual_value || 0;
    const years = dto.useful_life_years || 3;

    if (cost <= 0 || years <= 0) {
      throw new Error('Invalid purchase cost or useful life years');
    }

    const annualDep = (cost - residual) / years;
    const monthlyDep = annualDep / 12;
    const bookValue = Math.max(residual, cost - annualDep);

    const res = await dbService.query(
      `INSERT INTO asset_depreciation_schedules (
        asset_id, purchase_cost, residual_value, useful_life_years, method,
        annual_depreciation, monthly_depreciation, current_book_value
      ) VALUES ($1, $2, $3, $4, 'STRAIGHT_LINE', $5, $6, $7) RETURNING *`,
      [dto.asset_id, cost, residual, years, annualDep, monthlyDep, bookValue]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'DEPRECIATION_CALCULATED', 'ASSET_ANALYTICS', $2)`,
      [creatorId, `Calculated straight-line depreciation for Asset #${dto.asset_id}: Annual ₹${annualDep.toFixed(2)}`]
    );

    return res.rows[0];
  }

  async getDepreciationSchedules() {
    const res = await dbService.query(
      `SELECT ds.*, a.asset_name, a.asset_code, a.category
       FROM asset_depreciation_schedules ds
       JOIN assets a ON ds.asset_id = a.id
       ORDER BY ds.created_at DESC`
    );
    return res.rows;
  }

  // ─── Physical Inventory Audits & Reconciliation Engine ────────────────────
  async createInventoryAudit(auditName: string, auditorId: number) {
    const totRes = await dbService.query(`SELECT COUNT(*) as count FROM assets`);
    const totalExpected = parseInt(totRes.rows[0]?.count || '0', 10);

    const res = await dbService.query(
      `INSERT INTO asset_inventory_audits (audit_name, auditor_id, total_expected, total_scanned, missing_count, status)
       VALUES ($1, $2, $3, 0, 0, 'IN_PROGRESS') RETURNING *`,
      [auditName, auditorId, totalExpected]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'INVENTORY_AUDIT_STARTED', 'ASSET_ANALYTICS', $2)`,
      [auditorId, `Started Physical Inventory Audit '${auditName}'`]
    );

    return res.rows[0];
  }

  async getInventoryAudits() {
    const res = await dbService.query(
      `SELECT ia.*, e.first_name as auditor_first_name, e.last_name as auditor_last_name
       FROM asset_inventory_audits ia
       LEFT JOIN employees e ON ia.auditor_id = e.id
       ORDER BY ia.created_at DESC`
    );
    return res.rows;
  }

  async recordAuditFinding(auditId: number, assetId: number, discrepancyType: string, actualLocation?: string) {
    const res = await dbService.query(
      `INSERT INTO asset_audit_findings (audit_id, asset_id, discrepancy_type, actual_location, status)
       VALUES ($1, $2, $3, $4, 'OPEN') RETURNING *`,
      [auditId, assetId, discrepancyType, actualLocation || null]
    );

    await dbService.query(
      `UPDATE asset_inventory_audits
       SET missing_count = missing_count + 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [auditId]
    );

    return res.rows[0];
  }

  async getAuditFindings(auditId?: number) {
    let sql = `
      SELECT af.*, a.asset_name, a.asset_code, ia.audit_name
      FROM asset_audit_findings af
      JOIN assets a ON af.asset_id = a.id
      JOIN asset_inventory_audits ia ON af.audit_id = ia.id
    `;
    const params: any[] = [];
    if (auditId) {
      sql += ` WHERE af.audit_id = $1`;
      params.push(auditId);
    }
    sql += ` ORDER BY af.created_at DESC`;

    const res = await dbService.query(sql, params);
    return res.rows;
  }

  async reconcileFinding(findingId: number, action: string, reviewerId: number) {
    const res = await dbService.query(
      `UPDATE asset_audit_findings
       SET status = 'RECONCILED', reconciliation_action = $1 WHERE id = $2 RETURNING *`,
      [action, findingId]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'AUDIT_FINDING_RECONCILED', 'ASSET_ANALYTICS', $2)`,
      [reviewerId, `Reconciled Finding #${findingId} with action: ${action}`]
    );

    return res.rows[0];
  }
}

export const assetAnalyticsRepository = new AssetAnalyticsRepository();
