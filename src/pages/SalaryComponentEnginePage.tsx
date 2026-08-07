import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings, Plus, Search, Filter, RefreshCw, DollarSign, CreditCard,
  Building, Shield, Award, CheckCircle2, Clock, X, FileText, Heart,
  TrendingUp, Download, CheckSquare, Sparkles
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

interface ComponentMaster {
  id: number;
  code: string;
  name: string;
  category: string;
  calculation_mode: string;
  formula_expression?: string;
  is_taxable: boolean;
}

interface Loan {
  id: number;
  employee_id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
  loan_amount: number;
  interest_rate: number;
  tenure_months: number;
  emi_amount: number;
  outstanding_balance: number;
  reason: string;
  status: string;
}

interface Advance {
  id: number;
  employee_id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
  advance_amount: number;
  monthly_deduction: number;
  outstanding_balance: number;
  reason: string;
  status: string;
}

interface BankDetails {
  id: number;
  employee_id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
  account_holder_name: string;
  account_number: string;
  bank_name: string;
  ifsc_code: string;
  payment_mode: string;
}

interface Benefit {
  id: number;
  employee_id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
  benefit_name: string;
  benefit_type: string;
  coverage_amount: number;
  monthly_employer_cost: number;
  monthly_employee_cost: number;
}

const fmtCurr = (v: number | string) => `₹${parseFloat(String(v || 0)).toLocaleString('en-IN')}`;

