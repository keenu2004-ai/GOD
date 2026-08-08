import React, { useState, useEffect, useCallback } from 'react';
import {
  Network, Building, ShieldCheck, Users, Plus, RefreshCw, X,
  CheckCircle2, ArrowRight, Layers, FileText, Lock, ChevronRight
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

interface Branch {
  id: number;
  name: string;
  code: string;
  city: string;
  state: string;
  address: string;
  is_headquarters: boolean;
  employee_count: number;
}

interface Role {
  id: number;
  role_name: string;
  display_name: string;
  description: string;
}

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
}

export const EnterpriseOrganizationPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const isSuperAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(userRole);

  const [tab, setTab] = useState<'branches' | 'rbac' | 'hierarchy'>('branches');

  const [branches, setBranches] = useState<Branch[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Forms
  const [branchForm, setBranchForm] = useState({
    name: 'Mumbai Regional Technology Center',
    code: 'MUM-BO',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: 'Bandra Kurla Complex, Technology Tower 4',
    is_headquarters: false,
  });

  const [transferForm, setTransferForm] = useState({
    employee_id: '',
    to_branch_id: '',
    reason: 'Organizational expansion and regional leadership assignment',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [brRes, roleRes, empRes] = await Promise.all([
        apiClient.get('/org/branches').catch(() => ({ data: { data: [] } })),
        apiClient.get('/org/roles').catch(() => ({ data: { data: [] } })),
        apiClient.get('/employees').catch(() => ({ data: { data: [] } })),
      ]);
      setBranches(brRes.data?.data || []);
      setRoles(roleRes.data?.data || []);
      setEmployees(empRes.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/org/branches', branchForm);
      setShowBranchModal(false);
      await fetchData();
      alert('✅ Branch created successfully!');
    } catch (e: any) { alert(e.response?.data?.message || 'Branch creation failed'); }
    finally { setSubmitting(false); }
  };

  const handleTransferEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/org/transfers', transferForm);
      setShowTransferModal(false);
      await fetchData();
      alert('✅ Employee transferred to new branch!');
    } catch (e: any) { alert(e.response?.data?.message || 'Transfer failed'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-5 min-h-screen pb-10">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-indigo-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/30 rounded-xl">
              <Network className="w-7 h-7 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Enterprise Organization Architecture & IAM Control</h2>
              <p className="text-xs text-indigo-300/70 font-mono mt-0.5">Multi-Branch Hierarchy • RBAC Scope Matrix • Employee Branch Transfers</p>
            </div>
          </div>
          {isSuperAdmin && (
            <div className="flex items-center gap-2">
              <button onClick={() => setShowTransferModal(true)} className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-white/20">
                <ArrowRight className="w-3.5 h-3.5 inline mr-1" /> Transfer Employee
              </button>
              <button onClick={() => setShowBranchModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg">
                <Plus className="w-4 h-4 inline mr-1" /> Add Branch
              </button>
            </div>
          )}
        </div>

        {/* Real-time Org KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-indigo-200 font-mono uppercase">Operating Branches</p>
            <p className="text-xl font-black text-white mt-0.5 font-mono">{branches.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-emerald-300 font-mono uppercase">Configured RBAC Roles</p>
            <p className="text-xl font-black text-emerald-400 mt-0.5 font-mono">{roles.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-indigo-200 font-mono uppercase">Headquarters</p>
            <p className="text-sm font-bold text-indigo-200 mt-1">Bangalore HQ</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-indigo-200 font-mono uppercase">Total Workforce</p>
            <p className="text-xl font-black text-white mt-0.5 font-mono">{employees.length} Employees</p>
          </div>
        </div>
      </div>

      {/* ─── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200 overflow-x-auto">
        <button onClick={() => setTab('branches')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'branches' ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Building className="w-4 h-4" /> Branch Management ({branches.length})
        </button>
        <button onClick={() => setTab('rbac')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'rbac' ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <ShieldCheck className="w-4 h-4" /> RBAC Permission Matrix ({roles.length})
        </button>
        <button onClick={() => setTab('hierarchy')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'hierarchy' ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Network className="w-4 h-4" /> Visual Org Hierarchy
        </button>
      </div>

      {/* ─── BRANCH MANAGEMENT TAB ────────────────────────────────────────── */}
      {tab === 'branches' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {branches.map(b => (
            <div key={b.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200">{b.code}</span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">{b.name}</h4>
                </div>
                {b.is_headquarters && (
                  <span className="text-[10px] font-black px-2 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200">Headquarters</span>
                )}
              </div>
              <p className="text-xs text-slate-600">{b.address}, {b.city}, {b.state}</p>
              <div className="flex items-center justify-between text-xs font-mono pt-2 border-t text-slate-500">
                <span>Employee Capacity</span>
                <span className="font-bold text-indigo-700">{b.employee_count || 0} Employees Assigned</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── RBAC ROLE MATRIX TAB ─────────────────────────────────────────── */}
      {tab === 'rbac' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
              <tr>
                <th className="p-3">Role Code</th>
                <th className="p-3">Display Name</th>
                <th className="p-3">Role Scope & Authorization Boundary</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {roles.map(r => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-indigo-700">{r.role_name}</td>
                  <td className="p-3 font-sans font-bold text-slate-900">{r.display_name}</td>
                  <td className="p-3 font-sans text-slate-600">{r.description}</td>
                  <td className="p-3 font-sans">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">ACTIVE</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── VISUAL HIERARCHY TAB ─────────────────────────────────────────── */}
      {tab === 'hierarchy' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h4 className="font-bold text-slate-900 text-sm">Enterprise Multi-Branch Organizational Structure</h4>
          <div className="space-y-3 font-mono text-xs">
            {branches.map(b => (
              <div key={b.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-indigo-900">
                  <Building className="w-4 h-4" />
                  <span>{b.name} ({b.code})</span>
                  {b.is_headquarters && <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-black">HQ</span>}
                </div>
                <div className="pl-6 space-y-1 text-slate-600 font-sans">
                  <p className="text-[11px]">📍 Location: {b.city}, {b.state}</p>
                  <p className="text-[11px]">👥 Assigned Workforce: {b.employee_count || 0} Employees</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── ADD BRANCH MODAL ──────────────────────────────────────────────── */}
      {showBranchModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Add Operating Branch</h3>
              <button onClick={() => setShowBranchModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateBranch} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Branch Name *</label>
                <input required value={branchForm.name} onChange={e => setBranchForm({...branchForm, name: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Branch Code *</label>
                  <input required value={branchForm.code} onChange={e => setBranchForm({...branchForm, code: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">City *</label>
                  <input required value={branchForm.city} onChange={e => setBranchForm({...branchForm, city: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Address *</label>
                <textarea required value={branchForm.address} onChange={e => setBranchForm({...branchForm, address: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" rows={2} />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowBranchModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow">{submitting ? 'Adding...' : 'Create Branch'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── TRANSFER EMPLOYEE MODAL ───────────────────────────────────────── */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Transfer Employee Branch</h3>
              <button onClick={() => setShowTransferModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleTransferEmployee} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Select Employee *</label>
                <select required value={transferForm.employee_id} onChange={e => setTransferForm({...transferForm, employee_id: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                  <option value="">-- Choose Employee --</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>)}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Destination Branch *</label>
                <select required value={transferForm.to_branch_id} onChange={e => setTransferForm({...transferForm, to_branch_id: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                  <option value="">-- Choose Branch --</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Transfer Reason *</label>
                <textarea required value={transferForm.reason} onChange={e => setTransferForm({...transferForm, reason: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" rows={2} />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowTransferModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow">{submitting ? 'Transferring...' : 'Complete Transfer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
