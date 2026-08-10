import React, { useState, useEffect, useCallback } from 'react';
import {
  FileEdit, Clock, CheckCircle2, XCircle, AlertCircle,
  ChevronRight, Plus, X, MessageSquare, History, BarChart2,
  Search, Filter, RefreshCw, Download, Send, Flag, Eye,
  User, Calendar, Zap, AlertTriangle, Shield, ClipboardList,
  ChevronDown, CheckSquare, Inbox
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

// ─── Types ─────────────────────────────────────────────────────────────────
interface Regularization {
  id: number;
  employee_id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
  designation: string;
  department_name: string;
  attendance_date: string;
  request_type: string;
  requested_punch_in: string | null;
  requested_punch_out: string | null;
  reason: string;
  supporting_notes: string | null;
  status: string;
  manager_comment: string | null;
  hr_comment: string | null;
  admin_comment: string | null;
  rejection_reason: string | null;
  attendance_updated: boolean;
  created_at: string;
  existing_attendance?: any;
  comments?: Comment[];
  audit_trail?: AuditEntry[];
}

interface Comment {
  id: number;
  commenter_id: number;
  first_name: string;
  last_name: string;
  role: string;
  comment: string;
  is_internal: boolean;
  created_at: string;
}

interface AuditEntry {
  id: number;
  actor_id: number;
  first_name: string;
  last_name: string;
  role: string;
  action: string;
  from_status: string | null;
  to_status: string;
  notes: string;
  created_at: string;
}

interface Stats {
  overall: any;
  department: any[];
  manager: any[];
}

interface RequestType {
  value: string;
  label: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  PENDING_MANAGER: { label: 'Pending Manager', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: '#F59E0B' },
  PENDING_HR:      { label: 'Pending HR',      color: 'bg-blue-100 text-blue-700 border-blue-200',   dot: '#3B82F6' },
  PENDING_ADMIN:   { label: 'Pending Admin',   color: 'bg-purple-100 text-purple-700 border-purple-200', dot: '#8B5CF6' },
  INFO_REQUESTED:  { label: 'Info Requested',  color: 'bg-orange-100 text-orange-700 border-orange-200', dot: '#F97316' },
  APPROVED:        { label: 'Approved',         color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: '#10B981' },
  REJECTED:        { label: 'Rejected',         color: 'bg-red-100 text-red-700 border-red-200',       dot: '#EF4444' },
  CANCELLED:       { label: 'Cancelled',        color: 'bg-slate-100 text-slate-500 border-slate-200', dot: '#94A3B8' },
  DRAFT:           { label: 'Draft',            color: 'bg-slate-100 text-slate-500 border-slate-200', dot: '#94A3B8' },
};

const REQ_TYPE_LABELS: Record<string, string> = {
  MISSED_PUNCH_IN: 'Missed Clock In', MISSED_PUNCH_OUT: 'Missed Clock Out',
  LATE_ARRIVAL: 'Late Arrival', EARLY_DEPARTURE: 'Early Departure',
  WRONG_STATUS: 'Wrong Status', FORGOT_BREAK: 'Forgot Break',
  FORGOT_BREAK_END: 'Forgot Break End', WFH_CORRECTION: 'WFH Correction',
  BUSINESS_VISIT: 'Business Visit', TRAINING: 'Training',
  SYSTEM_ERROR: 'System Error', GPS_FAILURE: 'GPS Failure',
  MANUAL_ENTRY: 'Manual Entry', CUSTOM: 'Custom',
};

const REQ_TYPE_ICONS: Record<string, string> = {
  MISSED_PUNCH_IN: '⏰', MISSED_PUNCH_OUT: '🔔', LATE_ARRIVAL: '🚶',
  EARLY_DEPARTURE: '🏃', WRONG_STATUS: '⚠️', FORGOT_BREAK: '☕',
  WFH_CORRECTION: '🏠', BUSINESS_VISIT: '🏢', TRAINING: '📚',
  SYSTEM_ERROR: '🔧', GPS_FAILURE: '📍', MANUAL_ENTRY: '✍️', CUSTOM: '📋',
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-slate-100 text-slate-600 border-slate-200', dot: '#94A3B8' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded border ${cfg.color}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
      {cfg.label}
    </span>
  );
};

const fmtDate = (s: string) => s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (s: string) => s ? new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtTime = (s: string | null) => s ? new Date(s).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';

