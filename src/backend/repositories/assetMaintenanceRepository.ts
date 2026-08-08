import dbService from '../database/db.js';

export interface CreateWarrantyClaimDTO {
  asset_id: number;
  vendor_name?: string;
  issue_description: string;
}

export interface CreateDamageInvestigationDTO {
  issue_id?: number;
  asset_id: number;
  employee_id?: number;
  damage_severity?: string;
  estimated_cost?: number;
  responsibility?: string;
  notes?: string;
}

export interface CreatePayrollRecoveryDTO {
  asset_id: number;
  employee_id: number;
  recovery_amount: number;
  reason: string;
}

export class AssetMaintenanceRepository {

  // ─── Warranty Claims Engine ──────────────────────────────────────────────
  async createWarrantyClaim(dto: CreateWarrantyClaimDTO, creatorId: number) {
    const claimNum = `CLM-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const res = await dbService.query(
      `INSERT INTO asset_warranty_claims (claim_number, asset_id, vendor_name, issue_description, status)
       VALUES ($1, $2, $3, $4, 'CLAIM_SUBMITTED') RETURNING *`,
      [claimNum, dto.asset_id, dto.vendor_name || null, dto.issue_description]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'WARRANTY_CLAIM_SUBMITTED', 'ASSET_MAINTENANCE', $2)`,
      [creatorId, `Submitted Warranty Claim ${claimNum} for Asset #${dto.asset_id}`]
    );

    return res.rows[0];
  }

  async getWarrantyClaims() {
    const res = await dbService.query(
      `SELECT wc.*, a.asset_name, a.asset_code, a.category
       FROM asset_warranty_claims wc
       JOIN assets a ON wc.asset_id = a.id
       ORDER BY wc.created_at DESC`
    );
    return res.rows;
  }

  // ─── Damage & Loss Investigation Engine ───────────────────────────────────
  async createDamageInvestigation(dto: CreateDamageInvestigationDTO, creatorId: number) {
    const res = await dbService.query(
      `INSERT INTO asset_damage_investigations (
        issue_id, asset_id, employee_id, damage_severity, estimated_cost, responsibility, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'UNDER_INVESTIGATION') RETURNING *`,
      [
        dto.issue_id || null, dto.asset_id, dto.employee_id || null,
        dto.damage_severity || 'MODERATE', dto.estimated_cost || 0,
        dto.responsibility || 'COMPANY', dto.notes || null
      ]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'DAMAGE_INVESTIGATION_STARTED', 'ASSET_MAINTENANCE', $2)`,
      [creatorId, `Initiated damage investigation for Asset #${dto.asset_id}`]
    );

    return res.rows[0];
  }

  async getDamageInvestigations() {
    const res = await dbService.query(
      `SELECT di.*, a.asset_name, a.asset_code, e.first_name, e.last_name, e.employee_code
       FROM asset_damage_investigations di
       JOIN assets a ON di.asset_id = a.id
       LEFT JOIN employees e ON di.employee_id = e.id
       ORDER BY di.created_at DESC`
    );
    return res.rows;
  }

  // ─── Payroll Recovery Workflow Engine ────────────────────────────────────
  async createPayrollRecovery(dto: CreatePayrollRecoveryDTO, creatorId: number) {
    const res = await dbService.query(
      `INSERT INTO asset_payroll_recoveries (asset_id, employee_id, recovery_amount, reason, status)
       VALUES ($1, $2, $3, $4, 'PENDING_FINANCE_APPROVAL') RETURNING *`,
      [dto.asset_id, dto.employee_id, dto.recovery_amount, dto.reason]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'PAYROLL_RECOVERY_REQUESTED', 'ASSET_MAINTENANCE', $2)`,
      [creatorId, `Submitted Payroll Recovery of ₹${dto.recovery_amount} for Employee #${dto.employee_id}`]
    );

    return res.rows[0];
  }

  async getPayrollRecoveries() {
    const res = await dbService.query(
      `SELECT pr.*, a.asset_name, a.asset_code, e.first_name, e.last_name, e.employee_code
       FROM asset_payroll_recoveries pr
       JOIN assets a ON pr.asset_id = a.id
       JOIN employees e ON pr.employee_id = e.id
       ORDER BY pr.created_at DESC`
    );
    return res.rows;
  }

  async approvePayrollRecovery(recoveryId: number, approverId: number) {
    const res = await dbService.query(
      `UPDATE asset_payroll_recoveries
       SET status = 'PAYROLL_APPROVED', payroll_deducted = true
       WHERE id = $1 RETURNING *`,
      [recoveryId]
    );

    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'PAYROLL_RECOVERY_APPROVED', 'ASSET_MAINTENANCE', $2)`,
      [approverId, `Approved Payroll Recovery #${recoveryId} for payroll deduction`]
    );

    return res.rows[0];
  }
}

export const assetMaintenanceRepository = new AssetMaintenanceRepository();
