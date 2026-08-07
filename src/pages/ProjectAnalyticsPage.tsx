import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart2, FolderGit2, AlertTriangle, CheckCircle2, Clock, DollarSign,
  TrendingUp, Plus, Shield, ShieldAlert, Flag, Filter, RefreshCw, X, Award
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

interface PortfolioKPIs {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  delayed_projects: number;
  high_risks_count: number;
  total_portfolio_budget: number;
  average_completion_pct: number;
}

interface Milestone {
  id: number;
  project_name: string;
  project_code: string;
  milestone_name: string;
  planned_date: string;
  actual_date?: string;
  status: string;
  first_name?: string;
  last_name?: string;
}

interface Risk {
  id: number;
  project_name: string;
  project_code: string;
  risk_description: string;
  severity: string;
  probability: string;
  mitigation_plan?: string;
  status: string;
  first_name?: string;
  last_name?: string;
}

const fmtCurrency = (n?: number) => n ? `₹${n.toLocaleString('en-IN')}` : '₹0';
const fmtDate = (s?: string) => s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const ProjectAnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const isManager = ['ADMIN', 'PROJECT_MANAGER', 'DEPT_HEAD', 'SUPER_ADMIN'].includes(userRole);

  const [tab, setTab] = useState<'milestones' | 'risks'>('milestones');
  const [kpis, setKpis] = useState<PortfolioKPIs | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showRiskModal, setShowRiskModal] = useState(false);

  const [milestoneForm, setMilestoneForm] = useState({
    project_id: '',
    milestone_name: 'Production Release & Customer Signoff',
    planned_date: '2026-08-30',
  });

  const [riskForm, setRiskForm] = useState({
    project_id: '',
    risk_description: 'Third-party API rate limits during peak usage',
    severity: 'HIGH' as any,
    probability: 'MEDIUM' as any,
    mitigation_plan: 'Implement Redis queue caching and backoff retry logic',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [kpiRes, msRes, rskRes, prjRes] = await Promise.all([
        apiClient.get('/projects/portfolio/kpis').catch(() => ({ data: { data: null } })),
        apiClient.get('/projects/milestones').catch(() => ({ data: { data: [] } })),
        apiClient.get('/projects/risks').catch(() => ({ data: { data: [] } })),
        apiClient.get('/projects').catch(() => ({ data: { data: [] } })),
      ]);
      setKpis(kpiRes.data?.data || null);
      setMilestones(msRes.data?.data || []);
      setRisks(rskRes.data?.data || []);
      setProjects(prjRes.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/projects/milestones', {
        ...milestoneForm,
        project_id: parseInt(milestoneForm.project_id),
      });
      setShowMilestoneModal(false);
      await fetchData();
      alert('✅ Milestone added to project!');
    } catch (e: any) { alert(e.response?.data?.message || 'Creation failed'); }
    finally { setSubmitting(false); }
  };

  const handleCreateRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/projects/risks', {
        ...riskForm,
        project_id: parseInt(riskForm.project_id),
      });
      setShowRiskModal(false);
      await fetchData();
      alert('✅ Risk logged in risk register!');
    } catch (e: any) { alert(e.response?.data?.message || 'Creation failed'); }
    finally { setSubmitting(false); }
  };

  const mockMonthlyData = [
    { month: 'Mar', achieved: 4, planned: 5 },
    { month: 'Apr', achieved: 6, planned: 6 },
    { month: 'May', achieved: 8, planned: 9 },
    { month: 'Jun', achieved: 7, planned: 8 },
    { month: 'Jul', achieved: 10, planned: 11 },
    { month: 'Aug', achieved: 12, planned: 12 },
  ];

  return (
    <div className="space-y-5 min-h-screen pb-10">
      {/* ─── Executive Portfolio BI Header ─────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-indigo-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/30 rounded-xl">
              <BarChart2 className="w-7 h-7 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Enterprise Project Analytics & Portfolio BI</h2>
              <p className="text-xs text-indigo-300/70 font-mono mt-0.5">Executive Portfolio Dashboard • Milestones Engine • Risk Register</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowMilestoneModal(true)} className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-white/20">
              <Plus className="w-3.5 h-3.5 inline mr-1" /> Add Milestone
            </button>
            <button onClick={() => setShowRiskModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg">
              <ShieldAlert className="w-4 h-4 inline mr-1" /> Log Project Risk
            </button>
          </div>
        </div>

        {/* Portfolio BI Banner */}
        {kpis && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-2xl font-black text-white">{kpis.total_projects}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Total Active Projects</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-2xl font-black text-emerald-300">{fmtCurrency(kpis.total_portfolio_budget)}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Portfolio Budget</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-2xl font-black text-indigo-300">{kpis.average_completion_pct}%</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Average Progress</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className={`text-2xl font-black ${kpis.high_risks_count > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{kpis.high_risks_count}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Critical Open Risks</p>
            </div>
          </div>
        )}
      </div>

      {/* ─── 12-MONTH MILESTONE DELIVERY CHART ───────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-600" /> Milestone Delivery Pace & Velocity Trend
        </h3>

        <div className="h-40 flex items-end justify-between gap-4 pt-4 px-2">
          {mockMonthlyData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <div className="w-full flex items-end justify-center gap-1.5 h-full">
                <div style={{ height: `${(d.achieved / 15) * 100}%` }} className="w-1/2 bg-indigo-600 rounded-t transition-all" title={`Achieved: ${d.achieved}`} />
                <div style={{ height: `${(d.planned / 15) * 100}%` }} className="w-1/2 bg-slate-200 rounded-t transition-all" title={`Planned: ${d.planned}`} />
              </div>
              <span className="text-[10px] font-bold text-slate-500 font-mono">{d.month}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-6 text-[10px] font-bold pt-2 border-t">
          <span className="flex items-center gap-1 text-indigo-700"><span className="w-2.5 h-2.5 bg-indigo-600 rounded-sm" /> Achieved Milestones</span>
          <span className="flex items-center gap-1 text-slate-600"><span className="w-2.5 h-2.5 bg-slate-200 rounded-sm" /> Planned Milestones</span>
        </div>
      </div>

      {/* ─── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200 overflow-x-auto">
        <button onClick={() => setTab('milestones')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'milestones' ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Flag className="w-4 h-4" /> Milestones Tracker ({milestones.length})
        </button>
        <button onClick={() => setTab('risks')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'risks' ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <ShieldAlert className="w-4 h-4" /> Risk Register & Mitigation Hub ({risks.length})
        </button>
      </div>

      {/* ─── MILESTONES TRACKER TAB ──────────────────────────────────────── */}
      {tab === 'milestones' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
              <tr>
                <th className="p-3">Project</th>
                <th className="p-3">Milestone Name</th>
                <th className="p-3">Planned Date</th>
                <th className="p-3">Owner</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {milestones.map(m => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="p-3 font-sans font-bold text-slate-900">{m.project_name} ({m.project_code})</td>
                  <td className="p-3 font-sans text-slate-700">{m.milestone_name}</td>
                  <td className="p-3 font-sans text-slate-600">{fmtDate(m.planned_date)}</td>
                  <td className="p-3 font-sans text-slate-500">{m.first_name ? `${m.first_name} ${m.last_name}` : 'Unassigned'}</td>
                  <td className="p-3 font-sans">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      m.status === 'ACHIEVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}>{m.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── RISK REGISTER TAB ───────────────────────────────────────────── */}
      {tab === 'risks' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
              <tr>
                <th className="p-3">Project</th>
                <th className="p-3">Risk Description</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Probability</th>
                <th className="p-3">Mitigation Action Plan</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {risks.map(r => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="p-3 font-sans font-bold text-slate-900">{r.project_name}</td>
                  <td className="p-3 font-sans text-slate-700">{r.risk_description}</td>
                  <td className="p-3 font-sans">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      ['CRITICAL', 'HIGH'].includes(r.severity) ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>{r.severity}</span>
                  </td>
                  <td className="p-3 font-sans text-slate-600">{r.probability}</td>
                  <td className="p-3 font-sans text-slate-700">{r.mitigation_plan || 'Under review'}</td>
                  <td className="p-3 font-sans">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── ADD MILESTONE MODAL ────────────────────────────────────────── */}
      {showMilestoneModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Add Project Milestone</h3>
              <button onClick={() => setShowMilestoneModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateMilestone} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Select Project *</label>
                <select required value={milestoneForm.project_id} onChange={e => setMilestoneForm({...milestoneForm, project_id: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                  <option value="">-- Choose Project --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Milestone Name *</label>
                <input required value={milestoneForm.milestone_name} onChange={e => setMilestoneForm({...milestoneForm, milestone_name: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Planned Target Date *</label>
                <input required type="date" value={milestoneForm.planned_date} onChange={e => setMilestoneForm({...milestoneForm, planned_date: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowMilestoneModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow">{submitting ? 'Creating...' : 'Create Milestone'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── LOG RISK MODAL ─────────────────────────────────────────────── */}
      {showRiskModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Log Project Risk</h3>
              <button onClick={() => setShowRiskModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateRisk} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Select Project *</label>
                <select required value={riskForm.project_id} onChange={e => setRiskForm({...riskForm, project_id: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                  <option value="">-- Choose Project --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Risk Description *</label>
                <textarea required value={riskForm.risk_description} onChange={e => setRiskForm({...riskForm, risk_description: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" rows={2} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Severity</label>
                  <select value={riskForm.severity} onChange={e => setRiskForm({...riskForm, severity: e.target.value as any})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Probability</label>
                  <select value={riskForm.probability} onChange={e => setRiskForm({...riskForm, probability: e.target.value as any})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Mitigation Action Plan</label>
                <textarea value={riskForm.mitigation_plan} onChange={e => setRiskForm({...riskForm, mitigation_plan: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" rows={2} />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowRiskModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow">{submitting ? 'Logging...' : 'Log Risk'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
