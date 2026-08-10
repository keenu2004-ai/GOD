import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Download, Printer, Shield, CheckCircle2, Award, DollarSign,
  TrendingUp, Calendar, Building, User, Lock, Eye, Plus, X, QrCode
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

interface SelfServiceFeed {
  active_assignment: any;
  recent_payslips: any[];
  active_loans: any[];
  active_advances: any[];
  salary_revisions: any[];
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const fmtCurr = (v: number | string) => `₹${parseFloat(String(v || 0)).toLocaleString('en-IN')}`;
const fmtDate = (s: string) => s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const EmployeePayrollPortalPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const userId = (user as any)?.id || 0;

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[now.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [tab, setTab] = useState<'portal' | 'certificates'>('portal');

  const [feed, setFeed] = useState<SelfServiceFeed | null>(null);
  const [payslipData, setPayslipData] = useState<any>(null);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);

  const [certForm, setCertForm] = useState({
    certificate_type: 'SALARY_CERTIFICATE', purpose: 'Bank Loan Application',
  });

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const [feedRes, certRes] = await Promise.all([
        apiClient.get('/payroll/self-service/feed'),
        apiClient.get('/payroll/certificates').catch(() => ({ data: { data: [] } })),
      ]);
      setFeed(feedRes.data?.data || null);
      setCertificates(certRes.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  const handleViewPayslip = async (m = selectedMonth, y = selectedYear) => {
    try {
      const res = await apiClient.get(`/payroll/payslip/view?month=${m}&year=${y}`);
      setPayslipData(res.data?.data);
      setShowPayslipModal(true);
      if (res.data?.data?.payslip_document?.id) {
        apiClient.post('/payroll/payslip/log-download', { payslip_id: res.data.data.payslip_document.id }).catch(() => {});
      }
    } catch (e: any) { alert(e.response?.data?.message || 'Payslip not available'); }
  };

  const handleRequestCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/payroll/certificates/request', {
        employee_id: userId,
        certificate_type: certForm.certificate_type,
        purpose: certForm.purpose,
      });
      setShowCertModal(false);
      await fetchFeed();
      alert('✅ Salary Certificate issued successfully!');
    } catch (e: any) { alert(e.response?.data?.message || 'Request failed'); }
  };

  const p = payslipData;

  return (
    <div className="space-y-5 min-h-screen pb-10">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-blue-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 rounded-xl">
              <FileText className="w-7 h-7 text-blue-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Employee Self-Service Payroll Portal</h2>
              <p className="text-xs text-blue-300/70 font-mono mt-0.5">Digital Payslips • Salary Certificates • Tax Deductions</p>
            </div>
          </div>
          <button onClick={() => handleViewPayslip(selectedMonth, selectedYear)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg">
            <Eye className="w-4 h-4" /> View Current Payslip
          </button>
        </div>

        {/* Quick Self Service Stats */}
        {feed?.active_assignment && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-2xl font-black text-blue-300">{fmtCurr(feed.active_assignment.annual_ctc)}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Annual Total CTC</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-2xl font-black text-emerald-300">{fmtCurr(feed.active_assignment.monthly_net)}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Monthly Net Salary</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-2xl font-black text-amber-300">{fmtCurr(feed.active_assignment.pf_deduction)}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Monthly PF Contribution</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-2xl font-black text-purple-300">{feed.recent_payslips.length}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Available Payslips</p>
            </div>
          </div>
        )}
      </div>

      {/* ─── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200 overflow-x-auto">
        <button onClick={() => setTab('portal')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'portal' ? 'bg-white text-blue-700 shadow-sm border border-blue-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <FileText className="w-4 h-4" /> Self-Service Overview & Payslips
        </button>
        <button onClick={() => setTab('certificates')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'certificates' ? 'bg-white text-blue-700 shadow-sm border border-blue-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Award className="w-4 h-4" /> Salary Certificates Center ({certificates.length})
        </button>
      </div>

      {/* ─── PORTAL OVERVIEW TAB ─────────────────────────────────────────── */}
      {tab === 'portal' && feed && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Recent Payslips List */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> Digital Payslips Archive
              </h3>
              <div className="space-y-2">
                {feed.recent_payslips.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 border rounded-xl hover:bg-white transition-all">
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{doc.month} {doc.year}</p>
                      <p className="text-[10px] text-slate-500 font-mono">Net Salary: {fmtCurr(doc.net_salary)}</p>
                    </div>
                    <button onClick={() => handleViewPayslip(doc.month, doc.year)} className="flex items-center gap-1 bg-blue-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow">
                      <Eye className="w-3.5 h-3.5" /> View Payslip
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Loans & Advances Summary */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600" /> Active Loans & Advances Tracker
              </h3>
              <div className="space-y-3 text-xs">
                {feed.active_loans.map(l => (
                  <div key={l.id} className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                    <div className="flex justify-between font-bold text-amber-900">
                      <span>Loan #{l.id}</span>
                      <span>EMI: {fmtCurr(l.emi_amount)}/mo</span>
                    </div>
                    <p className="text-[10px] text-amber-700 font-mono">Outstanding: {fmtCurr(l.outstanding_balance)} of {fmtCurr(l.loan_amount)}</p>
                  </div>
                ))}
                {feed.active_advances.map(a => (
                  <div key={a.id} className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                    <div className="flex justify-between font-bold text-blue-900">
                      <span>Salary Advance</span>
                      <span>Deduction: {fmtCurr(a.monthly_deduction)}/mo</span>
                    </div>
                    <p className="text-[10px] text-blue-700 font-mono">Outstanding: {fmtCurr(a.outstanding_balance)} of {fmtCurr(a.advance_amount)}</p>
                  </div>
                ))}
                {feed.active_loans.length === 0 && feed.active_advances.length === 0 && (
                  <p className="text-slate-400 text-center py-6">No active loans or salary advances.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── CERTIFICATES TAB ────────────────────────────────────────────── */}
      {tab === 'certificates' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500 font-semibold">{certificates.length} Certificates & Official Letters Issued</p>
            <button onClick={() => setShowCertModal(true)} className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow">
              <Plus className="w-4 h-4" /> Request Certificate
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
                <tr>
                  <th className="p-3">Employee</th>
                  <th className="p-3">Certificate Type</th>
                  <th className="p-3">Purpose</th>
                  <th className="p-3">Issued Date</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {certificates.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-3 font-sans font-bold text-slate-900">{c.first_name} {c.last_name}</td>
                    <td className="p-3 font-sans"><span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">{c.certificate_type}</span></td>
                    <td className="p-3 font-sans text-slate-600">{c.purpose}</td>
                    <td className="p-3 text-slate-500">{fmtDate(c.issued_date)}</td>
                    <td className="p-3 font-sans"><span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── DIGITAL PAYSLIP VIEWER MODAL (PRINTABLE A4 LAYOUT) ─────────── */}
      {showPayslipModal && p && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl p-8 shadow-2xl space-y-6 text-slate-900 border">
            {/* Modal Controls Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-slate-900 text-base">Verified Digital Payslip • {p.payroll_period.month} {p.payroll_period.year}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3 py-1.5 rounded-xl border">
                  <Printer className="w-4 h-4" /> Print A4
                </button>
                <button onClick={() => setShowPayslipModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>
            </div>

            {/* ─── A4 PAYSLIP CONTENT ───────────────────────────────────── */}
            <div className="border-2 border-slate-900 rounded-xl p-6 space-y-6 bg-white font-sans">
              {/* Company Branding */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-900">THEIAKSHI ONE HRMS</h1>
                  <p className="text-xs font-semibold text-slate-600">Enterprise Workforce Management Systems</p>
                  <p className="text-[10px] text-slate-500">Corporate HQ, Cyber City, Sector 24, India</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black bg-slate-900 text-white px-3 py-1 rounded-md uppercase tracking-wider">PAYSLIP</span>
                  <p className="text-xs font-mono font-bold text-slate-700 mt-1">{p.payroll_period.month} {p.payroll_period.year}</p>
                </div>
              </div>

              {/* Employee Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div><span className="text-slate-500 text-[10px]">EMPLOYEE NAME</span> <p className="font-bold text-slate-900">{p.employee.name}</p></div>
                <div><span className="text-slate-500 text-[10px]">EMPLOYEE CODE</span> <p className="font-mono font-bold text-slate-900">{p.employee.employee_code}</p></div>
                <div><span className="text-slate-500 text-[10px]">DEPARTMENT</span> <p className="font-bold text-slate-900">{p.employee.department}</p></div>
                <div><span className="text-slate-500 text-[10px]">DESIGNATION</span> <p className="font-bold text-slate-900">{p.employee.designation}</p></div>
                <div><span className="text-slate-500 text-[10px]">BANK NAME</span> <p className="font-bold text-slate-900">{p.employee.bank_name}</p></div>
                <div><span className="text-slate-500 text-[10px]">BANK A/C NO</span> <p className="font-mono font-bold text-slate-900">{p.employee.account_number_masked}</p></div>
                <div><span className="text-slate-500 text-[10px]">WORKING / PRESENT</span> <p className="font-mono font-bold text-slate-900">{p.payroll_period.present_days} / {p.payroll_period.working_days} days</p></div>
                <div><span className="text-slate-500 text-[10px]">LOP DAYS</span> <p className="font-mono font-bold text-red-600">{p.payroll_period.lop_days} days</p></div>
              </div>

              {/* Earnings & Deductions Table */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                {/* Earnings Column */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-slate-900 text-white font-bold px-3 py-1.5 flex justify-between text-[11px]">
                    <span>EARNINGS</span><span>AMOUNT</span>
                  </div>
                  <div className="p-3 space-y-1.5 font-mono">
                    <div className="flex justify-between"><span>Basic Salary</span> <span>{fmtCurr(p.earnings.basic)}</span></div>
                    <div className="flex justify-between"><span>House Rent Allowance</span> <span>{fmtCurr(p.earnings.hra)}</span></div>
                    <div className="flex justify-between"><span>Special Allowance</span> <span>{fmtCurr(p.earnings.special_allowance)}</span></div>
                    {p.earnings.bonus > 0 && <div className="flex justify-between"><span>Performance Bonus</span> <span>{fmtCurr(p.earnings.bonus)}</span></div>}
                    {p.earnings.reimbursements > 0 && <div className="flex justify-between"><span>Expense Reimbursements</span> <span>{fmtCurr(p.earnings.reimbursements)}</span></div>}
                    <div className="flex justify-between font-bold font-sans border-t pt-1.5 text-slate-900">
                      <span>GROSS EARNINGS</span> <span>{fmtCurr(p.earnings.gross_salary)}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions Column */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-slate-900 text-white font-bold px-3 py-1.5 flex justify-between text-[11px]">
                    <span>DEDUCTIONS</span><span>AMOUNT</span>
                  </div>
                  <div className="p-3 space-y-1.5 font-mono">
                    <div className="flex justify-between text-red-700"><span>Provident Fund (PF)</span> <span>{fmtCurr(p.deductions.pf)}</span></div>
                    <div className="flex justify-between text-red-700"><span>Professional Tax (PT)</span> <span>{fmtCurr(p.deductions.pt)}</span></div>
                    {p.deductions.esi > 0 && <div className="flex justify-between text-red-700"><span>ESI Contribution</span> <span>{fmtCurr(p.deductions.esi)}</span></div>}
                    {p.deductions.loan_emi > 0 && <div className="flex justify-between text-red-700"><span>Loan EMI</span> <span>{fmtCurr(p.deductions.loan_emi)}</span></div>}
                    {p.deductions.salary_advance > 0 && <div className="flex justify-between text-red-700"><span>Salary Advance Recovery</span> <span>{fmtCurr(p.deductions.salary_advance)}</span></div>}
                    {p.deductions.lop_deduction > 0 && <div className="flex justify-between text-red-700"><span>Loss Of Pay (LOP)</span> <span>{fmtCurr(p.deductions.lop_deduction)}</span></div>}
                    <div className="flex justify-between font-bold font-sans border-t pt-1.5 text-slate-900">
                      <span>TOTAL DEDUCTIONS</span> <span>{fmtCurr(p.deductions.total_deductions)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Disbursal Banner */}
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">NET DISBURSAL SALARY</span>
                  <p className="text-2xl font-black font-mono text-emerald-950">{fmtCurr(p.net_salary)}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">QR VERIFICATION</span>
                  <p className="text-[10px] font-mono font-bold text-blue-700 flex items-center gap-1 mt-0.5">
                    <QrCode className="w-3.5 h-3.5" /> {p.qr_verification_code}
                  </p>
                </div>
              </div>

              {/* Footer Signatory */}
              <div className="flex justify-between items-end pt-4 text-[10px] text-slate-500 border-t">
                <p>This is a computer-generated digital document and does not require a physical signature.</p>
                <div className="text-center font-bold text-slate-900 border-t border-slate-400 pt-1 px-4">
                  Authorized HR Signatory
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── REQUEST CERTIFICATE MODAL ───────────────────────────────────── */}
      {showCertModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Request Salary Certificate</h3>
              <button onClick={() => setShowCertModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleRequestCertificate} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Certificate Type *</label>
                <select value={certForm.certificate_type} onChange={e => setCertForm({...certForm, certificate_type: e.target.value as any})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                  <option value="SALARY_CERTIFICATE">Salary Certificate</option>
                  <option value="EMPLOYMENT_LETTER">Employment Proof Letter</option>
                  <option value="INCREMENT_LETTER">Increment / Revision Letter</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Purpose *</label>
                <input required value={certForm.purpose} onChange={e => setCertForm({...certForm, purpose: e.target.value})}
                  placeholder="e.g. Bank Loan Application / Visa Process" className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowCertModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold shadow">Issue Certificate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
