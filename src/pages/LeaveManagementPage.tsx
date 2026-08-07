import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, CheckCircle2, XCircle, AlertCircle, Clock,
  Plus, Search, Filter, Download, RefreshCw, Layers,
  Shield, DollarSign, Settings, UserCheck, Trash2, Edit3,
  ChevronRight, ArrowUpRight, FileText, CheckSquare, Sparkles,
  Users, Building, Briefcase, Award, AlertTriangle, Eye, X
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

// ─── Types ─────────────────────────────────────────────────────────────────
interface LeaveType {
  id: number;
  name: string;
  code: string;
  color: string;
  days_allowed: number;
  is_carry_forward: boolean;
  is_paid: boolean;
  is_encashable: boolean;
  max_consecutive_days: number;
  requires_attachment: boolean;
  description: string;
}

interface LeavePolicy {
  id: number;
  name: string;
  code: string;
  description: string;
  leave_type_id: number;
  leave_type_name: string;
  leave_type_code: string;
  leave_type_color: string;
  annual_allocation: number;
  monthly_accrual: number;
  max_balance: number;
  carry_forward_limit: number;
  encashment_limit: number;
  half_day_allowed: boolean;
  negative_balance_allowed: boolean;
  probation_applicable: boolean;
  min_notice_days: number;
  max_consecutive_days: number;
  attachment_required: boolean;
  is_active: boolean;
  assigned_count: number;
  branch_name?: string;
  department_name?: string;
}

interface LeaveBalance {
  id: number;
  employee_id: number;
  leave_type_id: number;
  leave_type_name: string;
  leave_type_code: string;
  color: string;
  total_allocated: number;
  used_days: number;
  remaining_days: number;
}

interface LeaveApplication {
  id: number;
  employee_id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
  department_name: string;
  leave_type_name: string;
  leave_type_code: string;
  color: string;
  start_date: string;
  end_date: string;
  total_days: number;
  is_half_day: boolean;
  half_day_session: string | null;
  reason: string;
  emergency_contact: string | null;
  status: string;
  approver_first_name?: string;
  approver_last_name?: string;
  rejection_reason?: string;
  created_at: string;
}

interface PolicyAssignment {
  id: number;
  policy_name: string;
  policy_code: string;
  first_name?: string;
  last_name?: string;
  employee_code?: string;
  department_name?: string;
  branch_name?: string;
  role?: string;
  employment_type?: string;
  effective_date: string;
  is_active: boolean;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
const fmtDate = (s: string) => s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function exportCSV(data: any[], filename: string) {
  if (!data || !data.length) return alert('No data to export');
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(r =>
    Object.values(r).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
  );
  const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
}

const STATUS_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  APPROVED:        { label: 'Approved',         bg: 'bg-emerald-100 border-emerald-200', text: 'text-emerald-700' },
  MANAGER_PENDING: { label: 'Pending Manager', bg: 'bg-amber-100 border-amber-200',   text: 'text-amber-700' },
  HR_PENDING:      { label: 'Pending HR',      bg: 'bg-blue-100 border-blue-200',     text: 'text-blue-700' },
  REJECTED:        { label: 'Rejected',         bg: 'bg-red-100 border-red-200',       text: 'text-red-700' },
  CANCELLED:       { label: 'Cancelled',        bg: 'bg-slate-100 border-slate-200',   text: 'text-slate-500' },
};

