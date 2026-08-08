import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart2, DollarSign, Calculator, QrCode, Shield, CheckCircle2,
  AlertTriangle, RefreshCw, X, Plus, FileText, Search, ArrowRight
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

interface FinancialAnalytics {
  total_purchase_value: number;
  accumulated_depreciation: number;
  current_book_value: number;
  total_maintenance_cost: number;
}

interface DepreciationSchedule {
  id: number;
  asset_name: string;
  asset_code: string;
  category: string;
  purchase_cost: number;
  residual_value: number;
  useful_life_years: number;
  annual_depreciation: number;
  monthly_depreciation: number;
  current_book_value: number;
}

interface Audit {
  id: number;
  audit_name: string;
  auditor_first_name?: string;
  auditor_last_name?: string;
  total_expected: number;
  total_scanned: number;
  missing_count: number;
  status: string;
}

interface AuditFinding {
  id: number;
  asset_name: string;
  asset_code: string;
  audit_name: string;
  discrepancy_type: string;
  actual_location?: string;
  status: string;
  reconciliation_action?: string;
}

interface Asset {
  id: number;
  asset_name: string;
  asset_code: string;
  value: number;
}

const fmtCurr = (n?: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

export const EnterpriseAssetAnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const isFinance = ['ADMIN', 'FINANCE_MANAGER', 'SUPER_ADMIN'].includes(userRole);

  const [tab, setTab] = useState<'depreciation' | 'audits' | 'qr'>('depreciation');
  const [fin, setFin] = useState<FinancialAnalytics>({
    total_purchase_value: 0, accumulated_depreciation: 0, current_book_value: 0, total_maintenance_cost: 0
  });

  const [depSchedules, setDepSchedules] = useState<DepreciationSchedule[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [showDepModal, setShowDepModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showFindingModal, setShowFindingModal] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);

  // Forms
  const [depForm, setDepForm] = useState({
    asset_id: '',
    purchase_cost: 249900,
    residual_value: 24990,
    useful_life_years: 3,
  });

  const [auditForm, setAuditForm] = useState({
    audit_name: 'Q3 Enterprise Hardware Physical Inventory Verification',
  });

  const [findingForm, setFindingForm] = useState({
    asset_id: '',
    discrepancy_type: 'MISSING' as any,
    actual_location: 'Building B - Tech Lab 4',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [finRes, depRes, audRes, findRes, astRes] = await Promise.all([
        apiClient.get('/assets/analytics/financial').catch(() => ({ data: { data: {} } })),
        apiClient.get('/assets/depreciation/schedules').catch(() => ({ data: { data: [] } })),
        apiClient.get('/assets/audits').catch(() => ({ data: { data: [] } })),
        apiClient.get('/assets/audit-findings').catch(() => ({ data: { data: [] } })),
        apiClient.get('/assets').catch(() => ({ data: { data: [] } })),
      ]);
      setFin(finRes.data?.data || {});
      setDepSchedules(depRes.data?.data || []);
      setAudits(audRes.data?.data || []);
      setFindings(findRes.data?.data || []);
      setAssets(astRes.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCalculateDep = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/assets/depreciation/calculate', {
        ...depForm,
        asset_id: parseInt(depForm.asset_id),
        purchase_cost: Number(depForm.purchase_cost),
        residual_value: Number(depForm.residual_value),
        useful_life_years: Number(depForm.useful_life_years),
      });
      setShowDepModal(false);
      await fetchData();
      alert('✅ Straight-line depreciation calculated & updated!');
    } catch (e: any) { alert(e.response?.data?.message || 'Calculation failed'); }
    finally { setSubmitting(false); }
  };

  const handleCreateAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/assets/audits', auditForm);
      setShowAuditModal(false);
      await fetchData();
      alert('✅ Physical inventory audit session started!');
    } catch (e: any) { alert(e.response?.data?.message || 'Audit creation failed'); }
    finally { setSubmitting(false); }
  };

  const handleRecordFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAudit) return;
    setSubmitting(true);
    try {
      await apiClient.post(`/assets/audits/${selectedAudit.id}/findings`, {
        ...findingForm,
        asset_id: parseInt(findingForm.asset_id),
      });
      setShowFindingModal(false);
      await fetchData();
      alert('✅ Audit discrepancy recorded!');
    } catch (e: any) { alert(e.response?.data?.message || 'Finding failed'); }
    finally { setSubmitting(false); }
  };

  const handleReconcileFinding = async (id: number) => {
    try {
      await apiClient.patch(`/assets/audit-findings/${id}/reconcile`, {
        action: 'Location updated & asset verified in inventory',
      });
      await fetchData();
      alert('✅ Audit finding reconciled!');
    } catch (e: any) { alert('Reconciliation failed'); }
  };

  return (
    <div className="space-y-5 min-h-screen pb-10">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-purple-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-600/30 rounded-xl">
              <BarChart2 className="w-7 h-7 text-purple-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Enterprise Asset Analytics & Audit Verification Hub</h2>
              <p className="text-xs text-purple-300/70 font-mono mt-0.5">Financial Valuation • Depreciation Engine • Physical Audits • Reconciliation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isFinance && (
              <button onClick={() => setShowDepModal(true)} className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-white/20">
                <Calculator className="w-3.5 h-3.5 inline mr-1" /> Calculate Depreciation
              </button>
            )}
            <button onClick={() => setShowAuditModal(true)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg">
              <Plus className="w-4 h-4 inline mr-1" /> Start Physical Audit
            </button>
          </div>
        </div>

        {/* Real-time Valuation KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-purple-200 font-mono uppercase">Total Purchase Valuation</p>
            <p className="text-lg font-black text-purple-200 mt-0.5 font-mono">{fmtCurr(fin.total_purchase_value)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-amber-300 font-mono uppercase">Accumulated Depreciation</p>
            <p className="text-lg font-black text-amber-400 mt-0.5 font-mono">{fmtCurr(fin.accumulated_depreciation)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-emerald-300 font-mono uppercase">Net Book Valuation</p>
            <p className="text-lg font-black text-emerald-400 mt-0.5 font-mono">{fmtCurr(fin.current_book_value)}</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-purple-200 font-mono uppercase">Total Maintenance Spent</p>
            <p className="text-lg font-black text-purple-200 mt-0.5 font-mono">{fmtCurr(fin.total_maintenance_cost)}</p>
          </div>
        </div>
      </div>

      {/* ─── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200 overflow-x-auto">
        <button onClick={() => setTab('depreciation')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'depreciation' ? 'bg-white text-purple-700 shadow-sm border border-purple-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Calculator className="w-4 h-4" /> Straight-Line Depreciation Engine ({depSchedules.length})
        </button>
        <button onClick={() => setTab('audits')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'audits' ? 'bg-white text-purple-700 shadow-sm border border-purple-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Shield className="w-4 h-4" /> Physical Audits & Reconciliation ({findings.length})
        </button>
      </div>

      {/* ─── DEPRECIATION ENGINE TAB ──────────────────────────────────────── */}
      {tab === 'depreciation' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
              <tr>
                <th className="p-3">Asset</th>
                <th className="p-3">Purchase Cost</th>
                <th className="p-3">Residual Value</th>
                <th className="p-3">Useful Life</th>
                <th className="p-3">Annual Dep.</th>
                <th className="p-3">Monthly Dep.</th>
                <th className="p-3">Current Book Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {depSchedules.map(ds => (
                <tr key={ds.id} className="hover:bg-slate-50">
                  <td className="p-3 font-sans font-bold text-slate-900">{ds.asset_name} ({ds.asset_code})</td>
                  <td className="p-3 font-bold text-slate-900">{fmtCurr(ds.purchase_cost)}</td>
                  <td className="p-3 text-slate-600">{fmtCurr(ds.residual_value)}</td>
                  <td className="p-3 font-sans font-bold text-purple-700">{ds.useful_life_years} Years</td>
                  <td className="p-3 font-bold text-amber-700">{fmtCurr(ds.annual_depreciation)}</td>
                  <td className="p-3 text-slate-600">{fmtCurr(ds.monthly_depreciation)}</td>
                  <td className="p-3 font-bold text-emerald-700">{fmtCurr(ds.current_book_value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── AUDITS & RECONCILIATION TAB ──────────────────────────────────── */}
      {tab === 'audits' && (
        <div className="space-y-4">
          {/* Active Audits Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {audits.map(a => (
              <div key={a.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-200">{a.status}</span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">{a.audit_name}</h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Discrepancies: {a.missing_count} assets</p>
                </div>
                <button onClick={() => { setSelectedAudit(a); setShowFindingModal(true); }} className="px-3 py-1.5 bg-purple-600 text-white font-bold text-xs rounded-xl shadow">
                  Scan & Record Finding
                </button>
              </div>
            ))}
          </div>

          {/* Audit Findings Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
                <tr>
                  <th className="p-3">Audit Session</th>
                  <th className="p-3">Asset</th>
                  <th className="p-3">Discrepancy Type</th>
                  <th className="p-3">Actual Location</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {findings.map(f => (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="p-3 font-sans text-slate-600">{f.audit_name}</td>
                    <td className="p-3 font-sans font-bold text-slate-900">{f.asset_name} ({f.asset_code})</td>
                    <td className="p-3 font-sans">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-red-50 text-red-700 rounded border border-red-200">{f.discrepancy_type}</span>
                    </td>
                    <td className="p-3 font-sans text-slate-600">{f.actual_location || 'N/A'}</td>
                    <td className="p-3 font-sans">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        f.status === 'RECONCILED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>{f.status}</span>
                    </td>
                    <td className="p-3 font-sans">
                      {f.status === 'OPEN' && (
                        <button onClick={() => handleReconcileFinding(f.id)} className="px-2.5 py-1 bg-purple-600 text-white font-bold text-[10px] rounded hover:bg-purple-700">
                          Reconcile Finding
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

      {/* ─── CALCULATE DEPRECIATION MODAL ──────────────────────────────────── */}
      {showDepModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Calculate Straight-Line Depreciation</h3>
              <button onClick={() => setShowDepModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCalculateDep} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Select Asset *</label>
                <select required value={depForm.asset_id} onChange={e => {
                  const a = assets.find(x => x.id === parseInt(e.target.value));
                  setDepForm({...depForm, asset_id: e.target.value, purchase_cost: a?.value || 249900});
                }} className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                  <option value="">-- Choose Asset --</option>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.asset_name} ({a.asset_code})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Purchase Cost (₹) *</label>
                  <input required type="number" value={depForm.purchase_cost} onChange={e => setDepForm({...depForm, purchase_cost: Number(e.target.value)})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Residual Value (₹)</label>
                  <input type="number" value={depForm.residual_value} onChange={e => setDepForm({...depForm, residual_value: Number(e.target.value)})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Useful Life (Years) *</label>
                <input required type="number" value={depForm.useful_life_years} onChange={e => setDepForm({...depForm, useful_life_years: Number(e.target.value)})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowDepModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-purple-600 text-white rounded-xl font-bold shadow">{submitting ? 'Calculating...' : 'Run Depreciation'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── CREATE AUDIT SESSION MODAL ────────────────────────────────────── */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Start Physical Inventory Audit Session</h3>
              <button onClick={() => setShowAuditModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateAudit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Audit Session Title *</label>
                <input required value={auditForm.audit_name} onChange={e => setAuditForm({ audit_name: e.target.value })}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAuditModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-purple-600 text-white rounded-xl font-bold shadow">{submitting ? 'Creating...' : 'Start Audit Session'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── RECORD FINDING MODAL ─────────────────────────────────────────── */}
      {showFindingModal && selectedAudit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Record Finding for {selectedAudit.audit_name}</h3>
              <button onClick={() => setShowFindingModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleRecordFinding} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Select Asset *</label>
                <select required value={findingForm.asset_id} onChange={e => setFindingForm({...findingForm, asset_id: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                  <option value="">-- Choose Asset --</option>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.asset_name} ({a.asset_code})</option>)}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Discrepancy Type *</label>
                <select value={findingForm.discrepancy_type} onChange={e => setFindingForm({...findingForm, discrepancy_type: e.target.value as any})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                  <option value="MISSING">Missing Asset</option>
                  <option value="LOCATION_MISMATCH">Location Mismatch</option>
                  <option value="DAMAGED">Damaged Asset</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowFindingModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-purple-600 text-white rounded-xl font-bold shadow">{submitting ? 'Recording...' : 'Record Finding'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
