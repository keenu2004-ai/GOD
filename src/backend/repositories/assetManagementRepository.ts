import dbService from '../database/db.js';

export interface CreateAssetDTO {
  asset_name: string;
  asset_code: string;
  category: string;
  serial_number: string;
  purchase_date: string;
  value: number;
  assigned_to_employee_id?: number;
}

export class AssetManagementRepository {

  // ─── Asset Inventory KPIs & Master Inventory ──────────────────────────────
  async getAssetKPIs() {
    const [totRes, availRes, allocRes, maintRes, valRes] = await Promise.all([
      dbService.query(`SELECT COUNT(*) as count FROM assets`),
      dbService.query(`SELECT COUNT(*) as count FROM assets WHERE status = 'AVAILABLE'`),
      dbService.query(`SELECT COUNT(*) as count FROM assets WHERE status = 'ALLOCATED'`),
      dbService.query(`SELECT COUNT(*) as count FROM assets WHERE status = 'UNDER_MAINTENANCE'`),
      dbService.query(`SELECT COALESCE(SUM(value), 0) as total_val FROM assets`),
    ]);

    return {
      total_assets: parseInt(totRes.rows[0]?.count || '0', 10),
      available_assets: parseInt(availRes.rows[0]?.count || '0', 10),
      allocated_assets: parseInt(allocRes.rows[0]?.count || '0', 10),
      maintenance_assets: parseInt(maintRes.rows[0]?.count || '0', 10),
      total_inventory_value: parseFloat(valRes.rows[0]?.total_val || '0'),
    };
  }

  async createAsset(dto: CreateAssetDTO, creatorId: number) {
    const status = dto.assigned_to_employee_id ? 'ALLOCATED' : 'AVAILABLE';
    const res = await dbService.query(
      `INSERT INTO assets (
        asset_name, asset_code, category, serial_number, assigned_to_employee_id, purchase_date, value, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        dto.asset_name, dto.asset_code, dto.category, dto.serial_number,
        dto.assigned_to_employee_id || null, dto.purchase_date, dto.value, status
      ]
    );

    if (dto.assigned_to_employee_id) {
      await dbService.query(
        `INSERT INTO asset_assignments (asset_id, employee_id, assignment_date, status)
         VALUES ($1, $2, CURRENT_DATE, 'ASSIGNED')`,
        [res.rows[0].id, dto.assigned_to_employee_id]
      );
    }

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'ASSET_CREATED', 'ASSET_MANAGEMENT', $2)`,
      [creatorId, `Created asset '${dto.asset_name}' (${dto.asset_code})`]
    );

    return res.rows[0];
  }

  async getAssets(category?: string, status?: string) {
    let sql = `
      SELECT a.*, e.first_name, e.last_name, e.employee_code
      FROM assets a
      LEFT JOIN employees e ON a.assigned_to_employee_id = e.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let idx = 1;

    if (category) { sql += ` AND a.category = $${idx++}`; params.push(category); }
    if (status) { sql += ` AND a.status = $${idx++}`; params.push(status); }

    sql += ` ORDER BY a.created_at DESC`;

    const res = await dbService.query(sql, params);
    return res.rows;
  }

  // ─── Assignment & Acknowledgement Engine ──────────────────────────────────
  async assignAsset(assetId: number, employeeId: number, assignerId: number) {
    await dbService.query(
      `UPDATE assets SET assigned_to_employee_id = $1, status = 'ALLOCATED' WHERE id = $2`,
      [employeeId, assetId]
    );

    const assignRes = await dbService.query(
      `INSERT INTO asset_assignments (asset_id, employee_id, assignment_date, status)
       VALUES ($1, $2, CURRENT_DATE, 'ASSIGNED') RETURNING *`,
      [assetId, employeeId]
    );

    await dbService.query(
      `INSERT INTO notifications (employee_id, title, message, type)
       VALUES ($1, 'New IT Asset Assigned', 'An IT asset has been assigned to you. Please acknowledge receipt.', 'ASSET_ASSIGNED')`,
      [employeeId]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'ASSET_ASSIGNED', 'ASSET_MANAGEMENT', $2)`,
      [assignerId, `Assigned Asset #${assetId} to Employee #${employeeId}`]
    );

    return assignRes.rows[0];
  }

  async acknowledgeAsset(assignmentId: number, employeeId: number) {
    const res = await dbService.query(
      `UPDATE asset_assignments
       SET is_acknowledged = true, acknowledged_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND employee_id = $2 RETURNING *`,
      [assignmentId, employeeId]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'ASSET_ACKNOWLEDGED', 'ASSET_MANAGEMENT', $2)`,
      [employeeId, `Employee acknowledged receipt of Asset Assignment #${assignmentId}`]
    );

    return res.rows[0];
  }

  async returnAsset(assetId: number, returnerId: number) {
    await dbService.query(
      `UPDATE assets SET assigned_to_employee_id = NULL, status = 'AVAILABLE' WHERE id = $1`,
      [assetId]
    );

    await dbService.query(
      `UPDATE asset_assignments SET status = 'RETURNED', return_date = CURRENT_DATE WHERE asset_id = $1 AND status = 'ASSIGNED'`,
      [assetId]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'ASSET_RETURNED', 'ASSET_MANAGEMENT', $2)`,
      [returnerId, `Asset #${assetId} returned to inventory`]
    );

    return { asset_id: assetId, status: 'AVAILABLE' };
  }

  // ─── Maintenance & Issue Reporting Engine ─────────────────────────────────
  async scheduleMaintenance(assetId: number, maintenanceType: string, description: string, cost: number, startDate: string, creatorId: number) {
    await dbService.query(
      `UPDATE assets SET status = 'UNDER_MAINTENANCE' WHERE id = $1`,
      [assetId]
    );

    const res = await dbService.query(
      `INSERT INTO asset_maintenance (asset_id, maintenance_type, description, cost, start_date, status)
       VALUES ($1, $2, $3, $4, $5, 'SCHEDULED') RETURNING *`,
      [assetId, maintenanceType, description, cost, startDate]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'ASSET_MAINTENANCE_SCHEDULED', 'ASSET_MANAGEMENT', $2)`,
      [creatorId, `Scheduled ${maintenanceType} maintenance for Asset #${assetId}`]
    );

    return res.rows[0];
  }

  async reportIssue(assetId: number, reportedBy: number, issueType: string, description: string, severity: string) {
    const res = await dbService.query(
      `INSERT INTO asset_issues (asset_id, reported_by, issue_type, description, severity, status)
       VALUES ($1, $2, $3, $4, $5, 'OPEN') RETURNING *`,
      [assetId, reportedBy, issueType, description, severity]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'ASSET_ISSUE_REPORTED', 'ASSET_MANAGEMENT', $2)`,
      [reportedBy, `Reported ${severity} ${issueType} issue for Asset #${assetId}`]
    );

    return res.rows[0];
  }
}

export const assetManagementRepository = new AssetManagementRepository();
