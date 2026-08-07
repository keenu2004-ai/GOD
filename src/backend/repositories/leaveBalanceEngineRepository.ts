import dbService from '../database/db.js';

export interface BalanceAdjustmentDTO {
  employee_id: number;
  leave_type_id: number;
  adjustment_type: 'CREDIT' | 'DEBIT' | 'BONUS_GRANT' | 'CORRECTION';
  days: number;
  reason: string;
}

export class LeaveBalanceEngineRepository {

  // ─── Permanent Ledger Transaction Logger ─────────────────────────────────
  async recordTransaction(client: any, data: {
    employee_id: number;
    leave_type_id: number;
    transaction_type: string;
    days_changed: number;
    opening_balance: number;
    closing_balance: number;
    reference_type?: string;
    reference_id?: number;
    description: string;
    created_by: number;
  }) {
    await client.query(
      `INSERT INTO leave_balance_transactions (
        employee_id, leave_type_id, transaction_type, days_changed,
        opening_balance, closing_balance, reference_type, reference_id,
        description, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        data.employee_id, data.leave_type_id, data.transaction_type,
        data.days_changed, data.opening_balance, data.closing_balance,
        data.reference_type || null, data.reference_id || null,
        data.description, data.created_by,
      ]
    );
  }

  // ─── Manual Balance Adjustment (HR / Admin) ──────────────────────────────
  async adjustBalance(dto: BalanceAdjustmentDTO, adminId: number) {
    return await dbService.transaction(async (client) => {
      // 1. Lock current balance record
      const balRes = await client.query(
        `SELECT * FROM leave_balances WHERE employee_id = $1 AND leave_type_id = $2 FOR UPDATE`,
        [dto.employee_id, dto.leave_type_id]
      );

      let opening = 0;
      let totalAlloc = 12;
      let used = 0;
      let remaining = 12;

      if (balRes.rows[0]) {
        opening = parseFloat(balRes.rows[0].remaining_days);
        totalAlloc = parseFloat(balRes.rows[0].total_allocated);
        used = parseFloat(balRes.rows[0].used_days);
      }

      let change = dto.days;
      if (dto.adjustment_type === 'DEBIT') change = -dto.days;

      const closing = Math.max(0, opening + change);

      // 2. Upsert leave_balances
      await client.query(
        `INSERT INTO leave_balances (employee_id, leave_type_id, total_allocated, used_days, remaining_days)
         VALUES ($1, $2, $3, GREATEST(0, $3 - $4), $4)
         ON CONFLICT (employee_id, leave_type_id) DO UPDATE
         SET remaining_days = $4,
             total_allocated = CASE WHEN $5 > 0 THEN leave_balances.total_allocated + $5 ELSE leave_balances.total_allocated END,
             updated_at = CURRENT_TIMESTAMP`,
        [dto.employee_id, dto.leave_type_id, totalAlloc + (change > 0 ? change : 0), closing, change]
      );

      // 3. Record leave_adjustments
      const adjRes = await client.query(
        `INSERT INTO leave_adjustments (employee_id, leave_type_id, adjustment_type, days, reason, approved_by)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [dto.employee_id, dto.leave_type_id, dto.adjustment_type, dto.days, dto.reason, adminId]
      );

      // 4. Permanent ledger entry
      await this.recordTransaction(client, {
        employee_id: dto.employee_id,
        leave_type_id: dto.leave_type_id,
        transaction_type: `ADJUSTMENT_${dto.adjustment_type}`,
        days_changed: change,
        opening_balance: opening,
        closing_balance: closing,
        reference_type: 'LEAVE_ADJUSTMENT',
        reference_id: adjRes.rows[0].id,
        description: `Manual adjustment by admin #${adminId}: ${dto.reason} (${change > 0 ? '+' : ''}${change} days)`,
        created_by: adminId,
      });

      await client.query(
        `INSERT INTO audit_logs (employee_id, action, module, details) VALUES ($1, 'LEAVE_BALANCE_ADJUSTED', 'LEAVE_ENGINE', $2)`,
        [adminId, `Adjusted leave balance for emp #${dto.employee_id}, type #${dto.leave_type_id}: ${change} days (${dto.reason})`]
      );

      return adjRes.rows[0];
    });
  }

  // ─── Monthly Accrual Engine ───────────────────────────────────────────────
  async runMonthlyAccrual(periodStr: string, executorId = 1) {
    return await dbService.transaction(async (client) => {
      // Find all active policy assignments
      const assRes = await client.query(
        `SELECT lpa.*, lp.monthly_accrual, lp.leave_type_id, lp.max_balance
         FROM leave_policy_assignments lpa
         JOIN leave_policies lp ON lpa.policy_id = lp.id
         WHERE lpa.is_active = true AND lpa.deleted_at IS NULL AND lp.is_active = true`
      );

      let processedCount = 0;

      for (const a of assRes.rows) {
        let empIds: number[] = [];
        if (a.employee_id) empIds.push(a.employee_id);
        else if (a.department_id) {
          const emps = await client.query(`SELECT id FROM employees WHERE department_id = $1 AND is_deleted = false`, [a.department_id]);
          empIds = emps.rows.map((r: any) => r.id);
        }

        const accrualDays = parseFloat(a.monthly_accrual || '1.0');

        for (const empId of empIds) {
          const balRes = await client.query(
            `SELECT remaining_days, total_allocated FROM leave_balances WHERE employee_id = $1 AND leave_type_id = $2`,
            [empId, a.leave_type_id]
          );

          const opening = parseFloat(balRes.rows[0]?.remaining_days || '0');
          const maxBal = parseFloat(a.max_balance || '30');
          const closing = Math.min(maxBal, opening + accrualDays);
          const actualAccrued = closing - opening;

          if (actualAccrued > 0) {
            await client.query(
              `INSERT INTO leave_balances (employee_id, leave_type_id, total_allocated, remaining_days)
               VALUES ($1, $2, $3, $3)
               ON CONFLICT (employee_id, leave_type_id) DO UPDATE
               SET total_allocated = leave_balances.total_allocated + $4,
                   remaining_days = $5,
                   updated_at = CURRENT_TIMESTAMP`,
              [empId, a.leave_type_id, actualAccrued, actualAccrued, closing]
            );

            await client.query(
              `INSERT INTO leave_accrual_history (employee_id, leave_type_id, accrual_period, days_accrued)
               VALUES ($1, $2, $3, $4)`,
              [empId, a.leave_type_id, periodStr, actualAccrued]
            );

            await this.recordTransaction(client, {
              employee_id: empId,
              leave_type_id: a.leave_type_id,
              transaction_type: 'MONTHLY_ACCRUAL',
              days_changed: actualAccrued,
              opening_balance: opening,
              closing_balance: closing,
              description: `Automated monthly accrual for period ${periodStr} (+${actualAccrued} days)`,
              created_by: executorId,
            });

            processedCount++;
          }
        }
      }

      return { period: periodStr, processedCount };
    });
  }

  // ─── Comp-Off Engine ──────────────────────────────────────────────────────
  async requestCompOff(employeeId: number, dateWorked: string, days = 1.0, reason: string) {
    // Calculate 60-day expiry date from date worked
    const expiry = new Date(new Date(dateWorked).getTime() + 60 * 86400000).toISOString().split('T')[0];

    const res = await dbService.query(
      `INSERT INTO leave_comp_offs (employee_id, date_worked, days_granted, expiry_date, status, reason)
       VALUES ($1, $2, $3, $4, 'PENDING', $5) RETURNING *`,
      [employeeId, dateWorked, days, expiry, reason]
    );

    return res.rows[0];
  }

  async approveCompOff(compOffId: number, approverId: number) {
    return await dbService.transaction(async (client) => {
      const compRes = await client.query(
        `SELECT * FROM leave_comp_offs WHERE id = $1 AND status = 'PENDING' FOR UPDATE`,
        [compOffId]
      );
      const comp = compRes.rows[0];
      if (!comp) throw new Error('Comp-off request not found or already processed');

      // Get COMP_OFF leave_type_id
      const typeRes = await client.query(`SELECT id FROM leave_types WHERE code = 'COMP_OFF' LIMIT 1`);
      const compTypeId = typeRes.rows[0]?.id || 9;

      const balRes = await client.query(
        `SELECT remaining_days FROM leave_balances WHERE employee_id = $1 AND leave_type_id = $2`,
        [comp.employee_id, compTypeId]
      );
      const opening = parseFloat(balRes.rows[0]?.remaining_days || '0');
      const closing = opening + parseFloat(comp.days_granted);

      // Credit COMP_OFF balance
      await client.query(
        `INSERT INTO leave_balances (employee_id, leave_type_id, total_allocated, remaining_days)
         VALUES ($1, $2, $3, $3)
         ON CONFLICT (employee_id, leave_type_id) DO UPDATE
         SET total_allocated = leave_balances.total_allocated + $3,
             remaining_days = leave_balances.remaining_days + $3,
             updated_at = CURRENT_TIMESTAMP`,
        [comp.employee_id, compTypeId, comp.days_granted]
      );

      // Update Comp-off Status
      const updateRes = await client.query(
        `UPDATE leave_comp_offs SET status = 'APPROVED', approved_by = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 RETURNING *`,
        [approverId, compOffId]
      );

      await this.recordTransaction(client, {
        employee_id: comp.employee_id,
        leave_type_id: compTypeId,
        transaction_type: 'COMP_OFF_GRANTED',
        days_changed: parseFloat(comp.days_granted),
        opening_balance: opening,
        closing_balance: closing,
        reference_type: 'COMP_OFF',
        reference_id: compOffId,
        description: `Comp-off approved for work on ${comp.date_worked} (+${comp.days_granted} days, expires ${comp.expiry_date})`,
        created_by: approverId,
      });

      return updateRes.rows[0];
    });
  }

  // ─── Year-End Carry Forward Runner ────────────────────────────────────────
  async runYearEndCarryForward(year: number, executorId = 1) {
    return await dbService.transaction(async (client) => {
      const balRes = await client.query(
        `SELECT lb.*, lt.code as leave_type_code, lt.name as leave_type_name
         FROM leave_balances lb
         JOIN leave_types lt ON lb.leave_type_id = lt.id
         WHERE lt.is_carry_forward = true`
      );

      let processed = 0;
      for (const b of balRes.rows) {
        const remaining = Math.max(0, parseFloat(b.remaining_days));
        const maxCarry = 6.0; // standard carry forward limit
        const carried = Math.min(remaining, maxCarry);
        const expired = remaining - carried;

        // Reset balance for new year with carried days
        await client.query(
          `UPDATE leave_balances
           SET total_allocated = $1, remaining_days = $1, used_days = 0, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [carried, b.id]
        );

        await client.query(
          `INSERT INTO leave_carry_forward_history (employee_id, leave_type_id, year, days_carried, days_expired)
           VALUES ($1, $2, $3, $4, $5)`,
          [b.employee_id, b.leave_type_id, year, carried, expired]
        );

        await this.recordTransaction(client, {
          employee_id: b.employee_id,
          leave_type_id: b.leave_type_id,
          transaction_type: 'CARRY_FORWARD',
          days_changed: carried - remaining,
          opening_balance: remaining,
          closing_balance: carried,
          description: `Year-end carry forward for ${year}: ${carried} days transferred, ${expired} days expired.`,
          created_by: executorId,
        });

        processed++;
      }

      return { year, processedCount: processed };
    });
  }

  // ─── Ledger & History Queries ─────────────────────────────────────────────
  async getLedgerTransactions(employeeId?: number, leaveTypeId?: number) {
    let sql = `
      SELECT lbt.*, lt.name as leave_type_name, lt.code as leave_type_code, lt.color,
        e.first_name, e.last_name, e.employee_code, d.name as department_name
      FROM leave_balance_transactions lbt
      JOIN leave_types lt ON lbt.leave_type_id = lt.id
      JOIN employees e ON lbt.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
    `;
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (employeeId) { conditions.push(`lbt.employee_id = $${idx++}`); params.push(employeeId); }
    if (leaveTypeId) { conditions.push(`lbt.leave_type_id = $${idx++}`); params.push(leaveTypeId); }

    if (conditions.length > 0) sql += ` WHERE ${conditions.join(' AND ')}`;
    sql += ` ORDER BY lbt.created_at DESC LIMIT 200`;

    const res = await dbService.query(sql, params);
    return res.rows;
  }

  async getAdjustments(employeeId?: number) {
    let sql = `
      SELECT la.*, lt.name as leave_type_name, e.first_name, e.last_name, e.employee_code,
        appr.first_name as approver_first_name, appr.last_name as approver_last_name
      FROM leave_adjustments la
      JOIN leave_types lt ON la.leave_type_id = lt.id
      JOIN employees e ON la.employee_id = e.id
      LEFT JOIN employees appr ON la.approved_by = appr.id
    `;
    const params: any[] = [];
    if (employeeId) { sql += ` WHERE la.employee_id = $1`; params.push(employeeId); }
    sql += ` ORDER BY la.created_at DESC`;

    const res = await dbService.query(sql, params);
    return res.rows;
  }

  async getCompOffs(employeeId?: number) {
    let sql = `
      SELECT co.*, e.first_name, e.last_name, e.employee_code, d.name as department_name
      FROM leave_comp_offs co
      JOIN employees e ON co.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
    `;
    const params: any[] = [];
    if (employeeId) { sql += ` WHERE co.employee_id = $1`; params.push(employeeId); }
    sql += ` ORDER BY co.created_at DESC`;

    const res = await dbService.query(sql, params);
    return res.rows;
  }
}

export const leaveBalanceEngineRepository = new LeaveBalanceEngineRepository();
