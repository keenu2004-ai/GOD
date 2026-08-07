import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, TrendingUp, Users, Building, Shield, RefreshCw,
  Plus, Search, Filter, CheckCircle2, Award, Calendar, Settings,
  FileText, Download, X, AlertCircle, ArrowUpRight, ChevronRight
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

interface Assignment {
  id: number;
  employee_id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
  department_name?: string;
  branch_name?: string;
  annual_ctc: number;
  monthly_gross: number;
  monthly_net: number;
  basic_salary: number;
  hra: number;
  special_allowance: number;
  pf_deduction: number;
  esi_deduction: number;
  pt_deduction: number;
  effective_date: string;
}

interface Template {
  id: number;
  name: string;
  annual_ctc: number;
  employment_type: string;
  department_name?: string;
  branch_name?: string;
}

interface Revision {
  id: number;
  employee_id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
  old_ctc: number;
  new_ctc: number;
  revision_type: string;
  effective_date: string;
  reason: string;
  status: string;
  created_at: string;
}

const fmtCurr = (v: number | string) => `₹${parseFloat(String(v || 0)).toLocaleString('en-IN')}`;
const fmtDate = (s: string) => s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const PayrollFoundationPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const isPayrollAdmin = ['ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER', 'FINANCE_MANAGER', 'SUPER_ADMIN'].includes(userRole);

  const [tab, setTab] = useState<'dashboard' | 'assignments' | 'revisions' | 'templates' | 'settings'>('dashboard');
  const [kpis, setKpis] = useState<any>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Forms
  const [assignForm, setAssignForm] = useState({
    employee_id: '', annual_ctc: '600000', effective_date: new Date().toISOString().split('T')[0],
  });

  const [calcPreview, setCalcPreview] = useState<any>(null);

  const [revisionForm, setRevisionForm] = useState({
    employee_id: '', new_ctc: '720000', revision_type: 'ANNUAL_INCREMENT',
    effective_date: new Date().toISOString().split('T')[0], reason: 'Annual Appraisal 2026',
  });

  const [templateForm, setTemplateForm] = useState({
    name: 'Senior Developer Grade A', annual_ctc: '1200000', employment_type: 'PERMANENT',
  });

  const fetchPayrollData = useCallback(async () => {
    setLoading(true);
    try {
      const [kpiRes, assRes, tempRes, revRes, setRes, empRes] = await Promise.all([
        apiClient.get('/payroll/dashboard/kpis').catch(() => ({ data: { data: null } })),
        apiClient.get('/payroll/assignments').catch(() => ({ data: { data: [] } })),
        apiClient.get('/payroll/templates').catch(() => ({ data: { data: [] } })),
        apiClient.get('/payroll/revisions').catch(() => ({ data: { data: [] } })),
        apiClient.get('/payroll/settings').catch(() => ({ data: { data: null } })),
        apiClient.get('/employees').catch(() => ({ data: { data: [] } })),
      ]);
      setKpis(kpiRes.data?.data);
      setAssignments(assRes.data?.data || []);
      setTemplates(tempRes.data?.data || []);
      setRevisions(revRes.data?.data || []);
      setSettings(setRes.data?.data);
      setEmployees(empRes.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPayrollData(); }, [fetchPayrollData]);

  // Handle Live Calculation Preview
  useEffect(() => {
    const ctc = parseFloat(assignForm.annual_ctc);
    if (!isNaN(ctc) && ctc > 0) {
      apiClient.post('/payroll/calculate-preview', { annual_ctc: ctc })
        .then(res => setCalcPreview(res.data?.data))
        .catch(() => setCalcPreview(null));
    }
  }, [assignForm.annual_ctc]);

  const handleSeedDefaults = async () => {
    try {
      await apiClient.post('/payroll/seed-defaults');
      alert('✅ Salary components pre-seeded!');
    } catch (e: any) { alert(e.response?.data?.message || 'Seeding failed'); }
  };

  const handleAssignSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/payroll/assign', {
        employee_id: parseInt(assignForm.employee_id),
        annual_ctc: parseFloat(assignForm.annual_ctc),
        effective_date: assignForm.effective_date,
      });
      setShowAssignModal(false);
      await fetchPayrollData();
      alert('✅ Salary structure assigned successfully!');
    } catch (e: any) { alert(e.response?.data?.message || 'Assignment failed'); }
    finally { setSubmitting(false); }
  };

  const handleRequestRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/payroll/revisions', {
        employee_id: parseInt(revisionForm.employee_id),
        new_ctc: parseFloat(revisionForm.new_ctc),
        revision_type: revisionForm.revision_type,
        effective_date: revisionForm.effective_date,
        reason: revisionForm.reason,
      });
      setShowRevisionModal(false);
      await fetchPayrollData();
      alert('✅ Salary revision processed!');
    } catch (e: any) { alert(e.response?.data?.message || 'Revision failed'); }
    finally { setSubmitting(false); }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/payroll/templates', {
        name: templateForm.name,
        annual_ctc: parseFloat(templateForm.annual_ctc),
        employment_type: templateForm.employment_type,
      });
      setShowTemplateModal(false);
      await fetchPayrollData();
      alert('✅ Salary template created!');
    } catch (e: any) { alert(e.response?.data?.message || 'Template creation failed'); }
    finally { setSubmitting(false); }
  };

  const filteredAssignments = assignments.filter(a =>
    !search || `${a.first_name} ${a.last_name} ${a.employee_code} ${a.department_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const TABS = [
    { key: 'dashboard', label: 'Compensation BI', icon: <DollarSign className="w-4 h-4" /> },
    { key: 'assignments', label: 'Salary Assignments', icon: <Users className="w-4 h-4" />, count: assignments.length },
    { key: 'revisions', label: 'Salary Revisions', icon: <TrendingUp className="w-4 h-4" />, count: revisions.length },
    { key: 'templates', label: 'Salary Templates', icon: <FileText className="w-4 h-4" />, count: templates.length },
    { key: 'settings', label: 'Payroll Cycle & Tax', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-5 min-h-screen pb-10">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-emerald-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600/30 rounded-xl">
              <DollarSign className="w-7 h-7 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Enterprise Payroll Foundation & Compensation Engine</h2>
              <p className="text-xs text-emerald-300/70 font-mono mt-0.5">CTC Calculation Engine • Salary Structures • Statutory Deductions • Revisions</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isPayrollAdmin && (
              <button onClick={handleSeedDefaults} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-xl border border-white/20">
                Seed Statutory Components
              </button>
            )}
            {isPayrollAdmin && (
              <button onClick={() => setShowAssignModal(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg">
                <Plus className="w-4 h-4" /> Assign Salary
              </button>
            )}
          </div>
        </div>

        {/* Quick Compensation Stats */}
        {kpis && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-2xl font-black text-emerald-300">{fmtCurr(kpis.total_monthly_gross)}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Monthly Payroll Liability</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-2xl font-black text-blue-300">{fmtCurr(kpis.total_annual_ctc)}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Annual Total CTC</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-2xl font-black text-amber-300">{fmtCurr(kpis.total_pf_liability)}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Monthly PF Statutory Liability</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-2xl font-black text-purple-300">{kpis.assigned_employees}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Salaried Employees</p>
            </div>
          </div>
        )}
      </div>

      {/* ─── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              tab === t.key ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100' : 'text-slate-500 hover:text-slate-800'
            }`}>
            {t.icon} {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── DASHBOARD TAB ───────────────────────────────────────────────── */}
      {tab === 'dashboard' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" /> Standard Salary Component Formulas
              </h3>
              <ul className="text-xs space-y-2 text-slate-600">
                <li className="flex justify-between border-b pb-1"><span>Basic Salary:</span> <strong className="text-slate-900 font-mono">50% of Monthly Gross</strong></li>
                <li className="flex justify-between border-b pb-1"><span>House Rent Allowance (HRA):</span> <strong className="text-slate-900 font-mono">40% of Basic</strong></li>
                <li className="flex justify-between border-b pb-1"><span>Special Allowance:</span> <strong className="text-slate-900 font-mono">Balancing Earnings</strong></li>
                <li className="flex justify-between border-b pb-1"><span>PF Employee Deduction:</span> <strong className="text-slate-900 font-mono">12% Basic (Cap ₹1,800)</strong></li>
                <li className="flex justify-between border-b pb-1"><span>Professional Tax (PT):</span> <strong className="text-slate-900 font-mono">₹200 / month</strong></li>
                <li className="flex justify-between"><span>ESI Deduction:</span> <strong className="text-slate-900 font-mono">0.75% Gross (if ≤ ₹21k)</strong></li>
              </ul>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 md:col-span-2">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" /> Active Compensation Roster Overview
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-700">
                  <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
                    <tr>
                      <th className="p-2.5">Employee</th>
                      <th className="p-2.5">Annual CTC</th>
                      <th className="p-2.5">Monthly Gross</th>
                      <th className="p-2.5">PF Deduction</th>
                      <th className="p-2.5">Monthly Net Pay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assignments.slice(0, 5).map(a => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">{a.first_name} {a.last_name}</td>
                        <td className="p-2.5 font-mono text-blue-700 font-bold">{fmtCurr(a.annual_ctc)}</td>
                        <td className="p-2.5 font-mono">{fmtCurr(a.monthly_gross)}</td>
                        <td className="p-2.5 font-mono text-red-600">-{fmtCurr(a.pf_deduction)}</td>
                        <td className="p-2.5 font-mono text-emerald-700 font-bold">{fmtCurr(a.monthly_net)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── SALARY ASSIGNMENTS TAB ──────────────────────────────────────── */}
      {tab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee, dept..."
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs" />
            </div>
            {isPayrollAdmin && (
              <button onClick={() => setShowAssignModal(true)} className="flex items-center gap-2 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow">
                <Plus className="w-4 h-4" /> Assign Salary Structure
              </button>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase">
                  <tr>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Annual CTC</th>
                    <th className="p-3">Monthly Gross</th>
                    <th className="p-3">Basic (50%)</th>
                    <th className="p-3">HRA (20%)</th>
                    <th className="p-3">Deductions (PF+PT)</th>
                    <th className="p-3">Monthly Net</th>
                    <th className="p-3">Effective Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredAssignments.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="p-3 font-sans">
                        <p className="font-bold text-slate-900">{a.first_name} {a.last_name}</p>
                        <p className="text-[10px] text-slate-400">{a.employee_code} • {a.department_name}</p>
                      </td>
                      <td className="p-3 font-bold text-blue-700">{fmtCurr(a.annual_ctc)}</td>
                      <td className="p-3 font-bold text-slate-800">{fmtCurr(a.monthly_gross)}</td>
                      <td className="p-3 text-slate-600">{fmtCurr(a.basic_salary)}</td>
                      <td className="p-3 text-slate-600">{fmtCurr(a.hra)}</td>
                      <td className="p-3 text-red-600">-{fmtCurr(parseFloat(String(a.pf_deduction)) + parseFloat(String(a.pt_deduction)))}</td>
                      <td className="p-3 font-bold text-emerald-700">{fmtCurr(a.monthly_net)}</td>
                      <td className="p-3 font-sans text-slate-400 text-[10px]">{fmtDate(a.effective_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── SALARY REVISIONS TAB ────────────────────────────────────────── */}
      {tab === 'revisions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500 font-semibold">{revisions.length} Historical Revisions Logged</p>
            {isPayrollAdmin && (
              <button onClick={() => setShowRevisionModal(true)} className="flex items-center gap-2 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow">
                <TrendingUp className="w-4 h-4" /> Process Salary Revision
              </button>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Revision Type</th>
                  <th className="p-3">Old CTC</th>
                  <th className="p-3">New CTC</th>
                  <th className="p-3">Increment</th>
                  <th className="p-3">Effective Date</th>
                  <th className="p-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {revisions.map(r => {
                  const diff = parseFloat(String(r.new_ctc)) - parseFloat(String(r.old_ctc));
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{r.first_name} {r.last_name} <span className="text-[10px] text-slate-400 font-mono">({r.employee_code})</span></td>
                      <td className="p-3"><span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded">{r.revision_type}</span></td>
                      <td className="p-3 font-mono text-slate-500">{fmtCurr(r.old_ctc)}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">{fmtCurr(r.new_ctc)}</td>
                      <td className="p-3 font-mono font-bold text-emerald-600">+{fmtCurr(diff)}</td>
                      <td className="p-3 font-mono text-slate-500">{fmtDate(r.effective_date)}</td>
                      <td className="p-3 text-slate-600 max-w-xs truncate">{r.reason}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── SALARY TEMPLATES TAB ────────────────────────────────────────── */}
      {tab === 'templates' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500 font-semibold">{templates.length} Reusable Compensation Templates</p>
            {isPayrollAdmin && (
              <button onClick={() => setShowTemplateModal(true)} className="flex items-center gap-2 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow">
                <Plus className="w-4 h-4" /> Create Template
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map(t => (
              <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">{t.name}</h4>
                <p className="text-xl font-black font-mono text-emerald-600">{fmtCurr(t.annual_ctc)} / yr</p>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-600">{t.employment_type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── PAYROLL SETTINGS TAB ────────────────────────────────────────── */}
      {tab === 'settings' && settings && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-w-xl">
          <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-600" /> Payroll Cycle & Statutory Rates Configuration
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="border p-3 rounded-xl">
              <span className="text-slate-500">Payroll Cycle</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{settings.payroll_cycle}</p>
            </div>
            <div className="border p-3 rounded-xl">
              <span className="text-slate-500">Cut-Off Day of Month</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{settings.cutoff_day}th of month</p>
            </div>
            <div className="border p-3 rounded-xl">
              <span className="text-slate-500">Salary Disbursal Day</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{settings.pay_day}st of month</p>
            </div>
            <div className="border p-3 rounded-xl">
              <span className="text-slate-500">PF Rate</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{settings.pf_rate}% of Basic</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── ASSIGN SALARY MODAL ──────────────────────────────────────────── */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Assign Salary Structure</h3>
              <button onClick={() => setShowAssignModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAssignSalary} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Select Employee *</label>
                <select required value={assignForm.employee_id} onChange={e => setAssignForm({...assignForm, employee_id: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                  <option value="">-- Choose Employee --</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Annual CTC (₹) *</label>
                <input required type="number" step="10000" value={assignForm.annual_ctc} onChange={e => setAssignForm({...assignForm, annual_ctc: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold" />
              </div>

              {calcPreview && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1 font-mono text-[11px]">
                  <p className="font-bold text-slate-900 font-sans border-b pb-1">Live Breakup Preview:</p>
                  <div className="flex justify-between"><span>Monthly Gross:</span> <strong>{fmtCurr(calcPreview.monthly_gross)}</strong></div>
                  <div className="flex justify-between"><span>Basic (50%):</span> <strong>{fmtCurr(calcPreview.basic_salary)}</strong></div>
                  <div className="flex justify-between"><span>HRA (20%):</span> <strong>{fmtCurr(calcPreview.hra)}</strong></div>
                  <div className="flex justify-between"><span>Special Allowance:</span> <strong>{fmtCurr(calcPreview.special_allowance)}</strong></div>
                  <div className="flex justify-between text-red-600"><span>PF Deduction:</span> <strong>-{fmtCurr(calcPreview.pf_deduction)}</strong></div>
                  <div className="flex justify-between text-emerald-700 font-bold border-t pt-1 font-sans"><span>Estimated Net Pay:</span> <strong>{fmtCurr(calcPreview.monthly_net)}</strong></div>
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700">Effective Date *</label>
                <input required type="date" value={assignForm.effective_date} onChange={e => setAssignForm({...assignForm, effective_date: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAssignModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow">{submitting ? 'Assigning...' : 'Assign Structure'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── SALARY REVISION MODAL ───────────────────────────────────────── */}
      {showRevisionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Process Salary Revision</h3>
              <button onClick={() => setShowRevisionModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleRequestRevision} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Select Employee *</label>
                <select required value={revisionForm.employee_id} onChange={e => setRevisionForm({...revisionForm, employee_id: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                  <option value="">-- Choose Employee --</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">New Annual CTC (₹) *</label>
                <input required type="number" step="10000" value={revisionForm.new_ctc} onChange={e => setRevisionForm({...revisionForm, new_ctc: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold" />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Revision Type *</label>
                <select value={revisionForm.revision_type} onChange={e => setRevisionForm({...revisionForm, revision_type: e.target.value as any})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                  <option value="ANNUAL_INCREMENT">Annual Increment</option>
                  <option value="PROMOTION">Promotion</option>
                  <option value="MARKET_CORRECTION">Market Correction</option>
                  <option value="TRANSFER">Transfer</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Reason / Notes *</label>
                <textarea required value={revisionForm.reason} onChange={e => setRevisionForm({...revisionForm, reason: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" rows={2} />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowRevisionModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow">{submitting ? 'Processing...' : 'Apply Revision'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── SALARY TEMPLATE MODAL ───────────────────────────────────────── */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Create Salary Template</h3>
              <button onClick={() => setShowTemplateModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateTemplate} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Template Name *</label>
                <input required value={templateForm.name} onChange={e => setTemplateForm({...templateForm, name: e.target.value})}
                  placeholder="e.g. Senior Developer Grade A" className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Annual CTC (₹) *</label>
                <input required type="number" step="10000" value={templateForm.annual_ctc} onChange={e => setTemplateForm({...templateForm, annual_ctc: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowTemplateModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow">{submitting ? 'Creating...' : 'Create Template'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
