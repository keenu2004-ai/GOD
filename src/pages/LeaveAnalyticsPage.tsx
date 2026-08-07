import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart2, TrendingUp, DollarSign, Calendar, Users, Building,
  Download, RefreshCw, AlertTriangle, Sparkles, Layers, FileText,
  PieChart, Shield, CheckCircle2, ArrowUpRight, ArrowDownRight, Clock
} from 'lucide-react';
import apiClient from '../services/apiClient.js';

interface KPIs {
  total_requests: number;
  approved_count: number;
  rejected_count: number;
  pending_count: number;
  on_leave_today: number;
  avg_days_per_request: number;
  paid_leave_cost: number;
  lop_deduction_cost: number;
  encashment_payout: number;
  encashment_count: number;
  top_departments: any[];
}

function exportCSV(data: any[], filename: string) {
  if (!data || !data.length) return alert('No data to export');
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(r =>
    Object.values(r).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
  );
  const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
}

const fmtCurrency = (v: number) => `₹${v.toLocaleString('en-IN')}`;

export const LeaveAnalyticsPage: React.FC = () => {
  const [tab, setTab] = useState<'overview' | 'heatmap' | 'forecast' | 'reports'>('overview');
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [kpiRes, trendRes, deptRes, branchRes, heatRes, foreRes] = await Promise.all([
        apiClient.get('/analytics/leave/kpis').catch(() => ({ data: { data: null } })),
        apiClient.get('/analytics/leave/trend').catch(() => ({ data: { data: [] } })),
        apiClient.get('/analytics/leave/departments').catch(() => ({ data: { data: [] } })),
        apiClient.get('/analytics/leave/branches').catch(() => ({ data: { data: [] } })),
        apiClient.get('/analytics/leave/heatmap').catch(() => ({ data: { data: [] } })),
        apiClient.get('/analytics/leave/forecast').catch(() => ({ data: { data: null } })),
      ]);
      setKpis(kpiRes.data?.data);
      setTrend(trendRes.data?.data || []);
      setDepartments(deptRes.data?.data || []);
      setBranches(branchRes.data?.data || []);
      setHeatmap(heatRes.data?.data || []);
      setForecast(foreRes.data?.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const maxLeaveDays = Math.max(...trend.map(t => t.total_leave_days || 1), 10);

  return (
    <div className="space-y-5 min-h-screen pb-10">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-indigo-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/30 rounded-xl">
              <BarChart2 className="w-7 h-7 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Leave Business Intelligence & Cost Analytics</h2>
              <p className="text-xs text-indigo-300/70 font-mono mt-0.5">Real-time PostgreSQL aggregation • Cost Impact • Forecasting • Heatmaps</p>
            </div>
          </div>
          <button onClick={fetchAnalytics} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-white/20">
            <RefreshCw className="w-4 h-4" /> Refresh BI Feed
          </button>
        </div>

        {/* Live KPI Cards */}
        {kpis && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-2xl font-black text-indigo-300">{kpis.total_requests}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Total Leave Applications</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-2xl font-black text-emerald-300">{kpis.on_leave_today}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Employees On Leave Today</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-2xl font-black text-amber-300">{fmtCurrency(kpis.paid_leave_cost)}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Paid Leave Liability</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-2xl font-black text-purple-300">{fmtCurrency(kpis.encashment_payout)}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Encashment Payouts ({kpis.encashment_count})</p>
            </div>
          </div>
        )}
      </div>

      {/* ─── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200 overflow-x-auto">
        <button onClick={() => setTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'overview' ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <BarChart2 className="w-4 h-4" /> BI Overview & Cost Breakdown
        </button>
        <button onClick={() => setTab('heatmap')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'heatmap' ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Layers className="w-4 h-4" /> Monthly Intensity Heatmap
        </button>
        <button onClick={() => setTab('forecast')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'forecast' ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Sparkles className="w-4 h-4" /> Predictive Forecast & Risk
        </button>
        <button onClick={() => setTab('reports')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'reports' ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <FileText className="w-4 h-4" /> Export Center
        </button>
      </div>

      {/* ─── OVERVIEW TAB ────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {/* 12-Month Leave Trend Chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" /> 12-Month Leave Days Volume Trend
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Approved leave days volume per calendar month</p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">PostgreSQL Live Sync</span>
            </div>

            <div className="h-44 flex items-end justify-between gap-2 pt-4 px-2 border-b border-slate-100">
              {trend.map((t, idx) => {
                const heightPct = Math.round((t.total_leave_days / maxLeaveDays) * 100);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-[9px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      {t.total_leave_days}d
                    </span>
                    <div className="w-full bg-slate-100 rounded-t-lg overflow-hidden flex items-end h-32">
                      <div className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-t-lg transition-all"
                        style={{ height: `${Math.max(8, heightPct)}%` }} />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">M{t.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Department & Branch Utilization */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-600" /> Department Leave Utilization & Cost
              </h3>
              <div className="space-y-3">
                {departments.map(d => (
                  <div key={d.department_id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-800">{d.department_name}</span>
                      <span className="font-mono text-slate-500">{d.approved_days} days • {fmtCurrency(parseFloat(d.estimated_leave_cost || '0'))}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${Math.min(100, d.approved_days * 5)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" /> Branch Leave Breakdown
              </h3>
              <div className="space-y-3">
                {branches.map(b => (
                  <div key={b.branch_id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-800">{b.branch_name}</span>
                      <span className="font-mono text-slate-500">{b.approved_days} days approved</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-600 rounded-full" style={{ width: `${Math.min(100, b.approved_days * 8)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── HEATMAP TAB ─────────────────────────────────────────────────── */}
      {tab === 'heatmap' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" /> Monthly Leave Intensity Heatmap
            </h3>
            <p className="text-xs text-slate-500">Visualizes daily approved leave concentration across the current month</p>

            <div className="grid grid-cols-7 gap-2 pt-2">
              {heatmap.map((h, i) => {
                const count = parseInt(h.leave_count, 10);
                const bg = count > 3 ? 'bg-red-500 text-white' : count > 1 ? 'bg-amber-400 text-slate-900' : count > 0 ? 'bg-blue-200 text-blue-900' : 'bg-slate-50 text-slate-400';
                return (
                  <div key={i} className={`p-3 rounded-xl border border-slate-200 text-center font-mono ${bg}`}>
                    <p className="text-[10px] opacity-75">{new Date(h.date).getDate()}</p>
                    <p className="text-base font-black">{count}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── FORECAST TAB ────────────────────────────────────────────────── */}
      {tab === 'forecast' && forecast && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-amber-500" />
              <div>
                <h3 className="font-black text-slate-900 text-base">Predictive Leave Load & Staffing Risk Engine</h3>
                <p className="text-xs text-slate-500">Analyzes historical leave requests to forecast peak leave months</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-amber-800 font-bold">Peak Leave Month</p>
                <p className="text-2xl font-black text-amber-900 mt-1">{forecast.peak_leave_month}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-blue-800 font-bold">Risk Assessment</p>
                <p className="text-xl font-black text-blue-900 mt-1">{forecast.risk_level}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-slate-700 font-bold">Forecast Year</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{forecast.forecast_year}</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700">
              <p className="font-bold text-slate-900">AI Recommendation:</p>
              <p className="mt-1 text-slate-600">{forecast.recommended_action}</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── EXPORTS TAB ─────────────────────────────────────────────────── */}
      {tab === 'reports' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" /> BI Leave Reports & Export Center
          </h3>
          <p className="text-xs text-slate-500">Download formatted CSV reports for executive review and payroll audit</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-all space-y-2">
              <p className="font-bold text-slate-900 text-xs">Department Utilization Report</p>
              <p className="text-[11px] text-slate-500">Approved leave days and liability cost by department</p>
              <button onClick={() => exportCSV(departments, 'Department_Leave_Utilization.csv')}
                className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 text-white font-bold text-xs py-2 rounded-lg shadow">
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>
            <div className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-all space-y-2">
              <p className="font-bold text-slate-900 text-xs">Branch Leave Report</p>
              <p className="text-[11px] text-slate-500">Branch-wise leave volume and headcount metrics</p>
              <button onClick={() => exportCSV(branches, 'Branch_Leave_Analytics.csv')}
                className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 text-white font-bold text-xs py-2 rounded-lg shadow">
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>
            <div className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-all space-y-2">
              <p className="font-bold text-slate-900 text-xs">Monthly Trend Data</p>
              <p className="text-[11px] text-slate-500">Month-by-month approved and rejected request counts</p>
              <button onClick={() => exportCSV(trend, 'Monthly_Leave_Trend.csv')}
                className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 text-white font-bold text-xs py-2 rounded-lg shadow">
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