// ─── Sub-components ────────────────────────────────────────────────────────
const DetailDrawer: React.FC<{
  reg: Regularization | null;
  onClose: () => void;
  onAction: (id: number, action: string, comment: string) => Promise<void>;
  canApprove: boolean;
  userId: number;
  userRole: string;
}> = ({ reg, onClose, onAction, canApprove, userId, userRole }) => {
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');

  if (!reg) return null;

  const handleAction = async (action: string) => {
    if (!comment.trim() && ['REJECTED', 'INFO_REQUESTED'].includes(action)) {
      alert('Please provide a comment/reason before proceeding.');
      return;
    }
    setSubmitting(true);
    try {
      await onAction(reg.id, action, comment);
      setComment('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      await apiClient.post(`/attendance/regularizations/${reg.id}/comments`, { comment: newComment });
      setNewComment('');
    } finally {
      setSubmitting(false);
    }
  };

  const isPending = ['PENDING_MANAGER', 'PENDING_HR', 'PENDING_ADMIN', 'INFO_REQUESTED'].includes(reg.status);
  const isOwn = reg.employee_id === userId;
  const canCancel = isOwn && ['PENDING_MANAGER', 'INFO_REQUESTED', 'DRAFT'].includes(reg.status);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-end">
      <div className="w-full max-w-xl h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div>
            <p className="font-black text-slate-900 text-sm">Request #{reg.id}</p>
            <p className="text-xs text-slate-500 font-mono">{reg.employee_code} • {reg.first_name} {reg.last_name}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={reg.status} />
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Request Info */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-slate-500 font-semibold mb-0.5">Date</p><p className="font-bold text-slate-800">{fmtDate(reg.attendance_date)}</p></div>
              <div><p className="text-slate-500 font-semibold mb-0.5">Type</p>
                <p className="font-bold text-slate-800">{REQ_TYPE_ICONS[reg.request_type]} {REQ_TYPE_LABELS[reg.request_type] || reg.request_type}</p>
              </div>
              <div><p className="text-slate-500 font-semibold mb-0.5">Requested Clock In</p><p className="font-mono text-slate-800">{fmtTime(reg.requested_punch_in)}</p></div>
              <div><p className="text-slate-500 font-semibold mb-0.5">Requested Clock Out</p><p className="font-mono text-slate-800">{fmtTime(reg.requested_punch_out)}</p></div>
            </div>
            <div><p className="text-slate-500 font-semibold mb-0.5">Reason</p><p className="text-slate-700">{reg.reason}</p></div>
            {reg.supporting_notes && <div><p className="text-slate-500 font-semibold mb-0.5">Notes</p><p className="text-slate-600">{reg.supporting_notes}</p></div>}
            {reg.rejection_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 font-bold mb-0.5">Rejection Reason</p>
                <p className="text-red-700">{reg.rejection_reason}</p>
              </div>
            )}
            {reg.attendance_updated && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-emerald-700 text-xs font-bold">Attendance record has been corrected automatically</p>
              </div>
            )}
          </div>

          {/* Existing Attendance */}
          {reg.existing_attendance && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 text-xs">
              <p className="font-bold text-blue-800 mb-2">Existing Attendance Record</p>
              <div className="grid grid-cols-3 gap-2 text-blue-700">
                <div><p className="text-blue-500">Clock In</p><p className="font-mono">{fmtTime(reg.existing_attendance.punch_in)}</p></div>
                <div><p className="text-blue-500">Clock Out</p><p className="font-mono">{fmtTime(reg.existing_attendance.punch_out)}</p></div>
                <div><p className="text-blue-500">Status</p><p className="font-bold">{reg.existing_attendance.status}</p></div>
              </div>
            </div>
          )}

          {/* Approval Actions */}
          {isPending && canApprove && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-slate-700">Manager / HR Action</p>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                placeholder="Add a comment (required for rejection)..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
              <div className="flex flex-wrap gap-2">
                <button onClick={() => handleAction('approve')} disabled={submitting}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                </button>
                <button onClick={() => handleAction('reject')} disabled={submitting}
                  className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow">
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
                <button onClick={() => handleAction('request-info')} disabled={submitting}
                  className="flex items-center gap-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 text-xs font-bold px-3 py-2 rounded-lg border border-orange-200">
                  <AlertCircle className="w-3.5 h-3.5" /> Request Info
                </button>
                {(userRole === 'DEPT_HEAD') && (
                  <button onClick={() => handleAction('forward-hr')} disabled={submitting}
                    className="flex items-center gap-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-bold px-3 py-2 rounded-lg border border-blue-200">
                    <Send className="w-3.5 h-3.5" /> Forward HR
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Cancel by Employee */}
          {canCancel && (
            <button onClick={() => handleAction('cancel')} disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold py-2.5 rounded-lg border border-slate-200">
              <X className="w-3.5 h-3.5" /> Cancel Request
            </button>
          )}

          {/* Audit Trail */}
          {reg.audit_trail && reg.audit_trail.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><History className="w-3.5 h-3.5 text-slate-400" /> Audit Trail</p>
              <div className="relative pl-4 border-l-2 border-slate-200 space-y-3 ml-1">
                {reg.audit_trail.map((a, i) => (
                  <div key={a.id} className="relative text-xs">
                    <span className="absolute -left-[21px] w-4 h-4 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center" />
                    <p className="font-bold text-slate-800">{a.action.replace(/_/g, ' ')}</p>
                    <p className="text-slate-500">{a.first_name} {a.last_name} • {fmtDateTime(a.created_at)}</p>
                    {a.notes && <p className="text-slate-600 mt-0.5 italic">"{a.notes}"</p>}
                    {a.from_status && <p className="text-[10px] text-slate-400 font-mono">{a.from_status} → {a.to_status}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments Thread */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-slate-400" /> Comments ({reg.comments?.length || 0})</p>
            {reg.comments?.map(c => (
              <div key={c.id} className={`rounded-xl p-3 text-xs border ${c.is_internal ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200'}`}>
                <p className="font-bold text-slate-800">{c.first_name} {c.last_name}
                  <span className="text-slate-400 font-mono ml-2">{c.role}</span>
                  {c.is_internal && <span className="ml-2 text-indigo-600 text-[10px] font-bold bg-indigo-100 px-1.5 py-0.5 rounded">Internal</span>}
                </p>
                <p className="text-slate-700 mt-1">{c.comment}</p>
                <p className="text-slate-400 mt-0.5 text-[10px]">{fmtDateTime(c.created_at)}</p>
              </div>
            ))}

            {/* Add comment */}
            <div className="flex gap-2">
              <input value={newComment} onChange={e => setNewComment(e.target.value)}
                placeholder="Add comment..."
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
              />
              <button onClick={handleAddComment} disabled={!newComment.trim() || submitting}
                className="px-3 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-40">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────
export const AttendanceRegularizationTab: React.FC = () => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const userId = (user as any)?.id || 0;
  const isManager = ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'DEPT_HEAD'].includes(userRole);

  const [tab, setTab] = useState<'my-requests' | 'approvals' | 'reports'>('my-requests');
  const [requests, setRequests] = useState<Regularization[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Regularization[]>([]);
  const [selected, setSelected] = useState<Regularization | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<Regularization | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [bulkSelected, setBulkSelected] = useState<number[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [form, setForm] = useState({
    attendance_date: new Date().toISOString().split('T')[0],
    request_type: 'MISSED_PUNCH_IN',
    requested_punch_in: '',
    requested_punch_out: '',
    reason: '',
    supporting_notes: '',
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [reqRes, typesRes] = await Promise.all([
        apiClient.get('/attendance/regularizations'),
        apiClient.get('/attendance/regularizations/request-types').catch(() => ({ data: { data: [] } })),
      ]);
      setRequests(reqRes.data?.data || []);
      setRequestTypes(typesRes.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const fetchPending = useCallback(async () => {
    if (!isManager) return;
    try {
      const res = await apiClient.get('/attendance/pending-approvals');
      setPendingApprovals(res.data?.data || []);
    } catch (e) { console.error(e); }
  }, [isManager]);

  const fetchStats = useCallback(async () => {
    if (!isManager) return;
    try {
      const res = await apiClient.get('/attendance/regularizations/stats');
      setStats(res.data?.data || null);
    } catch (e) { console.error(e); }
  }, [isManager]);

  useEffect(() => { fetchAll(); fetchPending(); }, []);
  useEffect(() => { if (tab === 'reports') fetchStats(); }, [tab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/attendance/regularizations', {
        ...form,
        requested_punch_in: form.requested_punch_in
          ? `${form.attendance_date}T${form.requested_punch_in}:00` : undefined,
        requested_punch_out: form.requested_punch_out
          ? `${form.attendance_date}T${form.requested_punch_out}:00` : undefined,
      });
      setShowForm(false);
      setForm({ attendance_date: new Date().toISOString().split('T')[0], request_type: 'MISSED_PUNCH_IN', requested_punch_in: '', requested_punch_out: '', reason: '', supporting_notes: '' });
      await fetchAll();
      alert('✅ Regularization request submitted! Your manager will review it shortly.');
    } catch (e: any) {
      alert(e.response?.data?.message || 'Submission failed');
    } finally { setSubmitting(false); }
  };

  const handleAction = async (id: number, action: string, comment: string) => {
    try {
      if (action === 'cancel') {
        await apiClient.delete(`/attendance/regularizations/${id}`);
      } else if (action === 'approve') {
        await apiClient.patch(`/attendance/regularizations/${id}/approve`, { comment });
      } else if (action === 'reject') {
        await apiClient.patch(`/attendance/regularizations/${id}/reject`, { comment, rejection_reason: comment });
      } else if (action === 'request-info') {
        await apiClient.patch(`/attendance/regularizations/${id}/request-info`, { comment });
      } else if (action === 'forward-hr') {
        await apiClient.patch(`/attendance/regularizations/${id}/forward-hr`, { comment });
      }
      setSelectedDetail(null);
      await Promise.all([fetchAll(), fetchPending()]);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Action failed');
      throw e;
    }
  };

  const openDetail = async (reg: Regularization) => {
    try {
      const res = await apiClient.get(`/attendance/regularizations/${reg.id}`);
      setSelectedDetail(res.data?.data || reg);
    } catch {
      setSelectedDetail(reg);
    }
  };

  const handleBulkApprove = async () => {
    if (!bulkSelected.length) return;
    if (!confirm(`Approve ${bulkSelected.length} selected request(s)?`)) return;
    try {
      const res = await apiClient.post('/attendance/regularizations/bulk-approve', { ids: bulkSelected });
      const d = res.data?.data || [];
      const ok = d.filter((r: any) => r.success).length;
      alert(`✅ Bulk approved: ${ok}/${bulkSelected.length} successful`);
      setBulkSelected([]);
      await Promise.all([fetchAll(), fetchPending()]);
    } catch (e: any) { alert(e.response?.data?.message || 'Bulk action failed'); }
  };

  const exportCSV = (data: any[], filename: string) => {
    if (!data.length) return alert('No data to export');
    const headers = Object.keys(data[0]).filter(k => !['comments', 'audit_trail', 'existing_attendance'].includes(k)).join(',');
    const rows = data.map(r => Object.entries(r).filter(([k]) => !['comments', 'audit_trail', 'existing_attendance'].includes(k)).map(([, v]) => `"${String(v || '').replace(/"/g, '""')}"`).join(','));
    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  };

  const filteredRequests = requests.filter(r => {
    const matchSearch = !search ||
      `${r.first_name} ${r.last_name} ${r.employee_code} ${r.reason} ${r.attendance_date}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const TABS = [
    { key: 'my-requests', label: 'My Requests', icon: <FileEdit className="w-4 h-4" />, count: requests.filter(r => r.employee_id === userId).length },
    ...(isManager ? [
      { key: 'approvals', label: 'Approval Queue', icon: <Inbox className="w-4 h-4" />, count: pendingApprovals.length },
      { key: 'reports', label: 'Analytics', icon: <BarChart2 className="w-4 h-4" />, count: undefined },
    ] : []),
  ];

  return (
    <div className="space-y-5 min-h-screen pb-10">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-violet-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-violet-900/40">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-violet-600/30 rounded-xl">
                <FileEdit className="w-6 h-6 text-violet-300" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Attendance Regularization</h2>
                <p className="text-xs text-violet-300/70 font-mono mt-0.5">Correction Requests • Multi-Level Approval • Real-time Attendance Sync</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" /> New Request
          </button>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {[
            { label: 'Total Requests', value: requests.length, color: 'text-violet-300' },
            { label: 'Pending', value: requests.filter(r => r.status.startsWith('PENDING')).length, color: 'text-amber-300' },
            { label: 'Approved', value: requests.filter(r => r.status === 'APPROVED').length, color: 'text-emerald-300' },
            ...(isManager ? [{ label: 'Pending Your Action', value: pendingApprovals.length, color: 'text-rose-300' }]
              : [{ label: 'Rejected', value: requests.filter(r => r.status === 'REJECTED').length, color: 'text-red-300' }]),
          ].map(s => (
            <div key={s.label} className="bg-white/5 rounded-xl p-3 border border-white/10">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              tab === t.key ? 'bg-white text-violet-700 shadow-sm border border-violet-100' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.icon} {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={`${tab === t.key ? 'bg-violet-100 text-violet-700' : 'bg-slate-200 text-slate-600'} text-[10px] font-black px-1.5 py-0.5 rounded-full`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── MY REQUESTS TAB ───────────────────────────────────────────────── */}
      {tab === 'my-requests' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, reason, date..."
                className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-violet-500 outline-none bg-white"
              />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-700 bg-white focus:ring-2 focus:ring-violet-500 outline-none">
              <option value="">All Statuses</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <button onClick={fetchAll} className="p-2.5 bg-white border border-slate-300 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={() => exportCSV(filteredRequests, `Regularizations_${new Date().toISOString().split('T')[0]}.csv`)}
              className="flex items-center gap-2 text-xs font-bold bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 px-3 py-2.5 rounded-xl">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                  <tr>
                    {isManager && <th className="p-4 w-10"><input type="checkbox" onChange={e => setBulkSelected(e.target.checked ? filteredRequests.filter(r => r.status.startsWith('PENDING')).map(r => r.id) : [])} /></th>}
                    <th className="p-4">Employee</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Times</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Submitted</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={8} className="text-center py-8 text-slate-400">Loading...</td></tr>
                  ) : filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-14">
                        <FileEdit className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                        <p className="font-bold text-slate-500">No requests found</p>
                        <p className="text-slate-400 text-xs mt-1">Submit a new regularization request using the button above</p>
                      </td>
                    </tr>
                  ) : filteredRequests.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => openDetail(r)}>
                      {isManager && (
                        <td className="p-4" onClick={e => e.stopPropagation()}>
                          {r.status.startsWith('PENDING') && (
                            <input type="checkbox" checked={bulkSelected.includes(r.id)}
                              onChange={e => setBulkSelected(prev => e.target.checked ? [...prev, r.id] : prev.filter(i => i !== r.id))}
                            />
                          )}
                        </td>
                      )}
                      <td className="p-4">
                        <p className="font-bold text-slate-900">{r.first_name} {r.last_name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{r.employee_code} • {r.department_name}</p>
                      </td>
                      <td className="p-4 font-mono text-slate-700">{fmtDate(r.attendance_date)}</td>
                      <td className="p-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-lg text-[11px] font-bold">
                          {REQ_TYPE_ICONS[r.request_type]} {REQ_TYPE_LABELS[r.request_type] || r.request_type}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-600">
                        {fmtTime(r.requested_punch_in)} – {fmtTime(r.requested_punch_out)}
                      </td>
                      <td className="p-4"><StatusBadge status={r.status} /></td>
                      <td className="p-4 text-slate-500">{fmtDate(r.created_at)}</td>
                      <td className="p-4">
                        <button className="flex items-center gap-1 text-violet-600 font-bold text-[11px] hover:text-violet-800">
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bulk Actions */}
          {isManager && bulkSelected.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-2xl px-6 py-3.5 flex items-center gap-4 shadow-xl border border-slate-700 z-40">
              <p className="text-sm font-bold">{bulkSelected.length} selected</p>
              <button onClick={handleBulkApprove} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5" /> Bulk Approve
              </button>
              <button onClick={() => setBulkSelected([])} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      )}

      {/* ─── APPROVAL QUEUE TAB ─────────────────────────────────────────────── */}
      {tab === 'approvals' && isManager && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Inbox className="w-4 h-4 text-violet-500" /> Pending Approval Queue
              <span className="bg-violet-100 text-violet-700 text-xs font-black px-2 py-0.5 rounded-full">{pendingApprovals.length}</span>
            </h3>
            <div className="flex gap-2">
              {pendingApprovals.length > 0 && (
                <button onClick={() => setBulkSelected(pendingApprovals.map(r => r.id))}
                  className="text-xs font-bold bg-violet-100 text-violet-700 px-3 py-2 rounded-lg border border-violet-200">
                  Select All
                </button>
              )}
              {bulkSelected.length > 0 && (
                <button onClick={handleBulkApprove} className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow">
                  <CheckSquare className="w-3.5 h-3.5" /> Bulk Approve ({bulkSelected.length})
                </button>
              )}
            </div>
          </div>

          {pendingApprovals.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
              <p className="font-bold text-slate-600">All caught up!</p>
              <p className="text-xs text-slate-400 mt-1">No pending regularization requests requiring your action.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingApprovals.map(r => (
                <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <input type="checkbox" checked={bulkSelected.includes(r.id)}
                        onChange={e => setBulkSelected(prev => e.target.checked ? [...prev, r.id] : prev.filter(i => i !== r.id))}
                        className="mt-1"
                      />
                      <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center text-base shrink-0">
                        {REQ_TYPE_ICONS[r.request_type] || '📋'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{r.first_name} {r.last_name}
                          <span className="text-slate-400 font-mono text-xs ml-2">{r.employee_code}</span>
                        </p>
                        <p className="text-xs text-slate-500">{r.department_name}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">📅 {fmtDate(r.attendance_date)}</span>
                          <span className="bg-violet-50 text-violet-700 px-2 py-0.5 rounded font-bold">{REQ_TYPE_LABELS[r.request_type]}</span>
                          <span className="font-mono text-slate-600">{fmtTime(r.requested_punch_in)} – {fmtTime(r.requested_punch_out)}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{r.reason}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={r.status} />
                      <button onClick={() => openDetail(r)} className="flex items-center gap-1 text-violet-600 font-bold text-xs hover:text-violet-800 bg-violet-50 px-3 py-1.5 rounded-lg border border-violet-200">
                        <Eye className="w-3.5 h-3.5" /> Review
                      </button>
                      <button onClick={async () => { await handleAction(r.id, 'approve', 'Approved'); fetchPending(); }}
                        className="text-xs bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-200 border border-emerald-200">
                        ✓ Approve
                      </button>
                    </div>
                  </div>
                  {r.existing_attendance && (
                    <div className="mt-3 ml-12 bg-blue-50 rounded-lg p-2 text-xs text-blue-700 border border-blue-200 flex gap-4">
                      <span>Existing: ⏰ {fmtTime(r.existing_attendance.punch_in)} – {fmtTime(r.existing_attendance.punch_out)}</span>
                      <span>Status: <b>{r.existing_attendance.status}</b></span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── REPORTS / ANALYTICS TAB ────────────────────────────────────────── */}
      {tab === 'reports' && isManager && (
        <div className="space-y-5">
          {/* Overall Stats */}
          {stats?.overall && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[
                { label: 'Total Requests', value: stats.overall.total, color: 'bg-violet-50 border-violet-200 text-violet-800' },
                { label: 'Approved', value: stats.overall.approved, color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
                { label: 'Rejected', value: stats.overall.rejected, color: 'bg-red-50 border-red-200 text-red-800' },
                { label: 'Pending', value: stats.overall.pending, color: 'bg-amber-50 border-amber-200 text-amber-800' },
                { label: 'Avg Approval (hrs)', value: stats.overall.avg_approval_hours || '—', color: 'bg-blue-50 border-blue-200 text-blue-800' },
              ].map(s => (
                <div key={s.label} className={`${s.color} border rounded-xl p-4`}>
                  <p className="text-2xl font-black">{s.value}</p>
                  <p className="text-[10px] uppercase font-bold tracking-wider mt-0.5 opacity-70">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Request Type Breakdown */}
          {stats?.overall && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <h4 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-violet-500" /> Request Type Breakdown
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'missed_punch_in', label: 'Missed Clock In', icon: '⏰' },
                  { key: 'missed_punch_out', label: 'Missed Clock Out', icon: '🔔' },
                  { key: 'late_arrival', label: 'Late Arrival', icon: '🚶' },
                  { key: 'early_departure', label: 'Early Departure', icon: '🏃' },
                  { key: 'wfh_correction', label: 'WFH Correction', icon: '🏠' },
                ].map(t => (
                  <div key={t.key} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-center">
                    <p className="text-2xl mb-1">{t.icon}</p>
                    <p className="font-black text-slate-800 text-lg">{stats.overall[t.key] || 0}</p>
                    <p className="text-slate-500 text-[10px]">{t.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Department Table */}
          {stats?.department && stats.department.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h4 className="font-bold text-slate-800 text-sm">Department Statistics</h4>
                <button onClick={() => exportCSV(stats.department, 'Dept_RegStats.csv')} className="text-xs bg-slate-100 text-slate-600 font-bold px-3 py-1.5 rounded-lg border border-slate-200">Export</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Department</th>
                      <th className="p-4">Total</th>
                      <th className="p-4">Approved</th>
                      <th className="p-4">Rejected</th>
                      <th className="p-4">Pending</th>
                      <th className="p-4">Approval Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.department.map((d: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-4 font-bold text-slate-800">{d.department_name}</td>
                        <td className="p-4">{d.total_requests}</td>
                        <td className="p-4 text-emerald-600 font-semibold">{d.approved}</td>
                        <td className="p-4 text-red-600 font-semibold">{d.rejected}</td>
                        <td className="p-4 text-amber-600 font-semibold">{d.pending}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 bg-slate-200 rounded-full w-20 overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${d.total_requests ? Math.round((d.approved / d.total_requests) * 100) : 0}%` }} />
                            </div>
                            <span className="font-mono text-[10px]">{d.total_requests ? Math.round((d.approved / d.total_requests) * 100) : 0}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Manager Table */}
          {stats?.manager && stats.manager.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h4 className="font-bold text-slate-800 text-sm">Manager Response Statistics</h4>
                <button onClick={() => exportCSV(stats.manager, 'Manager_RegStats.csv')} className="text-xs bg-slate-100 text-slate-600 font-bold px-3 py-1.5 rounded-lg border border-slate-200">Export</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Manager</th>
                      <th className="p-4">Assigned</th>
                      <th className="p-4">Approved</th>
                      <th className="p-4">Rejected</th>
                      <th className="p-4">Pending</th>
                      <th className="p-4">Avg Response (hrs)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.manager.map((m: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-4">
                          <p className="font-bold text-slate-900">{m.first_name} {m.last_name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{m.employee_code}</p>
                        </td>
                        <td className="p-4">{m.total_assigned}</td>
                        <td className="p-4 text-emerald-600 font-semibold">{m.approved}</td>
                        <td className="p-4 text-red-600 font-semibold">{m.rejected}</td>
                        <td className="p-4 text-amber-600 font-semibold">{m.pending}</td>
                        <td className="p-4 font-mono">{m.avg_response_hours || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!stats && (
            <div className="text-center py-12 text-slate-400">
              <BarChart2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p>Loading analytics data...</p>
            </div>
          )}
        </div>
      )}

      {/* ─── SUBMIT REQUEST MODAL ───────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-violet-600" /> New Regularization Request
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              {/* Info Banner */}
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-xs text-violet-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Submit this form to request an attendance correction. Your manager will be notified immediately. Approved requests automatically update your attendance record.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-500 font-semibold">Attendance Date *</label>
                  <input required type="date" value={form.attendance_date}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={e => setForm({...form, attendance_date: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-violet-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-semibold">Request Type *</label>
                  <select required value={form.request_type} onChange={e => setForm({...form, request_type: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-violet-500 outline-none">
                    {(requestTypes.length > 0 ? requestTypes : Object.entries(REQ_TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }))).map(t => (
                      <option key={t.value} value={t.value}>{REQ_TYPE_ICONS[t.value]} {t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-500 font-semibold">Correct Clock In Time</label>
                  <input type="time" value={form.requested_punch_in}
                    onChange={e => setForm({...form, requested_punch_in: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-violet-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-500 font-semibold">Correct Clock Out Time</label>
                  <input type="time" value={form.requested_punch_out}
                    onChange={e => setForm({...form, requested_punch_out: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-violet-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-500 font-semibold">Reason for Correction *</label>
                <textarea required value={form.reason} onChange={e => setForm({...form, reason: e.target.value})}
                  rows={3} placeholder="Explain why the attendance needs to be corrected..."
                  className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-violet-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-slate-500 font-semibold">Supporting Notes (optional)</label>
                <textarea value={form.supporting_notes} onChange={e => setForm({...form, supporting_notes: e.target.value})}
                  rows={2} placeholder="Any additional context, reference numbers, etc."
                  className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-violet-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg shadow">
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {selectedDetail && (
        <DetailDrawer
          reg={selectedDetail}
          onClose={() => setSelectedDetail(null)}
          onAction={handleAction}
          canApprove={isManager}
          userId={userId}
          userRole={userRole}
        />
      )}
    </div>
  );
};
