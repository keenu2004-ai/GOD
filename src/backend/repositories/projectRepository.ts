import dbService from '../database/db.js';
import { Project, ProjectTask } from '../types/index.js';

export class ProjectRepository {
  async getAllProjects() {
    const sql = `
      SELECT p.*,
             (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as total_members,
             (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as total_tasks,
             (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'DONE') as completed_tasks
      FROM projects p
      ORDER BY p.id DESC
    `;
    const res = await dbService.query(sql);
    return res.rows;
  }

  async getProjectDetails(id: number) {
    const projRes = await dbService.query('SELECT * FROM projects WHERE id = $1', [id]);
    const project = projRes.rows[0];
    if (!project) return null;

    const membersRes = await dbService.query(
      `SELECT pm.*, e.first_name, e.last_name, e.email, e.avatar_url, e.designation
       FROM project_members pm
       JOIN employees e ON pm.employee_id = e.id
       WHERE pm.project_id = $1`,
      [id]
    );

    const tasksRes = await dbService.query(
      `SELECT t.*, e.first_name as assignee_first_name, e.last_name as assignee_last_name, e.avatar_url as assignee_avatar
       FROM tasks t
       LEFT JOIN employees e ON t.assigned_to = e.id
       WHERE t.project_id = $1
       ORDER BY t.id DESC`,
      [id]
    );

    return {
      ...project,
      members: membersRes.rows,
      tasks: tasksRes.rows,
    };
  }

  async createProject(data: Partial<Project>): Promise<Project> {
    const res = await dbService.query<Project>(
      `INSERT INTO projects (name, code, description, client_name, start_date, end_date, budget, status, progress)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        data.name,
        data.code,
        data.description || '',
        data.client_name,
        data.start_date,
        data.end_date,
        data.budget,
        data.status || 'IN_PROGRESS',
        data.progress || 0,
      ]
    );
    return res.rows[0];
  }

  async createTask(data: Partial<ProjectTask>): Promise<ProjectTask> {
    const res = await dbService.query<ProjectTask>(
      `INSERT INTO tasks (project_id, title, description, assigned_to, due_date, priority, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.project_id,
        data.title,
        data.description || '',
        data.assigned_to || null,
        data.due_date,
        data.priority || 'MEDIUM',
        data.status || 'TODO',
      ]
    );
    return res.rows[0];
  }

  async updateTaskStatus(taskId: number, status: string): Promise<ProjectTask | null> {
    const res = await dbService.query<ProjectTask>(
      'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
      [status, taskId]
    );
    return res.rows[0] || null;
  }
}

export const projectRepository = new ProjectRepository();
