import dbService from '../database/db.js';

export class RecruitmentRepository {
  async getAllJobOpenings() {
    const sql = `
      SELECT r.*, d.name as department_name,
             (SELECT COUNT(*) FROM candidates c WHERE c.recruitment_id = r.id) as total_candidates
      FROM recruitments r
      LEFT JOIN departments d ON r.department_id = d.id
      ORDER BY r.id DESC
    `;
    const res = await dbService.query(sql);
    return res.rows;
  }

  async getCandidatesByJob(recruitmentId: number) {
    const sql = `SELECT * FROM candidates WHERE recruitment_id = $1 ORDER BY id DESC`;
    const res = await dbService.query(sql, [recruitmentId]);
    return res.rows;
  }

  async createJobOpening(data: any) {
    const res = await dbService.query(
      `INSERT INTO recruitments (job_title, department_id, openings, experience_required, salary_range, status)
       VALUES ($1, $2, $3, $4, $5, 'OPEN')
       RETURNING *`,
      [data.job_title, data.department_id, data.openings, data.experience_required, data.salary_range]
    );
    return res.rows[0];
  }

  async createCandidate(data: any) {
    const res = await dbService.query(
      `INSERT INTO candidates (recruitment_id, candidate_name, email, phone, resume_url, status)
       VALUES ($1, $2, $3, $4, $5, 'APPLIED')
       RETURNING *`,
      [data.recruitment_id, data.candidate_name, data.email, data.phone, data.resume_url || '']
    );
    return res.rows[0];
  }

  async updateCandidateStatus(id: number, status: string, feedback?: string) {
    const res = await dbService.query(
      `UPDATE candidates SET status = $1, feedback = $2 WHERE id = $3 RETURNING *`,
      [status, feedback || null, id]
    );
    return res.rows[0];
  }
}

export class AssetRepository {
  async getAllAssets() {
    const sql = `
      SELECT a.*, e.first_name as assignee_first_name, e.last_name as assignee_last_name, e.employee_code
      FROM assets a
      LEFT JOIN employees e ON a.assigned_to_employee_id = e.id
      ORDER BY a.id DESC
    `;
    const res = await dbService.query(sql);
    return res.rows;
  }

  async createAsset(data: any) {
    const res = await dbService.query(
      `INSERT INTO assets (asset_name, asset_code, category, serial_number, assigned_to_employee_id, purchase_date, value, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.asset_name,
        data.asset_code,
        data.category,
        data.serial_number,
        data.assigned_to_employee_id || null,
        data.purchase_date || new Date().toISOString().split('T')[0],
        data.value,
        data.status || 'ALLOCATED',
      ]
    );
    return res.rows[0];
  }
}

export const recruitmentRepository = new RecruitmentRepository();
export const assetRepository = new AssetRepository();
