import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, CheckCircle2, AlertTriangle, Plus, Download, Filter,
  Users, RefreshCw, X, Play, Shield, BarChart2, Briefcase, FileSpreadsheet,
  Trash2, Edit3, ChevronRight
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

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export const WeeklyPlannerPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';

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
    task_name: '',
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
    } catch (e) {
      console.error('Error fetching weekly planner data:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedWeek, selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ESC Key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showTaskModal) {
        setShowTaskModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTaskModal]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.task_name.trim()) {
      alert('Please enter a valid task description.');
      return;
    }
    const hours = parseFloat(taskForm.planned_hours);
    if (isNaN(hours) || hours <= 0) {
      alert('Please enter a positive number for planned hours.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('/planner/items', {
        day_of_week: taskForm.day_of_week,
        task_name: taskForm.task_name.trim(),
        week_number: selectedWeek,
        year: selectedYear,
        planned_hours: hours,
        project_id: taskForm.project_id ? parseInt(taskForm.project_id) : undefined,
      });
      setShowTaskModal(false);
      setTaskForm({
        day_of_week: 'MONDAY',
        task_name: '',
        planned_hours: '8.0',
        project_id: '',
      });
      await fetchData();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to add weekly task item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (itemId: number, newStatus: string) => {
    try {
      await apiClient.patch(`/planner/items/${itemId}/status`, { status: newStatus });
      await fetchData();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to update status');
    }
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
    } catch (e: any) {
      alert('Failed to export schedule CSV');
    }
  };

  const totalPlannedHours = planItems.reduce((sum, i) => sum + parseFloat(String(i.planned_hours || 0)), 0);
  const overloadedCount = capacity.filter(c => c.workload_status === 'OVERLOADED').length;
  const capacityPct = Math.min(100, Math.round((totalPlannedHours / 40) * 100));

  // Compute dates for Monday-Saturday based on week number 32, 2026 (Aug 10 - Aug 15)
  const getDayDateLabel = (dayIndex: number) => {
    const dates = ['Aug 10', 'Aug 11', 'Aug 12', 'Aug 13', 'Aug 14', 'Aug 15'];
    return dates[dayIndex] || '';
  };

  return (
    <div className="space-y-6 min-h-screen pb-12 text-slate-900 font-sans">
      {/* ─── Top Header & Hero Command Banner ────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 rounded-2xl p-6 shadow-xl border border-slate-800 text-white flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-500/20 text-blue-300 font-mono text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full border border-blue-400/30">
              WORKLOAD & RESOURCE PLANNING
            </span>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              6-DAY SCHEDULE ACTIVE
            </span>
          </div>
          <h1 className="text-2xl font-black mt-2 text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-400 shrink-0" />
            <span>Enterprise Weekly Planner & Workload Workspace</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            Monday-to-Saturday Work Grid • Resource Capacity Allocation • Team Deliverables
          </p>

          {/* 4 Statistics KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-5">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3.5 shadow-inner">
              <p className="text-xl sm:text-2xl font-black text-white tracking-tight">{selectedWeek}, {selectedYear}</p>
              <p className="text-[10px] text-slate-300 uppercase tracking-widest font-mono font-bold mt-1">
                Active Calendar Week (Mon-Sat)
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3.5 shadow-inner">
              <p className="text-xl sm:text-2xl font-black text-blue-300 tracking-tight">{totalPlannedHours.toFixed(1)} hrs</p>
              <p className="text-[10px] text-blue-200 uppercase tracking-widest font-mono font-bold mt-1">
                My Total Planned Hours
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3.5 shadow-inner">
              <p className="text-xl sm:text-2xl font-black text-emerald-300 tracking-tight">{capacityPct}%</p>
              <p className="text-[10px] text-emerald-200 uppercase tracking-widest font-mono font-bold mt-1">
                Capacity Utilization
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3.5 shadow-inner">
              <p className={`text-xl sm:text-2xl font-black ${overloadedCount > 0 ? 'text-rose-400' : 'text-emerald-400'} tracking-tight`}>
                {overloadedCount}
              </p>
              <p className="text-[10px] text-slate-300 uppercase tracking-widest font-mono font-bold mt-1">
                Overloaded Staff (&gt;40h)
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end shrink-0 pt-2 lg:pt-0">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-bold text-xs rounded-xl border border-white/20 shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-blue-300" />
            <span>Export Schedule CSV</span>
          </button>
          <button
            onClick={() => setShowTaskModal(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Weekly Task</span>
          </button>
        </div>
      </div>

      {/* ─── Navigation Tabs ────────────────────────────────────────────────── */}
      <div className="flex gap-2 bg-white rounded-xl p-1.5 border border-slate-200 shadow-sm">
        <button
          onClick={() => setTab('my-plan')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
            tab === 'my-plan'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>My Weekly Work Schedule Grid (6-Day)</span>
        </button>
        <button
          onClick={() => setTab('team-capacity')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
            tab === 'team-capacity'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team Capacity & Workload Balancer</span>
        </button>
      </div>

      {/* ─── MONDAY-TO-SATURDAY 6-DAY WORK GRID TAB ───────────────────────────── */}
      {tab === 'my-plan' && (
        <div className="overflow-x-auto pb-2 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 min-w-[900px] lg:min-w-0">
            {DAYS.map((day, idx) => {
              const dayItems = planItems.filter((i) => i.day_of_week === day);
              const dayHours = dayItems.reduce((sum, i) => sum + parseFloat(String(i.planned_hours || 0)), 0);
              const isSaturday = day === 'SATURDAY';

              return (
                <div
                  key={day}
                  className={`border rounded-2xl p-4 space-y-3.5 transition-all flex flex-col justify-between min-h-[360px] ${
                    isSaturday
                      ? 'bg-blue-50/50 border-blue-200'
                      : 'bg-white border-slate-200'
                  } shadow-sm hover:shadow-md`}
                >
                  <div>
                    {/* Day Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div>
                        <h3 className={`font-black text-xs uppercase tracking-tight ${isSaturday ? 'text-blue-900' : 'text-slate-900'}`}>
                          {day}
                        </h3>
                        <p className="text-[10px] text-slate-500 font-mono font-medium">{getDayDateLabel(idx)}</p>
                      </div>
                      <span className={`text-[11px] font-mono font-extrabold px-2 py-0.5 rounded-md border ${
                        dayHours > 0
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {dayHours.toFixed(1)}h
                      </span>
                    </div>

                    {/* Task List */}
                    <div className="space-y-2.5 mt-3">
                      {dayItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-2 text-xs hover:border-blue-400 transition-colors"
                        >
                          <p className="font-bold text-slate-900 leading-snug">{item.task_name}</p>
                          {item.project_name && (
                            <div className="flex items-center gap-1 text-[10px] text-blue-600 font-semibold">
                              <Briefcase className="w-3 h-3 shrink-0" />
                              <span className="truncate">{item.project_name}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1.5 border-t border-slate-100">
                            <span className="font-bold text-slate-700">{item.planned_hours} hrs</span>
                            <span
                              className={`font-extrabold px-1.5 py-0.5 rounded border uppercase text-[9px] ${
                                item.status === 'COMPLETED'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                          {item.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleUpdateStatus(item.id, 'COMPLETED')}
                              className="w-full mt-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-[10px] rounded-lg border border-emerald-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Mark Done</span>
                            </button>
                          )}
                        </div>
                      ))}

                      {dayItems.length === 0 && (
                        <div className="text-center py-10 px-2">
                          <p className="text-[11px] text-slate-400 font-medium font-sans">No tasks planned</p>
                          <button
                            onClick={() => {
                              setTaskForm((prev) => ({ ...prev, day_of_week: day }));
                              setShowTaskModal(true);
                            }}
                            className="mt-2 text-[10px] text-blue-600 hover:text-blue-800 font-bold uppercase tracking-tight inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Add Task
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Day Footer Summary */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>{dayItems.length} Task{dayItems.length !== 1 ? 's' : ''}</span>
                    <span className="font-bold text-slate-700">{dayHours.toFixed(1)} Planned Hrs</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TEAM CAPACITY BALANCER TAB ──────────────────────────────────────── */}
      {tab === 'team-capacity' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>Team Workload Capacity & Resource Balancer (Mon-Sat)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Aggregated workload hours calculated across all 6 days of Week {selectedWeek}, {selectedYear}
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200">
              40h Capacity Standard
            </span>
          </div>

          <div className="space-y-3.5">
            {capacity.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8 font-medium">No team workload items registered for this week.</p>
            ) : (
              capacity.map((c) => (
                <div key={c.employee_id} className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-2.5 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-black text-slate-900 text-sm">
                        {c.first_name} {c.last_name}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono ml-2">({c.employee_code})</span>
                      <span className="text-[11px] text-slate-600 font-semibold ml-2">• {c.department_name || 'Engineering'}</span>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider self-start sm:self-auto ${
                        c.workload_status === 'OVERLOADED'
                          ? 'bg-red-100 text-red-800 border-red-200'
                          : c.workload_status === 'UNDERUTILIZED'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {c.workload_status} ({c.total_planned_hours}h / 40h)
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>Workload Utilization</span>
                      <span className="font-bold text-slate-900">{c.capacity_utilization_pct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden shadow-inner">
                      <div
                        style={{ width: `${Math.min(100, c.capacity_utilization_pct)}%` }}
                        className={`h-full transition-all duration-500 ${
                          c.total_planned_hours > 40 ? 'bg-rose-500' : 'bg-blue-600'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── ADD WEEKLY TASK MODAL ────────────────────────────────────────────── */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Add Weekly Work Plan Task</h3>
                  <p className="text-[11px] text-slate-500">Schedule task items for Week {selectedWeek}, {selectedYear}</p>
                </div>
              </div>
              <button
                onClick={() => setShowTaskModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Day of Week <span className="text-rose-500">*</span>
                </label>
                <select
                  value={taskForm.day_of_week}
                  onChange={(e) => setTaskForm({ ...taskForm, day_of_week: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-extrabold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer"
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d} {d === 'SATURDAY' ? '(Weekend Schedule)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Task / Work Description <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={taskForm.task_name}
                  onChange={(e) => setTaskForm({ ...taskForm, task_name: e.target.value })}
                  placeholder="e.g. Database Migration & Schema Audit"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Planned Hours <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    required
                    value={taskForm.planned_hours}
                    onChange={(e) => setTaskForm({ ...taskForm, planned_hours: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Project</label>
                  <select
                    value={taskForm.project_id}
                    onChange={(e) => setTaskForm({ ...taskForm, project_id: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer"
                  >
                    <option value="">-- Choose Project --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code || 'PRJ'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-black rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  {submitting ? 'Adding...' : 'Add Task Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