export const SalaryComponentEnginePage: React.FC = () => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const isPayrollAdmin = ['ADMIN', 'HR_MANAGER', 'PAYROLL_MANAGER', 'FINANCE_MANAGER', 'SUPER_ADMIN'].includes(userRole);

  const [tab, setTab] = useState<'components' | 'loans' | 'advances' | 'bank' | 'benefits'>('components');
  const [components, setComponents] = useState<ComponentMaster[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [bankDetails, setBankDetails] = useState<BankDetails[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  // Modals
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showBenefitModal, setShowBenefitModal] = useState(false);

  // Forms
  const [componentForm, setComponentForm] = useState({
    code: 'RETENTION_BONUS', name: 'Retention Bonus', category: 'EARNING',
    calculation_mode: 'FORMULA', formula_expression: 'BASIC * 0.10', is_taxable: true,
  });

  const [loanForm, setLoanForm] = useState({
    employee_id: '', loan_amount: '100000', tenure_months: '12', interest_rate: '0', reason: 'Medical emergency',
  });

  const [advanceForm, setAdvanceForm] = useState({
    employee_id: '', advance_amount: '25000', monthly_deduction: '5000', reason: 'Festival advance',
  });

  const [bankForm, setBankForm] = useState({
    employee_id: '', account_holder_name: '', account_number: '', bank_name: 'HDFC Bank', ifsc_code: 'HDFC0001234', payment_mode: 'BANK_TRANSFER',
  });

  const [benefitForm, setBenefitForm] = useState({
    employee_id: '', benefit_name: 'Comprehensive Family Health Cover', benefit_type: 'HEALTH_INSURANCE',
    coverage_amount: '500000', monthly_employer_cost: '1500', monthly_employee_cost: '200',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [compRes, loanRes, advRes, bankRes, benRes, empRes] = await Promise.all([
        apiClient.get('/payroll/components').catch(() => ({ data: { data: [] } })),
        apiClient.get('/payroll/loans').catch(() => ({ data: { data: [] } })),
        apiClient.get('/payroll/advances').catch(() => ({ data: { data: [] } })),
        apiClient.get('/payroll/bank-details/all').catch(() => ({ data: { data: [] } })),
        apiClient.get('/payroll/benefits').catch(() => ({ data: { data: [] } })),
        apiClient.get('/employees').catch(() => ({ data: { data: [] } })),
      ]);
      setComponents(compRes.data?.data || []);
      setLoans(loanRes.data?.data || []);
      setAdvances(advRes.data?.data || []);
      setBankDetails(bankRes.data?.data || []);
      setBenefits(benRes.data?.data || []);
      setEmployees(empRes.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSeedComponents = async () => {
    try {
      await apiClient.post('/payroll/components/seed');
      await fetchData();
      alert('✅ Standard 25+ components pre-seeded!');
    } catch (e: any) { alert(e.response?.data?.message || 'Seeding failed'); }
  };

  const handleCreateComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/payroll/components', componentForm);
      setShowComponentModal(false);
      await fetchData();
      alert('✅ Component created!');
    } catch (e: any) { alert(e.response?.data?.message || 'Creation failed'); }
    finally { setSubmitting(false); }
  };

  const handleRequestLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/payroll/loans/request', {
        employee_id: parseInt(loanForm.employee_id),
        loan_amount: parseFloat(loanForm.loan_amount),
        tenure_months: parseInt(loanForm.tenure_months),
        interest_rate: parseFloat(loanForm.interest_rate),
        reason: loanForm.reason,
      });
      setShowLoanModal(false);
      await fetchData();
      alert('✅ Loan request submitted!');
    } catch (e: any) { alert(e.response?.data?.message || 'Request failed'); }
    finally { setSubmitting(false); }
  };

  const handleApproveLoan = async (id: number) => {
    try {
      await apiClient.patch(`/payroll/loans/${id}/approve`);
      await fetchData();
      alert('✅ Loan approved!');
    } catch (e: any) { alert(e.response?.data?.message || 'Approval failed'); }
  };

  const handleRequestAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/payroll/advances/request', {
        employee_id: parseInt(advanceForm.employee_id),
        advance_amount: parseFloat(advanceForm.advance_amount),
        monthly_deduction: parseFloat(advanceForm.monthly_deduction),
        reason: advanceForm.reason,
      });
      setShowAdvanceModal(false);
      await fetchData();
      alert('✅ Advance request submitted!');
    } catch (e: any) { alert(e.response?.data?.message || 'Request failed'); }
    finally { setSubmitting(false); }
  };

  const handleApproveAdvance = async (id: number) => {
    try {
      await apiClient.patch(`/payroll/advances/${id}/approve`);
      await fetchData();
      alert('✅ Salary advance approved!');
    } catch (e: any) { alert(e.response?.data?.message || 'Approval failed'); }
  };

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/payroll/bank-details', {
        employee_id: parseInt(bankForm.employee_id),
        account_holder_name: bankForm.account_holder_name,
        account_number: bankForm.account_number,
        bank_name: bankForm.bank_name,
        ifsc_code: bankForm.ifsc_code,
        payment_mode: bankForm.payment_mode,
      });
      setShowBankModal(false);
      await fetchData();
      alert('✅ Bank details saved!');
    } catch (e: any) { alert(e.response?.data?.message || 'Save failed'); }
    finally { setSubmitting(false); }
  };

  const handleAssignBenefit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/payroll/benefits', {
        employee_id: parseInt(benefitForm.employee_id),
        benefit_name: benefitForm.benefit_name,
        benefit_type: benefitForm.benefit_type,
        coverage_amount: parseFloat(benefitForm.coverage_amount),
        monthly_employer_cost: parseFloat(benefitForm.monthly_employer_cost),
        monthly_employee_cost: parseFloat(benefitForm.monthly_employee_cost),
      });
      setShowBenefitModal(false);
      await fetchData();
      alert('✅ Benefit assigned!');
    } catch (e: any) { alert(e.response?.data?.message || 'Assignment failed'); }
    finally { setSubmitting(false); }
  };

  const TABS = [
    { key: 'components', label: 'Salary Components & Formulas', icon: <Settings className="w-4 h-4" />, count: components.length },
    { key: 'loans', label: 'Loans & EMI Engine', icon: <CreditCard className="w-4 h-4" />, count: loans.length },
    { key: 'advances', label: 'Salary Advances', icon: <DollarSign className="w-4 h-4" />, count: advances.length },
    { key: 'bank', label: 'Bank Account Details', icon: <Building className="w-4 h-4" />, count: bankDetails.length },
    { key: 'benefits', label: 'Employee Benefits', icon: <Heart className="w-4 h-4" />, count: benefits.length },
  ];

  return (
    <div className="space-y-5 min-h-screen pb-10">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-teal-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-600/30 rounded-xl">
              <Settings className="w-7 h-7 text-teal-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Salary Component Engine & Financial Services</h2>
              <p className="text-xs text-teal-300/70 font-mono mt-0.5">Formula Builder • Loans & EMI • Advances • Bank Verification • Benefits</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isPayrollAdmin && (
              <button onClick={handleSeedComponents} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-xl border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Seed 25+ Components
              </button>
            )}
            {isPayrollAdmin && (
              <button onClick={() => setShowComponentModal(true)} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg">
                <Plus className="w-4 h-4" /> Add Component
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              tab === t.key ? 'bg-white text-teal-700 shadow-sm border border-teal-100' : 'text-slate-500 hover:text-slate-800'
            }`}>
            {t.icon} {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-teal-100 text-teal-700' : 'bg-slate-200 text-slate-600'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── COMPONENTS TAB ──────────────────────────────────────────────── */}
      {tab === 'components' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {components.map(c => (
              <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
                    <span className="text-[10px] font-mono text-slate-400">Code: {c.code}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    c.category === 'EARNING' ? 'bg-emerald-100 text-emerald-800' : c.category === 'DEDUCTION' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {c.category}
                  </span>
                </div>
                {c.formula_expression && (
                  <p className="text-xs font-mono bg-slate-50 border border-slate-200 p-2 rounded-xl text-teal-800 font-bold">
                    Formula: {c.formula_expression}
                  </p>
                )}
                <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                  <span>Mode: {c.calculation_mode}</span>
                  <span>{c.is_taxable ? 'Taxable' : 'Tax Exempt'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── LOANS TAB ───────────────────────────────────────────────────── */}
      {tab === 'loans' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500 font-semibold">{loans.length} Employee Loans Active / Pending</p>
            <button onClick={() => setShowLoanModal(true)} className="flex items-center gap-2 bg-teal-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow">
              <Plus className="w-4 h-4" /> Request Loan
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Loan Amount</th>
                  <th className="p-3">Tenure</th>
                  <th className="p-3">Monthly EMI</th>
                  <th className="p-3">Outstanding</th>
                  <th className="p-3">Status</th>
                  {isPayrollAdmin && <th className="p-3">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {loans.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="p-3 font-sans font-bold text-slate-900">{l.first_name} {l.last_name} <span className="text-[10px] text-slate-400 font-mono">({l.employee_code})</span></td>
                    <td className="p-3 font-bold text-slate-900">{fmtCurr(l.loan_amount)}</td>
                    <td className="p-3 font-sans text-slate-600">{l.tenure_months} months</td>
                    <td className="p-3 font-bold text-red-600">{fmtCurr(l.emi_amount)}</td>
                    <td className="p-3 font-bold text-amber-700">{fmtCurr(l.outstanding_balance)}</td>
                    <td className="p-3 font-sans">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        l.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>{l.status}</span>
                    </td>
                    {isPayrollAdmin && (
                      <td className="p-3 font-sans">
                        {l.status === 'PENDING' && (
                          <button onClick={() => handleApproveLoan(l.id)} className="px-2 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded hover:bg-emerald-700">
                            Approve Loan
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

      {/* ─── ADVANCES TAB ────────────────────────────────────────────────── */}
      {tab === 'advances' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500 font-semibold">{advances.length} Salary Advance Requests</p>
            <button onClick={() => setShowAdvanceModal(true)} className="flex items-center gap-2 bg-teal-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow">
              <Plus className="w-4 h-4" /> Request Salary Advance
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Advance Amount</th>
                  <th className="p-3">Monthly Recovery</th>
                  <th className="p-3">Outstanding</th>
                  <th className="p-3">Status</th>
                  {isPayrollAdmin && <th className="p-3">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {advances.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="p-3 font-sans font-bold text-slate-900">{a.first_name} {a.last_name}</td>
                    <td className="p-3 font-bold text-slate-900">{fmtCurr(a.advance_amount)}</td>
                    <td className="p-3 font-bold text-red-600">{fmtCurr(a.monthly_deduction)}</td>
                    <td className="p-3 text-amber-700 font-bold">{fmtCurr(a.outstanding_balance)}</td>
                    <td className="p-3 font-sans">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        a.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>{a.status}</span>
                    </td>
                    {isPayrollAdmin && (
                      <td className="p-3 font-sans">
                        {a.status === 'PENDING' && (
                          <button onClick={() => handleApproveAdvance(a.id)} className="px-2 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded hover:bg-emerald-700">
                            Approve Advance
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

      {/* ─── BANK DETAILS TAB ────────────────────────────────────────────── */}
      {tab === 'bank' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500 font-semibold">{bankDetails.length} Verified Employee Bank Accounts</p>
            {isPayrollAdmin && (
              <button onClick={() => setShowBankModal(true)} className="flex items-center gap-2 bg-teal-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow">
                <Plus className="w-4 h-4" /> Save Bank Account
              </button>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Account Holder</th>
                  <th className="p-3">Account Number</th>
                  <th className="p-3">Bank Name</th>
                  <th className="p-3">IFSC Code</th>
                  <th className="p-3">Payment Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {bankDetails.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="p-3 font-sans font-bold text-slate-900">{b.first_name} {b.last_name}</td>
                    <td className="p-3 font-sans">{b.account_holder_name}</td>
                    <td className="p-3 font-bold text-blue-700">{b.account_number}</td>
                    <td className="p-3 font-sans">{b.bank_name}</td>
                    <td className="p-3 text-slate-600">{b.ifsc_code}</td>
                    <td className="p-3 font-sans"><span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded">{b.payment_mode}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── BENEFITS TAB ────────────────────────────────────────────────── */}
      {tab === 'benefits' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500 font-semibold">{benefits.length} Active Employee Benefits</p>
            {isPayrollAdmin && (
              <button onClick={() => setShowBenefitModal(true)} className="flex items-center gap-2 bg-teal-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow">
                <Plus className="w-4 h-4" /> Assign Benefit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {benefits.map(b => (
              <div key={b.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
                <div className="flex items-start justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">{b.benefit_name}</h4>
                  <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded">{b.benefit_type}</span>
                </div>
                <p className="text-xs font-mono font-bold text-slate-900">Coverage: {fmtCurr(b.coverage_amount)}</p>
                <div className="text-[10px] text-slate-500 space-y-0.5 pt-1 border-t">
                  <p>Employer Cost: <strong className="text-emerald-700">{fmtCurr(b.monthly_employer_cost)}/mo</strong></p>
                  <p>Employee Deduction: <strong className="text-red-600">{fmtCurr(b.monthly_employee_cost)}/mo</strong></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── ADD COMPONENT MODAL ─────────────────────────────────────────── */}
      {showComponentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Add Salary Component</h3>
              <button onClick={() => setShowComponentModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateComponent} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Component Code *</label>
                <input required value={componentForm.code} onChange={e => setComponentForm({...componentForm, code: e.target.value})}
                  placeholder="e.g. RETENTION_BONUS" className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono uppercase" />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Component Name *</label>
                <input required value={componentForm.name} onChange={e => setComponentForm({...componentForm, name: e.target.value})}
                  placeholder="e.g. Retention Bonus" className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Category *</label>
                  <select value={componentForm.category} onChange={e => setComponentForm({...componentForm, category: e.target.value as any})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                    <option value="EARNING">Earning</option>
                    <option value="DEDUCTION">Deduction</option>
                    <option value="REIMBURSEMENT">Reimbursement</option>
                    <option value="BENEFIT">Benefit</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Calculation Mode *</label>
                  <select value={componentForm.calculation_mode} onChange={e => setComponentForm({...componentForm, calculation_mode: e.target.value as any})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                    <option value="FORMULA">Formula Expression</option>
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FLAT">Flat Amount</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Formula Expression (e.g. BASIC * 0.10)</label>
                <input value={componentForm.formula_expression} onChange={e => setComponentForm({...componentForm, formula_expression: e.target.value})}
                  placeholder="BASIC * 0.10" className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowComponentModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-teal-600 text-white rounded-xl font-bold shadow">{submitting ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── REQUEST LOAN MODAL ──────────────────────────────────────────── */}
      {showLoanModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Request Employee Loan</h3>
              <button onClick={() => setShowLoanModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleRequestLoan} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Employee *</label>
                <select required value={loanForm.employee_id} onChange={e => setLoanForm({...loanForm, employee_id: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                  <option value="">-- Choose Employee --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_code})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Loan Amount (₹) *</label>
                  <input required type="number" value={loanForm.loan_amount} onChange={e => setLoanForm({...loanForm, loan_amount: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Tenure (Months) *</label>
                  <input required type="number" value={loanForm.tenure_months} onChange={e => setLoanForm({...loanForm, tenure_months: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold" />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Reason / Details *</label>
                <textarea required value={loanForm.reason} onChange={e => setLoanForm({...loanForm, reason: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" rows={2} />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowLoanModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-teal-600 text-white rounded-xl font-bold shadow">{submitting ? 'Requesting...' : 'Request Loan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── REQUEST ADVANCE MODAL ───────────────────────────────────────── */}
      {showAdvanceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Request Salary Advance</h3>
              <button onClick={() => setShowAdvanceModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleRequestAdvance} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Employee *</label>
                <select required value={advanceForm.employee_id} onChange={e => setAdvanceForm({...advanceForm, employee_id: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                  <option value="">-- Choose Employee --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_code})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Advance Amount (₹) *</label>
                  <input required type="number" value={advanceForm.advance_amount} onChange={e => setAdvanceForm({...advanceForm, advance_amount: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Monthly Recovery (₹) *</label>
                  <input required type="number" value={advanceForm.monthly_deduction} onChange={e => setAdvanceForm({...advanceForm, monthly_deduction: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold" />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Reason *</label>
                <textarea required value={advanceForm.reason} onChange={e => setAdvanceForm({...advanceForm, reason: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" rows={2} />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAdvanceModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-teal-600 text-white rounded-xl font-bold shadow">{submitting ? 'Requesting...' : 'Request Advance'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── BANK DETAILS MODAL ──────────────────────────────────────────── */}
      {showBankModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Save Employee Bank Details</h3>
              <button onClick={() => setShowBankModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveBankDetails} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Employee *</label>
                <select required value={bankForm.employee_id} onChange={e => {
                  const emp = employees.find(x => x.id === parseInt(e.target.value));
                  setBankForm({
                    ...bankForm, employee_id: e.target.value,
                    account_holder_name: emp ? `${emp.first_name} ${emp.last_name}` : ''
                  });
                }} className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                  <option value="">-- Choose Employee --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_code})</option>)}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Account Holder Name *</label>
                <input required value={bankForm.account_holder_name} onChange={e => setBankForm({...bankForm, account_holder_name: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Account Number *</label>
                  <input required value={bankForm.account_number} onChange={e => setBankForm({...bankForm, account_number: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">IFSC Code *</label>
                  <input required value={bankForm.ifsc_code} onChange={e => setBankForm({...bankForm, ifsc_code: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono uppercase" />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Bank Name *</label>
                <input required value={bankForm.bank_name} onChange={e => setBankForm({...bankForm, bank_name: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowBankModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-teal-600 text-white rounded-xl font-bold shadow">{submitting ? 'Saving...' : 'Save Bank Account'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ASSIGN BENEFIT MODAL ────────────────────────────────────────── */}
      {showBenefitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Assign Employee Benefit</h3>
              <button onClick={() => setShowBenefitModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAssignBenefit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Employee *</label>
                <select required value={benefitForm.employee_id} onChange={e => setBenefitForm({...benefitForm, employee_id: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                  <option value="">-- Choose Employee --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_code})</option>)}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Benefit Name *</label>
                <input required value={benefitForm.benefit_name} onChange={e => setBenefitForm({...benefitForm, benefit_name: e.target.value})}
                  placeholder="e.g. Comprehensive Health Cover" className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Benefit Type *</label>
                  <select value={benefitForm.benefit_type} onChange={e => setBenefitForm({...benefitForm, benefit_type: e.target.value as any})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                    <option value="HEALTH_INSURANCE">Health Insurance</option>
                    <option value="LIFE_INSURANCE">Life Insurance</option>
                    <option value="MEAL_CARD">Meal Card</option>
                    <option value="FUEL_CARD">Fuel Card</option>
                    <option value="GYM">Gym Membership</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Coverage (₹)</label>
                  <input type="number" value={benefitForm.coverage_amount} onChange={e => setBenefitForm({...benefitForm, coverage_amount: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowBenefitModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-teal-600 text-white rounded-xl font-bold shadow">{submitting ? 'Assigning...' : 'Assign Benefit'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
