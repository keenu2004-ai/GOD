import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  FileText,
  AlertCircle,
  Filter,
  Users,
  ShieldCheck,
  ChevronRight,
  UploadCloud,
  Check,
  X,
  RefreshCw,
  Edit2,
  Ban,
  Layers,
} from 'lucide-react';
import { leaveService } from '../services/leaveService.js';

export const LeavePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'my_leaves' | 'approvals' | 'calendar' | 'holidays'>('my_leaves');
  const [balances, setBalances] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [calendarData, setCalendarData] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
  const [editingLeave, setEditingLeave] = useState<any>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form state
  const [form, setForm] = useState({
    leave_type_id: 1,
    start_date: '',
    end_date: '',
    is_half_day: false,
    half_day_session: 'FIRST_HALF',
    reason: '',
    emergency_contact: '',
    attachment_url: '',
    status: 'MANAGER_PENDING',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resBal, resLeaves, resTypes, resHolidays, resCal] = await Promise.all([
        leaveService.getLeaveBalances(),
        leaveService.getAllLeaves(),
        leaveService.getLeaveTypes(),
        leaveService.getHolidays(),
        leaveService.getLeaveCalendar(),
      ]);

      if (resBal?.success) setBalances(resBal.data || []);
      if (resLeaves?.success) setLeaves(resLeaves.data || []);
      if (resTypes?.success) {
        setLeaveTypes(resTypes.data || []);
        if (resTypes.data?.length > 0 && !editingLeave) {
          setForm((prev) => ({ ...prev, leave_type_id: resTypes.data[0].id }));
        }
      }
      if (resHolidays?.success) setHolidays(resHolidays.data || []);
      if (resCal?.success) setCalendarData(resCal.data || null);
    } catch (err) {
      console.error('Error fetching leave data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingLeave) {
        const res = await leaveService.updateLeave(editingLeave.id, form);
        if (res?.success) {
          setShowApplyModal(false);
          setEditingLeave(null);
          fetchData();
        } else {
          alert(res?.message || 'Failed to update leave application');
        }
      } else {
        const res = await leaveService.applyLeave({
          leave_type_id: Number(form.leave_type_id),
          start_date: form.start_date,
          end_date: form.end_date,
          is_half_day: form.is_half_day,
          half_day_session: form.is_half_day ? form.half_day_session : undefined,
          reason: form.reason,
          emergency_contact: form.emergency_contact,
          attachment_url: form.attachment_url,
          status: form.status,
        });

        if (res?.success) {
          setShowApplyModal(false);
          setForm({
            leave_type_id: leaveTypes[0]?.id || 1,
            start_date: '',
            end_date: '',
            is_half_day: false,
            half_day_session: 'FIRST_HALF',
            reason: '',
            emergency_contact: '',
            attachment_url: '',
            status: 'MANAGER_PENDING',
          });
          fetchData();
        } else {
          alert(res?.message || 'Failed to submit leave request');
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelLeave = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this leave application?')) return;
    try {
      const res = await leaveService.cancelLeave(id);
      if (res?.success) fetchData();
      else alert(res?.message || 'Failed to cancel leave application');
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Cancellation failed');
    }
  };

  const handleProcessAction = async (id: number, action: 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'HR_PENDING') => {
    try {
      let reason = '';
      if (action === 'REJECTED') {
        reason = prompt('Please enter rejection reason:') || '';
        if (!reason) return;
      }

      const res = await leaveService.processApproval(id, action, reason);
      if (res?.success) {
        fetchData();
      } else {
        alert(res?.message || 'Failed to update leave status');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Action failed');
    }
  };

  const handleBulkAction = async (action: 'APPROVED' | 'REJECTED') => {
    if (selectedIds.length === 0) return;
    try {
      let reason = '';
      if (action === 'REJECTED') {
        reason = prompt('Reason for bulk rejection:') || '';
        if (!reason) return;
      }
      const res = await leaveService.bulkApprove(selectedIds, action, reason);
      if (res?.success) {
        setSelectedIds([]);
        fetchData();
      } else {
        alert(res?.message || 'Bulk action failed');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Bulk action failed');
    }
  };

  const openEditModal = (row: any) => {
    setEditingLeave(row);
    setForm({
      leave_type_id: row.leave_type_id,
      start_date: row.start_date.split('T')[0],
      end_date: row.end_date.split('T')[0],
      is_half_day: row.is_half_day,
      half_day_session: row.half_day_session || 'FIRST_HALF',
      reason: row.reason || '',
      emergency_contact: row.emergency_contact || '',
      attachment_url: row.attachment_url || '',
      status: row.status,
    });
    setShowApplyModal(true);
  };

  const pendingApprovals = leaves.filter((l) => ['MANAGER_PENDING', 'HR_PENDING', 'PENDING', 'SUBMITTED'].includes(l.status));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-emerald-100 text-emerald-800 border-emerald-200">APPROVED</span>;
      case 'REJECTED':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-rose-100 text-rose-800 border-rose-200">REJECTED</span>;
      case 'HR_PENDING':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-indigo-100 text-indigo-800 border-indigo-200">HR PENDING</span>;
      case 'MANAGER_PENDING':
      case 'SUBMITTED':
      case 'PENDING':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-amber-100 text-amber-800 border-amber-200">MANAGER PENDING</span>;
      case 'DRAFT':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-slate-100 text-slate-700 border-slate-300">DRAFT</span>;
      case 'CANCELLED':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-slate-200 text-slate-600 border-slate-300">CANCELLED</span>;
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
            Enterprise Leave & Absence Portal
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configurable leave policies, multi-step approval workflow (Manager → HR), accrual engine & team calendar.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingLeave(null);
              setForm({
                leave_type_id: leaveTypes[0]?.id || 1,
                start_date: '',
                end_date: '',
                is_half_day: false,
                half_day_session: 'FIRST_HALF',
                reason: '',
                emergency_contact: '',
                attachment_url: '',
                status: 'MANAGER_PENDING',
              });
              setShowApplyModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-2 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Apply For Leave</span>
          </button>
        </div>
      </div>

      {/* Leave Balances Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {balances.map((b) => (
          <div key={b.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{b.leave_type_code}</span>
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color || '#3b82f6' }} />
            </div>
            <div className="mt-2">
              <h4 className="text-2xl font-black text-slate-900">{b.remaining_days} <span className="text-xs font-normal text-slate-400">/ {b.total_allocated}</span></h4>
              <p className="text-[11px] text-slate-600 font-medium truncate mt-0.5">{b.leave_type_name}</p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between text-[10px] text-slate-400">
              <span>Used: {b.used_days}d</span>
              <span>Pending: {b.pending_days || 0}d</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('my_leaves')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'my_leaves' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>My Requests</span>
        </button>
        <button
          onClick={() => setActiveTab('approvals')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'approvals' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Approval Queue</span>
          {pendingApprovals.length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
              {pendingApprovals.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'calendar' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>Team Leave Calendar</span>
        </button>
        <button
          onClick={() => setActiveTab('holidays')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'holidays' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Company Holidays</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'my_leaves' && (
        <div className="bg-white border border-slate-200 rounded-b-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 font-bold text-slate-900 text-sm flex justify-between items-center">
            <span>My Submitted Applications</span>
            <span className="text-xs text-slate-500 font-normal">Showing all requests</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[10px] font-black tracking-wider">
                <tr>
                  <th className="p-4">Type</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Total Days</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Approver</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-slate-400">No leave requests found.</td>
                  </tr>
                ) : (
                  leaves.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-slate-900">
                        <span className="px-2 py-1 rounded text-[10px] font-bold text-white mr-2" style={{ backgroundColor: row.color || '#3b82f6' }}>
                          {row.leave_type_code}
                        </span>
                        {row.leave_type_name}
                      </td>
                      <td className="p-4 font-medium">
                        {new Date(row.start_date).toLocaleDateString()} - {new Date(row.end_date).toLocaleDateString()}
                      </td>
                      <td className="p-4 font-bold text-blue-600">{row.total_days} day(s)</td>
                      <td className="p-4 text-slate-600 max-w-xs truncate">{row.reason}</td>
                      <td className="p-4">{getStatusBadge(row.status)}</td>
                      <td className="p-4 text-slate-500">
                        {row.approver_first_name ? `${row.approver_first_name} ${row.approver_last_name}` : 'Pending Level Approval'}
                      </td>
                      <td className="p-4 flex items-center gap-2">
                        {['DRAFT', 'MANAGER_PENDING', 'SUBMITTED', 'PENDING'].includes(row.status) && (
                          <button
                            onClick={() => openEditModal(row)}
                            className="text-blue-600 hover:text-blue-800 text-[11px] font-semibold flex items-center gap-1"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                        )}
                        {['DRAFT', 'MANAGER_PENDING', 'SUBMITTED', 'PENDING', 'HR_PENDING', 'APPROVED'].includes(row.status) && row.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handleCancelLeave(row.id)}
                            className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold flex items-center gap-1"
                          >
                            <Ban className="w-3.5 h-3.5" /> Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="bg-white border border-slate-200 rounded-b-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <span className="font-bold text-slate-900 text-sm">Multi-Level Team Leave Approval Matrix</span>
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkAction('APPROVED')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded text-[11px] flex items-center gap-1 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" /> Bulk Approve ({selectedIds.length})
                </button>
                <button
                  onClick={() => handleBulkAction('REJECTED')}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded text-[11px] flex items-center gap-1 shadow-sm"
                >
                  <X className="w-3.5 h-3.5" /> Bulk Reject
                </button>
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[10px] font-black tracking-wider">
                <tr>
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(pendingApprovals.map((p) => p.id));
                        else setSelectedIds([]);
                      }}
                      checked={pendingApprovals.length > 0 && selectedIds.length === pendingApprovals.length}
                      className="rounded text-blue-600"
                    />
                  </th>
                  <th className="p-4">Employee</th>
                  <th className="p-4">Leave Type</th>
                  <th className="p-4">Dates</th>
                  <th className="p-4">Days</th>
                  <th className="p-4">Current Workflow Stage</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingApprovals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-slate-400">No pending leave approvals found.</td>
                  </tr>
                ) : (
                  pendingApprovals.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(row.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedIds([...selectedIds, row.id]);
                            else setSelectedIds(selectedIds.filter((id) => id !== row.id));
                          }}
                          className="rounded text-blue-600"
                        />
                      </td>
                      <td className="p-4 font-bold text-slate-900">
                        {row.first_name} {row.last_name}
                        <p className="text-[10px] text-slate-500 font-normal">{row.employee_code} • {row.department_name}</p>
                      </td>
                      <td className="p-4 font-medium">{row.leave_type_name}</td>
                      <td className="p-4 font-mono">{new Date(row.start_date).toLocaleDateString()} to {new Date(row.end_date).toLocaleDateString()}</td>
                      <td className="p-4 font-bold text-blue-600">{row.total_days}d</td>
                      <td className="p-4">{getStatusBadge(row.status)}</td>
                      <td className="p-4 text-slate-600 max-w-xs">{row.reason}</td>
                      <td className="p-4 flex items-center gap-2">
                        <button
                          onClick={() => handleProcessAction(row.id, 'APPROVED')}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded text-[11px] flex items-center gap-1 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleProcessAction(row.id, 'REJECTED')}
                          className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded text-[11px] flex items-center gap-1 shadow-sm"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="bg-white border border-slate-200 rounded-b-xl overflow-hidden shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm">Team & Organization Absence Calendar</h3>
            <span className="text-xs text-slate-500">Approved leaves & company holidays</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                Active Approved Absences ({calendarData?.approvedLeaves?.length || 0})
              </h4>
              <div className="space-y-2">
                {(!calendarData?.approvedLeaves || calendarData.approvedLeaves.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">No approved absences scheduled for this period.</p>
                ) : (
                  calendarData.approvedLeaves.map((item: any) => (
                    <div key={item.id} className="bg-white border border-slate-200 rounded-lg p-3 flex justify-between items-center shadow-2xs">
                      <div>
                        <div className="font-bold text-xs text-slate-900">{item.first_name} {item.last_name}</div>
                        <div className="text-[11px] text-slate-500">{item.leave_type_name} ({item.total_days}d)</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 font-bold">
                          {new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-600" />
                Upcoming Company Holidays ({holidays.length})
              </h4>
              <div className="space-y-2">
                {holidays.slice(0, 5).map((h) => (
                  <div key={h.id} className="bg-white border border-slate-200 rounded-lg p-3 flex justify-between items-center shadow-2xs">
                    <div>
                      <div className="font-bold text-xs text-slate-900">{h.name}</div>
                      <div className="text-[11px] text-slate-500">{new Date(h.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                      {h.type || 'MANDATORY'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'holidays' && (
        <div className="bg-white border border-slate-200 rounded-b-xl overflow-hidden shadow-sm p-4">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Official Organization Holidays Schedule</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {holidays.map((h) => (
              <div key={h.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{h.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{new Date(h.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-1 rounded uppercase">
                  {h.type || 'MANDATORY'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Apply / Edit Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                {editingLeave ? 'Edit Leave Application' : 'Apply For Leave'}
              </h3>
              <button onClick={() => setShowApplyModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Leave Type</label>
                <select
                  value={form.leave_type_id}
                  onChange={(e) => setForm({ ...form, leave_type_id: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500"
                >
                  {leaveTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="halfDay"
                  checked={form.is_half_day}
                  onChange={(e) => setForm({ ...form, is_half_day: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="halfDay" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Half Day Application
                </label>
              </div>

              {form.is_half_day && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Half Day Session</label>
                  <select
                    value={form.half_day_session}
                    onChange={(e) => setForm({ ...form, half_day_session: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-medium"
                  >
                    <option value="FIRST_HALF">First Half (Morning)</option>
                    <option value="SECOND_HALF">Second Half (Afternoon)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Initial Application Mode</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-medium"
                >
                  <option value="MANAGER_PENDING">Submit to Manager Approval</option>
                  <option value="DRAFT">Save as Draft</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Leave</label>
                <textarea
                  required
                  rows={3}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Provide detailed reason..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact Number</label>
                <input
                  type="text"
                  value={form.emergency_contact}
                  onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md flex items-center gap-1.5"
                >
                  {submitting ? 'Submitting...' : editingLeave ? 'Update Leave' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
