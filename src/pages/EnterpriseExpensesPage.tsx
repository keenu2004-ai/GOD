import React, { useState, useEffect, useCallback } from 'react';
import {
  Receipt, DollarSign, Plus, Filter, CheckCircle2, XCircle, AlertTriangle,
  RefreshCw, X, ShieldAlert, FileText, ArrowRight, ArrowLeft, Wallet, Check
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

interface ExpenseClaim {
  id: number;
  expense_number: string;
  title: string;
  category: string;
  amount: number;
  currency: string;
  merchant_name?: string;
  date: string;
  description?: string;
  receipt_url?: string;
  status: string;
  policy_warning?: string;
  reimbursed_amount?: number;
  payment_status?: string;
  first_name?: string;
  last_name?: string;
  project_name?: string;
  created_at: string;
}

interface ExpenseAdvance {
  id: number;
  advance_number: string;
  advance_amount: number;
  purpose: string;
  status: string;
  settled_amount: number;
  is_settled: boolean;
  first_name?: string;
  last_name?: string;
  created_at: string;
}

interface Project {
  id: number;
  name: string;
}

const fmtCurr = (n?: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

export const EnterpriseExpensesPage: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const isFinance = ['ADMIN', 'FINANCE_MANAGER', 'SUPER_ADMIN'].includes(userRole);
  const isManager = ['ADMIN', 'HR_MANAGER', 'DEPT_HEAD', 'SUPER_ADMIN'].includes(userRole);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [tab, setTab] = useState<'claims' | 'advances' | 'policies'>('claims');
  const [claims, setClaims] = useState<ExpenseClaim[]>([]);
  const [advances, setAdvances] = useState<ExpenseAdvance[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<ExpenseAdvance | null>(null);

  // Forms
  const [claimForm, setClaimForm] = useState({
    title: 'Client Lunch & Onsite Meeting',
    category: 'MEALS',
    amount: 3500,
    merchant_name: 'The Taj Hotel Restaurant',
    date: new Date().toISOString().split('T')[0],
    description: 'Quarterly client review meeting with Enterprise stakeholders',
    project_id: '',
  });

  const [advanceForm, setAdvanceForm] = useState({
    advance_amount: 15000,
    purpose: 'Onsite Client Visit Travel & Local Conveyance Advance',
  });

  const [settleAmount, setSettleAmount] = useState<number>(15000);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [claimRes, advRes, prjRes] = await Promise.all([
        apiClient.get('/expenses/claims').catch(() => ({ data: { data: [] } })),
        apiClient.get('/expenses/advances').catch(() => ({ data: { data: [] } })),
        apiClient.get('/projects').catch(() => ({ data: { data: [] } })),
      ]);
      setClaims(claimRes.data?.data || []);
      setAdvances(advRes.data?.data || []);
      setProjects(prjRes.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/expenses/claims', {
        ...claimForm,
        amount: Number(claimForm.amount),
        project_id: claimForm.project_id ? parseInt(claimForm.project_id) : undefined,
      });
      setShowClaimModal(false);
      await fetchData();
      alert('✅ Expense claim submitted for manager & policy review!');
    } catch (e: any) { alert(e.response?.data?.message || 'Submission failed'); }
    finally { setSubmitting(false); }
  };

  const handleRequestAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/expenses/advances', {
        ...advanceForm,
        advance_amount: Number(advanceForm.advance_amount),
      });
      setShowAdvanceModal(false);
      await fetchData();
      alert('✅ Expense advance request submitted!');
    } catch (e: any) { alert(e.response?.data?.message || 'Advance request failed'); }
    finally { setSubmitting(false); }
  };

  const handleManagerApprove = async (id: number) => {
    try {
      await apiClient.patch(`/expenses/claims/${id}/manager-approve`);
      await fetchData();
      alert('✅ Expense claim approved by manager!');
    } catch (e: any) { alert('Approval failed'); }
  };

  const handleFinanceSettle = async (id: number, amount: number) => {
    try {
      await apiClient.patch(`/expenses/claims/${id}/finance-settle`, {
        reimbursed_amount: amount,
        payment_reference: `PAY-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      });
      await fetchData();
      alert('✅ Reimbursement processed & marked PAID!');
    } catch (e: any) { alert('Reimbursement failed'); }
  };

  const handleSettleAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdvance) return;
    try {
      await apiClient.patch(`/expenses/advances/${selectedAdvance.id}/settle`, {
        settled_amount: Number(settleAmount),
      });
      setShowSettleModal(false);
      await fetchData();
      alert('✅ Expense advance settled!');
    } catch (e: any) { alert('Advance settlement failed'); }
  };

  return (
    <div className="space-y-5 min-h-screen pb-10 font-sans text-slate-800">
      {isMobile ? (
        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <button onClick={() => onNavigate?.('dashboard')} className="p-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-extrabold text-sm uppercase tracking-tight">Expenses Workspace</span>
        </div>
      ) : null}

      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className={isMobile ? "bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-4 shadow-xl border border-emerald-900/40 text-slate-800" : "bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-emerald-900/40 text-slate-800"}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600/30 rounded-xl">
              <Receipt className="w-7 h-7 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Enterprise Expense Management & Policy Engine</h2>
              <p className="text-xs text-emerald-300/70 font-mono mt-0.5">Automated Policy Limits • Manager Approval • Finance Reimbursement • Advances</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAdvanceModal(true)} className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-white/20">
              <Wallet className="w-3.5 h-3.5 inline mr-1" /> Request Advance
            </button>
            <button onClick={() => setShowClaimModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg">
              <Plus className="w-4 h-4 inline mr-1" /> Create Expense Claim
            </button>
          </div>
        </div>

        {/* Financial Expense KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-emerald-200 font-mono uppercase">Submitted Claims</p>
            <p className="text-xl font-black text-white mt-0.5 font-mono">{claims.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-emerald-300 font-mono uppercase">Total Reimbursed</p>
            <p className="text-xl font-black text-emerald-400 mt-0.5 font-mono">{fmtCurr(claims.filter(c => c.status === 'REIMBURSED').reduce((acc, c) => acc + (c.reimbursed_amount || c.amount), 0))}</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-amber-300 font-mono uppercase">Pending Finance Approval</p>
            <p className="text-xl font-black text-amber-400 mt-0.5 font-mono">{claims.filter(c => c.status === 'MANAGER_APPROVED').length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-emerald-200 font-mono uppercase">Active Advances</p>
            <p className="text-xl font-black text-white mt-0.5 font-mono">{advances.length}</p>
          </div>
        </div>
      </div>

      {/* ─── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200 overflow-x-auto">
        <button onClick={() => setTab('claims')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'claims' ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Receipt className="w-4 h-4" /> Expense Claims ({claims.length})
        </button>
        <button onClick={() => setTab('advances')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'advances' ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Wallet className="w-4 h-4" /> Expense Advances ({advances.length})
        </button>
        <button onClick={() => setTab('policies')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'policies' ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <ShieldAlert className="w-4 h-4" /> Category Policy Rules
        </button>
      </div>

      {/* ─── EXPENSE CLAIMS TAB ────────────────────────────────────────────── */}
      {tab === 'claims' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
              <tr>
                <th className="p-3">Claim Number</th>
                <th className="p-3">Employee</th>
                <th className="p-3">Title & Category</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Policy Status</th>
                <th className="p-3">Approval Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {claims.map(c => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-emerald-700">{c.expense_number || `EXP-${c.id}`}</td>
                  <td className="p-3 font-sans font-bold text-slate-900">{c.first_name} {c.last_name}</td>
                  <td className="p-3 font-sans">
                    <p className="font-bold text-slate-900">{c.title}</p>
                    <span className="text-[10px] text-slate-500">{c.category} {c.merchant_name ? `• ${c.merchant_name}` : ''}</span>
                  </td>
                  <td className="p-3 font-bold text-slate-900">{fmtCurr(c.amount)}</td>
                  <td className="p-3 font-sans">
                    {c.policy_warning ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200">Policy Warning</span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">Compliant</span>
                    )}
                  </td>
                  <td className="p-3 font-sans">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      c.status === 'REIMBURSED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      c.status === 'MANAGER_APPROVED' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>{c.status}</span>
                  </td>
                  <td className="p-3 font-sans">
                    {isManager && c.status === 'SUBMITTED' && (
                      <button onClick={() => handleManagerApprove(c.id)} className="px-2.5 py-1 bg-blue-600 text-white font-bold text-[10px] rounded hover:bg-blue-700 mr-1">
                        Manager Approve
                      </button>
                    )}
                    {isFinance && c.status === 'MANAGER_APPROVED' && (
                      <button onClick={() => handleFinanceSettle(c.id, c.amount)} className="px-2.5 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded hover:bg-emerald-700">
                        Reimburse & Pay
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── EXPENSE ADVANCES TAB ─────────────────────────────────────────── */}
      {tab === 'advances' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
              <tr>
                <th className="p-3">Advance Code</th>
                <th className="p-3">Employee</th>
                <th className="p-3">Advance Amount</th>
                <th className="p-3">Purpose</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {advances.map(a => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-emerald-700">{a.advance_number}</td>
                  <td className="p-3 font-sans font-bold text-slate-900">{a.first_name} {a.last_name}</td>
                  <td className="p-3 font-bold text-slate-900">{fmtCurr(a.advance_amount)}</td>
                  <td className="p-3 font-sans text-slate-600 line-clamp-1">{a.purpose}</td>
                  <td className="p-3 font-sans">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      a.status === 'SETTLED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>{a.status}</span>
                  </td>
                  <td className="p-3 font-sans">
                    {isFinance && !a.is_settled && (
                      <button onClick={() => { setSelectedAdvance(a); setSettleAmount(a.advance_amount); setShowSettleModal(true); }}
                        className="px-2.5 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded hover:bg-emerald-700">
                        Settle Advance
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── POLICY ENGINE RULES TAB ──────────────────────────────────────── */}
      {tab === 'policies' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">Category Policy</span>
            <h4 className="font-bold text-slate-900 text-sm">IT Hardware & Equipment</h4>
            <p className="text-xs text-slate-500 font-mono">Max Limit: ₹50,000 / claim</p>
            <p className="text-[11px] text-slate-600">Requires receipt upload and Manager + Finance dual approval.</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">Category Policy</span>
            <h4 className="font-bold text-slate-900 text-sm">Travel & Lodging</h4>
            <p className="text-xs text-slate-500 font-mono">Max Limit: ₹25,000 / claim</p>
            <p className="text-[11px] text-slate-600">Requires itemized boarding/hotel receipt.</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">Category Policy</span>
            <h4 className="font-bold text-slate-900 text-sm">Meals & Entertainment</h4>
            <p className="text-xs text-slate-500 font-mono">Max Limit: ₹5,000 / claim</p>
            <p className="text-[11px] text-slate-600">Requires merchant name and business purpose statement.</p>
          </div>
        </div>
      )}

      {/* ─── CREATE CLAIM MODAL ────────────────────────────────────────────── */}
      {showClaimModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Create Expense Claim</h3>
              <button onClick={() => setShowClaimModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateClaim} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Expense Title *</label>
                <input required value={claimForm.title} onChange={e => setClaimForm({...claimForm, title: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Category *</label>
                  <select value={claimForm.category} onChange={e => setClaimForm({...claimForm, category: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                    <option value="MEALS">Meals & Client Dining</option>
                    <option value="TRAVEL">Travel & Transport</option>
                    <option value="EQUIPMENT">IT Equipment</option>
                    <option value="SUPPLIES">Office Supplies</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Amount (₹) *</label>
                  <input required type="number" value={claimForm.amount} onChange={e => setClaimForm({...claimForm, amount: Number(e.target.value)})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Merchant / Vendor Name</label>
                <input value={claimForm.merchant_name} onChange={e => setClaimForm({...claimForm, merchant_name: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Business Purpose Description *</label>
                <textarea required value={claimForm.description} onChange={e => setClaimForm({...claimForm, description: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" rows={2} />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowClaimModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow">{submitting ? 'Submitting...' : 'Submit Claim'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── REQUEST ADVANCE MODAL ─────────────────────────────────────────── */}
      {showAdvanceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Request Expense Advance</h3>
              <button onClick={() => setShowAdvanceModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleRequestAdvance} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Advance Amount (₹) *</label>
                <input required type="number" value={advanceForm.advance_amount} onChange={e => setAdvanceForm({...advanceForm, advance_amount: Number(e.target.value)})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Advance Purpose *</label>
                <textarea required value={advanceForm.purpose} onChange={e => setAdvanceForm({...advanceForm, purpose: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" rows={3} />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAdvanceModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow">{submitting ? 'Requesting...' : 'Request Advance'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── SETTLE ADVANCE MODAL ─────────────────────────────────────────── */}
      {showSettleModal && selectedAdvance && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Settle Advance {selectedAdvance.advance_number}</h3>
              <button onClick={() => setShowSettleModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSettleAdvance} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Settled Amount (₹) *</label>
                <input required type="number" value={settleAmount} onChange={e => setSettleAmount(Number(e.target.value))}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowSettleModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow">Settle Advance</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
