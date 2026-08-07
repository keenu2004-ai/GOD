import React, { useState, useEffect, useCallback } from 'react';
import {
  Award, Gift, DollarSign, Receipt, Shield, TrendingUp, Plus, X, Search,
  CheckCircle2, Clock, Sparkles, Building, FileText, Heart, CheckSquare
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

interface Bonus {
  id: number;
  employee_id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
  bonus_name?: string;
  bonus_type?: string;
  bonus_amount: number;
  payout_month: string;
  payout_year: number;
  reason?: string;
  status: string;
}

interface Incentive {
  id: number;
  employee_id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
  incentive_type: string;
  amount: number;
  payout_month: string;
  payout_year: number;
  reason?: string;
}

interface Claim {
  id: number;
  employee_id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
  claim_category: string;
  claim_amount: number;
  description: string;
  status: string;
  manager_approved: boolean;
  finance_approved: boolean;
  created_at: string;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const fmtCurr = (v: number | string) => `₹${parseFloat(String(v || 0)).toLocaleString('en-IN')}`;

export const CompensationManagementPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const isCompensationAdmin = ['ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER', 'FINANCE_MANAGER', 'SUPER_ADMIN'].includes(userRole);

  const [tab, setTab] = useState<'bonuses' | 'incentives' | 'claims'>('bonuses');
  const [analytics, setAnalytics] = useState<any>(null);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [bonusTypes, setBonusTypes] = useState<any[]>([]);
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [showIncentiveModal, setShowIncentiveModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);

  // Forms
  const [bonusForm, setBonusForm] = useState({
    employee_id: '', bonus_id: '', bonus_amount: '15000', payout_month: 'August', payout_year: 2026, reason: 'Q2 Performance Bonus',
  });

  const [incentiveForm, setIncentiveForm] = useState({
    employee_id: '', incentive_type: 'SALES', amount: '10000', payout_month: 'August', payout_year: 2026, reason: 'Exceeded August Target',
  });

  const [claimForm, setClaimForm] = useState({
    employee_id: '', claim_category: 'TRAVEL', claim_amount: '2500', description: 'Client visit cab fare and lunch',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [anaRes, bonRes, typeRes, incRes, claimRes, empRes] = await Promise.all([
        apiClient.get('/compensation/analytics').catch(() => ({ data: { data: null } })),
        apiClient.get('/bonus').catch(() => ({ data: { data: [] } })),
        apiClient.get('/compensation/bonus/types').catch(() => ({ data: { data: [] } })),
        apiClient.get('/incentives').catch(() => ({ data: { data: [] } })),
        apiClient.get('/reimbursements').catch(() => ({ data: { data: [] } })),
        apiClient.get('/employees').catch(() => ({ data: { data: [] } })),
      ]);
      setAnalytics(anaRes.data?.data || null);
      setBonuses(bonRes.data?.data || []);
      setBonusTypes(typeRes.data?.data || []);
      setIncentives(incRes.data?.data || []);
      setClaims(claimRes.data?.data || []);
      setEmployees(empRes.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSeedBonusTypes = async () => {
    try {
      await apiClient.post('/compensation/bonus/seed');
      await fetchData();
      alert('✅ Standard bonus types pre-seeded!');
    } catch (e: any) { alert(e.response?.data?.message || 'Seeding failed'); }
  };

  const handleAssignBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/bonus', {
        employee_id: parseInt(bonusForm.employee_id),
        bonus_id: bonusForm.bonus_id ? parseInt(bonusForm.bonus_id) : undefined,
        bonus_amount: parseFloat(bonusForm.bonus_amount),
        payout_month: bonusForm.payout_month,
        payout_year: bonusForm.payout_year,
        reason: bonusForm.reason,
      });
      setShowBonusModal(false);
      await fetchData();
      alert('✅ Bonus assigned!');
    } catch (e: any) { alert(e.response?.data?.message || 'Assignment failed'); }
    finally { setSubmitting(false); }
  };

  const handleApproveBonus = async (id: number) => {
    try {
      await apiClient.patch(`/bonus/${id}/approve`);
      await fetchData();
      alert('✅ Bonus approved!');
    } catch (e: any) { alert(e.response?.data?.message || 'Approval failed'); }
  };

  const handleAwardIncentive = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/incentive', {
        employee_id: parseInt(incentiveForm.employee_id),
        incentive_type: incentiveForm.incentive_type,
        amount: parseFloat(incentiveForm.amount),
        payout_month: incentiveForm.payout_month,
        payout_year: incentiveForm.payout_year,
        reason: incentiveForm.reason,
      });
      setShowIncentiveModal(false);
      await fetchData();
      alert('✅ Incentive awarded!');
    } catch (e: any) { alert(e.response?.data?.message || 'Award failed'); }
    finally { setSubmitting(false); }
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/reimbursement', {
        employee_id: parseInt(claimForm.employee_id),
        claim_category: claimForm.claim_category,
        claim_amount: parseFloat(claimForm.claim_amount),
        description: claimForm.description,
      });
      setShowClaimModal(false);
      await fetchData();
      alert('✅ Reimbursement claim submitted!');
    } catch (e: any) { alert(e.response?.data?.message || 'Submission failed'); }
    finally { setSubmitting(false); }
  };

  const handleApproveClaim = async (id: number) => {
    try {
      await apiClient.patch(`/reimbursement/${id}/approve`);
      await fetchData();
      alert('✅ Claim approved!');
    } catch (e: any) { alert(e.response?.data?.message || 'Approval failed'); }
  };

  return (
    <div className="space-y-5 min-h-screen pb-10">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-indigo-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/30 rounded-xl">
              <Gift className="w-7 h-7 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Enterprise Compensation & Benefits Module</h2>
              <p className="text-xs text-indigo-300/70 font-mono mt-0.5">Bonuses • Sales Incentives • Expense Claims • Company Benefits</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isCompensationAdmin && (
              <button onClick={handleSeedBonusTypes} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-xl border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Seed 8 Bonus Types
              </button>
            )}
            {isCompensationAdmin && (
              <button onClick={() => setShowBonusModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg">
                <Plus className="w-4 h-4" /> Assign Bonus
              </button>
            )}
          </div>
        </div>

        {/* BI Analytics Metrics Banner */}
        {analytics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-2xl font-black text-indigo-300">{fmtCurr(analytics.total_bonuses_paid)}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Approved Bonuses (YTD)</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-2xl font-black text-emerald-300">{fmtCurr(analytics.total_incentives_paid)}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Sales & Target Incentives</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-2xl font-black text-amber-300">{fmtCurr(analytics.total_claims_disbursed)}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Disbursed Claims</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-2xl font-black text-purple-300">{fmtCurr(analytics.monthly_benefits_cost)}/mo</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Monthly Benefits Cost</p>
            </div>
          </div>
        )}
      </div>

      {/* ─── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200 overflow-x-auto">
        <button onClick={() => setTab('bonuses')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'bonuses' ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Gift className="w-4 h-4" /> Bonuses & Rewards ({bonuses.length})
        </button>
        <button onClick={() => setTab('incentives')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'incentives' ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Award className="w-4 h-4" /> Sales & Target Incentives ({incentives.length})
        </button>
        <button onClick={() => setTab('claims')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'claims' ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Receipt className="w-4 h-4" /> Reimbursements & Expense Claims ({claims.length})
        </button>
      </div>

      {/* ─── BONUSES TAB ─────────────────────────────────────────────────── */}
      {tab === 'bonuses' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Bonus Title</th>
                  <th className="p-3">Payout Period</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  {isCompensationAdmin && <th className="p-3">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {bonuses.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="p-3 font-sans font-bold text-slate-900">{b.first_name} {b.last_name}</td>
                    <td className="p-3 font-sans font-semibold text-indigo-900">{b.bonus_name || b.bonus_type || 'Performance Bonus'}</td>
                    <td className="p-3 font-sans text-slate-600">{b.payout_month} {b.payout_year}</td>
                    <td className="p-3 font-bold text-emerald-700">{fmtCurr(b.bonus_amount)}</td>
                    <td className="p-3 font-sans">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        b.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>{b.status}</span>
                    </td>
                    {isCompensationAdmin && (
                      <td className="p-3 font-sans">
                        {b.status === 'PENDING' && (
                          <button onClick={() => handleApproveBonus(b.id)} className="px-2 py-1 bg-indigo-600 text-white font-bold text-[10px] rounded hover:bg-indigo-700">
                            Approve Bonus
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── INCENTIVES TAB ──────────────────────────────────────────────── */}
      {tab === 'incentives' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500 font-semibold">{incentives.length} Sales & Performance Incentives Awarded</p>
            {isCompensationAdmin && (
              <button onClick={() => setShowIncentiveModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow">
                <Plus className="w-4 h-4" /> Award Incentive
              </button>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Incentive Category</th>
                  <th className="p-3">Payout Period</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {incentives.map(i => (
                  <tr key={i.id} className="hover:bg-slate-50">
                    <td className="p-3 font-sans font-bold text-slate-900">{i.first_name} {i.last_name}</td>
                    <td className="p-3 font-sans"><span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">{i.incentive_type}</span></td>
                    <td className="p-3 font-sans text-slate-600">{i.payout_month} {i.payout_year}</td>
                    <td className="p-3 font-bold text-emerald-700">{fmtCurr(i.amount)}</td>
                    <td className="p-3 font-sans text-slate-500">{i.reason || 'Target Achievement'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── CLAIMS TAB ──────────────────────────────────────────────────── */}
      {tab === 'claims' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500 font-semibold">{claims.length} Reimbursement Claims</p>
            <button onClick={() => setShowClaimModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow">
              <Plus className="w-4 h-4" /> Submit Claim
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Status</th>
                  {isCompensationAdmin && <th className="p-3">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {claims.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-3 font-sans font-bold text-slate-900">{c.first_name} {c.last_name}</td>
                    <td className="p-3 font-sans"><span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">{c.claim_category}</span></td>
                    <td className="p-3 font-bold text-slate-900">{fmtCurr(c.claim_amount)}</td>
                    <td className="p-3 font-sans text-slate-600">{c.description}</td>
                    <td className="p-3 font-sans">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        c.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>{c.status}</span>
                    </td>
                    {isCompensationAdmin && (
                      <td className="p-3 font-sans">
                        {c.status !== 'PAID' && (
                          <button onClick={() => handleApproveClaim(c.id)} className="px-2 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded hover:bg-emerald-700">
                            Approve Claim
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── ASSIGN BONUS MODAL ──────────────────────────────────────────── */}
      {showBonusModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Assign Employee Bonus</h3>
              <button onClick={() => setShowBonusModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAssignBonus} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Employee *</label>
                <select required value={bonusForm.employee_id} onChange={e => setBonusForm({...bonusForm, employee_id: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                  <option value="">-- Choose Employee --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_code})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Bonus Category</label>
                  <select value={bonusForm.bonus_id} onChange={e => setBonusForm({...bonusForm, bonus_id: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                    <option value="">Custom Performance Bonus</option>
                    {bonusTypes.map(t => <option key={t.id} value={t.id}>{t.bonus_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Bonus Amount (₹) *</label>
                  <input required type="number" value={bonusForm.bonus_amount} onChange={e => setBonusForm({...bonusForm, bonus_amount: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowBonusModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow">{submitting ? 'Assigning...' : 'Assign Bonus'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── AWARD INCENTIVE MODAL ───────────────────────────────────────── */}
      {showIncentiveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Award Performance Incentive</h3>
              <button onClick={() => setShowIncentiveModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAwardIncentive} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Employee *</label>
                <select required value={incentiveForm.employee_id} onChange={e => setIncentiveForm({...incentiveForm, employee_id: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                  <option value="">-- Choose Employee --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_code})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Incentive Type *</label>
                  <select value={incentiveForm.incentive_type} onChange={e => setIncentiveForm({...incentiveForm, incentive_type: e.target.value as any})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                    <option value="SALES">Sales Incentive</option>
                    <option value="PROJECT">Project Incentive</option>
                    <option value="PERFORMANCE">Performance Incentive</option>
                    <option value="ATTENDANCE">Attendance Reward</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Amount (₹) *</label>
                  <input required type="number" value={incentiveForm.amount} onChange={e => setIncentiveForm({...incentiveForm, amount: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowIncentiveModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow">{submitting ? 'Awarding...' : 'Award Incentive'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── SUBMIT CLAIM MODAL ──────────────────────────────────────────── */}
      {showClaimModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Submit Reimbursement Claim</h3>
              <button onClick={() => setShowClaimModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmitClaim} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Employee *</label>
                <select required value={claimForm.employee_id} onChange={e => setClaimForm({...claimForm, employee_id: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                  <option value="">-- Choose Employee --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_code})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Claim Category *</label>
                  <select value={claimForm.claim_category} onChange={e => setClaimForm({...claimForm, claim_category: e.target.value as any})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                    <option value="TRAVEL">Travel Claim</option>
                    <option value="FUEL">Fuel Allowance</option>
                    <option value="FOOD">Food / Meal Claim</option>
                    <option value="MEDICAL">Medical Claim</option>
                    <option value="MOBILE">Mobile / Phone Bill</option>
                    <option value="INTERNET">Internet Expense</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Claim Amount (₹) *</label>
                  <input required type="number" value={claimForm.claim_amount} onChange={e => setClaimForm({...claimForm, claim_amount: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold" />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Description / Details *</label>
                <textarea required value={claimForm.description} onChange={e => setClaimForm({...claimForm, description: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" rows={2} />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowClaimModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow">{submitting ? 'Submitting...' : 'Submit Claim'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
