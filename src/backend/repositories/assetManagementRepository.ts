import dbService from '../database/db.js';

export interface CreateAssetDTO {
  asset_name: string;
  category: string;
  serial_number: string;
  value: number;
}

export class AssetManagementRepository {

  // ─── Master Asset Inventory Engine ──────────────────────────────────────────
  async createAsset(dto: CreateAssetDTO, creatorId: number) {
    const tagNum = Math.floor(100000 + Math.random() * 900000);
    const assetCode = `AST-2026-${tagNum}`;

    const res = await dbService.query(
      `INSERT INTO assets (asset_name, asset_code, category, serial_number, purchase_date, value, status)
       VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, 'AVAILABLE') RETURNING *`,
      [dto.asset_name, assetCode, dto.category, dto.serial_number, dto.value]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'ASSET_CREATED', 'ASSET_MANAGEMENT', $2)`,
      [creatorId, `Created Asset ${dto.asset_name} (${assetCode})`]
    );

    return res.rows[0];
  }

  async getAssets() {
    const res = await dbService.query(
      `SELECT a.*, e.first_name, e.last_name
       FROM assets a
       LEFT JOIN employees e ON a.assigned_to_employee_id = e.id
       ORDER BY a.created_at DESC`
    );
    return res.rows;
  }

  // ─── Asset Assignment & Transfer Engine ────────────────────────────────────
  async assignAsset(assetId: number, employeeId: number, assignerId: number) {
    await dbService.query(
      `UPDATE assets SET status = 'ALLOCATED', assigned_to_employee_id = $1 WHERE id = $2`,
      [employeeId, assetId]
    );

    const assignRes = await dbService.query(
      `INSERT INTO asset_assignments (asset_id, employee_id, assignment_date, status)
       VALUES ($1, $2, CURRENT_DATE, 'ASSIGNED') RETURNING *`,
      [assetId, employeeId]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'ASSET_ASSIGNED', 'ASSET_MANAGEMENT', $2)`,
      [assignerId, `Assigned Asset #${assetId} to Employee #${employeeId}`]
    );

    return assignRes.rows[0];
  }

  async transferAsset(assetId: number, fromEmpId: number, toEmpId: number, reason: string, transferrerId: number) {
    await dbService.query(
      `UPDATE assets SET assigned_to_employee_id = $1 WHERE id = $2`,
      [toEmpId, assetId]
    );

    const transRes = await dbService.query(
      `INSERT INTO asset_transfers (asset_id, from_employee_id, to_employee_id, reason, transferred_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [assetId, fromEmpId, toEmpId, reason, transferrerId]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'ASSET_TRANSFERRED', 'ASSET_MANAGEMENT', $2)`,
      [transferrerId, `Transferred Asset #${assetId} to Employee #${toEmpId}: ${reason}`]
    );

    return transRes.rows[0];
  }

  // ─── My Assigned Assets Self-Service ───────────────────────────────────────
  async getMyAssignedAssets(employeeId: number) {
    const res = await dbService.query(
      `SELECT * FROM assets WHERE assigned_to_employee_id = $1 ORDER BY created_at DESC`,
      [employeeId]
    );
    return res.rows;
  }
}

export const assetManagementRepository = new AssetManagementRepository();
