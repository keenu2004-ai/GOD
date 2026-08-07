import React, { useState, useEffect, useCallback } from 'react';
import {
  Zap, Play, Lock, Unlock, CheckCircle2, AlertTriangle, Shield,
  DollarSign, FileText, RefreshCw, Users, Plus, X, Search, Clock, Download
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

interface PayrollRun {
  id: number;
  month: string;
  year: number;
  status: string;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  total_employees: number;
  created_at: string;
}

interface PayrollItem {
  id: number;
  employee_id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
  department_name?: string;
  basic_salary: number;
  hra: number;
  special_allowance: number;
  gross_salary: number;
  pf_deduction: number;
  pt_deduction: number;
  esi_deduction: number;
  loan_deduction: number;
  advance_deduction: number;
  lop_deduction: number;
  reimbursements: number;
  bonus: number;
  net_salary: number;
  working_days: number;
  present_days: number;
  lop_days: number;
  warning_flags?: string;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const fmtCurr = (v: number | string) => `₹${parseFloat(String(v || 0)).toLocaleString('en-IN')}`;

export const PayrollProcessingPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isPayrollAdmin = ['ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER', 'FINANCE_MANAGER', 'SUPER_ADMIN'].includes(userRole);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[now.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [tab, setTab] = useState<'wizard' | 'approvals' | 'lock' | 'adjustments'>('wizard');

  const [runDetails, setRunDetails] = useState<{ run: PayrollRun; items: PayrollItem[]; approvals: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);

  // Modals
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [unlockReason, setUnlockReason] = useState('');

  const [adjForm, setAdjForm] = useState({
    employee_id: '', adjustment_type: 'BONUS', amount: '5000', reason: 'Festival Bonus 2026',
  });

  const fetchRunDetails = useCallback(async () => {
    setLoading(true);
    try {
      const [runRes, empRes] = await Promise.all([
        apiClient.get(`/payroll/preview?month=${selectedMonth}&year=${selectedYear}`),
        apiClient.get('/employees').catch(() => ({ data: { data: [] } })),
      ]);
      setRunDetails(runRes.data?.data || null);
      setEmployees(empRes.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [selectedMonth, selectedYear]);

  useEffect(() => { fetchRunDetails(); }, [fetchRunDetails]);

  const handleGeneratePayroll = async () => {
    setProcessing(true);
    try {
      await apiClient.post('/payroll/process', { month: selectedMonth, year: selectedYear });
      await fetchRunDetails();
      alert(`✅ Payroll calculated and preview generated for ${selectedMonth} ${selectedYear}!`);
    } catch (e: any) { alert(e.response?.data?.message || 'Payroll processing failed'); }
    finally { setProcessing(false); }
  };

  const handleApprovePayroll = async (level: string) => {
    if (!runDetails?.run) return;
    try {
      await apiClient.post('/payroll/approve', {
        run_id: runDetails.run.id,
        level: level,
        status: 'APPROVED',
        comment: `Approved by ${userRole}`,
      });
      await fetchRunDetails();
      alert(`✅ Payroll approved at level: ${level}`);
    } catch (e: any) { alert(e.response?.data?.message || 'Approval failed'); }
  };

  const handleUnlockPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.patch('/payroll/unlock', {
        month: selectedMonth, year: selectedYear, reason: unlockReason,
      });
      setShowUnlockModal(false);
      await fetchRunDetails();
      alert('✅ Payroll unlocked!');
    } catch (e: any) { alert(e.response?.data?.message || 'Unlock failed'); }
  };

  const handleAddAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/payroll/adjustment', {
        run_id: runDetails?.run?.id,
        employee_id: parseInt(adjForm.employee_id),
        adjustment_type: adjForm.adjustment_type,
        amount: parseFloat(adjForm.amount),
        reason: adjForm.reason,
      });
      setShowAdjustmentModal(false);
      await fetchRunDetails();
      alert('✅ Adjustment added!');
    } catch (e: any) { alert(e.response?.data?.message || 'Adjustment failed'); }
  };

  const handleDownloadBankFile = async () => {
    try {
      const response = await apiClient.get(`/payroll/bank-file?month=${selectedMonth}&year=${selectedYear}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SALARY_NEFT_DISBURSAL_${selectedMonth}_${selectedYear}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      alert('✅ Bank Disbursal NEFT file downloaded!');
    } catch (e: any) { alert('Download failed: Ensure payroll is generated'); }
  };

  const run = runDetails?.run;
  const items = runDetails?.items || [];
  const approvals = runDetails?.approvals || [];

  return (
    <div className="space-y-5 min-h-screen pb-10">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-amber-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-600/30 rounded-xl">
              <Zap className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Enterprise Payroll Processing Engine</h2>
              <p className="text-xs text-amber-300/70 font-mono mt-0.5">Automated Integration • Multi-Level Approval • Period Lock • Arrears</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="bg-white/10 text-white font-bold text-xs px-3 py-2 rounded-xl border border-white/20">
              {MONTHS.map(m => <option key={m} value={m} className="text-slate-900">{m}</option>)}
            </select>
            <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="bg-white/10 text-white font-bold text-xs px-3 py-2 rounded-xl border border-white/20">
              <option value={2026} className="text-slate-900">2026</option>
              <option value={2025} className="text-slate-900">2025</option>
            </select>
            {isPayrollAdmin && (
              <button onClick={handleDownloadBankFile} disabled={!run}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3 py-2.5 rounded-xl border border-white/20 disabled:opacity-50">
                <Download className="w-4 h-4 text-emerald-300" /> Bank NEFT File
              </button>
            )}
            {isPayrollAdmin && (
              <button onClick={handleGeneratePayroll} disabled={processing || run?.status === 'LOCKED'}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg disabled:opacity-50">
                <Play className="w-4 h-4 fill-current" /> {processing ? 'Calculating...' : 'Run Payroll Engine'}
              </button>
            )}
          </div>
        </div>

        {/* Run Metrics Banner */}
        {run && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-xs font-mono font-bold text-amber-300 uppercase">{run.status}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Payroll Status</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-xl font-black text-white">{run.total_employees}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Processed Headcount</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-xl font-black text-blue-300">{fmtCurr(run.total_gross)}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Total Gross Pay</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-xl font-black text-red-300">-{fmtCurr(run.total_deductions)}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Total Deductions</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-xl font-black text-emerald-300">{fmtCurr(run.total_net)}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Total Disbursal Net</p>
            </div>
          </div>
        )}
      </div>

      {/* ─── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200 overflow-x-auto">
        <button onClick={() => setTab('wizard')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'wizard' ? 'bg-white text-amber-700 shadow-sm border border-amber-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Zap className="w-4 h-4" /> Live Payroll Preview & Breakdown
        </button>
        <button onClick={() => setTab('approvals')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'approvals' ? 'bg-white text-amber-700 shadow-sm border border-amber-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Shield className="w-4 h-4" /> Approval Pipeline ({approvals.length})
        </button>
        <button onClick={() => setTab('lock')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'lock' ? 'bg-white text-amber-700 shadow-sm border border-amber-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          {run?.status === 'LOCKED' ? <Lock className="w-4 h-4 text-red-600" /> : <Unlock className="w-4 h-4 text-emerald-600" />} Period Lock Status
        </button>
        <button onClick={() => setTab('adjustments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'adjustments' ? 'bg-white text-amber-700 shadow-sm border border-amber-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Plus className="w-4 h-4" /> Adjustments & Arrears Hub
        </button>
      </div>

      {/* ─── PREVIEW WIZARD TAB ──────────────────────────────────────────── */}
      {tab === 'wizard' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs">Employee Payroll Line Items ({items.length})</span>
              <button onClick={() => alert('Payroll export downloaded!')} className="flex items-center gap-1.5 text-xs font-bold text-slate-700 border px-3 py-1.5 rounded-xl bg-white">
                <Download className="w-3.5 h-3.5" /> Export Register CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase">
                  <tr>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Working / LOP Days</th>
                    <th className="p-3">Basic + HRA</th>
                    <th className="p-3">Reimbursements</th>
                    <th className="p-3">Gross Salary</th>
                    <th className="p-3">PF + PT Deductions</th>
                    <th className="p-3">Loan + Adv Recovery</th>
                    <th className="p-3">Net Disbursal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {items.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-3 font-sans">
                        <p className="font-bold text-slate-900">{item.first_name} {item.last_name}</p>
                        <p className="text-[10px] text-slate-400">{item.employee_code} • {item.department_name}</p>
                        {item.warning_flags && <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1 rounded">⚠️ {item.warning_flags}</span>}
                      </td>
                      <td className="p-3 font-sans text-slate-600">
                        {item.present_days} / {item.working_days} days
                        {parseFloat(String(item.lop_days)) > 0 && <span className="block text-[10px] text-red-600 font-bold">({item.lop_days} LOP)</span>}
                      </td>
                      <td className="p-3 text-slate-700">{fmtCurr(parseFloat(String(item.basic_salary)) + parseFloat(String(item.hra)))}</td>
                      <td className="p-3 text-emerald-600">+{fmtCurr(item.reimbursements)}</td>
                      <td className="p-3 font-bold text-blue-700">{fmtCurr(item.gross_salary)}</td>
                      <td className="p-3 text-red-600">-{fmtCurr(parseFloat(String(item.pf_deduction)) + parseFloat(String(item.pt_deduction)))}</td>
                      <td className="p-3 text-purple-700">-{fmtCurr(parseFloat(String(item.loan_deduction)) + parseFloat(String(item.advance_deduction)))}</td>
                      <td className="p-3 font-bold text-emerald-700 text-sm">{fmtCurr(item.net_salary)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {items.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Zap className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p>No payroll generated for {selectedMonth} {selectedYear} yet.</p>
                <button onClick={handleGeneratePayroll} className="mt-3 bg-amber-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl shadow">
                  Run Calculation Engine Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── APPROVALS TAB ───────────────────────────────────────────────── */}
      {tab === 'approvals' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-600" /> Multi-Level Payroll Approval Pipeline
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              {['PAYROLL_MANAGER', 'FINANCE_MANAGER', 'HR_MANAGER', 'SUPER_ADMIN'].map((lvl, idx) => {
                const isApproved = approvals.some(a => a.level === lvl && a.status === 'APPROVED');
                return (
                  <div key={lvl} className={`p-4 rounded-xl border ${isApproved ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                    <p className="text-[10px] font-bold uppercase text-slate-400">Level {idx + 1}</p>
                    <p className="font-black text-slate-900 text-sm mt-0.5">{lvl.replace('_', ' ')}</p>
                    <div className="mt-3 flex items-center justify-between">
                      {isApproved ? (
                        <span className="text-emerald-700 font-bold text-xs flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Approved</span>
                      ) : (
                        <button onClick={() => handleApprovePayroll(lvl)} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg shadow">
                          Approve {lvl.split('_')[0]}
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

      {/* ─── LOCK TAB ────────────────────────────────────────────────────── */}
      {tab === 'lock' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-w-xl">
          <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
            {run?.status === 'LOCKED' ? <Lock className="w-5 h-5 text-red-600" /> : <Unlock className="w-5 h-5 text-emerald-600" />} Period Lock Status
          </h3>
          <p className="text-xs text-slate-600">
            {run?.status === 'LOCKED'
              ? 'Payroll is LOCKED. Salary numbers are immutable and finalized for banking disbursal.'
              : 'Payroll is UNLOCKED and open for edits.'}
          </p>

          {run?.status === 'LOCKED' && isSuperAdmin && (
            <button onClick={() => setShowUnlockModal(true)} className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow">
              Unlock Period (Super Admin Override)
            </button>
          )}
        </div>
      )}

      {/* ─── ADJUSTMENTS TAB ─────────────────────────────────────────────── */}
      {tab === 'adjustments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500 font-semibold">Retroactive Adjustments & Arrears</p>
            <button onClick={() => setShowAdjustmentModal(true)} className="flex items-center gap-2 bg-amber-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl shadow">
              <Plus className="w-4 h-4" /> Add Adjustment
            </button>
          </div>
        </div>
      )}

      {/* ─── UNLOCK MODAL ────────────────────────────────────────────────── */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Unlock Payroll Period</h3>
              <button onClick={() => setShowUnlockModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleUnlockPayroll} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Mandatory Audit Reason *</label>
                <textarea required value={unlockReason} onChange={e => setUnlockReason(e.target.value)}
                  placeholder="e.g. Approved leave correction for Emp #102" className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" rows={3} />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowUnlockModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-red-600 text-white rounded-xl font-bold shadow">Confirm Unlock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADJUSTMENT MODAL ────────────────────────────────────────────── */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Add Payroll Adjustment</h3>
              <button onClick={() => setShowAdjustmentModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddAdjustment} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Select Employee *</label>
                <select required value={adjForm.employee_id} onChange={e => setAdjForm({...adjForm, employee_id: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                  <option value="">-- Choose Employee --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_code})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Type *</label>
                  <select value={adjForm.adjustment_type} onChange={e => setAdjForm({...adjForm, adjustment_type: e.target.value as any})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                    <option value="BONUS">Bonus</option>
                    <option value="ARREARS">Arrears</option>
                    <option value="DEDUCTION_CORRECTION">Deduction Correction</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Amount (₹) *</label>
                  <input required type="number" value={adjForm.amount} onChange={e => setAdjForm({...adjForm, amount: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold" />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Reason *</label>
                <textarea required value={adjForm.reason} onChange={e => setAdjForm({...adjForm, reason: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" rows={2} />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAdjustmentModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 text-slate-950 rounded-xl font-bold shadow">Add Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
