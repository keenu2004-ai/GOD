import React, { useState, useEffect, useCallback } from 'react';
import {
  Laptop, Plus, Search, Filter, RefreshCw, CheckCircle2, AlertTriangle,
  UserCheck, Wrench, X, DollarSign, Calendar, Tag, Shield, Building2
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

interface AssetKPIs {
  total_assets: number;
  available_assets: number;
  allocated_assets: number;
  maintenance_assets: number;
  total_inventory_value: number;
}

interface Asset {
  id: number;
  asset_name: string;
  asset_code: string;
  category: string;
  serial_number: string;
  purchase_date: string;
  value: number;
  status: string;
  first_name?: string;
  last_name?: string;
  employee_code?: string;
}

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
}

const fmtCurr = (n?: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (s?: string) => s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const EnterpriseAssetsPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const isHR = ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'].includes(userRole);

  const [kpis, setKpis] = useState<AssetKPIs>({
    total_assets: 0, available_assets: 0, allocated_assets: 0, maintenance_assets: 0, total_inventory_value: 0
  });
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Forms
  const [assetForm, setAssetForm] = useState({
    asset_name: 'MacBook Pro M3 Max 16"',
    asset_code: 'AST-2026-0099',
    category: 'Laptop',
    serial_number: 'C02G99887766',
    purchase_date: '2026-01-15',
    value: 249900,
    assigned_to_employee_id: '',
  });

  const [assignForm, setAssignForm] = useState({ employee_id: '' });

  const [maintForm, setMaintForm] = useState({
    maintenance_type: 'PREVENTIVE',
    description: 'Annual hardware overhaul and thermal paste replacement',
    cost: 3500,
    start_date: '2026-08-15',
  });

  const [issueForm, setIssueForm] = useState({
    issue_type: 'DAMAGE',
    description: 'Screen glass cracked during transit',
    severity: 'HIGH' as any,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [kpiRes, astRes, empRes] = await Promise.all([
        apiClient.get('/assets/kpis').catch(() => ({ data: { data: {} } })),
        apiClient.get(`/assets?category=${filterCategory}&status=${filterStatus}`).catch(() => ({ data: { data: [] } })),
        apiClient.get('/employees').catch(() => ({ data: { data: [] } })),
      ]);
      setKpis(kpiRes.data?.data || {});
      setAssets(astRes.data?.data || []);
      setEmployees(empRes.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filterCategory, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/assets', {
        ...assetForm,
        value: Number(assetForm.value),
        assigned_to_employee_id: assetForm.assigned_to_employee_id ? parseInt(assetForm.assigned_to_employee_id) : undefined,
      });
      setShowAddModal(false);
      await fetchData();
      alert('✅ IT Asset onboarded into master inventory!');
    } catch (e: any) { alert(e.response?.data?.message || 'Asset creation failed'); }
    finally { setSubmitting(false); }
  };

  const handleAssignAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    try {
      await apiClient.post(`/assets/${selectedAsset.id}/assign`, {
        employee_id: parseInt(assignForm.employee_id),
      });
      setShowAssignModal(false);
      await fetchData();
      alert('✅ Asset assigned to employee!');
    } catch (e: any) { alert(e.response?.data?.message || 'Assignment failed'); }
  };

  const handleReturnAsset = async (assetId: number) => {
    try {
      await apiClient.post(`/assets/${assetId}/return`);
      await fetchData();
      alert('✅ Asset returned to available inventory!');
    } catch (e: any) { alert('Return failed'); }
  };

  const handleScheduleMaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    try {
      await apiClient.post(`/assets/${selectedAsset.id}/maintenance`, {
        ...maintForm,
        cost: Number(maintForm.cost),
      });
      setShowMaintModal(false);
      await fetchData();
      alert('✅ Maintenance scheduled!');
    } catch (e: any) { alert(e.response?.data?.message || 'Maintenance failed'); }
  };

  const handleReportIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    try {
      await apiClient.post(`/assets/${selectedAsset.id}/issues`, issueForm);
      setShowIssueModal(false);
      await fetchData();
      alert('✅ Asset issue reported!');
    } catch (e: any) { alert(e.response?.data?.message || 'Issue report failed'); }
  };

  return (
    <div className="space-y-5 min-h-screen pb-10">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-indigo-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/30 rounded-xl">
              <Laptop className="w-7 h-7 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Enterprise IT & Company Asset Management</h2>
              <p className="text-xs text-indigo-300/70 font-mono mt-0.5">Asset Master Inventory • Allocations • Maintenance & Repairs • Lifecycle Tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isHR && (
              <button onClick={() => setShowAddModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg">
                <Plus className="w-4 h-4 inline mr-1" /> Onboard IT Asset
              </button>
            )}
          </div>
        </div>

        {/* Real-time KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-indigo-200 font-mono uppercase">Total Assets</p>
            <p className="text-xl font-black mt-0.5">{kpis.total_assets}</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-emerald-300 font-mono uppercase">Available Stock</p>
            <p className="text-xl font-black text-emerald-400 mt-0.5">{kpis.available_assets}</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-sky-300 font-mono uppercase">Allocated / In Use</p>
            <p className="text-xl font-black text-sky-400 mt-0.5">{kpis.allocated_assets}</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-amber-300 font-mono uppercase">Under Maintenance</p>
            <p className="text-xl font-black text-amber-400 mt-0.5">{kpis.maintenance_assets}</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-indigo-200 font-mono uppercase">Inventory Valuation</p>
            <p className="text-base font-black text-indigo-200 mt-0.5 font-mono">{fmtCurr(kpis.total_inventory_value)}</p>
          </div>
        </div>
      </div>

      {/* ─── FILTERS ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="border border-slate-300 rounded-xl px-3 py-1.5 font-semibold text-slate-700">
            <option value="">All Categories</option>
            <option value="Laptop">Laptop</option>
            <option value="Desktop">Desktop</option>
            <option value="Mobile">Mobile Phone</option>
            <option value="Monitor">Monitor</option>
            <option value="Printer">Printer</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border border-slate-300 rounded-xl px-3 py-1.5 font-semibold text-slate-700">
            <option value="">All Statuses</option>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="ALLOCATED">ALLOCATED</option>
            <option value="UNDER_MAINTENANCE">UNDER_MAINTENANCE</option>
          </select>
        </div>
        <button onClick={fetchData} className="flex items-center gap-1 text-slate-600 font-bold hover:text-indigo-600">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* ─── MASTER INVENTORY TABLE ────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-xs text-left text-slate-700">
          <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
            <tr>
              <th className="p-3">Asset Code</th>
              <th className="p-3">Asset Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Serial Number</th>
              <th className="p-3">Assigned Employee</th>
              <th className="p-3">Valuation</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {assets.map(a => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="p-3 font-bold text-indigo-700">{a.asset_code}</td>
                <td className="p-3 font-sans font-bold text-slate-900">{a.asset_name}</td>
                <td className="p-3 font-sans text-slate-600">{a.category}</td>
                <td className="p-3 text-slate-600">{a.serial_number}</td>
                <td className="p-3 font-sans">
                  {a.first_name ? (
                    <span className="font-bold text-slate-900">{a.first_name} {a.last_name} ({a.employee_code})</span>
                  ) : <span className="text-slate-400 italic">Unassigned (In Stock)</span>}
                </td>
                <td className="p-3 font-bold text-slate-900">{fmtCurr(a.value)}</td>
                <td className="p-3 font-sans">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    a.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    a.status === 'ALLOCATED' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                    'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>{a.status}</span>
                </td>
                <td className="p-3 font-sans flex items-center gap-1.5">
                  {isHR && a.status === 'AVAILABLE' && (
                    <button onClick={() => { setSelectedAsset(a); setShowAssignModal(true); }} className="px-2 py-1 bg-indigo-600 text-white font-bold text-[10px] rounded hover:bg-indigo-700">
                      Assign
                    </button>
                  )}
                  {isHR && a.status === 'ALLOCATED' && (
                    <button onClick={() => handleReturnAsset(a.id)} className="px-2 py-1 bg-slate-600 text-white font-bold text-[10px] rounded hover:bg-slate-700">
                      Return
                    </button>
                  )}
                  {isHR && (
                    <button onClick={() => { setSelectedAsset(a); setShowMaintModal(true); }} className="px-2 py-1 bg-amber-600 text-white font-bold text-[10px] rounded hover:bg-amber-700">
                      Maintenance
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ─── ADD ASSET MODAL ───────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Onboard IT Asset into Master Inventory</h3>
              <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateAsset} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Asset Name *</label>
                <input required value={assetForm.asset_name} onChange={e => setAssetForm({...assetForm, asset_name: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Asset Tag/Code *</label>
                  <input required value={assetForm.asset_code} onChange={e => setAssetForm({...assetForm, asset_code: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Category *</label>
                  <select required value={assetForm.category} onChange={e => setAssetForm({...assetForm, category: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                    <option value="Laptop">Laptop</option>
                    <option value="Desktop">Desktop</option>
                    <option value="Mobile">Mobile Phone</option>
                    <option value="Monitor">Monitor</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Serial Number *</label>
                  <input required value={assetForm.serial_number} onChange={e => setAssetForm({...assetForm, serial_number: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Valuation Price (₹) *</label>
                  <input required type="number" value={assetForm.value} onChange={e => setAssetForm({...assetForm, value: Number(e.target.value)})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow">{submitting ? 'Creating...' : 'Onboard Asset'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ASSIGN ASSET MODAL ────────────────────────────────────────────── */}
      {showAssignModal && selectedAsset && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Assign Asset #{selectedAsset.asset_code}</h3>
              <button onClick={() => setShowAssignModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAssignAsset} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Select Employee *</label>
                <select required value={assignForm.employee_id} onChange={e => setAssignForm({ employee_id: e.target.value })}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                  <option value="">-- Select Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.employee_code})</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAssignModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow">Assign Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── SCHEDULE MAINTENANCE MODAL ────────────────────────────────────── */}
      {showMaintModal && selectedAsset && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Schedule Maintenance for #{selectedAsset.asset_code}</h3>
              <button onClick={() => setShowMaintModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleScheduleMaint} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Maintenance Type *</label>
                <select value={maintForm.maintenance_type} onChange={e => setMaintForm({...maintForm, maintenance_type: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                  <option value="PREVENTIVE">Preventive Maintenance</option>
                  <option value="REPAIR">Hardware Repair</option>
                  <option value="INSPECTION">Inspection Check</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Description *</label>
                <textarea required value={maintForm.description} onChange={e => setMaintForm({...maintForm, description: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" rows={2} />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowMaintModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-600 text-white rounded-xl font-bold shadow">Schedule Maintenance</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
