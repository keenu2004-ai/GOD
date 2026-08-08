import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderGit2, CheckCircle2, Clock, Plus, RefreshCw, X,
  FileText, Users, ArrowRight, Layers, Award, AlertCircle
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

interface Project {
  id: number;
  name: string;
  code: string;
  client_name: string;
  start_date: string;
  end_date: string;
  budget: number;
  status: string;
  progress: number;
}

interface Task {
  id: number;
  project_id: number;
  project_name: string;
  project_code: string;
  title: string;
  description: string;
  first_name?: string;
  last_name?: string;
  due_date: string;
  priority: string;
  status: string;
  progress_pct: number;
}

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
}

interface WorkUpdate {
  id: number;
  first_name: string;
  last_name: string;
  work_completed: string;
  hours_worked: number;
  progress_pct: number;
  blockers?: string;
  created_at: string;
}

const fmtCurr = (n?: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

export const EnterpriseProjectTaskPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const isPM = ['ADMIN', 'PROJECT_MANAGER', 'DEPT_HEAD', 'SUPER_ADMIN'].includes(userRole);

  const [tab, setTab] = useState<'portfolio' | 'kanban'>('portfolio');

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [workUpdates, setWorkUpdates] = useState<WorkUpdate[]>([]);

  // Forms
  const [projForm, setProjForm] = useState({
    name: 'Enterprise Cloud Migration & AI HRMS',
    client_name: 'Apex Global Enterprises',
    start_date: '2026-08-01',
    end_date: '2026-12-31',
    budget: 4500000,
    description: 'Multi-tenant cloud architecture deployment with AI Analytics engine',
  });

  const [taskForm, setTaskForm] = useState({
    project_id: '',
    title: 'Implement OAuth2 & RBAC Scope Validation',
    description: 'Build backend middleware for token scope verification and permission matrix',
    assigned_to: '',
    due_date: '2026-08-30',
    priority: 'HIGH',
  });

  const [updateForm, setUpdateForm] = useState({
    work_completed: 'Completed OAuth2 middleware integration and permission check unit tests',
    hours_worked: 4.5,
    progress_pct: 75,
    blockers: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, tRes, eRes] = await Promise.all([
        apiClient.get('/projects/all').catch(() => ({ data: { data: [] } })),
        apiClient.get('/projects/tasks/all').catch(() => ({ data: { data: [] } })),
        apiClient.get('/employees').catch(() => ({ data: { data: [] } })),
      ]);
      setProjects(pRes.data?.data || []);
      setTasks(tRes.data?.data || []);
      setEmployees(eRes.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/projects/create', projForm);
      setShowProjectModal(false);
      await fetchData();
      alert('✅ Project created in portfolio!');
    } catch (e: any) { alert(e.response?.data?.message || 'Project creation failed'); }
    finally { setSubmitting(false); }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/projects/tasks/create', taskForm);
      setShowTaskModal(false);
      await fetchData();
      alert('✅ Task assigned and created!');
    } catch (e: any) { alert('Task creation failed'); }
    finally { setSubmitting(false); }
  };

  const loadTaskUpdates = async (t: Task) => {
    setSelectedTask(t);
    setUpdateForm({ ...updateForm, progress_pct: t.progress_pct });
    try {
      const res = await apiClient.get(`/projects/tasks/${t.id}/work-updates`);
      setWorkUpdates(res.data?.data || []);
    } catch (e) { console.error(e); }
  };

  const handleSubmitWorkUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    setSubmitting(true);
    try {
      await apiClient.post(`/projects/tasks/${selectedTask.id}/work-update`, updateForm);
      await fetchData();
      await loadTaskUpdates(selectedTask);
      alert('✅ Work update submitted & project progress updated!');
    } catch (e: any) { alert('Work update failed'); }
    finally { setSubmitting(false); }
  };

  const avgProgress = projects.length > 0 ? Math.round(projects.reduce((a, b) => a + Number(b.progress || 0), 0) / projects.length) : 0;

  return (
    <div className="space-y-5 min-h-screen pb-10">
      {/* ─── Header Workspace ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-blue-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 rounded-xl">
              <FolderGit2 className="w-7 h-7 text-blue-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Enterprise Project & Task Management Architecture</h2>
              <p className="text-xs text-blue-300/70 font-mono mt-0.5">Kanban Task Board • Real Work Updates • Weekly Planner • Progress Tracking</p>
            </div>
          </div>
          {isPM && (
            <div className="flex items-center gap-2">
              <button onClick={() => setShowTaskModal(true)} className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl border border-white/20">
                <Plus className="w-3.5 h-3.5 inline mr-1" /> Create Task
              </button>
              <button onClick={() => setShowProjectModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg">
                <Plus className="w-4 h-4 inline mr-1" /> Create Project
              </button>
            </div>
          )}
        </div>

        {/* Real-time Project KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-blue-200 font-mono uppercase">Total Projects Portfolio</p>
            <p className="text-xl font-black text-white mt-0.5 font-mono">{projects.length} Projects</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-emerald-300 font-mono uppercase">Total Project Tasks</p>
            <p className="text-xl font-black text-emerald-400 mt-0.5 font-mono">{tasks.length} Tasks</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-blue-200 font-mono uppercase">Portfolio Completion</p>
            <p className="text-xl font-black text-blue-300 mt-0.5 font-mono">{avgProgress}%</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-blue-200 font-mono uppercase">Completed Tasks</p>
            <p className="text-xl font-black text-white mt-0.5 font-mono">{tasks.filter(t => t.status === 'COMPLETED' || t.progress_pct >= 100).length}</p>
          </div>
        </div>
      </div>

      {/* ─── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200 overflow-x-auto">
        <button onClick={() => setTab('portfolio')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'portfolio' ? 'bg-white text-blue-700 shadow-sm border border-blue-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <FolderGit2 className="w-4 h-4" /> Projects Portfolio ({projects.length})
        </button>
        <button onClick={() => setTab('kanban')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'kanban' ? 'bg-white text-blue-700 shadow-sm border border-blue-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Layers className="w-4 h-4" /> Interactive Task Kanban ({tasks.length})
        </button>
      </div>

      {/* ─── PROJECTS PORTFOLIO TAB ───────────────────────────────────────── */}
      {tab === 'portfolio' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
              <tr>
                <th className="p-3">Project Code</th>
                <th className="p-3">Project Name</th>
                <th className="p-3">Client</th>
                <th className="p-3">Timeline</th>
                <th className="p-3">Budget</th>
                <th className="p-3">Progress</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {projects.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-blue-700">{p.code}</td>
                  <td className="p-3 font-sans font-bold text-slate-900">{p.name}</td>
                  <td className="p-3 font-sans text-slate-600">{p.client_name}</td>
                  <td className="p-3 text-slate-500">{p.start_date} → {p.end_date}</td>
                  <td className="p-3 font-bold text-slate-900">{fmtCurr(p.budget)}</td>
                  <td className="p-3 font-sans">
                    <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden inline-block mr-2">
                      <div className="bg-blue-600 h-full" style={{ width: `${p.progress}%` }}></div>
                    </div>
                    <span className="font-bold font-mono">{p.progress}%</span>
                  </td>
                  <td className="p-3 font-sans">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── KANBAN TASK BOARD TAB ────────────────────────────────────────── */}
      {tab === 'kanban' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {['TODO', 'IN_PROGRESS', 'COMPLETED'].map(colStatus => (
            <div key={colStatus} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-bold text-slate-900 text-xs uppercase">{colStatus.replace('_', ' ')}</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-white text-slate-700 rounded border">{tasks.filter(t => t.status === colStatus).length}</span>
              </div>
              <div className="space-y-3">
                {tasks.filter(t => t.status === colStatus).map(t => (
                  <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-blue-700 font-mono">{t.project_code}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded">{t.priority}</span>
                    </div>
                    <h5 className="font-bold text-slate-900 text-xs">{t.title}</h5>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{t.description}</p>
                    <div className="flex items-center justify-between pt-2 border-t text-[11px]">
                      <span className="text-slate-600 font-bold">{t.first_name ? `${t.first_name} ${t.last_name}` : 'Unassigned'}</span>
                      <button onClick={() => loadTaskUpdates(t)} className="text-blue-600 font-bold hover:underline">Work Updates ({t.progress_pct}%)</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── CREATE PROJECT MODAL ─────────────────────────────────────────── */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Create New Project</h3>
              <button onClick={() => setShowProjectModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Project Name *</label>
                <input required value={projForm.name} onChange={e => setProjForm({...projForm, name: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Client Name *</label>
                  <input required value={projForm.client_name} onChange={e => setProjForm({...projForm, client_name: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Budget (₹) *</label>
                  <input required type="number" value={projForm.budget} onChange={e => setProjForm({...projForm, budget: Number(e.target.value)})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Start Date *</label>
                  <input required type="date" value={projForm.start_date} onChange={e => setProjForm({...projForm, start_date: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">End Date *</label>
                  <input required type="date" value={projForm.end_date} onChange={e => setProjForm({...projForm, end_date: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowProjectModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold shadow">{submitting ? 'Creating...' : 'Create Project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── CREATE TASK MODAL ────────────────────────────────────────────── */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Create Project Task</h3>
              <button onClick={() => setShowTaskModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Select Project *</label>
                <select required value={taskForm.project_id} onChange={e => setTaskForm({...taskForm, project_id: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                  <option value="">-- Choose Project --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Task Title *</label>
                <input required value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold" />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Assign To *</label>
                <select required value={taskForm.assigned_to} onChange={e => setTaskForm({...taskForm, assigned_to: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                  <option value="">-- Choose Assignee --</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Priority *</label>
                  <select required value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Due Date *</label>
                  <input required type="date" value={taskForm.due_date} onChange={e => setTaskForm({...taskForm, due_date: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowTaskModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold shadow">{submitting ? 'Creating...' : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── WORK UPDATES MODAL ───────────────────────────────────────────── */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">{selectedTask.project_code}</span>
                <h3 className="font-bold text-slate-900 text-sm mt-1">{selectedTask.title}</h3>
              </div>
              <button onClick={() => setSelectedTask(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmitWorkUpdate} className="space-y-3 text-xs border-b pb-4">
              <div>
                <label className="font-semibold text-slate-700">Work Completed Summary *</label>
                <textarea required value={updateForm.work_completed} onChange={e => setUpdateForm({...updateForm, work_completed: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Hours Logged *</label>
                  <input required type="number" step="0.5" value={updateForm.hours_worked} onChange={e => setUpdateForm({...updateForm, hours_worked: Number(e.target.value)})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Progress (%): {updateForm.progress_pct}% *</label>
                  <input type="range" min="0" max="100" value={updateForm.progress_pct} onChange={e => setUpdateForm({...updateForm, progress_pct: Number(e.target.value)})}
                    className="mt-2 w-full accent-blue-600" />
                </div>
              </div>
              <button type="submit" disabled={submitting} className="w-full py-2 bg-blue-600 text-white rounded-xl font-bold shadow">{submitting ? 'Submitting...' : 'Submit Work Update'}</button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2 p-1 font-sans text-xs">
              <h4 className="font-bold text-slate-900 uppercase text-[10px]">Work Update Activity Timeline</h4>
              {workUpdates.map(w => (
                <div key={w.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex justify-between items-center font-bold text-slate-900">
                    <span>{w.first_name} {w.last_name}</span>
                    <span className="text-blue-700 font-mono">{w.progress_pct}% Completed ({w.hours_worked} hrs)</span>
                  </div>
                  <p className="text-slate-700">{w.work_completed}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
