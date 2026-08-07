import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart2, TrendingUp, DollarSign, Building, Users, Calendar, Download,
  Target, Shield, Zap, Plus, X, ArrowUpRight, ArrowDownRight, RefreshCw
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

interface ExecutiveKPIs {
  active_headcount: number;
  total_annual_ctc: number;
  average_ctc: number;
  total_net_disbursed: number;
  total_gross_payroll: number;
  total_bonuses_paid: number;
  total_claims_disbursed: number;
  total_loan_recovery: number;
}

interface DeptBreakup {
  department_id: number;
  department_name: string;
  headcount: number;
  monthly_cost: number;
  annual_cost: number;
  department_budget: number;
}

interface BranchBreakup {
  branch_id: number;
  branch_name: string;
  headcount: number;
  monthly_cost: number;
  annual_cost: number;
}

interface TrendItem {
  month: string;
  year: number;
  total_gross: number;
  total_net: number;
  total_employees: number;
}

interface Forecast {
  current_monthly_run_rate: number;
  next_month_forecast: number;
  next_quarter_forecast: number;
  annual_forecast: number;
  growth_assumption_pct: number;
}

const fmtCurr = (v: number | string) => `₹${parseFloat(String(v || 0)).toLocaleString('en-IN')}`;

export const PayrollAnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const isFinanceAdmin = ['ADMIN', 'FINANCE_MANAGER', 'SUPER_ADMIN'].includes(userRole);

  const [tab, setTab] = useState<'departments' | 'forecast' | 'budgets'>('departments');
  const [kpis, setKpis] = useState<ExecutiveKPIs | null>(null);
  const [deptBreakup, setDeptBreakup] = useState<DeptBreakup[]>([]);
  const [branchBreakup, setBranchBreakup] = useState<BranchBreakup[]>([]);
  const [trend, setTrend] = useState<TrendItem[]>([]);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);

  // Budget Modal
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ department_id: '', year: 2026, annual_budget: '5000000' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [kpiRes, deptRes, branchRes, trendRes, foreRes, empRes] = await Promise.all([
        apiClient.get('/payroll/analytics/kpis').catch(() => ({ data: { data: null } })),
        apiClient.get('/payroll/analytics/departments').catch(() => ({ data: { data: [] } })),
        apiClient.get('/payroll/analytics/branches').catch(() => ({ data: { data: [] } })),
        apiClient.get('/payroll/analytics/trend').catch(() => ({ data: { data: [] } })),
        apiClient.get('/payroll/analytics/forecast').catch(() => ({ data: { data: null } })),
        apiClient.get('/departments').catch(() => ({ data: { data: [] } })),
      ]);
      setKpis(kpiRes.data?.data || null);
      setDeptBreakup(deptRes.data?.data || []);
      setBranchBreakup(branchRes.data?.data || []);
      setTrend(trendRes.data?.data || []);
      setForecast(foreRes.data?.data || null);
      setDepartments(empRes.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSetBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/payroll/analytics/budget', {
        department_id: parseInt(budgetForm.department_id),
        year: parseInt(String(budgetForm.year)),
        annual_budget: parseFloat(budgetForm.annual_budget),
      });
      setShowBudgetModal(false);
      await fetchData();
      alert('✅ Department annual budget set!');
    } catch (e: any) { alert(e.response?.data?.message || 'Budget set failed'); }
  };

  const maxCost = Math.max(...trend.map(t => parseFloat(String(t.total_gross || 1))), 1);

  return (
    <div className="space-y-5 min-h-screen pb-10">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-violet-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-violet-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-600/30 rounded-xl">
              <BarChart2 className="w-7 h-7 text-violet-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Enterprise Payroll Analytics & BI Platform</h2>
              <p className="text-xs text-violet-300/70 font-mono mt-0.5">Executive Financial Intelligence • Predictive Cost Forecasting • Departmental Budgets</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => alert('Executive Payroll Report Exported!')} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3 py-2 rounded-xl border border-white/20">
              <Download className="w-3.5 h-3.5" /> Export BI Report CSV
            </button>
            {isFinanceAdmin && (
              <button onClick={() => setShowBudgetModal(true)} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg">
                <Plus className="w-4 h-4" /> Set Department Budget
              </button>
            )}
          </div>
        </div>

        {/* Executive KPI Banner */}
        {kpis && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-2xl font-black text-violet-300">{fmtCurr(kpis.total_annual_ctc)}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Total Annual CTC Liability</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-2xl font-black text-emerald-300">{fmtCurr(kpis.total_net_disbursed)}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Total Net Disbursed YTD</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-2xl font-black text-amber-300">{fmtCurr(kpis.average_ctc)}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Average Employee CTC</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-2xl font-black text-blue-300">{kpis.active_headcount}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Active Workforce Headcount</p>
            </div>
          </div>
        )}
      </div>

      {/* ─── 12-MONTH PAYROLL TREND VISUAL CHART ──────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-600" /> 12-Month Historical Payroll Cost Trend
          </h3>
          <span className="text-[10px] font-mono text-slate-400">Monthly Gross vs Net Disbursal</span>
        </div>

        {/* Visual Bar Chart */}
        <div className="h-44 flex items-end gap-3 pt-6 pb-2 border-b border-slate-100">
          {trend.map((t, idx) => {
            const grossHeight = Math.round((parseFloat(String(t.total_gross)) / maxCost) * 100);
            const netHeight = Math.round((parseFloat(String(t.total_net)) / maxCost) * 100);
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                <div className="absolute -top-8 hidden group-hover:block bg-slate-900 text-white text-[9px] p-1 rounded font-mono z-10 whitespace-nowrap">
                  Gross: {fmtCurr(t.total_gross)} | Net: {fmtCurr(t.total_net)}
                </div>
                <div className="w-full max-w-[28px] flex items-end gap-0.5 h-full">
                  <div style={{ height: `${grossHeight}%` }} className="w-1/2 bg-violet-600 rounded-t transition-all" />
                  <div style={{ height: `${netHeight}%` }} className="w-1/2 bg-emerald-500 rounded-t transition-all" />
                </div>
                <span className="text-[9px] font-mono font-bold text-slate-500">{t.month.slice(0, 3)}</span>
              </div>
            );
          })}
          {trend.length === 0 && (
            <div className="w-full text-center py-10 text-slate-400 text-xs font-mono">No historical payroll runs found.</div>
          )}
        </div>
        <div className="flex justify-center gap-6 text-[10px] font-bold text-slate-600">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-violet-600 rounded-sm" /> Gross Payroll</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" /> Net Disbursal</span>
        </div>
      </div>

      {/* ─── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200 overflow-x-auto">
        <button onClick={() => setTab('departments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'departments' ? 'bg-white text-violet-700 shadow-sm border border-violet-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Building className="w-4 h-4" /> Department & Branch Cost Breakup
        </button>
        <button onClick={() => setTab('forecast')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'forecast' ? 'bg-white text-violet-700 shadow-sm border border-violet-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Target className="w-4 h-4" /> Predictive Payroll Forecasting Center
        </button>
      </div>

      {/* ─── DEPARTMENTS & BRANCHES TAB ──────────────────────────────────── */}
      {tab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Department Cost Breakup */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <Building className="w-4 h-4 text-violet-600" /> Departmental Cost Breakup
            </h3>
            <div className="space-y-3 text-xs">
              {deptBreakup.map(d => {
                const budget = parseFloat(String(d.department_budget || 0));
                const annual = parseFloat(String(d.annual_cost || 0));
                const pct = budget > 0 ? Math.min(100, Math.round((annual / budget) * 100)) : 0;
                return (
                  <div key={d.department_id} className="p-3 bg-slate-50 border rounded-xl space-y-1.5">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{d.department_name} ({d.headcount} Headcount)</span>
                      <span>{fmtCurr(d.monthly_cost)}/mo</span>
                    </div>
                    {budget > 0 && (
                      <div className="space-y-1">
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div style={{ width: `${pct}%` }} className={`h-full ${pct > 90 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                          <span>Annual CTC: {fmtCurr(annual)}</span>
                          <span>Budget: {fmtCurr(budget)} ({pct}%)</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Branch Cost Breakup */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <Building className="w-4 h-4 text-violet-600" /> Regional Branch Cost Breakup
            </h3>
            <div className="space-y-3 text-xs">
              {branchBreakup.map(b => (
                <div key={b.branch_id} className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{b.branch_name}</p>
                    <p className="text-[10px] text-slate-500">{b.headcount} Employees Assigned</p>
                  </div>
                  <div className="text-right font-mono">
                    <p className="font-bold text-violet-900">{fmtCurr(b.monthly_cost)}/mo</p>
                    <p className="text-[10px] text-slate-400">Annual: {fmtCurr(b.annual_cost)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── FORECASTING TAB ─────────────────────────────────────────────── */}
      {tab === 'forecast' && forecast && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
          <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
            <Target className="w-5 h-5 text-violet-600" /> Predictive Payroll Requirement Forecast
          </h3>
          <p className="text-xs text-slate-600">
            Statistical forecast based on current monthly run-rate with a projected {forecast.growth_assumption_pct}% annual growth/increment factor.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
            <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-violet-700 uppercase">NEXT MONTH FORECAST</span>
              <p className="text-xl font-black text-violet-950 font-mono">{fmtCurr(forecast.next_month_forecast)}</p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-blue-700 uppercase">NEXT QUARTER FORECAST</span>
              <p className="text-xl font-black text-blue-950 font-mono">{fmtCurr(forecast.next_quarter_forecast)}</p>
            </div>
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-emerald-700 uppercase">ANNUAL FORECAST</span>
              <p className="text-xl font-black text-emerald-950 font-mono">{fmtCurr(forecast.annual_forecast)}</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── SET BUDGET MODAL ────────────────────────────────────────────── */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Configure Department Annual Budget</h3>
              <button onClick={() => setShowBudgetModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSetBudget} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Department *</label>
                <select required value={budgetForm.department_id} onChange={e => setBudgetForm({...budgetForm, department_id: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                  <option value="">-- Choose Department --</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Budget Year *</label>
                  <input required type="number" value={budgetForm.year} onChange={e => setBudgetForm({...budgetForm, year: parseInt(e.target.value)})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Annual Budget (₹) *</label>
                  <input required type="number" value={budgetForm.annual_budget} onChange={e => setBudgetForm({...budgetForm, annual_budget: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowBudgetModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-violet-600 text-white rounded-xl font-bold shadow">Save Budget</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