// ─── Main Page Component ───────────────────────────────────────────────────
export const LeaveManagementPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const userId = (user as any)?.id || 0;
  const isHRAdmin = ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'].includes(userRole);
  const isManager = ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'DEPT_HEAD'].includes(userRole);

  const [tab, setTab] = useState<'applications' | 'balances' | 'availability' | 'ledger' | 'compoff' | 'policies' | 'assignments' | 'settings'>('applications');
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [assignments, setAssignments] = useState<PolicyAssignment[]>([]);
  const [teamAvailability, setTeamAvailability] = useState<any[]>([]);
  const [ledgerTransactions, setLedgerTransactions] = useState<any[]>([]);
  const [compOffs, setCompOffs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Apply Form
  const [applyForm, setApplyForm] = useState({
    leave_type_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    is_half_day: false,
    half_day_session: 'FIRST_HALF',
    reason: '',
    emergency_contact: '',
  });

  // Policy Form
  const [policyForm, setPolicyForm] = useState({
    name: '', code: '', description: '', leave_type_id: 1,
    annual_allocation: 12, monthly_accrual: 1, max_balance: 30,
    carry_forward_limit: 6, encashment_limit: 0, half_day_allowed: true,
    negative_balance_allowed: false, probation_applicable: true,
    min_notice_days: 0, max_consecutive_days: 14, attachment_required: false,
  });

  // Assign Form
  const [assignForm, setAssignForm] = useState({
    policy_id: '', employee_id: '', department_id: '', role: '', employment_type: 'FULL_TIME',
    effective_date: new Date().toISOString().split('T')[0],
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [typesRes, appRes, balRes] = await Promise.all([
        apiClient.get('/leave/types'),
        apiClient.get('/leave/history'),
        apiClient.get('/leave/balance'),
      ]);
      setLeaveTypes(typesRes.data?.data || []);
      setApplications(appRes.data?.data || []);
      setBalances(balRes.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const fetchHRData = useCallback(async () => {
    try {
      const [polRes, assRes, setRes, availRes, ledgRes, compRes] = await Promise.all([
        apiClient.get('/leave/policies').catch(() => ({ data: { data: [] } })),
        apiClient.get('/leave/assignments').catch(() => ({ data: { data: [] } })),
        apiClient.get('/leave/settings').catch(() => ({ data: { data: null } })),
        apiClient.get('/leave/team-availability').catch(() => ({ data: { data: [] } })),
        apiClient.get('/leave/ledger').catch(() => ({ data: { data: [] } })),
        apiClient.get('/leave/comp-offs').catch(() => ({ data: { data: [] } })),
      ]);
      setPolicies(polRes.data?.data || []);
      setAssignments(assRes.data?.data || []);
      setSettings(setRes.data?.data || null);
      setTeamAvailability(availRes.data?.data || []);
      setLedgerTransactions(ledgRes.data?.data || []);
      setCompOffs(compRes.data?.data || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (['policies', 'assignments', 'settings'].includes(tab)) fetchHRData(); }, [tab, fetchHRData]);

  const handleSeedDefaults = async () => {
    try {
      await apiClient.post('/leave/seed-defaults');
      await Promise.all([fetchData(), fetchHRData()]);
      alert('✅ 19 Enterprise Leave Types successfully seeded into PostgreSQL!');
    } catch (e: any) { alert(e.response?.data?.message || 'Seeding failed'); }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const start = new Date(applyForm.start_date);
      const end = new Date(applyForm.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const total_days = applyForm.is_half_day ? 0.5 : diffDays;

      await apiClient.post('/leave/apply', {
        ...applyForm,
        leave_type_id: parseInt(applyForm.leave_type_id),
        total_days,
      });
      setShowApplyModal(false);
      await fetchData();
      alert('✅ Leave application submitted!');
    } catch (e: any) { alert(e.response?.data?.message || 'Application failed'); }
    finally { setSubmitting(false); }
  };

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/leave/policies', {
        ...policyForm,
        leave_type_id: parseInt(String(policyForm.leave_type_id)),
        annual_allocation: parseFloat(String(policyForm.annual_allocation)),
      });
      setShowPolicyModal(false);
      await fetchHRData();
      alert('✅ Leave Policy created successfully!');
    } catch (e: any) { alert(e.response?.data?.message || 'Policy creation failed'); }
    finally { setSubmitting(false); }
  };

  const handleAssignPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/leave/policy/assign', {
        policy_id: parseInt(assignForm.policy_id),
        employee_id: assignForm.employee_id ? parseInt(assignForm.employee_id) : undefined,
        department_id: assignForm.department_id ? parseInt(assignForm.department_id) : undefined,
        role: assignForm.role || undefined,
        employment_type: assignForm.employment_type || undefined,
        effective_date: assignForm.effective_date,
      });
      setShowAssignModal(false);
      await Promise.all([fetchData(), fetchHRData()]);
      alert('✅ Leave Policy assigned and employee balances updated!');
    } catch (e: any) { alert(e.response?.data?.message || 'Assignment failed'); }
    finally { setSubmitting(false); }
  };

  const handleApprove = async (id: number, status: string) => {
    try {
      await apiClient.post(`/leaves/${id}/approve`, { status });
      await fetchData();
    } catch (e: any) { alert(e.response?.data?.message || 'Action failed'); }
  };

  const filteredApps = applications.filter(a => {
    const matchSearch = !search || `${a.first_name} ${a.last_name} ${a.employee_code} ${a.leave_type_name} ${a.reason}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const TABS = [
    { key: 'applications', label: 'Leave Applications', icon: <Calendar className="w-4 h-4" />, count: applications.length },
    { key: 'balances', label: 'Balances & Encashment', icon: <Layers className="w-4 h-4" />, count: balances.length },
    { key: 'availability', label: 'Team Availability', icon: <Users className="w-4 h-4" />, count: teamAvailability.filter(t => t.active_leave_id).length },
    { key: 'ledger', label: 'Leave Ledger', icon: <FileText className="w-4 h-4" />, count: ledgerTransactions.length },
    { key: 'compoff', label: 'Comp-Off Hub', icon: <Award className="w-4 h-4" />, count: compOffs.length },
    ...(isHRAdmin ? [
      { key: 'policies', label: 'Policy Engine', icon: <Shield className="w-4 h-4" />, count: policies.length },
      { key: 'assignments', label: 'Assignments', icon: <UserCheck className="w-4 h-4" />, count: assignments.length },
      { key: 'settings', label: 'Configuration', icon: <Settings className="w-4 h-4" />, count: undefined },
    ] : []),
  ];

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
              <h2 className="text-xl font-black text-white tracking-tight">Enterprise Leave Management</h2>
              <p className="text-xs text-blue-300/70 font-mono mt-0.5">Policy Engine • Balances • Encashment • Attendance Auto-Sync</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isHRAdmin && (
              <button onClick={handleSeedDefaults} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-xl border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Seed 19 Leave Types
              </button>
            )}
            <button onClick={() => setShowApplyModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg">
              <Plus className="w-4 h-4" /> Apply for Leave
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-2xl font-black text-blue-300">{applications.length}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Total Applications</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-2xl font-black text-amber-300">{applications.filter(a => a.status.includes('PENDING')).length}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Pending Approval</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-2xl font-black text-emerald-300">{applications.filter(a => a.status === 'APPROVED').length}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Approved</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-2xl font-black text-purple-300">{leaveTypes.length}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Active Leave Types</p>
          </div>
        </div>
      </div>

      {/* ─── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              tab === t.key ? 'bg-white text-blue-700 shadow-sm border border-blue-100' : 'text-slate-500 hover:text-slate-800'
            }`}>
            {t.icon} {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── APPLICATIONS TAB ────────────────────────────────────────────── */}
      {tab === 'applications' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search employee, leave type, reason..."
                className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-700 bg-white focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">All Statuses</option>
              {Object.entries(STATUS_BADGES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <button onClick={fetchData} className="p-2.5 bg-white border border-slate-300 rounded-xl text-slate-500 hover:bg-slate-50">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => exportCSV(filteredApps, 'Leave_Applications.csv')}
              className="flex items-center gap-1.5 text-xs font-bold bg-white border border-slate-300 text-slate-600 px-3 py-2.5 rounded-xl hover:bg-slate-50">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Employee</th>
                    <th className="p-4">Leave Type</th>
                    <th className="p-4">Dates</th>
                    <th className="p-4">Days</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Reason</th>
                    <th className="p-4">Applied On</th>
                    {isManager && <th className="p-4">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={8} className="text-center py-8 text-slate-400">Loading...</td></tr>
                  ) : filteredApps.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-12 text-slate-400">No leave applications found</td></tr>
                  ) : filteredApps.map(a => {
                    const statusCfg = STATUS_BADGES[a.status] || { label: a.status, bg: 'bg-slate-100 border-slate-200', text: 'text-slate-600' };
                    return (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="p-4">
                          <p className="font-bold text-slate-900">{a.first_name} {a.last_name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{a.employee_code} • {a.department_name}</p>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold"
                            style={{ backgroundColor: `${a.color}15`, color: a.color }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: a.color }} />
                            {a.leave_type_name}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-slate-600">
                          {fmtDate(a.start_date)} {a.start_date !== a.end_date ? `– ${fmtDate(a.end_date)}` : ''}
                        </td>
                        <td className="p-4 font-bold text-slate-800">{a.total_days} {a.is_half_day ? '(Half Day)' : 'days'}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${statusCfg.bg} ${statusCfg.text}`}>
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="p-4 max-w-xs truncate text-slate-600">{a.reason}</td>
                        <td className="p-4 text-slate-400">{fmtDate(a.created_at)}</td>
                        {isManager && (
                          <td className="p-4">
                            {a.status.includes('PENDING') ? (
                              <div className="flex gap-1">
                                <button onClick={() => handleApprove(a.id, 'APPROVED')} className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-700">Approve</button>
                                <button onClick={() => handleApprove(a.id, 'REJECTED')} className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-bold hover:bg-red-700">Reject</button>
                              </div>
                            ) : <span className="text-slate-400 text-[10px]">Processed</span>}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── BALANCES & ENCASHMENT TAB ───────────────────────────────────── */}
      {tab === 'balances' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {balances.map(b => {
              const pct = b.total_allocated > 0 ? Math.round((b.remaining_days / b.total_allocated) * 100) : 0;
              return (
                <div key={b.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: b.color || '#3B82F6' }} />
                      {b.leave_type_name}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">{b.leave_type_code}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 rounded-xl p-3">
                    <div><p className="text-lg font-black text-blue-600">{b.remaining_days}</p><p className="text-[10px] text-slate-500">Remaining</p></div>
                    <div><p className="text-lg font-black text-slate-700">{b.used_days}</p><p className="text-[10px] text-slate-500">Used</p></div>
                    <div><p className="text-lg font-black text-slate-400">{b.total_allocated}</p><p className="text-[10px] text-slate-500">Allocated</p></div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Available Quota</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: b.color || '#3B82F6' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {balances.length === 0 && (
            <div className="text-center py-14 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-600">No leave balances found</p>
              <p className="text-xs text-slate-400 mt-1">Assign a leave policy or seed leave types to generate balances</p>
            </div>
          )}
        </div>
      )}

      {/* ─── TEAM AVAILABILITY TAB ───────────────────────────────────────── */}
      {tab === 'availability' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" /> Team Availability & Capacity Matrix
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Real-time team presence, active leaves, and staffing thresholds</p>
              </div>
              <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-200">
                {teamAvailability.filter(t => !t.active_leave_id).length} / {teamAvailability.length} Available Today
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamAvailability.map(t => (
                <div key={t.employee_id} className={`border rounded-2xl p-4 transition-all shadow-sm ${
                  t.active_leave_id ? 'bg-amber-50/60 border-amber-200' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{t.first_name} {t.last_name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{t.employee_code} • {t.department_name}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      t.active_leave_id ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {t.active_leave_id ? 'On Leave' : 'Available'}
                    </span>
                  </div>

                  {t.active_leave_id && (
                    <div className="mt-3 bg-white/80 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900 space-y-1">
                      <p className="font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.leave_type_color || '#F59E0B' }} />
                        {t.leave_type_name}
                      </p>
                      <p className="text-[10px] text-slate-600 font-mono">
                        {fmtDate(t.start_date)} – {fmtDate(t.end_date)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {teamAvailability.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p>Loading team availability...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── PERMANENT LEAVE LEDGER TAB ──────────────────────────────────── */}
      {tab === 'ledger' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" /> Permanent Leave Ledger & Audit Log
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Immutable transaction log of every allocation, accrual, leave taken, adjustment, and carry-forward</p>
              </div>
              <button onClick={() => exportCSV(ledgerTransactions, 'Leave_Ledger.csv')}
                className="flex items-center gap-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl shadow-sm hover:bg-slate-50">
                <Download className="w-3.5 h-3.5" /> Export Ledger CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Leave Type</th>
                    <th className="p-3">Transaction</th>
                    <th className="p-3">Days</th>
                    <th className="p-3">Opening</th>
                    <th className="p-3">Closing</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {ledgerTransactions.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="p-3 font-sans">
                        <p className="font-bold text-slate-900">{l.first_name} {l.last_name}</p>
                        <p className="text-[10px] text-slate-500">{l.employee_code}</p>
                      </td>
                      <td className="p-3 font-sans">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded"
                          style={{ backgroundColor: `${l.color || '#3B82F6'}15`, color: l.color || '#3B82F6' }}>
                          {l.leave_type_name}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-slate-800 text-[10px] px-2 py-0.5 bg-slate-100 rounded">
                          {l.transaction_type}
                        </span>
                      </td>
                      <td className={`p-3 font-bold ${parseFloat(l.days_changed) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {parseFloat(l.days_changed) >= 0 ? `+${l.days_changed}` : l.days_changed}
                      </td>
                      <td className="p-3 text-slate-500">{l.opening_balance}</td>
                      <td className="p-3 font-bold text-slate-900">{l.closing_balance}</td>
                      <td className="p-3 font-sans text-slate-600 max-w-xs truncate">{l.description}</td>
                      <td className="p-3 text-slate-400 font-sans text-[10px]">{fmtDate(l.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {ledgerTransactions.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p>No ledger transactions recorded yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── COMP-OFF HUB TAB ────────────────────────────────────────────── */}
      {tab === 'compoff' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-600" /> Compensatory Off (Comp-Off) Hub
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Manage comp-off credit requests for holiday or weekend work</p>
              </div>
              <button onClick={async () => {
                const date_worked = prompt('Enter Date Worked (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
                const reason = prompt('Enter Reason / Holiday Worked:');
                if (date_worked && reason) {
                  await apiClient.post('/leave/comp-off/request', { date_worked, days: 1.0, reason });
                  alert('✅ Comp-off request submitted!');
                  fetchHRData();
                }
              }} className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow">
                <Plus className="w-4 h-4" /> Request Comp-Off
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Date Worked</th>
                    <th className="p-3">Days Granted</th>
                    <th className="p-3">Expiry Date</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3">Status</th>
                    {isManager && <th className="p-3">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {compOffs.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{c.first_name} {c.last_name} <span className="text-[10px] text-slate-400 font-mono">({c.employee_code})</span></td>
                      <td className="p-3 font-mono">{fmtDate(c.date_worked)}</td>
                      <td className="p-3 font-bold text-emerald-600">+{c.days_granted} day</td>
                      <td className="p-3 font-mono text-slate-500">{fmtDate(c.expiry_date)}</td>
                      <td className="p-3 text-slate-600 max-w-xs truncate">{c.reason}</td>
                      <td className="p-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          c.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>{c.status}</span>
                      </td>
                      {isManager && (
                        <td className="p-3">
                          {c.status === 'PENDING' ? (
                            <button onClick={async () => {
                              await apiClient.patch(`/leave/comp-off/${c.id}/approve`);
                              fetchHRData();
                              fetchData();
                            }} className="px-2 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded hover:bg-emerald-700">
                              Approve & Credit
                            </button>
                          ) : <span className="text-slate-400 text-[10px]">Credited</span>}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {compOffs.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Award className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p>No comp-off requests found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── POLICIES TAB (HR/Admin) ─────────────────────────────────────── */}
      {tab === 'policies' && isHRAdmin && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500 font-semibold">{policies.length} Leave Policies Configured</p>
            <button onClick={() => setShowPolicyModal(true)} className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow">
              <Plus className="w-4 h-4" /> Create Leave Policy
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {policies.map(p => (
              <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">CODE: {p.code} • Type: {p.leave_type_name}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${p.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                    {p.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {p.description && <p className="text-xs text-slate-600">{p.description}</p>}

                <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-3 text-xs text-slate-700">
                  <div><p className="text-slate-400 text-[10px]">Annual Quota</p><p className="font-bold">{p.annual_allocation} days</p></div>
                  <div><p className="text-slate-400 text-[10px]">Monthly Accrual</p><p className="font-bold">{p.monthly_accrual} days</p></div>
                  <div><p className="text-slate-400 text-[10px]">Max Balance</p><p className="font-bold">{p.max_balance} days</p></div>
                  <div><p className="text-slate-400 text-[10px]">Carry Forward</p><p className="font-bold">{p.carry_forward_limit} days</p></div>
                  <div><p className="text-slate-400 text-[10px]">Notice Days</p><p className="font-bold">{p.min_notice_days} days</p></div>
                  <div><p className="text-slate-400 text-[10px]">Assigned Employees</p><p className="font-bold text-blue-600">{p.assigned_count}</p></div>
                </div>

                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  {p.half_day_allowed && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">Half-Day</span>}
                  {p.negative_balance_allowed && <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded">Negative Bal</span>}
                  {p.probation_applicable && <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded">Probation</span>}
                  {p.attachment_required && <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded">Medical Cert Req</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── ASSIGNMENTS TAB ──────────────────────────────────────────────── */}
      {tab === 'assignments' && isHRAdmin && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500 font-semibold">{assignments.length} Policy Assignments</p>
            <button onClick={() => setShowAssignModal(true)} className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow">
              <Plus className="w-4 h-4" /> Assign Policy
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Policy</th>
                    <th className="p-4">Assigned Target</th>
                    <th className="p-4">Scope</th>
                    <th className="p-4">Effective Date</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-slate-900">{a.policy_name} <span className="text-[10px] text-slate-400 font-mono">[{a.policy_code}]</span></td>
                      <td className="p-4 font-semibold text-slate-800">
                        {a.first_name ? `${a.first_name} ${a.last_name} (${a.employee_code})`
                          : a.department_name ? `Dept: ${a.department_name}`
                          : a.branch_name ? `Branch: ${a.branch_name}`
                          : a.role ? `Role: ${a.role}` : 'Company-wide'}
                      </td>
                      <td className="p-4 text-slate-500">
                        {a.employee_id ? 'Employee' : a.department_name ? 'Department' : 'Global'}
                      </td>
                      <td className="p-4 font-mono">{fmtDate(a.effective_date)}</td>
                      <td className="p-4">
                        <span className="bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded text-[10px]">Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── SETTINGS TAB (HR/Admin) ─────────────────────────────────────── */}
      {tab === 'settings' && isHRAdmin && settings && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 max-w-2xl">
          <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" /> Leave Module Configuration
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700">Leave Year Start Month</label>
              <select value={settings.leave_year_start_month}
                onChange={e => setSettings({...settings, leave_year_start_month: parseInt(e.target.value)})}
                className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none">
                <option value={1}>January (Calendar Year)</option>
                <option value={4}>April (Financial Year)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div>
                <p className="font-bold text-slate-800">Auto Carry Forward at Year End</p>
                <p className="text-slate-500 text-[10px]">Automatically roll unused eligible leaves into new leave year</p>
              </div>
              <input type="checkbox" checked={settings.auto_carry_forward}
                onChange={e => setSettings({...settings, auto_carry_forward: e.target.checked})} />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div>
                <p className="font-bold text-slate-800">Sandwich Rule Enabled</p>
                <p className="text-slate-500 text-[10px]">Treat weekends/holidays between leave days as leave</p>
              </div>
              <input type="checkbox" checked={settings.sandwich_rule_enabled}
                onChange={e => setSettings({...settings, sandwich_rule_enabled: e.target.checked})} />
            </div>

            <button onClick={async () => { await apiClient.post('/leave/settings', settings); alert('✅ Settings saved!'); }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow">
              Save Configuration
            </button>
          </div>
        </div>
      )}

      {/* ─── APPLY LEAVE MODAL ─────────────────────────────────────────────── */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Apply for Leave</h3>
              <button onClick={() => setShowApplyModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleApplySubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Leave Type *</label>
                <select required value={applyForm.leave_type_id} onChange={e => setApplyForm({...applyForm, leave_type_id: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Select Leave Type...</option>
                  {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.days_allowed} days/yr)</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Start Date *</label>
                  <input required type="date" value={applyForm.start_date} onChange={e => setApplyForm({...applyForm, start_date: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">End Date *</label>
                  <input required type="date" value={applyForm.end_date} onChange={e => setApplyForm({...applyForm, end_date: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input type="checkbox" checked={applyForm.is_half_day} onChange={e => setApplyForm({...applyForm, is_half_day: e.target.checked})} />
                <label className="font-semibold text-slate-700">Half Day Leave</label>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Reason *</label>
                <textarea required rows={3} value={applyForm.reason} onChange={e => setApplyForm({...applyForm, reason: e.target.value})}
                  placeholder="State the reason for leave..." className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowApplyModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold shadow">{submitting ? 'Submitting...' : 'Submit'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── CREATE POLICY MODAL ────────────────────────────────────────────── */}
      {showPolicyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Create Leave Policy</h3>
              <button onClick={() => setShowPolicyModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreatePolicy} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Policy Name *</label>
                  <input required value={policyForm.name} onChange={e => setPolicyForm({...policyForm, name: e.target.value})}
                    placeholder="e.g. Standard Full-time Policy" className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Policy Code *</label>
                  <input required value={policyForm.code} onChange={e => setPolicyForm({...policyForm, code: e.target.value})}
                    placeholder="e.g. POL_STD_2026" className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Target Leave Type *</label>
                <select required value={policyForm.leave_type_id} onChange={e => setPolicyForm({...policyForm, leave_type_id: parseInt(e.target.value)})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                  {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Annual Quota</label>
                  <input type="number" value={policyForm.annual_allocation} onChange={e => setPolicyForm({...policyForm, annual_allocation: parseFloat(e.target.value)})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Max Balance</label>
                  <input type="number" value={policyForm.max_balance} onChange={e => setPolicyForm({...policyForm, max_balance: parseFloat(e.target.value)})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Carry Forward Limit</label>
                  <input type="number" value={policyForm.carry_forward_limit} onChange={e => setPolicyForm({...policyForm, carry_forward_limit: parseFloat(e.target.value)})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowPolicyModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold shadow">{submitting ? 'Creating...' : 'Create Policy'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ASSIGN POLICY MODAL ────────────────────────────────────────────── */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Assign Leave Policy</h3>
              <button onClick={() => setShowAssignModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAssignPolicy} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Select Policy *</label>
                <select required value={assignForm.policy_id} onChange={e => setAssignForm({...assignForm, policy_id: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                  <option value="">Select Policy...</option>
                  {policies.map(p => <option key={p.id} value={p.id}>{p.name} ({p.leave_type_name})</option>)}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Target Employee ID (Optional for specific employee)</label>
                <input value={assignForm.employee_id} onChange={e => setAssignForm({...assignForm, employee_id: e.target.value})}
                  placeholder="e.g. 5" className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Target Department ID (Optional for department-wide)</label>
                <input value={assignForm.department_id} onChange={e => setAssignForm({...assignForm, department_id: e.target.value})}
                  placeholder="e.g. 1" className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAssignModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold shadow">{submitting ? 'Assigning...' : 'Assign Policy'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
