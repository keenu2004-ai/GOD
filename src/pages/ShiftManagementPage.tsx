import React, { useState, useEffect } from 'react';
import {
  Clock, Users, RefreshCw, AlertTriangle, CheckCircle2,
  Plus, X, Edit3, Trash2, Calendar, Activity, BarChart2,
  Zap, Coffee, Sun, Moon, Home, TrendingUp, Shield,
  ChevronDown, ChevronRight, Star
} from 'lucide-react';
import apiClient from '../services/apiClient.js';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Shift {
  id: number;
  name: string;
  code: string;
  start_time: string;
  end_time: string;
  grace_mins: number;
  late_threshold_mins: number;
  half_day_threshold_hours: number;
  break_duration_mins: number;
  max_work_hours: number;
  overtime_eligible: boolean;
  is_night_shift: boolean;
  is_wfh: boolean;
  shift_type: string;
  color: string;
  assigned_count?: number;
}

interface Assignment {
  id: number;
  employee_id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
  designation: string;
  department_name: string;
  branch_name: string;
  shift_name: string;
  shift_code: string;
  start_time: string;
  end_time: string;
  color: string;
  effective_date: string;
}

interface SwapRequest {
  id: number;
  requester_first: string;
  requester_last: string;
  requester_code: string;
  target_first: string;
  target_last: string;
  target_code: string;
  requester_shift_name: string;
  target_shift_name: string;
  shift_date: string;
  reason: string;
  status: string;
  created_at: string;
}

interface OvertimeRequest {
  id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
  department_name: string;
  shift_name: string;
  date: string;
  expected_overtime_hours: number;
  approved_hours: number;
  reason: string;
  status: string;
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
    APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-red-100 text-red-700 border-red-200',
    COMPLETED: 'bg-blue-100 text-blue-700 border-blue-200',
  };
  return `${map[status] || 'bg-slate-100 text-slate-600 border-slate-200'} text-[10px] font-bold px-2 py-0.5 rounded border`;
};

