import React, { useState, useEffect, useCallback } from 'react';
import {
  Wrench, Shield, AlertTriangle, DollarSign, Plus, RefreshCw, X,
  CheckCircle2, Clock, FileText, UserCheck, ArrowRight
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

interface WarrantyClaim {
  id: number;
  claim_number: string;
  asset_name: string;
  asset_code: string;
  vendor_name?: string;
  issue_description: string;
  status: string;
}

interface DamageInvestigation {
  id: number;
  asset_name: string;
  asset_code: string;
  first_name?: string;
  last_name?: string;
  damage_severity: string;
  estimated_cost: number;
  responsibility: string;
  status: string;
}

interface PayrollRecovery {
  id: number;
  asset_name: string;
  asset_code: string;
  first_name: string;
  last_name: string;
  recovery_amount: number;
  reason: string;
  status: string;
  payroll_deducted: boolean;
}

interface Asset {
  id: number;
  asset_name: string;
  asset_code: string;
}

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
}

const fmtCurr = (n?: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

export const EnterpriseAssetMaintenancePage: React.FC = () => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const isHR = ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'FINANCE_MANAGER'].includes(userRole);

  const [tab, setTab] = useState<'warranty' | 'damage' | 'payroll-recovery'>('warranty');
  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [investigations, setInvestigations] = useState<DamageInvestigation[]>([]);
  const [recoveries, setRecoveries] = useState<PayrollRecovery[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  // Forms
  const [claimForm, setClaimForm] = useState({
    asset_id: '',
    vendor_name: 'Apple Authorized Service Provider',
    issue_description: 'Motherboard power rail component failure under warranty',
  });

  const [damageForm, setDamageForm] = useState({
    asset_id: '',
    employee_id: '',
    damage_severity: 'MODERATE' as any,
    estimated_cost: 15000,
    responsibility: 'EMPLOYEE' as any,
    notes: 'Liquid spill on keyboard during off-site meeting',
  });

  const [recoveryForm, setRecoveryForm] = useState({
    asset_id: '',
    employee_id: '',
    recovery_amount: 15000,
    reason: 'Employee liability for unreturned equipment',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [claimRes, damRes, recRes, astRes, empRes] = await Promise.all([
        apiClient.get('/assets/warranty-claims').catch(() => ({ data: { data: [] } })),
        apiClient.get('/assets/damage-investigations').catch(() => ({ data: { data: [] } })),
        apiClient.get('/assets/payroll-recoveries').catch(() => ({ data: { data: [] } })),
        apiClient.get('/assets').catch(() => ({ data: { data: [] } })),
        apiClient.get('/employees').catch(() => ({ data: { data: [] } })),
      ]);
      setClaims(claimRes.data?.data || []);
      setInvestigations(damRes.data?.data || []);
      setRecoveries(recRes.data?.data || []);
      setAssets(astRes.data?.data || []);
      setEmployees(empRes.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/assets/warranty-claims', {
        ...claimForm,
        asset_id: parseInt(claimForm.asset_id),
      });
      setShowClaimModal(false);
      await fetchData();
      alert('✅ Warranty claim submitted to vendor!');
    } catch (e: any) { alert(e.response?.data?.message || 'Claim failed'); }
    finally { setSubmitting(false); }
  };

  const handleCreateDamage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/assets/damage-investigations', {
        ...damageForm,
        asset_id: parseInt(damageForm.asset_id),
        employee_id: damageForm.employee_id ? parseInt(damageForm.employee_id) : undefined,
        estimated_cost: Number(damageForm.estimated_cost),
      });
      setShowDamageModal(false);
      await fetchData();
      alert('✅ Damage investigation initiated!');
    } catch (e: any) { alert(e.response?.data?.message || 'Investigation failed'); }
    finally { setSubmitting(false); }
  };

  const handleCreateRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/assets/payroll-recoveries', {
        ...recoveryForm,
        asset_id: parseInt(recoveryForm.asset_id),
        employee_id: parseInt(recoveryForm.employee_id),
        recovery_amount: Number(recoveryForm.recovery_amount),
      });
      setShowRecoveryModal(false);
      await fetchData();
      alert('✅ Payroll recovery request created for Finance approval!');
    } catch (e: any) { alert(e.response?.data?.message || 'Recovery creation failed'); }
    finally { setSubmitting(false); }
  };

  const handleApproveRecovery = async (id: number) => {
    try {
      await apiClient.patch(`/assets/payroll-recoveries/${id}/approve`);
      await fetchData();
      alert('✅ Payroll recovery approved for payroll deduction!');
    } catch (e: any) { alert('Approval failed'); }
  };

  return (
    <div className="space-y-5 min-h-screen pb-10">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-rose-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600/30 rounded-xl">
              <Wrench className="w-7 h-7 text-rose-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Enterprise Asset Maintenance & Recovery Center</h2>
              <p className="text-xs text-rose-300/70 font-mono mt-0.5">Warranty Claims • Damage Investigations • Payroll Loss Recoveries</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowClaimModal(true)} className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3 py-2 rounded-xl border border-white/20">
              <Plus className="w-3.5 h-3.5 inline mr-1" /> Submit Warranty Claim
            </button>
            <button onClick={() => setShowDamageModal(true)} className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3 py-2 rounded-xl border border-white/20">
              <Plus className="w-3.5 h-3.5 inline mr-1" /> Report Damage
            </button>
            {isHR && (
              <button onClick={() => setShowRecoveryModal(true)} className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg">
                <Plus className="w-4 h-4 inline mr-1" /> Create Payroll Recovery
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200 overflow-x-auto">
        <button onClick={() => setTab('warranty')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'warranty' ? 'bg-white text-rose-700 shadow-sm border border-rose-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Shield className="w-4 h-4" /> Warranty Claims ({claims.length})
        </button>
        <button onClick={() => setTab('damage')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'damage' ? 'bg-white text-rose-700 shadow-sm border border-rose-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <AlertTriangle className="w-4 h-4" /> Damage Investigations ({investigations.length})
        </button>
        <button onClick={() => setTab('payroll-recovery')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'payroll-recovery' ? 'bg-white text-rose-700 shadow-sm border border-rose-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <DollarSign className="w-4 h-4" /> Payroll Loss Recoveries ({recoveries.length})
        </button>
      </div>

      {/* ─── WARRANTY CLAIMS TAB ───────────────────────────────────────────── */}
      {tab === 'warranty' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
              <tr>
                <th className="p-3">Claim Number</th>
                <th className="p-3">Asset Name</th>
                <th className="p-3">Vendor / Service Provider</th>
                <th className="p-3">Issue Description</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {claims.map(c => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-rose-700">{c.claim_number}</td>
                  <td className="p-3 font-sans font-bold text-slate-900">{c.asset_name} ({c.asset_code})</td>
                  <td className="p-3 font-sans text-slate-600">{c.vendor_name || 'N/A'}</td>
                  <td className="p-3 font-sans text-slate-600 line-clamp-1">{c.issue_description}</td>
                  <td className="p-3 font-sans">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200">{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── DAMAGE INVESTIGATIONS TAB ────────────────────────────────────── */}
      {tab === 'damage' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
              <tr>
                <th className="p-3">Asset</th>
                <th className="p-3">Employee</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Est. Repair Cost</th>
                <th className="p-3">Responsibility</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {investigations.map(d => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="p-3 font-sans font-bold text-slate-900">{d.asset_name} ({d.asset_code})</td>
                  <td className="p-3 font-sans font-semibold text-slate-700">{d.first_name ? `${d.first_name} ${d.last_name}` : 'Unassigned'}</td>
                  <td className="p-3 font-sans">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-red-50 text-red-700 rounded border border-red-200">{d.damage_severity}</span>
                  </td>
                  <td className="p-3 font-bold text-slate-900">{fmtCurr(d.estimated_cost)}</td>
                  <td className="p-3 font-sans font-bold text-slate-800">{d.responsibility}</td>
                  <td className="p-3 font-sans">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200">{d.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── PAYROLL RECOVERIES TAB ────────────────────────────────────────── */}
      {tab === 'payroll-recovery' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
              <tr>
                <th className="p-3">Asset</th>
                <th className="p-3">Employee</th>
                <th className="p-3">Recovery Amount</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Approval Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {recoveries.map(r => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="p-3 font-sans font-bold text-slate-900">{r.asset_name} ({r.asset_code})</td>
                  <td className="p-3 font-sans font-bold text-slate-900">{r.first_name} {r.last_name}</td>
                  <td className="p-3 font-bold text-rose-700">{fmtCurr(r.recovery_amount)}</td>
                  <td className="p-3 font-sans text-slate-600 line-clamp-1">{r.reason}</td>
                  <td className="p-3 font-sans">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      r.status === 'PAYROLL_APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>{r.status}</span>
                  </td>
                  <td className="p-3 font-sans">
                    {isHR && r.status === 'PENDING_FINANCE_APPROVAL' && (
                      <button onClick={() => handleApproveRecovery(r.id)} className="px-2.5 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded hover:bg-emerald-700">
                        Approve Payroll Deduction
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── SUBMIT WARRANTY CLAIM MODAL ───────────────────────────────────── */}
      {showClaimModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Submit Warranty Claim</h3>
              <button onClick={() => setShowClaimModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateClaim} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Select Asset *</label>
                <select required value={claimForm.asset_id} onChange={e => setClaimForm({...claimForm, asset_id: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                  <option value="">-- Choose Asset --</option>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.asset_name} ({a.asset_code})</option>)}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Issue Description *</label>
                <textarea required value={claimForm.issue_description} onChange={e => setClaimForm({...claimForm, issue_description: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" rows={3} />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowClaimModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-rose-600 text-white rounded-xl font-bold shadow">{submitting ? 'Submitting...' : 'Submit Claim'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── INITIATE DAMAGE INVESTIGATION MODAL ──────────────────────────── */}
      {showDamageModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Initiate Damage Investigation</h3>
              <button onClick={() => setShowDamageModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateDamage} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Select Damaged Asset *</label>
                <select required value={damageForm.asset_id} onChange={e => setDamageForm({...damageForm, asset_id: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                  <option value="">-- Choose Asset --</option>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.asset_name} ({a.asset_code})</option>)}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Estimated Repair Cost (₹) *</label>
                <input required type="number" value={damageForm.estimated_cost} onChange={e => setDamageForm({...damageForm, estimated_cost: Number(e.target.value)})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowDamageModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-rose-600 text-white rounded-xl font-bold shadow">{submitting ? 'Initiating...' : 'Initiate Investigation'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── CREATE PAYROLL RECOVERY MODAL ─────────────────────────────────── */}
      {showRecoveryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Create Employee Payroll Recovery Request</h3>
              <button onClick={() => setShowRecoveryModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateRecovery} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Select Asset *</label>
                <select required value={recoveryForm.asset_id} onChange={e => setRecoveryForm({...recoveryForm, asset_id: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                  <option value="">-- Choose Asset --</option>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.asset_name} ({a.asset_code})</option>)}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Select Responsible Employee *</label>
                <select required value={recoveryForm.employee_id} onChange={e => setRecoveryForm({...recoveryForm, employee_id: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                  <option value="">-- Choose Employee --</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>)}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Recovery Amount (₹) *</label>
                <input required type="number" value={recoveryForm.recovery_amount} onChange={e => setRecoveryForm({...recoveryForm, recovery_amount: Number(e.target.value)})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowRecoveryModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-rose-600 text-white rounded-xl font-bold shadow">{submitting ? 'Creating...' : 'Submit Payroll Recovery'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
