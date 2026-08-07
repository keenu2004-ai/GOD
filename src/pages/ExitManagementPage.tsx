import React, { useState, useEffect, useCallback } from 'react';
import {
  LogOut, Calendar, CheckCircle2, Shield, FileText, UserCheck, DollarSign,
  Plus, X, Search, Clock, Laptop, Printer, Award, RefreshCw
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

interface Resignation {
  id: number;
  employee_id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
  department_name?: string;
  resignation_date: string;
  last_working_day: string;
  notice_period_days: number;
  reason: string;
  status: string;
}

interface Clearance {
  id: number;
  department: string;
  status: string;
  comments?: string;
  cleared_by_first?: string;
  cleared_by_last?: string;
  cleared_at?: string;
}

interface FnFSettlement {
  id: number;
  resignation_id: number;
  employee_id: number;
  first_name: string;
  last_name: string;
  pending_salary: number;
  leave_encashment: number;
  bonus_payout: number;
  asset_recovery_deduction: number;
  loan_balance_deduction: number;
  net_settlement_amount: number;
  status: string;
}

const fmtCurr = (v: number | string) => `₹${parseFloat(String(v || 0)).toLocaleString('en-IN')}`;
const fmtDate = (s: string) => s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const ExitManagementPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const isExitAdmin = ['ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER', 'SUPER_ADMIN'].includes(userRole);

  const [tab, setTab] = useState<'resignations' | 'clearances' | 'fnf' | 'letters'>('resignations');
  const [resignations, setResignations] = useState<Resignation[]>([]);
  const [selectedReg, setSelectedReg] = useState<Resignation | null>(null);
  const [clearances, setClearances] = useState<Clearance[]>([]);
  const [fnf, setFnf] = useState<FnFSettlement | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [showResModal, setShowResModal] = useState(false);
  const [showLetterModal, setShowLetterModal] = useState(false);

  const [resForm, setResForm] = useState({
    employee_id: '', last_working_day: '2026-09-30', notice_period_days: '30', reason: 'Career Growth Opportunity',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [regRes, empRes] = await Promise.all([
        apiClient.get('/exit/resignations').catch(() => ({ data: { data: [] } })),
        apiClient.get('/employees').catch(() => ({ data: { data: [] } })),
      ]);
      const list = regRes.data?.data || [];
      setResignations(list);
      setEmployees(empRes.data?.data || []);
      if (list.length > 0 && !selectedReg) {
        setSelectedReg(list[0]);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [selectedReg]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchSelectedDetails = useCallback(async (regId: number) => {
    try {
      const [clrRes, fnfRes] = await Promise.all([
        apiClient.get(`/exit/clearances/${regId}`).catch(() => ({ data: { data: [] } })),
        apiClient.get(`/exit/fnf/${regId}`).catch(() => ({ data: { data: null } })),
      ]);
      setClearances(clrRes.data?.data || []);
      setFnf(fnfRes.data?.data || null);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (selectedReg) {
      fetchSelectedDetails(selectedReg.id);
    }
  }, [selectedReg, fetchSelectedDetails]);

  const handleSubmitResignation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/exit/resignation', {
        employee_id: parseInt(resForm.employee_id),
        resignation_date: new Date().toISOString().split('T')[0],
        last_working_day: resForm.last_working_day,
        notice_period_days: parseInt(resForm.notice_period_days),
        reason: resForm.reason,
      });
      setShowResModal(false);
      await fetchData();
      alert('✅ Resignation submitted successfully!');
    } catch (e: any) { alert(e.response?.data?.message || 'Submission failed'); }
    finally { setSubmitting(false); }
  };

  const handleApproveResignation = async (id: number) => {
    try {
      await apiClient.patch(`/exit/resignation/${id}/approve`);
      await fetchData();
      alert('✅ Resignation approved!');
    } catch (e: any) { alert(e.response?.data?.message || 'Approval failed'); }
  };

  const handleClearDept = async (dept: string) => {
    if (!selectedReg) return;
    try {
      await apiClient.post('/exit/clearance', {
        resignation_id: selectedReg.id,
        department: dept,
        comments: 'No pending items. Assets & dues cleared.',
      });
      await fetchSelectedDetails(selectedReg.id);
      alert(`✅ ${dept} Clearance recorded!`);
    } catch (e: any) { alert(e.response?.data?.message || 'Clearance failed'); }
  };

  const handleCalculateFnF = async () => {
    if (!selectedReg) return;
    try {
      const res = await apiClient.post('/exit/fnf/calculate', { resignation_id: selectedReg.id });
      setFnf(res.data?.data);
      alert('✅ Full & Final (FnF) Settlement calculated!');
    } catch (e: any) { alert(e.response?.data?.message || 'Calculation failed'); }
  };

  const handleApproveFnF = async () => {
    if (!fnf) return;
    try {
      await apiClient.patch(`/exit/fnf/${fnf.id}/approve`);
      await fetchSelectedDetails(selectedReg!.id);
      alert('✅ Full & Final Settlement approved and finalized!');
    } catch (e: any) { alert(e.response?.data?.message || 'Approval failed'); }
  };

  return (
    <div className="space-y-5 min-h-screen pb-10">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-rose-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600/30 rounded-xl">
              <LogOut className="w-7 h-7 text-rose-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Enterprise Exit Management & FnF Settlement</h2>
              <p className="text-xs text-rose-300/70 font-mono mt-0.5">Offboarding Pipeline • 5-Departmental Clearances • FnF Calculator • Relieving Letters</p>
            </div>
          </div>
          <button onClick={() => setShowResModal(true)} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg">
            <Plus className="w-4 h-4" /> Submit Resignation
          </button>
        </div>

        {/* Selected Resignation Tracker */}
        {selectedReg && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-white font-mono">
            <div>
              <span className="text-[10px] text-rose-300 font-bold uppercase">Active Offboarding Case</span>
              <p className="font-sans font-bold text-sm text-white">{selectedReg.first_name} {selectedReg.last_name} ({selectedReg.employee_code})</p>
              <p className="text-[10px] text-slate-400 font-sans">{selectedReg.department_name} • Last Working Day: {fmtDate(selectedReg.last_working_day)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-1 rounded border ${
                selectedReg.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>{selectedReg.status}</span>
            </div>
          </div>
        )}
      </div>

      {/* ─── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200 overflow-x-auto">
        <button onClick={() => setTab('resignations')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'resignations' ? 'bg-white text-rose-700 shadow-sm border border-rose-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <LogOut className="w-4 h-4" /> Resignations Pipeline ({resignations.length})
        </button>
        <button onClick={() => setTab('clearances')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'clearances' ? 'bg-white text-rose-700 shadow-sm border border-rose-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <UserCheck className="w-4 h-4" /> 5-Departmental Clearances ({clearances.filter(c => c.status === 'CLEARED').length}/5)
        </button>
        <button onClick={() => setTab('fnf')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'fnf' ? 'bg-white text-rose-700 shadow-sm border border-rose-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <DollarSign className="w-4 h-4" /> Full & Final (FnF) Settlement Calculator
        </button>
        <button onClick={() => setTab('letters')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'letters' ? 'bg-white text-rose-700 shadow-sm border border-rose-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Award className="w-4 h-4" /> Relieving & Experience Letters
        </button>
      </div>

      {/* ─── RESIGNATIONS PIPELINE TAB ──────────────────────────────────── */}
      {tab === 'resignations' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Resignation Date</th>
                  <th className="p-3">Last Working Day</th>
                  <th className="p-3">Notice Period</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {resignations.map(r => (
                  <tr key={r.id} onClick={() => setSelectedReg(r)} className={`hover:bg-slate-50 cursor-pointer ${selectedReg?.id === r.id ? 'bg-rose-50/60' : ''}`}>
                    <td className="p-3 font-sans font-bold text-slate-900">{r.first_name} {r.last_name}</td>
                    <td className="p-3 text-slate-600 font-sans">{fmtDate(r.resignation_date)}</td>
                    <td className="p-3 font-bold text-rose-700 font-sans">{fmtDate(r.last_working_day)}</td>
                    <td className="p-3 text-slate-700 font-sans">{r.notice_period_days} days</td>
                    <td className="p-3 font-sans text-slate-500">{r.reason}</td>
                    <td className="p-3 font-sans">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        r.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>{r.status}</span>
                    </td>
                    <td className="p-3 font-sans">
                      {isExitAdmin && r.status === 'PENDING' && (
                        <button onClick={(e) => { e.stopPropagation(); handleApproveResignation(r.id); }} className="px-2 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded hover:bg-emerald-700">
                          Approve Exit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── CLEARANCES TAB ──────────────────────────────────────────────── */}
      {tab === 'clearances' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-rose-600" /> 5-Departmental Clearance Status
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
              {['HR', 'FINANCE', 'IT', 'ADMIN', 'MANAGER'].map(dept => {
                const item = clearances.find(c => c.department === dept);
                const isCleared = item?.status === 'CLEARED';
                return (
                  <div key={dept} className={`p-4 rounded-xl border ${isCleared ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                    <p className="font-black text-slate-900 text-sm">{dept} Clearance</p>
                    <div className="mt-3 flex items-center justify-between">
                      {isCleared ? (
                        <span className="text-emerald-700 font-bold text-xs flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Cleared</span>
                      ) : (
                        <button onClick={() => handleClearDept(dept)} className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-2.5 py-1 rounded shadow">
                          Mark Cleared
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── FNF SETTLEMENT TAB ──────────────────────────────────────────── */}
      {tab === 'fnf' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-rose-600" /> Automated Full & Final (FnF) Settlement Calculator
              </h3>
              <button onClick={handleCalculateFnF} className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow">
                Calculate FnF Statement
              </button>
            </div>

            {fnf ? (
              <div className="space-y-4 font-mono text-xs">
                <div className="grid grid-cols-2 gap-4">
                  {/* Earnings */}
                  <div className="border rounded-xl p-4 bg-emerald-50/40 border-emerald-200 space-y-2">
                    <p className="font-sans font-bold text-emerald-900">FnF Earnings Additions</p>
                    <div className="flex justify-between"><span>Pending Days Salary</span> <span>+{fmtCurr(fnf.pending_salary)}</span></div>
                    <div className="flex justify-between"><span>Leave Encashment Pay</span> <span>+{fmtCurr(fnf.leave_encashment)}</span></div>
                  </div>
                  {/* Deductions */}
                  <div className="border rounded-xl p-4 bg-red-50/40 border-red-200 space-y-2">
                    <p className="font-sans font-bold text-red-900">FnF Recovery Deductions</p>
                    <div className="flex justify-between text-red-700"><span>Active Loan Outstanding</span> <span>-{fmtCurr(fnf.loan_balance_deduction)}</span></div>
                    <div className="flex justify-between text-red-700"><span>Asset Damage Recovery</span> <span>-{fmtCurr(fnf.asset_recovery_deduction)}</span></div>
                  </div>
                </div>

                <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-sans uppercase">NET SETTLEMENT DISBURSAL</span>
                    <p className="text-2xl font-black text-emerald-400">{fmtCurr(fnf.net_settlement_amount)}</p>
                  </div>
                  {fnf.status === 'PREVIEW' ? (
                    <button onClick={handleApproveFnF} className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs px-4 py-2 rounded-xl shadow">
                      Approve & Finalize FnF
                    </button>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-900 font-bold text-xs px-3 py-1 rounded">SETTLED</span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">Click "Calculate FnF Statement" to auto-run settlement for selected employee.</p>
            )}
          </div>
        </div>
      )}

      {/* ─── LETTERS TAB ─────────────────────────────────────────────────── */}
      {tab === 'letters' && selectedReg && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Award className="w-5 h-5 text-rose-600" /> Relieving Letter & Service Certificate
            </h3>
            <button onClick={() => setShowLetterModal(true)} className="flex items-center gap-1.5 bg-slate-900 text-white font-bold text-xs px-3 py-2 rounded-xl">
              <Printer className="w-4 h-4" /> Print Relieving Letter
            </button>
          </div>
          <p className="text-xs text-slate-600">
            Official Relieving & Experience Letter generated for <strong>{selectedReg.first_name} {selectedReg.last_name}</strong>.
          </p>
        </div>
      )}

      {/* ─── SUBMIT RESIGNATION MODAL ────────────────────────────────────── */}
      {showResModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Submit Resignation & Initiate Exit</h3>
              <button onClick={() => setShowResModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmitResignation} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Employee *</label>
                <select required value={resForm.employee_id} onChange={e => setResForm({...resForm, employee_id: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                  <option value="">-- Choose Employee --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_code})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Last Working Day *</label>
                  <input required type="date" value={resForm.last_working_day} onChange={e => setResForm({...resForm, last_working_day: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Notice Period *</label>
                  <select value={resForm.notice_period_days} onChange={e => setResForm({...resForm, notice_period_days: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                    <option value="15">15 Days</option>
                    <option value="30">30 Days</option>
                    <option value="60">60 Days</option>
                    <option value="90">90 Days</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Resignation Reason *</label>
                <textarea required value={resForm.reason} onChange={e => setResForm({...resForm, reason: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" rows={2} />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowResModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-rose-600 text-white rounded-xl font-bold shadow">{submitting ? 'Submitting...' : 'Submit Exit Request'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── PRINTABLE RELIEVING LETTER MODAL ────────────────────────────── */}
      {showLetterModal && selectedReg && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-8 shadow-2xl space-y-6 text-slate-900 border font-sans">
            <div className="flex justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Official Relieving Letter & Service Certificate</h3>
              <button onClick={() => setShowLetterModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="border-2 border-slate-900 p-6 rounded-xl space-y-4 text-xs">
              <h2 className="text-base font-black text-slate-900 uppercase text-center border-b pb-2">RELIEVING LETTER & EXPERIENCE CERTIFICATE</h2>
              <p>Date: {new Date().toLocaleDateString('en-IN')}</p>
              <p>To,<br /><strong>{selectedReg.first_name} {selectedReg.last_name}</strong><br />Employee Code: {selectedReg.employee_code}</p>
              <p>This is to certify that <strong>{selectedReg.first_name} {selectedReg.last_name}</strong> has been relieved from their duties at <strong>THEIAKSHI ONE HRMS</strong> effective <strong>{fmtDate(selectedReg.last_working_day)}</strong>.</p>
              <p>All company assets and departmental dues have been fully cleared as per company offboarding policy.</p>
              <div className="pt-8 text-right font-bold">
                Authorized Signatory<br />THEIAKSHI ONE HRMS
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