const shiftIcon = (type: string) => {
  const map: Record<string, React.ReactNode> = {
    GENERAL: <Sun className="w-4 h-4 text-blue-500" />,
    MORNING: <Sun className="w-4 h-4 text-amber-500" />,
    EVENING: <Coffee className="w-4 h-4 text-purple-500" />,
    NIGHT: <Moon className="w-4 h-4 text-indigo-400" />,
    FLEXIBLE: <Zap className="w-4 h-4 text-emerald-500" />,
    WFH: <Home className="w-4 h-4 text-cyan-500" />,
    HYBRID: <RefreshCw className="w-4 h-4 text-orange-500" />,
  };
  return map[type] || <Clock className="w-4 h-4 text-slate-400" />;
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const ShiftManagementPage: React.FC = () => {
  const [tab, setTab] = useState<'templates' | 'roster' | 'swap' | 'overtime' | 'reports'>('templates');
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([]);
  const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequest[]>([]);
  const [utilReport, setUtilReport] = useState<any[]>([]);
  const [otReport, setOtReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Create Shift Form
  const [showCreateShift, setShowCreateShift] = useState(false);
  const [shiftForm, setShiftForm] = useState({
    name: '', code: '', start_time: '09:00', end_time: '18:00',
    grace_mins: 15, late_threshold_mins: 30, half_day_threshold_hours: 4,
    early_exit_threshold_mins: 60, break_duration_mins: 60, max_work_hours: 12,
    min_work_hours: 4, overtime_eligible: true, is_night_shift: false, is_wfh: false,
    auto_clockout_after_hours: 14, shift_type: 'GENERAL', color: '#3B82F6',
  });

  // Assign Shift Form
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ employee_id: '', shift_id: '', effective_date: new Date().toISOString().split('T')[0] });

  // Swap Request Form
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapForm, setSwapForm] = useState({ target_employee_id: '', requester_shift_id: '', target_shift_id: '', shift_date: '', reason: '' });

  // Overtime Request Form
  const [showOtModal, setShowOtModal] = useState(false);
  const [otForm, setOtForm] = useState({ date: new Date().toISOString().split('T')[0], expected_overtime_hours: 1, reason: '' });

  const [submitting, setSubmitting] = useState(false);
  const [myShift, setMyShift] = useState<any>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, a, sw, ot, ms] = await Promise.all([
        apiClient.get('/shifts'),
        apiClient.get('/shifts/assignments').catch(() => ({ data: { data: [] } })),
        apiClient.get('/shifts/swap-requests').catch(() => ({ data: { data: [] } })),
        apiClient.get('/shifts/overtime-requests').catch(() => ({ data: { data: [] } })),
        apiClient.get('/shifts/my-shift').catch(() => ({ data: { data: null } })),
      ]);
      setShifts(s.data?.data || []);
      setAssignments(a.data?.data || []);
      setSwapRequests(sw.data?.data || []);
      setOvertimeRequests(ot.data?.data || []);
      setMyShift(ms.data?.data || null);
    } catch (e) {
      console.error('Failed to fetch shift data', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const [u, o] = await Promise.all([
        apiClient.get('/shifts/reports/utilization').catch(() => ({ data: { data: [] } })),
        apiClient.get('/shifts/reports/overtime').catch(() => ({ data: { data: [] } })),
      ]);
      setUtilReport(u.data?.data || []);
      setOtReport(o.data?.data || []);
    } catch (e) { /* ignore */ }
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { if (tab === 'reports') fetchReports(); }, [tab]);

  const handleSeedShifts = async () => {
    setSeeding(true);
    try {
      await apiClient.post('/shifts/seed');
      await fetchAll();
      alert('✅ 7 enterprise shift templates seeded into PostgreSQL!');
    } catch (e: any) {
      alert(e.response?.data?.message || 'Seed failed');
    } finally {
      setSeeding(false);
    }
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/shifts', shiftForm);
      setShowCreateShift(false);
      setShiftForm({ name: '', code: '', start_time: '09:00', end_time: '18:00', grace_mins: 15, late_threshold_mins: 30, half_day_threshold_hours: 4, early_exit_threshold_mins: 60, break_duration_mins: 60, max_work_hours: 12, min_work_hours: 4, overtime_eligible: true, is_night_shift: false, is_wfh: false, auto_clockout_after_hours: 14, shift_type: 'GENERAL', color: '#3B82F6' });
      await fetchAll();
    } catch (e: any) { alert(e.response?.data?.message || 'Failed to create shift'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteShift = async (id: number) => {
    if (!confirm('Deactivate this shift?')) return;
    try { await apiClient.delete(`/shifts/${id}`); await fetchAll(); }
    catch (e: any) { alert(e.response?.data?.message || 'Failed'); }
  };

  const handleAssignShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/shifts/assign', { ...assignForm, employee_id: Number(assignForm.employee_id), shift_id: Number(assignForm.shift_id) });
      setShowAssignModal(false);
      await fetchAll();
      alert('✅ Shift assigned successfully!');
    } catch (e: any) { alert(e.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleSwapRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/shifts/swap-requests', { ...swapForm, target_employee_id: Number(swapForm.target_employee_id), requester_shift_id: Number(swapForm.requester_shift_id), target_shift_id: Number(swapForm.target_shift_id) });
      setShowSwapModal(false);
      await fetchAll();
      alert('✅ Shift swap request submitted!');
    } catch (e: any) { alert(e.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleOvertimeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/shifts/overtime-requests', { ...otForm });
      setShowOtModal(false);
      await fetchAll();
      alert('✅ Overtime request submitted!');
    } catch (e: any) { alert(e.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const processSwap = async (id: number, status: string) => {
    try {
      await apiClient.put(`/shifts/swap-requests/${id}/process`, { status });
      await fetchAll();
    } catch (e: any) { alert(e.response?.data?.message || 'Failed'); }
  };

  const processOvertime = async (id: number, status: string) => {
    const approved_hours = status === 'APPROVED' ? prompt('Approved overtime hours:', '1') : '0';
    try {
      await apiClient.put(`/shifts/overtime-requests/${id}/process`, { status, approved_hours: Number(approved_hours || 0) });
      await fetchAll();
    } catch (e: any) { alert(e.response?.data?.message || 'Failed'); }
  };

  const exportCSV = (data: any[], filename: string) => {
    if (!data.length) return alert('No data to export');
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(r => Object.values(r).map(v => `"${v}"`).join(','));
    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  };

  const TABS = [
    { key: 'templates', label: 'Shift Templates', icon: <Clock className="w-4 h-4" /> },
    { key: 'roster', label: 'Roster / Assignments', icon: <Users className="w-4 h-4" /> },
    { key: 'swap', label: 'Swap Requests', icon: <RefreshCw className="w-4 h-4" /> },
    { key: 'overtime', label: 'Overtime', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'reports', label: 'Reports', icon: <BarChart2 className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-5 min-h-screen pb-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-indigo-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-indigo-600/30 rounded-xl">
                <Clock className="w-6 h-6 text-indigo-300" />
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">Enterprise Shift Management</h2>
            </div>
            <p className="text-xs text-indigo-300/70 font-mono ml-11">
              {shifts.length} shift templates • {assignments.length} active assignments • Overtime & swap workflows
            </p>
          </div>

          {/* My Shift Badge */}
          {myShift && (
            <div className="flex items-center gap-3 bg-indigo-900/40 border border-indigo-700/50 rounded-xl px-4 py-2.5 text-xs">
              <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: myShift.color || '#6366F1' }} />
              <div>
                <p className="font-bold text-white">{myShift.shift_name}</p>
                <p className="text-indigo-300/70 font-mono">{myShift.start_time} – {myShift.end_time}</p>
              </div>
              <Shield className="w-4 h-4 text-indigo-400" />
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {[
            { label: 'Total Shifts', value: shifts.length, color: 'text-blue-400' },
            { label: 'Active Assignments', value: assignments.length, color: 'text-emerald-400' },
            { label: 'Pending Swaps', value: swapRequests.filter(s => s.status === 'PENDING').length, color: 'text-amber-400' },
            { label: 'Pending Overtime', value: overtimeRequests.filter(o => o.status === 'PENDING').length, color: 'text-rose-400' },
          ].map(s => (
            <div key={s.label} className="bg-white/5 rounded-xl p-3 border border-white/10">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              tab === t.key
                ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ─── SHIFT TEMPLATES TAB ─────────────────────────────────────────────── */}
      {tab === 'templates' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-800">Shift Templates Library</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSeedShifts}
                disabled={seeding}
                className="flex items-center gap-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-xs font-bold px-3.5 py-2 rounded-lg border border-indigo-200 transition-all"
              >
                <Star className="w-3.5 h-3.5" />
                {seeding ? 'Seeding...' : 'Seed 7 Default Shifts'}
              </button>
              <button
                onClick={() => setShowCreateShift(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> New Shift
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="h-36 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : shifts.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-600">No shifts configured yet</p>
              <p className="text-xs text-slate-400 mt-1">Click "Seed 7 Default Shifts" to auto-populate enterprise shift templates into PostgreSQL</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shifts.map(shift => (
                <div key={shift.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${shift.color}20` }}>
                        {shiftIcon(shift.shift_type)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{shift.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{shift.code}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleDeleteShift(shift.id)} className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Hours</span>
                      <span className="font-bold text-slate-800 font-mono">{shift.start_time} – {shift.end_time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Grace Period</span>
                      <span className="font-semibold text-slate-700">{shift.grace_mins} mins</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Break</span>
                      <span className="font-semibold text-slate-700">{shift.break_duration_mins} mins</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Assigned</span>
                      <span className="font-bold text-indigo-600">{shift.assigned_count || 0} employees</span>
                    </div>
                  </div>

                  <div className="flex gap-1.5 mt-3 flex-wrap">
                    {shift.overtime_eligible && <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded">OT Eligible</span>}
                    {shift.is_night_shift && <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded">Night</span>}
                    {shift.is_wfh && <span className="bg-cyan-50 text-cyan-600 text-[10px] font-bold px-2 py-0.5 rounded">WFH</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── ROSTER / ASSIGNMENTS TAB ────────────────────────────────────────── */}
      {tab === 'roster' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-800">Employee Shift Roster</h3>
            <div className="flex gap-2">
              <button
                onClick={() => exportCSV(assignments, `THEIAKSHI_ShiftRoster_${new Date().toISOString().split('T')[0]}.csv`)}
                className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg border border-slate-200"
              >
                Export CSV
              </button>
              <button
                onClick={() => setShowAssignModal(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Assign Shift
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[10px] font-black tracking-wider">
                  <tr>
                    <th className="p-4">Employee</th>
                    <th className="p-4">Shift</th>
                    <th className="p-4">Hours</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Effective Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={5} className="text-center py-8 text-slate-400">Loading roster...</td></tr>
                  ) : assignments.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-slate-400">No assignments found. Assign shifts to employees above.</td></tr>
                  ) : (
                    assignments.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-slate-900">{a.first_name} {a.last_name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{a.employee_code} • {a.designation}</p>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: a.color }} />
                            <div>
                              <p className="font-bold text-slate-800">{a.shift_name}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{a.shift_code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-700">{a.start_time} – {a.end_time}</td>
                        <td className="p-4 text-slate-600">{a.department_name || '—'}</td>
                        <td className="p-4 font-mono text-slate-500">{a.effective_date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── SWAP REQUESTS TAB ───────────────────────────────────────────────── */}
      {tab === 'swap' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Shift Swap Requests</h3>
            <button onClick={() => setShowSwapModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm">
              <Plus className="w-3.5 h-3.5" /> Request Swap
            </button>
          </div>

          <div className="space-y-3">
            {swapRequests.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <RefreshCw className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 font-semibold text-sm">No swap requests</p>
              </div>
            ) : swapRequests.map(sr => (
              <div key={sr.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="text-xs">
                      <p className="font-bold text-slate-900">{sr.requester_first} {sr.requester_last}</p>
                      <p className="text-slate-500 font-mono">{sr.requester_code} → wants shift swap</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="text-xs">
                      <p className="font-bold text-slate-900">{sr.target_first} {sr.target_last}</p>
                      <p className="text-slate-500 font-mono">{sr.target_code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={statusBadge(sr.status)}>{sr.status}</span>
                    {sr.status === 'PENDING' && (
                      <>
                        <button onClick={() => processSwap(sr.id, 'APPROVED')} className="text-xs bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-200 border border-emerald-200">Approve</button>
                        <button onClick={() => processSwap(sr.id, 'REJECTED')} className="text-xs bg-red-100 text-red-700 font-bold px-3 py-1.5 rounded-lg hover:bg-red-200 border border-red-200">Reject</button>
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                  <span>📅 {sr.shift_date}</span>
                  <span>💬 {sr.reason}</span>
                  {sr.requester_shift_name && <span>🔄 {sr.requester_shift_name} ↔ {sr.target_shift_name}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── OVERTIME TAB ────────────────────────────────────────────────────── */}
      {tab === 'overtime' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Overtime Requests</h3>
            <button onClick={() => setShowOtModal(true)} className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm">
              <Zap className="w-3.5 h-3.5" /> Request Overtime
            </button>
          </div>

          <div className="space-y-3">
            {overtimeRequests.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <TrendingUp className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 font-semibold text-sm">No overtime requests</p>
              </div>
            ) : overtimeRequests.map(ot => (
              <div key={ot.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs">
                    <p className="font-bold text-slate-900">{ot.first_name} {ot.last_name}
                      <span className="text-slate-500 font-mono ml-2">{ot.employee_code}</span>
                    </p>
                    <p className="text-slate-500 mt-0.5">{ot.department_name} • {ot.date}</p>
                    <p className="text-amber-600 font-semibold mt-1">Requested: {ot.expected_overtime_hours}h OT
                      {ot.approved_hours ? ` • Approved: ${ot.approved_hours}h` : ''}
                    </p>
                    <p className="text-slate-400 mt-0.5">Reason: {ot.reason}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={statusBadge(ot.status)}>{ot.status}</span>
                    {ot.status === 'PENDING' && (
                      <>
                        <button onClick={() => processOvertime(ot.id, 'APPROVED')} className="text-xs bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-200 border border-emerald-200">Approve</button>
                        <button onClick={() => processOvertime(ot.id, 'REJECTED')} className="text-xs bg-red-100 text-red-700 font-bold px-3 py-1.5 rounded-lg hover:bg-red-200 border border-red-200">Reject</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── REPORTS TAB ─────────────────────────────────────────────────────── */}
      {tab === 'reports' && (
        <div className="space-y-6">
          {/* Shift Utilization */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-blue-500" /> Shift Utilization Report</h4>
              <button onClick={() => exportCSV(utilReport, 'ShiftUtilization.csv')} className="text-xs bg-slate-100 text-slate-600 font-bold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-200">Export CSV</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">Shift</th>
                    <th className="p-4">Sessions</th>
                    <th className="p-4">Late Count</th>
                    <th className="p-4">Overtime Count</th>
                    <th className="p-4">Avg Work Hrs</th>
                    <th className="p-4">Avg Break Mins</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {utilReport.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-slate-400">No utilization data. Attendance records will populate this.</td></tr>
                  ) : utilReport.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-800">{r.shift_name || 'General'}</td>
                      <td className="p-4">{r.total_sessions}</td>
                      <td className="p-4 text-amber-600 font-semibold">{r.late_count}</td>
                      <td className="p-4 text-blue-600 font-semibold">{r.overtime_count}</td>
                      <td className="p-4 font-mono">{r.avg_work_hours}h</td>
                      <td className="p-4 font-mono">{r.avg_break_mins} mins</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Overtime Summary */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-amber-500" /> Overtime Summary Report</h4>
              <button onClick={() => exportCSV(otReport, 'OvertimeSummary.csv')} className="text-xs bg-slate-100 text-slate-600 font-bold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-200">Export CSV</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">Employee</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">OT Days</th>
                    <th className="p-4">Total OT Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {otReport.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-slate-400">No overtime data for selected period.</td></tr>
                  ) : otReport.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-4">
                        <p className="font-bold text-slate-900">{r.first_name} {r.last_name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{r.employee_code}</p>
                      </td>
                      <td className="p-4 text-slate-600">{r.department_name}</td>
                      <td className="p-4 font-semibold text-amber-600">{r.overtime_days}</td>
                      <td className="p-4 font-bold font-mono text-blue-700">{r.total_overtime_hours}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODALS ───────────────────────────────────────────────────────────── */}

      {/* Create Shift Modal */}
      {showCreateShift && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-slate-900 flex items-center gap-2"><Plus className="w-5 h-5 text-indigo-600" /> Create New Shift Template</h3>
              <button onClick={() => setShowCreateShift(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateShift} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-slate-500 font-semibold">Shift Name *</label><input required value={shiftForm.name} onChange={e => setShiftForm({...shiftForm, name: e.target.value})} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                <div><label className="text-slate-500 font-semibold">Shift Code *</label><input required value={shiftForm.code} onChange={e => setShiftForm({...shiftForm, code: e.target.value.toUpperCase()})} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. CUSTOM_A" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-slate-500 font-semibold">Start Time *</label><input required type="time" value={shiftForm.start_time} onChange={e => setShiftForm({...shiftForm, start_time: e.target.value})} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                <div><label className="text-slate-500 font-semibold">End Time *</label><input required type="time" value={shiftForm.end_time} onChange={e => setShiftForm({...shiftForm, end_time: e.target.value})} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="text-slate-500 font-semibold">Grace Period (mins)</label><input type="number" value={shiftForm.grace_mins} onChange={e => setShiftForm({...shiftForm, grace_mins: Number(e.target.value)})} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                <div><label className="text-slate-500 font-semibold">Late Threshold (mins)</label><input type="number" value={shiftForm.late_threshold_mins} onChange={e => setShiftForm({...shiftForm, late_threshold_mins: Number(e.target.value)})} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
                <div><label className="text-slate-500 font-semibold">Break Duration (mins)</label><input type="number" value={shiftForm.break_duration_mins} onChange={e => setShiftForm({...shiftForm, break_duration_mins: Number(e.target.value)})} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-slate-500 font-semibold">Shift Type</label>
                  <select value={shiftForm.shift_type} onChange={e => setShiftForm({...shiftForm, shift_type: e.target.value})} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none">
                    {['GENERAL','MORNING','EVENING','NIGHT','FLEXIBLE','WFH','HYBRID','CUSTOM'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div><label className="text-slate-500 font-semibold">Color</label><input type="color" value={shiftForm.color} onChange={e => setShiftForm({...shiftForm, color: e.target.value})} className="mt-1 w-full h-10 border border-slate-300 rounded-lg cursor-pointer" /></div>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                  <input type="checkbox" checked={shiftForm.overtime_eligible} onChange={e => setShiftForm({...shiftForm, overtime_eligible: e.target.checked})} className="w-4 h-4 rounded text-indigo-600" />
                  Overtime Eligible
                </label>
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                  <input type="checkbox" checked={shiftForm.is_night_shift} onChange={e => setShiftForm({...shiftForm, is_night_shift: e.target.checked})} className="w-4 h-4 rounded text-indigo-600" />
                  Night Shift
                </label>
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                  <input type="checkbox" checked={shiftForm.is_wfh} onChange={e => setShiftForm({...shiftForm, is_wfh: e.target.checked})} className="w-4 h-4 rounded text-indigo-600" />
                  Work From Home
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setShowCreateShift(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow">{submitting ? 'Creating...' : 'Create Shift'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Shift Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="font-bold text-slate-900">Assign Shift to Employee</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAssignShift} className="p-5 space-y-4 text-xs">
              <div><label className="text-slate-500 font-semibold">Employee ID *</label><input required type="number" value={assignForm.employee_id} onChange={e => setAssignForm({...assignForm, employee_id: e.target.value})} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Enter employee ID" /></div>
              <div><label className="text-slate-500 font-semibold">Select Shift *</label>
                <select required value={assignForm.shift_id} onChange={e => setAssignForm({...assignForm, shift_id: e.target.value})} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="">— Choose shift —</option>
                  {shifts.map(s => <option key={s.id} value={s.id}>{s.name} ({s.start_time}–{s.end_time})</option>)}
                </select>
              </div>
              <div><label className="text-slate-500 font-semibold">Effective Date *</label><input required type="date" value={assignForm.effective_date} onChange={e => setAssignForm({...assignForm, effective_date: e.target.value})} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowAssignModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow">{submitting ? 'Assigning...' : 'Assign Shift'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Swap Request Modal */}
      {showSwapModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="font-bold text-slate-900">Request Shift Swap</h3>
              <button onClick={() => setShowSwapModal(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSwapRequest} className="p-5 space-y-4 text-xs">
              <div><label className="text-slate-500 font-semibold">Target Employee ID *</label><input required type="number" value={swapForm.target_employee_id} onChange={e => setSwapForm({...swapForm, target_employee_id: e.target.value})} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-slate-500 font-semibold">My Shift</label>
                  <select value={swapForm.requester_shift_id} onChange={e => setSwapForm({...swapForm, requester_shift_id: e.target.value})} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">— My shift —</option>
                    {shifts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div><label className="text-slate-500 font-semibold">Their Shift</label>
                  <select value={swapForm.target_shift_id} onChange={e => setSwapForm({...swapForm, target_shift_id: e.target.value})} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">— Their shift —</option>
                    {shifts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="text-slate-500 font-semibold">Swap Date *</label><input required type="date" value={swapForm.shift_date} onChange={e => setSwapForm({...swapForm, shift_date: e.target.value})} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
              <div><label className="text-slate-500 font-semibold">Reason *</label><textarea required value={swapForm.reason} onChange={e => setSwapForm({...swapForm, reason: e.target.value})} rows={3} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" /></div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowSwapModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow">{submitting ? 'Submitting...' : 'Submit Request'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Overtime Request Modal */}
      {showOtModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" /> Request Overtime</h3>
              <button onClick={() => setShowOtModal(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleOvertimeRequest} className="p-5 space-y-4 text-xs">
              <div><label className="text-slate-500 font-semibold">Date *</label><input required type="date" value={otForm.date} onChange={e => setOtForm({...otForm, date: e.target.value})} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none" /></div>
              <div><label className="text-slate-500 font-semibold">Expected Overtime Hours *</label><input required type="number" step="0.5" min="0.5" max="8" value={otForm.expected_overtime_hours} onChange={e => setOtForm({...otForm, expected_overtime_hours: Number(e.target.value)})} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none" /></div>
              <div><label className="text-slate-500 font-semibold">Reason / Work Description *</label><textarea required value={otForm.reason} onChange={e => setOtForm({...otForm, reason: e.target.value})} rows={3} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none resize-none" /></div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowOtModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-amber-600 text-white font-bold rounded-lg shadow">{submitting ? 'Submitting...' : 'Submit OT Request'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
