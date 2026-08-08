import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert, DollarSign, Lock, AlertTriangle, RefreshCw, X, Plus,
  CheckCircle2, FileText, PieChart, ArrowRight, ShieldCheck
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

interface RiskFlag {
  id: number;
  expense_number: string;
  title: string;
  amount: number;
  first_name: string;
  last_name: string;
  risk_level: string;
  risk_reason: string;
  is_duplicate: boolean;
  is_cleared: boolean;
  created_at: string;
}

interface Budget {
  id: number;
  cost_center_name: string;
  total_budget_amount: number;
  committed_amount: number;
  paid_amount: number;
  financial_year: string;
}

interface Reconciliation {
  id: number;
  expense_number: string;
  title: string;
  first_name: string;
  last_name: string;
  approved_amount: number;
  paid_amount: number;
  status: string;
  payment_reference?: string;
  reconciled_at: string;
}

interface PeriodLock {
  id: number;
  period_name: string;
  is_locked: boolean;
  locked_at?: string;
}

const fmtCurr = (n?: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

export const EnterpriseExpensePolicyPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const isFinance = ['ADMIN', 'FINANCE_MANAGER', 'SUPER_ADMIN'].includes(userRole);

  const [tab, setTab] = useState<'risk' | 'budgets' | 'reconcile'>('risk');

  const [riskFlags, setRiskFlags] = useState<RiskFlag[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [periodLocks, setPeriodLocks] = useState<PeriodLock[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);

  // Forms
  const [budgetForm, setBudgetForm] = useState({
    cost_center_name: 'Engineering & Product Development',
    total_budget_amount: 1500000,
  });

  const [periodName, setPeriodName] = useState('Q2-2026 Financial Period');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [riskRes, budRes, recRes, lockRes] = await Promise.all([
        apiClient.get('/expenses/risk-flags').catch(() => ({ data: { data: [] } })),
        apiClient.get('/expenses/budgets').catch(() => ({ data: { data: [] } })),
        apiClient.get('/expenses/reconciliations').catch(() => ({ data: { data: [] } })),
        apiClient.get('/expenses/periods').catch(() => ({ data: { data: [] } })),
      ]);
      setRiskFlags(riskRes.data?.data || []);
      setBudgets(budRes.data?.data || []);
      setReconciliations(recRes.data?.data || []);
      setPeriodLocks(lockRes.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/expenses/budgets', {
        ...budgetForm,
        total_budget_amount: Number(budgetForm.total_budget_amount),
      });
      setShowBudgetModal(false);
      await fetchData();
      alert('✅ Cost center budget allocated!');
    } catch (e: any) { alert(e.response?.data?.message || 'Budget allocation failed'); }
    finally { setSubmitting(false); }
  };

  const handleLockPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/expenses/periods/lock', { period_name: periodName });
      setShowLockModal(false);
      await fetchData();
      alert('✅ Financial period locked successfully!');
    } catch (e: any) { alert('Period lock failed'); }
    finally { setSubmitting(false); }
  };

  const handleClearRisk = async (id: number) => {
    try {
      await apiClient.patch(`/expenses/risk-flags/${id}/clear`);
      await fetchData();
      alert('✅ Risk flag cleared by Finance!');
    } catch (e) { alert('Clear risk failed'); }
  };

  return (
    <div className="space-y-5 min-h-screen pb-10">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-rose-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600/30 rounded-xl">
              <ShieldAlert className="w-7 h-7 text-rose-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Enterprise Expense Policy Controls & Fraud Risk Radar</h2>
              <p className="text-xs text-rose-300/70 font-mono mt-0.5">Budget Management • Fraud & Duplicate Flags • Payment Reconciliation • Period Lock</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowLockModal(true)} className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-white/20">
              <Lock className="w-3.5 h-3.5 inline mr-1" /> Lock Financial Period
            </button>
            <button onClick={() => setShowBudgetModal(true)} className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg">
              <Plus className="w-4 h-4 inline mr-1" /> Allocate Budget
            </button>
          </div>
        </div>

        {/* Real-time Policy & Risk KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-rose-200 font-mono uppercase">Total Budget Allocated</p>
            <p className="text-lg font-black text-white mt-0.5 font-mono">{fmtCurr(budgets.reduce((a, b) => a + Number(b.total_budget_amount), 0))}</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-amber-300 font-mono uppercase">Active Risk & Duplicate Flags</p>
            <p className="text-lg font-black text-amber-400 mt-0.5 font-mono">{riskFlags.filter(r => !r.is_cleared).length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-emerald-300 font-mono uppercase">Reconciled Transactions</p>
            <p className="text-lg font-black text-emerald-400 mt-0.5 font-mono">{reconciliations.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-rose-200 font-mono uppercase">Locked Financial Periods</p>
            <p className="text-lg font-black text-white mt-0.5 font-mono">{periodLocks.filter(p => p.is_locked).length}</p>
          </div>
        </div>
      </div>

      {/* ─── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200 overflow-x-auto">
        <button onClick={() => setTab('risk')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'risk' ? 'bg-white text-rose-700 shadow-sm border border-rose-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <ShieldAlert className="w-4 h-4" /> Risk & Fraud Radar ({riskFlags.length})
        </button>
        <button onClick={() => setTab('budgets')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'budgets' ? 'bg-white text-rose-700 shadow-sm border border-rose-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <PieChart className="w-4 h-4" /> Cost Center Budgets ({budgets.length})
        </button>
        <button onClick={() => setTab('reconcile')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'reconcile' ? 'bg-white text-rose-700 shadow-sm border border-rose-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <ShieldCheck className="w-4 h-4" /> Reconciliation & Period Locks
        </button>
      </div>

      {/* ─── RISK & FRAUD RADAR TAB ────────────────────────────────────────── */}
      {tab === 'risk' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
              <tr>
                <th className="p-3">Expense Code</th>
                <th className="p-3">Employee</th>
                <th className="p-3">Claim Amount</th>
                <th className="p-3">Risk Level</th>
                <th className="p-3">Risk Reason</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {riskFlags.map(rf => (
                <tr key={rf.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-rose-700">{rf.expense_number}</td>
                  <td className="p-3 font-sans font-bold text-slate-900">{rf.first_name} {rf.last_name}</td>
                  <td className="p-3 font-bold text-slate-900">{fmtCurr(rf.amount)}</td>
                  <td className="p-3 font-sans">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      rf.risk_level === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>{rf.risk_level}</span>
                  </td>
                  <td className="p-3 font-sans text-slate-600 line-clamp-1">{rf.risk_reason}</td>
                  <td className="p-3 font-sans">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      rf.is_cleared ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>{rf.is_cleared ? 'CLEARED' : 'ACTIVE_FLAG'}</span>
                  </td>
                  <td className="p-3 font-sans">
                    {!rf.is_cleared && (
                      <button onClick={() => handleClearRisk(rf.id)} className="px-2.5 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded hover:bg-emerald-700">
                        Clear Flag
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── COST CENTER BUDGETS TAB ───────────────────────────────────────── */}
      {tab === 'budgets' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {budgets.map(b => (
            <div key={b.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-bold text-slate-900 text-sm">{b.cost_center_name}</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">{b.financial_year}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Allocated</p>
                  <p className="font-bold text-slate-900">{fmtCurr(b.total_budget_amount)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Committed</p>
                  <p className="font-bold text-amber-700">{fmtCurr(b.committed_amount)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Remaining</p>
                  <p className="font-bold text-emerald-700">{fmtCurr(b.total_budget_amount - b.paid_amount)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── RECONCILIATION & PERIOD LOCKS TAB ────────────────────────────── */}
      {tab === 'reconcile' && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <h4 className="font-bold text-slate-900 text-xs uppercase p-4 border-b bg-slate-50">Payment Reconciliation Audit</h4>
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
                <tr>
                  <th className="p-3">Expense Number</th>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Approved Amount</th>
                  <th className="p-3">Paid Amount</th>
                  <th className="p-3">Payment Ref</th>
                  <th className="p-3">Reconciliation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {reconciliations.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-rose-700">{r.expense_number}</td>
                    <td className="p-3 font-sans font-bold text-slate-900">{r.first_name} {r.last_name}</td>
                    <td className="p-3 font-bold text-slate-900">{fmtCurr(r.approved_amount)}</td>
                    <td className="p-3 font-bold text-emerald-700">{fmtCurr(r.paid_amount)}</td>
                    <td className="p-3 text-slate-600">{r.payment_reference || 'N/A'}</td>
                    <td className="p-3 font-sans">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        r.status === 'MATCHED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                      }`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── ALLOCATE BUDGET MODAL ─────────────────────────────────────────── */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Allocate Cost Center Budget</h3>
              <button onClick={() => setShowBudgetModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateBudget} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Cost Center Name *</label>
                <input required value={budgetForm.cost_center_name} onChange={e => setBudgetForm({...budgetForm, cost_center_name: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold" />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Total Budget Amount (₹) *</label>
                <input required type="number" value={budgetForm.total_budget_amount} onChange={e => setBudgetForm({...budgetForm, total_budget_amount: Number(e.target.value)})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowBudgetModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-rose-600 text-white rounded-xl font-bold shadow">{submitting ? 'Allocating...' : 'Allocate Budget'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── LOCK PERIOD MODAL ─────────────────────────────────────────────── */}
      {showLockModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Lock Financial Period</h3>
              <button onClick={() => setShowLockModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleLockPeriod} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Period Name *</label>
                <input required value={periodName} onChange={e => setPeriodName(e.target.value)}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowLockModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-rose-600 text-white rounded-xl font-bold shadow">{submitting ? 'Locking...' : 'Lock Period'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
