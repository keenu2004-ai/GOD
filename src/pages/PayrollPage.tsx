import React, { useState, useEffect } from 'react';
import { DollarSign, FileText, Download, CheckCircle2, Eye, Plus, X } from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { PayrollRecord } from '../types/index.js';

export const PayrollPage: React.FC = () => {
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null);

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/payrolls');
      if (res.data?.success) setPayrolls(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            Payroll & Payslip Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">Itemized salary breakdown, statutory deductions (PF, ESI, TDS) & bank payouts.</p>
        </div>

        <button
          onClick={() => {
            const headers = ['ID', 'Employee', 'Code', 'Month', 'Year', 'Gross', 'PF', 'ESI', 'TDS', 'Net Salary', 'Status'];
            const rows = payrolls.map((p) => [
              p.id,
              `"${p.first_name || ''} ${p.last_name || ''}"`,
              p.employee_code,
              p.month,
              p.year,
              p.gross_salary,
              p.pf_deduction,
              p.esi_deduction,
              p.tds_deduction,
              p.net_salary,
              p.payment_status,
            ]);
            const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', `Payroll_Disbursement_Report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 border border-slate-200 transition-all shadow-sm"
        >
          <FileText className="w-4 h-4 text-emerald-600" />
          <span>Export Payroll CSV</span>
        </button>
      </div>

      {/* Payroll Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[10px] font-black tracking-wider">
            <tr>
              <th className="p-4">Employee</th>
              <th className="p-4">Month / Year</th>
              <th className="p-4">Gross Salary</th>
              <th className="p-4">Deductions</th>
              <th className="p-4">Net Payable</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Payslip</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payrolls.map((p) => {
              const totalDeductions = Number(p.pf_deduction || 0) + Number(p.esi_deduction || 0) + Number(p.tds_deduction || 0);
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="p-4">
                    <p className="font-bold text-slate-900">{p.first_name} {p.last_name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{p.employee_code}</p>
                  </td>
                  <td className="p-4 font-mono font-semibold text-blue-600">{p.month} {p.year}</td>
                  <td className="p-4 font-mono font-semibold text-slate-900">₹{Number(p.gross_salary || 0).toLocaleString('en-IN')}</td>
                  <td className="p-4 font-mono text-rose-600 font-semibold">-₹{totalDeductions.toLocaleString('en-IN')}</td>
                  <td className="p-4 font-mono font-bold text-emerald-600">₹{Number(p.net_salary || 0).toLocaleString('en-IN')}</td>
                  <td className="p-4">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                      {p.payment_status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setSelectedPayslip(p)}
                      className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 text-xs font-semibold ml-auto shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Payslip</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Itemized Payslip Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 w-full max-w-2xl space-y-6 shadow-2xl text-slate-900">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">THEIAKSHI ENTERPRISES</h3>
                <p className="text-xs text-blue-600 font-mono font-bold">CONFIDENTIAL SALARY PAYSLIP • {selectedPayslip.month} {selectedPayslip.year}</p>
              </div>
              <button onClick={() => setSelectedPayslip(null)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
              <div>
                <p className="text-slate-500 font-medium">Employee Name:</p>
                <p className="font-bold text-slate-900">{selectedPayslip.first_name} {selectedPayslip.last_name}</p>
                <p className="text-slate-500 mt-2 font-medium">Designation:</p>
                <p className="font-bold text-slate-900">{selectedPayslip.designation}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Bank Account:</p>
                <p className="font-mono font-bold text-emerald-700">{selectedPayslip.bank_account || '918237192890'}</p>
                <p className="text-slate-500 mt-2 font-medium">IFSC Code:</p>
                <p className="font-mono font-bold text-slate-900">{selectedPayslip.ifsc_code || 'HDFC0001234'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 text-xs">
              {/* Earnings */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                <p className="font-bold text-emerald-700 border-b border-slate-200 pb-2">EARNINGS (₹)</p>
                <div className="flex justify-between"><span className="text-slate-600">Basic Salary:</span><span className="font-mono text-slate-900 font-semibold">₹{Number(selectedPayslip.basic_salary).toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">House Rent Allowance (HRA):</span><span className="font-mono text-slate-900 font-semibold">₹{Number(selectedPayslip.hra).toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Conveyance Allowance:</span><span className="font-mono text-slate-900 font-semibold">₹{Number(selectedPayslip.conveyance).toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Special Allowances:</span><span className="font-mono text-slate-900 font-semibold">₹{Number(selectedPayslip.allowances).toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between font-bold text-emerald-700 pt-2 border-t border-slate-200">
                  <span>Gross Earnings:</span>
                  <span className="font-mono">₹{Number(selectedPayslip.gross_salary).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Deductions */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                <p className="font-bold text-rose-700 border-b border-slate-200 pb-2">STATUTORY DEDUCTIONS (₹)</p>
                <div className="flex justify-between"><span className="text-slate-600">Provident Fund (PF):</span><span className="font-mono text-rose-600 font-semibold">₹{Number(selectedPayslip.pf_deduction).toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Employee State Insurance (ESI):</span><span className="font-mono text-rose-600 font-semibold">₹{Number(selectedPayslip.esi_deduction).toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Tax Deducted at Source (TDS):</span><span className="font-mono text-rose-600 font-semibold">₹{Number(selectedPayslip.tds_deduction).toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between font-bold text-rose-700 pt-6 border-t border-slate-200">
                  <span>Total Deductions:</span>
                  <span className="font-mono">₹{(Number(selectedPayslip.pf_deduction) + Number(selectedPayslip.esi_deduction) + Number(selectedPayslip.tds_deduction)).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg flex justify-between items-center text-sm font-bold">
              <span className="text-emerald-800">NET SALARY DISBURSED TO BANK:</span>
              <span className="text-xl text-emerald-700 font-mono font-black">₹{Number(selectedPayslip.net_salary).toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm">
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
