import React, { useState, useEffect, useCallback } from 'react';
import {
  Laptop, ShieldCheck, Wrench, Users, Plus, RefreshCw, X,
  CheckCircle2, ArrowRight, Layers, FileText, AlertTriangle, HelpCircle
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

interface Asset {
  id: number;
  asset_name: string;
  asset_code: string;
  category: string;
  serial_number: string;
  value: number;
  status: string;
  first_name?: string;
  last_name?: string;
  assigned_to_employee_id?: number;
}

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
}

const fmtCurr = (n?: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

export const EnterpriseAssetPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const isAssetMgr = ['ADMIN', 'HR_MANAGER', 'ASSET_MANAGER', 'SUPER_ADMIN'].includes(userRole);

  const [tab, setTab] = useState<'inventory' | 'my-assets' | 'categories'>('inventory');

  const [assets, setAssets] = useState<Asset[]>([]);
  const [myAssets, setMyAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Forms
  const [addForm, setAddForm] = useState({
    asset_name: 'MacBook Pro 16" M3 Max',
    category: 'Laptop',
    serial_number: `SN-MP16-${Math.floor(100000 + Math.random() * 900000)}`,
    value: 249900,
  });

  const [assignForm, setAssignForm] = useState({
    asset_id: '',
    employee_id: '',
  });

  const [transferForm, setTransferForm] = useState({
    asset_id: '',
    from_employee_id: '',
    to_employee_id: '',
    reason: 'Departmental reassignment and project allocation',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [astRes, myRes, empRes] = await Promise.all([
        apiClient.get('/assets/all').catch(() => ({ data: { data: [] } })),
        apiClient.get('/assets/my-assets').catch(() => ({ data: { data: [] } })),
        apiClient.get('/employees').catch(() => ({ data: { data: [] } })),
      ]);
      setAssets(astRes.data?.data || []);
      setMyAssets(myRes.data?.data || []);
      setEmployees(empRes.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/assets/create', addForm);
      setShowAddModal(false);
      await fetchData();
      alert('✅ Asset added to master inventory!');
    } catch (e: any) { alert(e.response?.data?.message || 'Asset creation failed'); }
    finally { setSubmitting(false); }
  };

  const handleAssignAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/assets/assign', assignForm);
      setShowAssignModal(false);
      await fetchData();
      alert('✅ Asset assigned to employee!');
    } catch (e: any) { alert('Assignment failed'); }
    finally { setSubmitting(false); }
  };

  const handleTransferAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/assets/transfer', transferForm);
      setShowTransferModal(false);
      await fetchData();
      alert('✅ Asset transferred successfully!');
    } catch (e: any) { alert('Transfer failed'); }
    finally { setSubmitting(false); }
  };

  const totalValue = assets.reduce((a, b) => a + Number(b.value || 0), 0);

  return (
    <div className="space-y-5 min-h-screen pb-10">
      {/* ─── Header Workspace ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-sky-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-600/30 rounded-xl">
              <Laptop className="w-7 h-7 text-sky-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Enterprise Asset Lifecycle & Inventory Management</h2>
              <p className="text-xs text-sky-300/70 font-mono mt-0.5">Asset Requisitions • Custodian Transfers • Warranty Claims • Physical Audits</p>
            </div>
          </div>
          {isAssetMgr && (
            <div className="flex items-center gap-2">
              <button onClick={() => setShowTransferModal(true)} className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-white/20">
                <ArrowRight className="w-3.5 h-3.5 inline mr-1" /> Transfer Asset
              </button>
              <button onClick={() => setShowAssignModal(true)} className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-white/20">
                <Users className="w-3.5 h-3.5 inline mr-1" /> Assign Asset
              </button>
              <button onClick={() => setShowAddModal(true)} className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg">
                <Plus className="w-4 h-4 inline mr-1" /> Add Asset
              </button>
            </div>
          )}
        </div>

        {/* Real-time Asset KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-sky-200 font-mono uppercase">Master Inventory Count</p>
            <p className="text-xl font-black text-white mt-0.5 font-mono">{assets.length} Assets</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-emerald-300 font-mono uppercase">Assigned Workforce Assets</p>
            <p className="text-xl font-black text-emerald-400 mt-0.5 font-mono">{assets.filter(a => a.status === 'ALLOCATED').length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-sky-200 font-mono uppercase">Available Stock</p>
            <p className="text-xl font-black text-sky-300 mt-0.5 font-mono">{assets.filter(a => a.status === 'AVAILABLE').length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-sky-200 font-mono uppercase">Total Inventory Valuation</p>
            <p className="text-lg font-black text-white mt-0.5 font-mono">{fmtCurr(totalValue)}</p>
          </div>
        </div>
      </div>

      {/* ─── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200 overflow-x-auto">
        <button onClick={() => setTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'inventory' ? 'bg-white text-sky-700 shadow-sm border border-sky-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Laptop className="w-4 h-4" /> Master Inventory ({assets.length})
        </button>
        <button onClick={() => setTab('my-assets')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'my-assets' ? 'bg-white text-sky-700 shadow-sm border border-sky-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Users className="w-4 h-4" /> My Assigned Assets ({myAssets.length})
        </button>
      </div>

      {/* ─── MASTER INVENTORY TAB ─────────────────────────────────────────── */}
      {tab === 'inventory' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
              <tr>
                <th className="p-3">Asset Tag</th>
                <th className="p-3">Asset Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Serial Number</th>
                <th className="p-3">Assigned Custodian</th>
                <th className="p-3">Valuation</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {assets.map(a => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-sky-700">{a.asset_code}</td>
                  <td className="p-3 font-sans font-bold text-slate-900">{a.asset_name}</td>
                  <td className="p-3 text-slate-600">{a.category}</td>
                  <td className="p-3 text-slate-500">{a.serial_number}</td>
                  <td className="p-3 font-sans font-bold text-slate-900">{a.first_name ? `${a.first_name} ${a.last_name}` : 'Unassigned'}</td>
                  <td className="p-3 font-bold text-slate-900">{fmtCurr(a.value)}</td>
                  <td className="p-3 font-sans">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      a.status === 'ALLOCATED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-sky-50 text-sky-700 border-sky-200'
                    }`}>{a.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── MY ASSIGNED ASSETS TAB ───────────────────────────────────────── */}
      {tab === 'my-assets' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {myAssets.map(ma => (
            <div key={ma.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-sky-50 text-sky-700 rounded border border-sky-200">{ma.asset_code}</span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">{ma.asset_name}</h4>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">ACTIVE_ASSIGNMENT</span>
              </div>
              <div className="space-y-1 text-xs text-slate-600 font-mono">
                <p>• Category: {ma.category}</p>
                <p>• Serial: {ma.serial_number}</p>
                <p>• Asset Value: {fmtCurr(ma.value)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── ADD ASSET MODAL ───────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Add Asset to Inventory</h3>
              <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateAsset} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Asset Name *</label>
                <input required value={addForm.asset_name} onChange={e => setAddForm({...addForm, asset_name: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Category *</label>
                  <select required value={addForm.category} onChange={e => setAddForm({...addForm, category: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                    <option value="Laptop">Laptop</option>
                    <option value="Desktop">Desktop</option>
                    <option value="Monitor">Monitor</option>
                    <option value="Mobile Phone">Mobile Phone</option>
                    <option value="Network Equipment">Network Equipment</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Value (₹) *</label>
                  <input required type="number" value={addForm.value} onChange={e => setAddForm({...addForm, value: Number(e.target.value)})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Serial Number *</label>
                <input required value={addForm.serial_number} onChange={e => setAddForm({...addForm, serial_number: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-sky-600 text-white rounded-xl font-bold shadow">{submitting ? 'Creating...' : 'Create Asset'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ASSIGN ASSET MODAL ────────────────────────────────────────────── */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Assign Asset to Employee</h3>
              <button onClick={() => setShowAssignModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAssignAsset} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Select Asset *</label>
                <select required value={assignForm.asset_id} onChange={e => setAssignForm({...assignForm, asset_id: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                  <option value="">-- Choose Available Asset --</option>
                  {assets.filter(a => a.status === 'AVAILABLE').map(a => <option key={a.id} value={a.id}>{a.asset_name} ({a.asset_code})</option>)}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Assign To Employee *</label>
                <select required value={assignForm.employee_id} onChange={e => setAssignForm({...assignForm, employee_id: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                  <option value="">-- Choose Employee --</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAssignModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-sky-600 text-white rounded-xl font-bold shadow">{submitting ? 'Assigning...' : 'Complete Assignment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
