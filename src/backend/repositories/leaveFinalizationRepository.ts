import dbService from '../database/db.js';
import { leaveBalanceEngineRepository } from './leaveBalanceEngineRepository.js';

export interface BulkAssignPolicyDTO {
  policy_id: number;
  department_ids?: number[];
  employee_ids?: number[];
  effective_date?: string;
}

export interface BulkAdjustBalanceDTO {
  employee_ids: number[];
  leave_type_id: number;
  adjustment_type: 'CREDIT' | 'DEBIT' | 'BONUS_GRANT';
  days: number;
  reason: string;
}

export class LeaveFinalizationRepository {

  // ─── Bulk Assign Policy ───────────────────────────────────────────────────
  async bulkAssignPolicy(dto: BulkAssignPolicyDTO, creatorId: number) {
    return await dbService.transaction(async (client) => {
      const results = [];
      let targetEmpIds: number[] = dto.employee_ids || [];

      if (dto.department_ids && dto.department_ids.length > 0) {
        const deptEmps = await client.query(
          `SELECT id FROM employees WHERE department_id = ANY($1::int[]) AND is_deleted = false`,
          [dto.department_ids]
        );
        targetEmpIds = Array.from(new Set([...targetEmpIds, ...deptEmps.rows.map((r: any) => r.id)]));
      }

      // Fetch policy rules to get annual allocation
      const polRes = await client.query(`SELECT * FROM leave_policies WHERE id = $1`, [dto.policy_id]);
      const policy = polRes.rows[0];
      if (!policy) throw new Error('Policy not found');

      for (const empId of targetEmpIds) {
        await client.query(
          `INSERT INTO leave_policy_assignments (policy_id, employee_id, effective_date, created_by, updated_by)
           VALUES ($1, $2, $3, $4, $4)`,
          [dto.policy_id, empId, dto.effective_date || new Date().toISOString().split('T')[0], creatorId]
        );

        // Update / Initialize leave balance
        await client.query(
          `INSERT INTO leave_balances (employee_id, leave_type_id, total_allocated, used_days, remaining_days)
           VALUES ($1, $2, $3, 0, $3)
           ON CONFLICT (employee_id, leave_type_id) DO UPDATE
           SET total_allocated = EXCLUDED.total_allocated,
               remaining_days = EXCLUDED.total_allocated - leave_balances.used_days,
               updated_at = CURRENT_TIMESTAMP`,
          [empId, policy.leave_type_id, policy.annual_allocation]
        );

        results.push(empId);
      }

      await client.query(
        `INSERT INTO audit_logs (employee_id, action, module, details)
         VALUES ($1, 'LEAVE_BULK_POLICY_ASSIGNED', 'LEAVE_FINALIZATION', $2)`,
        [creatorId, `Bulk assigned policy #${dto.policy_id} to ${results.length} employees`]
      );

      return { assigned_count: results.length, employee_ids: results };
    });
  }

  // ─── Bulk Adjust Balances ─────────────────────────────────────────────────
  async bulkAdjustBalances(dto: BulkAdjustBalanceDTO, adminId: number) {
    const results = [];
    for (const empId of dto.employee_ids) {
      try {
        const res = await leaveBalanceEngineRepository.adjustBalance({
          employee_id: empId,
          leave_type_id: dto.leave_type_id,
          adjustment_type: dto.adjustment_type,
          days: dto.days,
          reason: `BULK: ${dto.reason}`,
        }, adminId);
        results.push({ employee_id: empId, success: true, res });
      } catch (e: any) {
        results.push({ employee_id: empId, success: false, error: e.message });
      }
    }
    return results;
  }

  // ─── Automated Maintenance Cron Job ───────────────────────────────────────
  async runAutomatedMaintenanceJobs(executorId = 1) {
    const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
    const currentYear = new Date().getFullYear();

    // 1. Run Monthly Accruals
    const accrualResult = await leaveBalanceEngineRepository.runMonthlyAccrual(currentPeriod, executorId);

    // 2. Expire Comp-Offs older than 60 days
    const todayStr = new Date().toISOString().split('T')[0];
    const expCompRes = await dbService.query(
      `UPDATE leave_comp_offs
       SET status = 'EXPIRED', updated_at = CURRENT_TIMESTAMP
       WHERE status = 'APPROVED' AND expiry_date < $1
       RETURNING id, employee_id`,
      [todayStr]
    );

    // 3. Log Audit
    await dbService.query(
      `INSERT INTO audit_logs (employee_id, action, module, details)
       VALUES ($1, 'LEAVE_CRON_MAINTENANCE_RUN', 'LEAVE_ENGINE', $2)`,
      [executorId, `Maintenance cron ran for ${currentPeriod}. Accrued: ${accrualResult.processedCount}, Expired Comp-Offs: ${expCompRes.rows.length}`]
    );

    return {
      period: currentPeriod,
      accruals: accrualResult,
      expired_comp_offs: expCompRes.rows.length,
    };
  }

  // ─── Import Template Generator ───────────────────────────────────────────
  getImportTemplate() {
    return [
      { employee_code: 'EMP001', leave_type_code: 'CASUAL', start_date: '2026-08-10', end_date: '2026-08-12', reason: 'Personal work' },
      { employee_code: 'EMP002', leave_type_code: 'SICK', start_date: '2026-08-15', end_date: '2026-08-15', reason: 'Fever' },
    ];
  }
}

export const leaveFinalizationRepository = new LeaveFinalizationRepository();
