import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, CheckCircle2, AlertTriangle, Plus, Download, Filter,
  Users, RefreshCw, X, Play, Shield, BarChart2, Briefcase
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

interface PlanItem {
  id: number;
  day_of_week: string;
  task_name: string;
  planned_hours: number;
  actual_hours: number;
  status: string;
  project_name?: string;
  project_code?: string;
}

interface CapacityItem {
  employee_id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
  department_name?: string;
  total_planned_hours: number;
  total_actual_hours: number;
  task_count: number;
  workload_status: string;
  capacity_utilization_pct: number;
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

export const WeeklyPlannerPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const isManager = ['ADMIN', 'HR_MANAGER', 'DEPT_HEAD', 'SUPER_ADMIN'].includes(userRole);

  const [tab, setTab] = useState<'my-plan' | 'team-capacity'>('my-plan');
  const [selectedWeek, setSelectedWeek] = useState(32);
  const [selectedYear, setSelectedYear] = useState(2026);

  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [capacity, setCapacity] = useState<CapacityItem[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const [taskForm, setTaskForm] = useState({
    day_of_week: 'MONDAY',
    task_name: 'Database Migration & Schema Audit',
    planned_hours: '8.0',
    project_id: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [planRes, capRes, prjRes] = await Promise.all([
        apiClient.get(`/planner/details?week=${selectedWeek}&year=${selectedYear}`),
        apiClient.get(`/planner/capacity?week=${selectedWeek}&year=${selectedYear}`).catch(() => ({ data: { data: [] } })),
        apiClient.get('/projects').catch(() => ({ data: { data: [] } })),
      ]);
      setPlanItems(planRes.data?.data?.items || []);
      setCapacity(capRes.data?.data || []);
      setProjects(prjRes.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [selectedWeek, selectedYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/planner/items', {
        ...taskForm,
        week_number: selectedWeek,
        year: selectedYear,
        planned_hours: parseFloat(taskForm.planned_hours),
        project_id: taskForm.project_id ? parseInt(taskForm.project_id) : undefined,
      });
      setShowTaskModal(false);
      await fetchData();
      alert('✅ Weekly plan task added!');
    } catch (e: any) { alert(e.response?.data?.message || 'Addition failed'); }
    finally { setSubmitting(false); }
  };

  const handleUpdateStatus = async (itemId: number, newStatus: string) => {
    try {
      await apiClient.patch(`/planner/items/${itemId}/status`, { status: newStatus });
      await fetchData();
    } catch (e: any) { alert(e.response?.data?.message || 'Update failed'); }
  };

  const handleExportCSV = async () => {
    try {
      const response = await apiClient.get(`/planner/export/csv?week=${selectedWeek}&year=${selectedYear}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `WEEKLY_SCHEDULE_WEEK_${selectedWeek}_${selectedYear}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      alert('✅ Weekly schedule CSV exported!');
    } catch (e: any) { alert('Export failed'); }
  };

  const totalPlannedHours = planItems.reduce((sum, i) => sum + parseFloat(String(i.planned_hours || 0)), 0);
  const overloadedCount = capacity.filter(c => c.workload_status === 'OVERLOADED').length;

  return (
    <div className="space-y-5 min-h-screen pb-10">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-blue-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 rounded-xl">
              <Calendar className="w-7 h-7 text-blue-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Enterprise Weekly Planner & Workload Workspace</h2>
              <p className="text-xs text-blue-300/70 font-mono mt-0.5">TeamNest Workspace • Monday-to-Friday Work Grid • Resource Capacity Planning</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExportCSV} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3 py-2 rounded-xl border border-white/20">
              <Download className="w-3.5 h-3.5 text-blue-300" /> Export Schedule CSV
            </button>
            <button onClick={() => setShowTaskModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg">
              <Plus className="w-4 h-4" /> Add Weekly Task
            </button>
          </div>
        </div>

        {/* Capacity Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-2xl font-black text-white">{selectedWeek}, {selectedYear}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Active Calendar Week</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-2xl font-black text-blue-300">{totalPlannedHours} hrs</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">My Total Planned Hours</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-2xl font-black text-emerald-300">{Math.min(100, Math.round((totalPlannedHours / 40) * 100))}%</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Capacity Utilization</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className={`text-2xl font-black ${overloadedCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{overloadedCount}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Overloaded Staff (&gt;40h)</p>
          </div>
        </div>
      </div>

      {/* ─── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200 overflow-x-auto">
        <button onClick={() => setTab('my-plan')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'my-plan' ? 'bg-white text-blue-700 shadow-sm border border-blue-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Calendar className="w-4 h-4" /> My Weekly Work Schedule Grid
        </button>
        <button onClick={() => setTab('team-capacity')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'team-capacity' ? 'bg-white text-blue-700 shadow-sm border border-blue-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Users className="w-4 h-4" /> Team Capacity & Workload Balancer
        </button>
      </div>

      {/* ─── MONDAY-TO-FRIDAY WEEKLY WORK GRID TAB ────────────────────────── */}
      {tab === 'my-plan' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-start">
          {DAYS.map(day => {
            const dayItems = planItems.filter(i => i.day_of_week === day);
            const dayHours = dayItems.reduce((sum, i) => sum + parseFloat(String(i.planned_hours || 0)), 0);
            return (
              <div key={day} className="bg-slate-100/70 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between font-black text-xs text-slate-800 border-b border-slate-200 pb-2">
                  <span>{day}</span>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">{dayHours}h</span>
                </div>

                <div className="space-y-2.5">
                  {dayItems.map(item => (
                    <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm space-y-2 text-xs">
                      <p className="font-bold text-slate-900 leading-snug">{item.task_name}</p>
                      {item.project_name && <p className="text-[10px] text-blue-600 font-semibold">{item.project_name}</p>}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-100">
                        <span>{item.planned_hours} hrs</span>
                        <span className={`font-bold px-1.5 py-0.5 rounded border ${
                          item.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>{item.status}</span>
                      </div>
                      {item.status !== 'COMPLETED' && (
                        <button onClick={() => handleUpdateStatus(item.id, 'COMPLETED')} className="w-full mt-1 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded">
                          ✔ Mark Done
                        </button>
                      )}
                    </div>
                  ))}
                  {dayItems.length === 0 && (
                    <p className="text-[10px] text-slate-400 text-center py-6 font-mono">No tasks planned</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── TEAM CAPACITY BALANCER TAB ──────────────────────────────────── */}
      {tab === 'team-capacity' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" /> Team Workload Capacity & Resource Balancer
          </h3>

          <div className="space-y-3">
            {capacity.map(c => (
              <div key={c.employee_id} className="p-4 bg-slate-50 border rounded-xl space-y-2 text-xs">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{c.first_name} {c.last_name} ({c.employee_code}) - {c.department_name || 'Engineering'}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    c.workload_status === 'OVERLOADED' ? 'bg-red-50 text-red-700 border-red-200' :
                    c.workload_status === 'UNDERUTILIZED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>{c.workload_status} ({c.total_planned_hours}/40h)</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div style={{ width: `${c.capacity_utilization_pct}%` }} className={`h-full ${c.total_planned_hours > 40 ? 'bg-red-500' : 'bg-blue-600'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── ADD TASK MODAL ─────────────────────────────────────────────── */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Add Weekly Work Plan Task</h3>
              <button onClick={() => setShowTaskModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddTask} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Day of Week *</label>
                <select value={taskForm.day_of_week} onChange={e => setTaskForm({...taskForm, day_of_week: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Task Description *</label>
                <input required value={taskForm.task_name} onChange={e => setTaskForm({...taskForm, task_name: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Planned Hours *</label>
                  <input required type="number" step="0.5" value={taskForm.planned_hours} onChange={e => setTaskForm({...taskForm, planned_hours: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Project</label>
                  <select value={taskForm.project_id} onChange={e => setTaskForm({...taskForm, project_id: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                    <option value="">-- Choose Project --</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowTaskModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold shadow">{submitting ? 'Adding...' : 'Add Task Item'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
