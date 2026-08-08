import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock, Play, Pause, Square, Plus, CheckCircle2, AlertCircle, DollarSign,
  Calendar, Users, UserCheck, Shield, RefreshCw, X, FileText, Zap, BarChart2, ArrowLeft
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

interface ActiveTimer {
  id: number;
  project_id?: number;
  task_id?: number;
  start_time: string;
  is_paused: boolean;
  accum_seconds: number;
}

interface TimeEntry {
  id: number;
  entry_date: string;
  hours_worked: number;
  is_billable: boolean;
  is_overtime: boolean;
  description?: string;
  project_name?: string;
  task_title?: string;
  status: string;
}

interface PendingTimesheet {
  id: number;
  employee_id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
  department_name?: string;
  week_number: number;
  year: number;
  total_hours: number;
  billable_hours: number;
  status: string;
}

interface ProductivityKPIs {
  total_hours_logged: number;
  billable_hours: number;
  overtime_hours: number;
  billability_percentage: number;
}

const fmtDate = (s?: string) => s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const EnterpriseTimeTrackingPage: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const isManager = ['ADMIN', 'PROJECT_MANAGER', 'DEPT_HEAD', 'SUPER_ADMIN'].includes(userRole);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [tab, setTab] = useState<'my-timesheet' | 'approvals' | 'analytics'>('my-timesheet');
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [pendingTimesheets, setPendingTimesheets] = useState<PendingTimesheet[]>([]);
  const [kpis, setKpis] = useState<ProductivityKPIs | null>(null);
  const [projects, setProjects] = useState<any[]>([]);

  const [timerSeconds, setTimerSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modals & Forms
  const [showLogModal, setShowLogModal] = useState(false);
  const [logForm, setLogForm] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    hours_worked: '8.0',
    project_id: '',
    description: 'Sprint development and code review',
    is_billable: true,
    is_overtime: false,
  });

  const [timerProjectId, setTimerProjectId] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tmrRes, entRes, penRes, kpiRes, prjRes] = await Promise.all([
        apiClient.get('/timetracking/timer/active').catch(() => ({ data: { data: null } })),
        apiClient.get('/timetracking/timesheet').catch(() => ({ data: { data: [] } })),
        apiClient.get('/timetracking/timesheets/pending').catch(() => ({ data: { data: [] } })),
        apiClient.get('/timetracking/analytics/kpis').catch(() => ({ data: { data: null } })),
        apiClient.get('/projects').catch(() => ({ data: { data: [] } })),
      ]);
      setActiveTimer(tmrRes.data?.data || null);
      setEntries(entRes.data?.data || []);
      setPendingTimesheets(penRes.data?.data || []);
      setKpis(kpiRes.data?.data || null);
      setProjects(prjRes.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Live Timer Ticking
  useEffect(() => {
    let interval: any = null;
    if (activeTimer && !activeTimer.is_paused) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - new Date(activeTimer.start_time).getTime()) / 1000) + (activeTimer.accum_seconds || 0);
        setTimerSeconds(elapsed);
      }, 1000);
    } else {
      setTimerSeconds(activeTimer?.accum_seconds || 0);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  const handleStartTimer = async () => {
    try {
      const res = await apiClient.post('/timetracking/timer/start', {
        project_id: timerProjectId ? parseInt(timerProjectId) : undefined,
      });
      setActiveTimer(res.data?.data);
      alert('▶ Live work session timer started!');
    } catch (e: any) { alert(e.response?.data?.message || 'Timer start failed'); }
  };

  const handleStopTimer = async () => {
    try {
      await apiClient.post('/timetracking/timer/stop', { description: 'Live session work logged' });
      setActiveTimer(null);
      await fetchData();
      alert('⏹ Work timer stopped and time entry logged!');
    } catch (e: any) { alert(e.response?.data?.message || 'Timer stop failed'); }
  };

  const handleLogManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/timetracking/entry', {
        ...logForm,
        hours_worked: parseFloat(logForm.hours_worked),
        project_id: logForm.project_id ? parseInt(logForm.project_id) : undefined,
      });
      setShowLogModal(false);
      await fetchData();
      alert('✅ Time entry logged successfully!');
    } catch (e: any) { alert(e.response?.data?.message || 'Entry log failed'); }
    finally { setSubmitting(false); }
  };

  const handleSubmitTimesheet = async () => {
    const totalHours = entries.reduce((sum, e) => sum + parseFloat(String(e.hours_worked || 0)), 0);
    const billableHours = entries.filter(e => e.is_billable).reduce((sum, e) => sum + parseFloat(String(e.hours_worked || 0)), 0);
    try {
      await apiClient.post('/timetracking/timesheet/submit', {
        week_number: 32, year: 2026, total_hours: totalHours, billable_hours: billableHours,
      });
      await fetchData();
      alert('✅ Timesheet submitted for manager approval!');
    } catch (e: any) { alert(e.response?.data?.message || 'Submission failed'); }
  };

  const handleApproveTimesheet = async (id: number) => {
    try {
      await apiClient.patch(`/timetracking/timesheet/${id}/approve`);
      await fetchData();
      alert('✅ Timesheet approved by manager!');
    } catch (e: any) { alert(e.response?.data?.message || 'Approval failed'); }
  };

  const formatHMS = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-5 min-h-screen pb-10 font-sans text-slate-800">
      {isMobile ? (
        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <button onClick={() => onNavigate?.('dashboard')} className="p-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-extrabold text-sm uppercase tracking-tight">Timesheet Workspace</span>
        </div>
      ) : null}

      {/* ─── Live Work Session Timer Banner ─────────────────────────────── */}
      <div className={isMobile ? "bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-4 shadow-xl border border-emerald-900/40 text-slate-800" : "bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-emerald-900/40 text-slate-800"}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-600/30 rounded-2xl">
              <Clock className="w-8 h-8 text-emerald-300 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">LIVE WORK SESSION TIMER</span>
              <p className="text-3xl font-black text-white font-mono tracking-tight">{formatHMS(timerSeconds)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!activeTimer ? (
              <div className="flex items-center gap-2">
                <select value={timerProjectId} onChange={e => setTimerProjectId(e.target.value)}
                  className="bg-white/10 text-white font-bold text-xs px-3 py-2.5 rounded-xl border border-white/20">
                  <option value="" className="text-slate-900">-- Choose Project --</option>
                  {projects.map(p => <option key={p.id} value={p.id} className="text-slate-900">{p.name}</option>)}
                </select>
                <button onClick={handleStartTimer} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-lg">
                  <Play className="w-4 h-4 fill-current" /> Start Live Timer
                </button>
              </div>
            ) : (
              <button onClick={handleStopTimer} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-lg">
                <Square className="w-4 h-4 fill-current" /> Stop & Save Work Session
              </button>
            )}
          </div>
        </div>

        {/* Productivity KPIs Banner */}
        {kpis && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-2xl font-black text-white">{kpis.total_hours_logged} hrs</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Total Logged Work Hours</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-2xl font-black text-emerald-300">{kpis.billable_hours} hrs</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Billable Client Hours</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-2xl font-black text-amber-300">{kpis.overtime_hours} hrs</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Overtime Hours Logged</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-2xl font-black text-cyan-300">{kpis.billability_percentage}%</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Billability Score</p>
            </div>
          </div>
        )}
      </div>

      {/* ─── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200 overflow-x-auto">
        <button onClick={() => setTab('my-timesheet')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'my-timesheet' ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Clock className="w-4 h-4" /> My Timesheet Log ({entries.length})
        </button>
        <button onClick={() => setTab('approvals')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'approvals' ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <UserCheck className="w-4 h-4" /> Manager Timesheet Approvals ({pendingTimesheets.filter(t => t.status === 'PENDING').length})
        </button>
      </div>

      {/* ─── MY TIMESHEET LOG TAB ────────────────────────────────────────── */}
      {tab === 'my-timesheet' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" /> Logged Work Hours & Activity
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowLogModal(true)} className="bg-slate-900 text-white font-bold text-xs px-3.5 py-2 rounded-xl">
                <Plus className="w-3.5 h-3.5 inline mr-1" /> Log Manual Hours
              </button>
              <button onClick={handleSubmitTimesheet} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow">
                Submit Weekly Timesheet
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Project</th>
                  <th className="p-3">Task</th>
                  <th className="p-3">Work Summary</th>
                  <th className="p-3">Hours</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {entries.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="p-3 font-sans font-bold text-slate-900">{fmtDate(e.entry_date)}</td>
                    <td className="p-3 font-sans text-slate-700 font-bold">{e.project_name || 'General Project'}</td>
                    <td className="p-3 font-sans text-slate-500">{e.task_title || 'Sprint Delivery'}</td>
                    <td className="p-3 font-sans text-slate-600">{e.description || 'Routine work'}</td>
                    <td className="p-3 font-black text-slate-900 font-sans">{e.hours_worked} hrs</td>
                    <td className="p-3 font-sans">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        e.is_billable ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>{e.is_billable ? 'Billable' : 'Internal'}</span>
                    </td>
                    <td className="p-3 font-sans">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded">{e.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── MANAGER APPROVALS TAB ───────────────────────────────────────── */}
      {tab === 'approvals' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
              <tr>
                <th className="p-3">Employee</th>
                <th className="p-3">Week</th>
                <th className="p-3">Total Worked Hours</th>
                <th className="p-3">Billable Hours</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {pendingTimesheets.map(t => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="p-3 font-sans font-bold text-slate-900">{t.first_name} {t.last_name}</td>
                  <td className="p-3 font-sans text-slate-600">Week {t.week_number}, {t.year}</td>
                  <td className="p-3 font-bold text-slate-900 font-sans">{t.total_hours} hrs</td>
                  <td className="p-3 font-bold text-emerald-700 font-sans">{t.billable_hours} hrs</td>
                  <td className="p-3 font-sans">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      t.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>{t.status}</span>
                  </td>
                  <td className="p-3 font-sans">
                    {isManager && t.status === 'PENDING' && (
                      <button onClick={() => handleApproveTimesheet(t.id)} className="px-2 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded hover:bg-emerald-700">
                        Approve Timesheet
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── LOG TIME ENTRY MODAL ───────────────────────────────────────── */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Log Manual Time Entry</h3>
              <button onClick={() => setShowLogModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleLogManualEntry} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Date *</label>
                  <input required type="date" value={logForm.entry_date} onChange={e => setLogForm({...logForm, entry_date: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Hours Worked *</label>
                  <input required type="number" step="0.5" value={logForm.hours_worked} onChange={e => setLogForm({...logForm, hours_worked: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold" />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Project</label>
                <select value={logForm.project_id} onChange={e => setLogForm({...logForm, project_id: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                  <option value="">-- Choose Project --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Work Summary *</label>
                <textarea required value={logForm.description} onChange={e => setLogForm({...logForm, description: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" rows={2} />
              </div>

              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={logForm.is_billable} onChange={e => setLogForm({...logForm, is_billable: e.target.checked})} className="rounded" /> Billable Client Hours
                </label>
                <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={logForm.is_overtime} onChange={e => setLogForm({...logForm, is_overtime: e.target.checked})} className="rounded" /> Overtime Hours
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowLogModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow">{submitting ? 'Saving...' : 'Save Entry'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
