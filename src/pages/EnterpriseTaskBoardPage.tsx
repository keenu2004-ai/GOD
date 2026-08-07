import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckSquare, Plus, Search, Filter, Clock, AlertCircle, ArrowRight,
  CheckCircle2, Play, AlertTriangle, Layers, Users, X, RefreshCw, ChevronRight, Tag
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

interface Task {
  id: number;
  task_number: string;
  title: string;
  description?: string;
  project_id: number;
  project_name: string;
  project_code: string;
  sprint_id?: number;
  sprint_name?: string;
  task_type: string;
  priority: string;
  status: string;
  assignee_first?: string;
  assignee_last?: string;
  assignee_code?: string;
  story_points: number;
  progress_percentage: number;
  due_date?: string;
}

interface Sprint {
  id: number;
  project_id: number;
  project_name: string;
  sprint_name: string;
  sprint_goal?: string;
  status: string;
}

const fmtDate = (s?: string) => s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';

export const EnterpriseTaskBoardPage: React.FC = () => {
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  const [selectedSprintId, setSelectedSprintId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showSprintModal, setShowSprintModal] = useState(false);

  // Forms
  const [taskForm, setTaskForm] = useState({
    title: 'Implement Dark Mode Toggle & UI Theme Provider',
    description: 'Add Tailwind dark mode support across layout and components',
    project_id: '', sprint_id: '', task_type: 'FEATURE', priority: 'HIGH',
    assignee_id: '', story_points: '3', due_date: '2026-08-31',
  });

  const [sprintForm, setSprintForm] = useState({
    project_id: '', sprint_name: 'Sprint 24 - UI/UX Refactor & Performance',
    sprint_goal: 'Complete dark mode and reduce bundle load times by 20%',
    start_date: '2026-08-01', end_date: '2026-08-15',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tskRes, sprRes, prjRes, empRes] = await Promise.all([
        apiClient.get(`/tasks${selectedSprintId ? `?sprintId=${selectedSprintId}` : ''}`),
        apiClient.get('/tasks/sprints').catch(() => ({ data: { data: [] } })),
        apiClient.get('/projects').catch(() => ({ data: { data: [] } })),
        apiClient.get('/employees').catch(() => ({ data: { data: [] } })),
      ]);
      setTasks(tskRes.data?.data || []);
      setSprints(sprRes.data?.data || []);
      setProjects(prjRes.data?.data || []);
      setEmployees(empRes.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [selectedSprintId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpdateStatus = async (taskId: number, newStatus: string) => {
    try {
      await apiClient.patch(`/tasks/${taskId}/status`, { status: newStatus });
      await fetchData();
    } catch (e: any) { alert(e.response?.data?.message || 'Status update failed'); }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/tasks', {
        ...taskForm,
        project_id: parseInt(taskForm.project_id),
        sprint_id: taskForm.sprint_id ? parseInt(taskForm.sprint_id) : undefined,
        assignee_id: taskForm.assignee_id ? parseInt(taskForm.assignee_id) : undefined,
        story_points: parseInt(taskForm.story_points),
      });
      setShowTaskModal(false);
      await fetchData();
      alert('✅ Task created successfully!');
    } catch (e: any) { alert(e.response?.data?.message || 'Task creation failed'); }
    finally { setSubmitting(false); }
  };

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/tasks/sprints', {
        ...sprintForm,
        project_id: parseInt(sprintForm.project_id),
      });
      setShowSprintModal(false);
      await fetchData();
      alert('✅ Sprint created successfully!');
    } catch (e: any) { alert(e.response?.data?.message || 'Sprint creation failed'); }
  };

  const todoTasks = tasks.filter(t => t.status === 'TO_DO');
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
  const reviewTasks = tasks.filter(t => t.status === 'IN_REVIEW');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');

  const totalPoints = tasks.reduce((sum, t) => sum + (t.story_points || 0), 0);

  return (
    <div className="space-y-5 min-h-screen pb-10">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-indigo-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/30 rounded-xl">
              <CheckSquare className="w-7 h-7 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Enterprise Sprint Board & Task Management</h2>
              <p className="text-xs text-indigo-300/70 font-mono mt-0.5">Jira / ClickUp Kanban • Sprint Velocity • Subtasks • Work Allocation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSprintModal(true)} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-xl border border-white/20">
              <Layers className="w-3.5 h-3.5 text-indigo-300" /> New Sprint
            </button>
            <button onClick={() => setShowTaskModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg">
              <Plus className="w-4 h-4" /> Create Task
            </button>
          </div>
        </div>

        {/* Sprint & Velocity Metrics Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-2xl font-black text-white">{tasks.length}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Total Backlog & Sprint Tasks</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-2xl font-black text-indigo-300">{inProgressTasks.length}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">In Progress Tasks</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-2xl font-black text-emerald-300">{completedTasks.length}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Completed Tasks</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-2xl font-black text-amber-300">{totalPoints} pts</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Total Velocity Story Points</p>
          </div>
        </div>
      </div>

      {/* ─── Sprint Selector Filter ───────────────────────────────────────── */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <Layers className="w-4 h-4 text-indigo-600" />
        <span className="text-xs font-bold text-slate-700">Sprint Filter:</span>
        <select value={selectedSprintId} onChange={e => setSelectedSprintId(e.target.value)}
          className="text-xs border border-slate-300 rounded-xl px-3 py-1.5 font-semibold text-slate-900">
          <option value="">All Active Sprints</option>
          {sprints.map(s => <option key={s.id} value={s.id}>{s.sprint_name} ({s.project_name})</option>)}
        </select>
      </div>

      {/* ─── 4-COLUMN KANBAN BOARD ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
        {/* Column 1: To Do */}
        <div className="bg-slate-100/70 border border-slate-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between font-black text-xs text-slate-700 border-b border-slate-200 pb-2">
            <span>TO DO ({todoTasks.length})</span>
            <span className="w-2.5 h-2.5 bg-slate-400 rounded-full" />
          </div>
          <div className="space-y-3">
            {todoTasks.map(t => (
              <TaskCard key={t.id} task={t} onMove={(st) => handleUpdateStatus(t.id, st)} />
            ))}
          </div>
        </div>

        {/* Column 2: In Progress */}
        <div className="bg-indigo-50/50 border border-indigo-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between font-black text-xs text-indigo-900 border-b border-indigo-200 pb-2">
            <span>IN PROGRESS ({inProgressTasks.length})</span>
            <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse" />
          </div>
          <div className="space-y-3">
            {inProgressTasks.map(t => (
              <TaskCard key={t.id} task={t} onMove={(st) => handleUpdateStatus(t.id, st)} />
            ))}
          </div>
        </div>

        {/* Column 3: In Review */}
        <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between font-black text-xs text-amber-900 border-b border-amber-200 pb-2">
            <span>IN REVIEW / QA ({reviewTasks.length})</span>
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
          </div>
          <div className="space-y-3">
            {reviewTasks.map(t => (
              <TaskCard key={t.id} task={t} onMove={(st) => handleUpdateStatus(t.id, st)} />
            ))}
          </div>
        </div>

        {/* Column 4: Completed */}
        <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between font-black text-xs text-emerald-900 border-b border-emerald-200 pb-2">
            <span>COMPLETED ({completedTasks.length})</span>
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
          </div>
          <div className="space-y-3">
            {completedTasks.map(t => (
              <TaskCard key={t.id} task={t} onMove={(st) => handleUpdateStatus(t.id, st)} />
            ))}
          </div>
        </div>
      </div>

      {/* ─── CREATE TASK MODAL ──────────────────────────────────────────── */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Create Work Task</h3>
              <button onClick={() => setShowTaskModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Project *</label>
                <select required value={taskForm.project_id} onChange={e => setTaskForm({...taskForm, project_id: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                  <option value="">-- Choose Project --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Task Title *</label>
                <input required value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Priority *</label>
                  <select value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Story Points *</label>
                  <input required type="number" value={taskForm.story_points} onChange={e => setTaskForm({...taskForm, story_points: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Assignee *</label>
                <select value={taskForm.assignee_id} onChange={e => setTaskForm({...taskForm, assignee_id: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                  <option value="">-- Choose Assignee --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowTaskModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow">{submitting ? 'Creating...' : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── CREATE SPRINT MODAL ────────────────────────────────────────── */}
      {showSprintModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Create New Sprint</h3>
              <button onClick={() => setShowSprintModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateSprint} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Project *</label>
                <select required value={sprintForm.project_id} onChange={e => setSprintForm({...sprintForm, project_id: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                  <option value="">-- Choose Project --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Sprint Name *</label>
                <input required value={sprintForm.sprint_name} onChange={e => setSprintForm({...sprintForm, sprint_name: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Start Date *</label>
                  <input required type="date" value={sprintForm.start_date} onChange={e => setSprintForm({...sprintForm, start_date: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">End Date *</label>
                  <input required type="date" value={sprintForm.end_date} onChange={e => setSprintForm({...sprintForm, end_date: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowSprintModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow">Save Sprint</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Individual Task Card Component ───────────────────────────────────────
const TaskCard: React.FC<{ task: Task; onMove: (status: string) => void }> = ({ task, onMove }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm space-y-2.5 hover:shadow transition-all">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-mono font-bold text-slate-400">{task.task_number}</span>
      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
        task.priority === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' :
        task.priority === 'HIGH' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200'
      }`}>
        {task.priority}
      </span>
    </div>
    <p className="font-bold text-slate-900 text-xs leading-snug">{task.title}</p>

    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
      <span>{task.assignee_first ? `${task.assignee_first}` : 'Unassigned'}</span>
      <span className="bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded border border-indigo-100">{task.story_points} pts</span>
    </div>

    {/* Quick Transition Actions */}
    <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1">
      {task.status !== 'IN_PROGRESS' && task.status !== 'COMPLETED' && (
        <button onClick={() => onMove('IN_PROGRESS')} className="text-[9px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100">
          → Progress
        </button>
      )}
      {task.status === 'IN_PROGRESS' && (
        <button onClick={() => onMove('IN_REVIEW')} className="text-[9px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 rounded hover:bg-amber-100">
          → Review
        </button>
      )}
      {task.status !== 'COMPLETED' && (
        <button onClick={() => onMove('COMPLETED')} className="text-[9px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100">
          ✔ Complete
        </button>
      )}
    </div>
  </div>
);
