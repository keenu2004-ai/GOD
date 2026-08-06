import { dbConnectionV2 } from './connection.js';

export interface AuditEntry {
  employee_id?: number | null;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'APPROVE' | 'REJECT';
  module: string;
  details: string;
  ip_address?: string;
}

export interface ActivityEntry {
  employee_id?: number | null;
  activity_type: string;
  description: string;
}

export interface SystemLogEntry {
  level: 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  message: string;
  stack_trace?: string;
}

export class AuditService {
  async logAuditEvent(entry: AuditEntry): Promise<void> {
    try {
      await dbConnectionV2.query(
        `INSERT INTO audit_logs (employee_id, action, module, details, ip_address) VALUES ($1, $2, $3, $4, $5)`,
        [entry.employee_id || null, entry.action, entry.module, entry.details, entry.ip_address || null]
      );
    } catch (err: any) {
      console.error('[Audit Log Error]: Failed to write audit log:', err.message);
    }
  }

  async logActivity(entry: ActivityEntry): Promise<void> {
    try {
      await dbConnectionV2.query(
        `INSERT INTO activity_logs (employee_id, activity_type, description) VALUES ($1, $2, $3)`,
        [entry.employee_id || null, entry.activity_type, entry.description]
      );
    } catch (err: any) {
      console.error('[Activity Log Error]: Failed to write activity log:', err.message);
    }
  }

  async logSystemError(entry: SystemLogEntry): Promise<void> {
    try {
      await dbConnectionV2.query(
        `INSERT INTO system_logs (level, message, stack_trace) VALUES ($1, $2, $3)`,
        [entry.level, entry.message, entry.stack_trace || null]
      );
    } catch (err: any) {
      console.error('[System Log Error]: Failed to write system log:', err.message);
    }
  }

  async logAIOperation(employeeId: number | null, actionType: string, prompt: string, response: string, tokens: number): Promise<void> {
    try {
      await dbConnectionV2.query(
        `INSERT INTO ai_logs (employee_id, action_type, prompt, response, tokens_used) VALUES ($1, $2, $3, $4, $5)`,
        [employeeId, actionType, prompt, response, tokens]
      );
    } catch (err: any) {
      console.error('[AI Log Error]: Failed to write AI log:', err.message);
    }
  }
}

export const auditLogger = new AuditService();
export default auditLogger;
