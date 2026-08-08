import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, CheckCircle2, Clock, AlertTriangle, Plus, RefreshCw, X,
  FileText, ShieldCheck, ArrowRight, ArrowLeft, UserCheck, Award, Layers
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

interface LeaveBalance {
  id: number;
  leave_type_name: string;
  leave_type_code: string;
  total_allocated: number;
  used_days: number;
  remaining_days: number;
}

interface LeaveApplication {
  id: number;
  leave_type_name: string;
  first_name: string;
  last_name: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: string;
}

interface LedgerEntry {
  id: number;
  leave_type_name: string;
  first_name?: string;
  last_name?: string;
  transaction_type: string;
  amount: number;
  opening_balance: number;
  closing_balance: number;
  reason: string;
  created_at: string;
}

export const EnterpriseLeavePage: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const isManager = ['ADMIN', 'HR_MANAGER', 'DEPT_HEAD', 'SUPER_ADMIN'].includes(userRole);
  const isSuperAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(userRole);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [tab, setTab] = useState<'balances' | 'applications' | 'ledger'>('balances');

  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  // Forms
  const [applyForm, setApplyForm] = useState({
    leave_type_id: 1,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    is_half_day: false,
    reason: 'Personal leave for family event',
  });

  const [adjustForm, setAdjustForm] = useState({
    employee_id: 1,
    leave_type_id: 1,
    amount: 3,
    transaction_type: 'ADJUSTMENT_INCREASE',
    reason: 'Annual performance reward entitlement grant',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [balRes, appRes, ledRes] = await Promise.all([
        apiClient.get('/leave/balance').catch(() => ({ data: { data: [] } })),
        apiClient.get('/leaves/applications').catch(() => ({ data: { data: [] } })),
        apiClient.get('/leaves/ledger').catch(() => ({ data: { data: [] } })),
      ]);
      setBalances(balRes.data?.data || []);
      setApplications(appRes.data?.data || []);
      setLedger(ledRes.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiClient.post('/leaves/apply', applyForm);
      setShowApplyModal(false);
      await fetchData();
      const data = res.data?.data;
      if (data?.lop_days > 0) {
        alert(`✅ Leave submitted! Note: ${data.paid_days} days Paid Leave + ${data.lop_days} days Loss of Pay (LOP).`);
      } else {
        alert('✅ Leave application submitted successfully!');
      }
    } catch (e: any) { alert(e.response?.data?.message || 'Leave application failed'); }
    finally { setSubmitting(false); }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/leaves/balances/adjust', adjustForm);
      setShowAdjustModal(false);
      await fetchData();
      alert('✅ Leave balance adjusted & audit ledger updated!');
    } catch (e: any) { alert('Balance adjustment failed'); }
    finally { setSubmitting(false); }
  };

  const handleApproveLeave = async (id: number) => {
    try {
      await apiClient.patch(`/leaves/${id}/approve`);
      await fetchData();
      alert('✅ Leave application approved!');
    } catch (e) { alert('Approval failed'); }
  };

  const handleCancelLeave = async (id: number) => {
    try {
      await apiClient.patch(`/leaves/${id}/cancel`);
      await fetchData();
      alert('✅ Leave application cancelled & balance restored!');
    } catch (e) { alert('Cancellation failed'); }
  };

  const totalRemaining = balances.reduce((a, b) => a + Number(b.remaining_days), 0);

  return (
    <div className="space-y-5 min-h-screen pb-10 font-sans text-slate-800">
      {isMobile ? (
        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <button onClick={() => onNavigate?.('dashboard')} className="p-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-extrabold text-sm uppercase tracking-tight">Leave Workspace</span>
        </div>
      ) : null}

      {/* ─── Header Workspace ──────────────────────────────────────────────── */}
      <div className={isMobile ? "bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-4 shadow-xl border border-emerald-900/40 text-slate-800" : "bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-emerald-900/40 text-slate-800"}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600/30 rounded-xl">
              <Calendar className="w-7 h-7 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Enterprise Leave Management & Balance Ledger Engine</h2>
              <p className="text-xs text-emerald-300/70 font-mono mt-0.5">Accrual • Carry Forward • LOP Conversion • Immutable Audit Ledger</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <button onClick={() => setShowAdjustModal(true)} className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl border border-white/20">
                <Plus className="w-3.5 h-3.5 inline mr-1" /> Adjust Balance
              </button>
            )}
            <button onClick={() => setShowApplyModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg">
              <Plus className="w-4 h-4 inline mr-1" /> Apply Leave
            </button>
          </div>
        </div>

        {/* Real-time Leave KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-emerald-200 font-mono uppercase">Total Paid Balance Available</p>
            <p className="text-xl font-black text-white mt-0.5 font-mono">{totalRemaining} Days</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-amber-300 font-mono uppercase">Pending Applications</p>
            <p className="text-xl font-black text-amber-400 mt-0.5 font-mono">{applications.filter(a => a.status === 'PENDING').length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-emerald-300 font-mono uppercase">Approved Leaves</p>
            <p className="text-xl font-black text-emerald-400 mt-0.5 font-mono">{applications.filter(a => a.status === 'APPROVED').length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-emerald-200 font-mono uppercase">Financial Year</p>
            <p className="text-sm font-bold text-emerald-200 mt-1">2026 - 2027</p>
          </div>
        </div>
      </div>

      {/* ─── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200 overflow-x-auto">
        <button onClick={() => setTab('balances')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'balances' ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Calendar className="w-4 h-4" /> My Balances & Apply ({balances.length})
        </button>
        <button onClick={() => setTab('applications')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'applications' ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <UserCheck className="w-4 h-4" /> Requisitions & Approvals ({applications.length})
        </button>
        <button onClick={() => setTab('ledger')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'ledger' ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Layers className="w-4 h-4" /> Immutable Audit Ledger ({ledger.length})
        </button>
      </div>

      {/* ─── MY LEAVE BALANCES TAB ───────────────────────────────────────── */}
      {tab === 'balances' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {balances.map(b => (
            <div key={b.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-bold text-slate-900 text-sm">{b.leave_type_name}</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">{b.leave_type_code || 'PAID'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 font-mono text-xs text-center">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <p className="text-[9px] text-slate-500 uppercase">Allocated</p>
                  <p className="font-bold text-slate-900 mt-0.5">{b.total_allocated}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <p className="text-[9px] text-slate-500 uppercase">Used</p>
                  <p className="font-bold text-rose-700 mt-0.5">{b.used_days || 0}</p>
                </div>
                <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                  <p className="text-[9px] text-emerald-800 uppercase font-bold">Remaining</p>
                  <p className="font-black text-emerald-700 mt-0.5">{b.remaining_days}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── LEAVE APPLICATIONS TAB ──────────────────────────────────────── */}
      {tab === 'applications' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
              <tr>
                <th className="p-3">Employee</th>
                <th className="p-3">Leave Type</th>
                <th className="p-3">Start Date</th>
                <th className="p-3">End Date</th>
                <th className="p-3">Total Days</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {applications.map(app => (
                <tr key={app.id} className="hover:bg-slate-50">
                  <td className="p-3 font-sans font-bold text-slate-900">{app.first_name} {app.last_name}</td>
                  <td className="p-3 font-bold text-emerald-700">{app.leave_type_name}</td>
                  <td className="p-3 font-bold text-slate-900">{app.start_date}</td>
                  <td className="p-3 font-bold text-slate-900">{app.end_date}</td>
                  <td className="p-3 font-bold text-slate-900">{app.total_days} Days</td>
                  <td className="p-3 font-sans text-slate-600 line-clamp-1">{app.reason}</td>
                  <td className="p-3 font-sans">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      app.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      app.status === 'CANCELLED' ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>{app.status}</span>
                  </td>
                  <td className="p-3 font-sans flex items-center gap-1">
                    {isManager && app.status === 'PENDING' && (
                      <button onClick={() => handleApproveLeave(app.id)} className="px-2.5 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded hover:bg-emerald-700">
                        Approve
                      </button>
                    )}
                    {app.status === 'APPROVED' && (
                      <button onClick={() => handleCancelLeave(app.id)} className="px-2 py-1 bg-slate-200 text-slate-700 font-bold text-[10px] rounded hover:bg-slate-300">
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── IMMUTABLE BALANCE LEDGER TAB ─────────────────────────────────── */}
      {tab === 'ledger' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Leave Type</th>
                <th className="p-3">Transaction Type</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Opening</th>
                <th className="p-3">Closing</th>
                <th className="p-3">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {ledger.map(l => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="p-3 text-slate-500">{new Date(l.created_at).toLocaleDateString()}</td>
                  <td className="p-3 font-bold text-slate-900">{l.leave_type_name}</td>
                  <td className="p-3 font-sans font-bold">
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${
                      l.amount > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>{l.transaction_type}</span>
                  </td>
                  <td className="p-3 font-bold text-slate-900">{l.amount > 0 ? `+${l.amount}` : l.amount}</td>
                  <td className="p-3 text-slate-500">{l.opening_balance}</td>
                  <td className="p-3 font-bold text-emerald-700">{l.closing_balance}</td>
                  <td className="p-3 font-sans text-slate-600 line-clamp-1">{l.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── APPLY LEAVE MODAL ─────────────────────────────────────────────── */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Apply Leave Application</h3>
              <button onClick={() => setShowApplyModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleApplyLeave} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Leave Type *</label>
                <select required value={applyForm.leave_type_id} onChange={e => setApplyForm({...applyForm, leave_type_id: Number(e.target.value)})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                  {balances.map(b => <option key={b.id} value={b.id}>{b.leave_type_name} (Remaining: {b.remaining_days} days)</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Start Date *</label>
                  <input required type="date" value={applyForm.start_date} onChange={e => setApplyForm({...applyForm, start_date: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">End Date *</label>
                  <input required type="date" value={applyForm.end_date} onChange={e => setApplyForm({...applyForm, end_date: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold" />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Reason for Leave *</label>
                <textarea required value={applyForm.reason} onChange={e => setApplyForm({...applyForm, reason: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" rows={2} />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowApplyModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow">{submitting ? 'Submitting...' : 'Submit Application'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADJUST BALANCE MODAL ──────────────────────────────────────────── */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Super Admin Leave Balance Adjustment</h3>
              <button onClick={() => setShowAdjustModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAdjustBalance} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Leave Type *</label>
                <select required value={adjustForm.leave_type_id} onChange={e => setAdjustForm({...adjustForm, leave_type_id: Number(e.target.value)})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                  {balances.map(b => <option key={b.id} value={b.id}>{b.leave_type_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Adjustment Days *</label>
                  <input required type="number" step="0.5" value={adjustForm.amount} onChange={e => setAdjustForm({...adjustForm, amount: Number(e.target.value)})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Transaction Type *</label>
                  <select required value={adjustForm.transaction_type} onChange={e => setAdjustForm({...adjustForm, transaction_type: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                    <option value="ADJUSTMENT_INCREASE">ADJUSTMENT INCREASE (+)</option>
                    <option value="ADJUSTMENT_DECREASE">ADJUSTMENT DECREASE (-)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Adjustment Reason *</label>
                <textarea required value={adjustForm.reason} onChange={e => setAdjustForm({...adjustForm, reason: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" rows={2} />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAdjustModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow">{submitting ? 'Adjusting...' : 'Complete Adjustment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
