import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Check, X, FileText, DollarSign } from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { ExpenseClaim } from '../types/index.js';

export const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    title: 'Client Lunch Meeting',
    category: 'Travel & Food',
    amount: 2850,
    date: new Date().toISOString().split('T')[0],
    description: 'Business discussion with enterprise prospects',
  });

  const fetchExpenses = async () => {
    try {
      const res = await apiClient.get('/expenses');
      if (res.data?.success) setExpenses(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/expenses', formData);
      setShowSubmitModal(false);
      fetchExpenses();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit claim');
    }
  };

  const handleApprove = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      await apiClient.put(`/expenses/${id}/status`, { status });
      fetchExpenses();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-rose-600" />
            Expense Reimbursement Claims
          </h2>
          <p className="text-xs text-slate-500 mt-1">Submit travel, meal, hardware & operational expense receipts.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const headers = ['ID', 'Employee', 'Title', 'Category', 'Amount', 'Date', 'Status'];
              const rows = expenses.map((e) => [
                e.id,
                `"${e.first_name || ''} ${e.last_name || ''}"`,
                `"${e.title || ''}"`,
                e.category,
                e.amount,
                e.date,
                e.status,
              ]);
              const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', `Expenses_Report_${new Date().toISOString().split('T')[0]}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 border border-slate-200 transition-all"
          >
            <FileText className="w-4 h-4 text-slate-600" />
            <span>Export CSV</span>
          </button>

          <button onClick={() => setShowSubmitModal(true)} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all">
            <Plus className="w-4 h-4" />
            <span>New Claim</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[10px] font-black tracking-wider">
            <tr>
              <th className="p-4">Employee</th>
              <th className="p-4">Title / Category</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Date</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-slate-50">
                <td className="p-4 font-bold text-slate-900">{exp.first_name} {exp.last_name}</td>
                <td className="p-4">
                  <p className="font-bold text-slate-900">{exp.title}</p>
                  <p className="text-[10px] text-slate-500 font-mono font-medium">{exp.category}</p>
                </td>
                <td className="p-4 font-mono font-bold text-emerald-600">₹{Number(exp.amount).toLocaleString('en-IN')}</td>
                <td className="p-4 font-mono font-medium">{exp.date}</td>
                <td className="p-4">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    exp.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : exp.status === 'REJECTED' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-orange-100 text-orange-700 border border-orange-200'
                  }`}>
                    {exp.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-1">
                  {exp.status === 'PENDING' && (
                    <>
                      <button onClick={() => handleApprove(exp.id, 'APPROVED')} className="p-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition-colors"><Check className="w-4 h-4" /></button>
                      <button onClick={() => handleApprove(exp.id, 'REJECTED')} className="p-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 w-full max-w-md space-y-4 shadow-2xl text-slate-900">
            <h3 className="text-base font-bold text-slate-900">Submit Expense Reimbursement</h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 font-semibold">Claim Title</label>
                <input required type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-slate-900 mt-1 font-medium" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-semibold">Category</label>
                  <input required type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-slate-900 mt-1 font-medium" />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold">Amount (₹)</label>
                  <input required type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })} className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-slate-900 mt-1 font-medium" />
                </div>
              </div>
              <div>
                <label className="text-slate-600 font-semibold">Description</label>
                <textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-slate-900 mt-1 font-medium" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowSubmitModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-sm">Submit Claim</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
