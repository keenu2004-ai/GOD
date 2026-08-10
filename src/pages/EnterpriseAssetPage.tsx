import React, { useState, useEffect, useCallback } from 'react';
import {
  Laptop, ShieldCheck, Wrench, Users, Plus, RefreshCw, X,
  CheckCircle2, ArrowRight, Layers, FileText, AlertTriangle, HelpCircle,
  ShoppingBag, Check, Ban, PlusCircle, List
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

interface AssetRequest {
  id: number;
  request_number: string;
  employee_id: number;
  category: string;
  request_type: string;
  reason: string;
  priority: string;
  required_date?: string;
  estimated_cost: number;
  status: string;
  first_name?: string;
  last_name?: string;
  department_name?: string;
  created_at: string;
}

interface PurchaseOrder {
  id: number;
  po_number: string;
  request_id: number;
  vendor_name: string;
  total_amount: number;
  expected_delivery: string;
  status: string;
  request_number?: string;
  category?: string;
  created_at: string;
}

interface VendorQuotation {
  id: number;
  request_id: number;
  vendor_name: string;
  quotation_amount: number;
  delivery_days: number;
  is_selected: boolean;
}

const fmtCurr = (n?: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

export const EnterpriseAssetPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const isAssetMgr = ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'].includes(userRole);

  const [tab, setTab] = useState<'inventory' | 'my-assets' | 'requests' | 'purchase-orders'>('inventory');

  const [assets, setAssets] = useState<Asset[]>([]);
  const [myAssets, setMyAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [requests, setRequests] = useState<AssetRequest[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);

  // Selected for quotation / PO
  const [selectedRequest, setSelectedRequest] = useState<AssetRequest | null>(null);
  const [quotations, setQuotations] = useState<VendorQuotation[]>([]);

  // Forms
  const [addForm, setAddForm] = useState({
    asset_name: '',
    category: 'Laptop',
    serial_number: '',
    value: 50000,
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

  const [requestForm, setRequestForm] = useState({
    category: 'Laptop',
    request_type: 'NEW_ASSET',
    reason: '',
    priority: 'NORMAL',
    required_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    estimated_cost: 60000,
  });

  const [poForm, setPoForm] = useState({
    vendor_name: '',
    total_amount: 0,
    expected_delivery: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
  });

  const [quotationForm, setQuotationForm] = useState({
    vendor_name: '',
    quotation_amount: 0,
    delivery_days: 3,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [astRes, myRes, empRes, reqRes, poRes] = await Promise.all([
        apiClient.get('/assets/all').catch(() => ({ data: { data: [] } })),
        apiClient.get('/assets/my-assets').catch(() => ({ data: { data: [] } })),
        apiClient.get('/employees').catch(() => ({ data: { data: [] } })),
        apiClient.get('/assets/requests').catch(() => ({ data: { data: [] } })),
        apiClient.get('/assets/purchase-orders').catch(() => ({ data: { data: [] } })),
      ]);
      setAssets(astRes.data?.data || []);
      setMyAssets(myRes.data?.data || []);
      setEmployees(empRes.data?.data || []);
      setRequests(reqRes.data?.data || []);
      setPurchaseOrders(poRes.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/assets/create', addForm);
      setShowAddModal(false);
      await fetchData();
      alert('✅ Asset added to master inventory!');
    } catch (e: any) {
      alert(e.response?.data?.message || 'Asset creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/assets/assign', assignForm);
      setShowAssignModal(false);
      await fetchData();
      alert('✅ Asset assigned to employee!');
    } catch (e: any) {
      alert('Assignment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransferAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/assets/transfer', transferForm);
      setShowTransferModal(false);
      await fetchData();
      alert('✅ Asset transferred successfully!');
    } catch (e: any) {
      alert('Transfer failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/assets/requests', requestForm);
      setShowRequestModal(false);
      await fetchData();
      alert('✅ Asset request submitted successfully!');
    } catch (e: any) {
      alert('Request submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewRequest = async (id: number, status: 'APPROVED' | 'REJECTED' | 'IN_PROCUREMENT') => {
    if (!window.confirm(`Are you sure you want to mark this request as ${status}?`)) return;
    try {
      await apiClient.patch(`/assets/requests/${id}/review`, { status });
      await fetchData();
      alert(`✅ Request marked as ${status}`);
    } catch (e: any) {
      alert('Review failed');
    }
  };

  const handleOpenPOModal = (req: AssetRequest) => {
    setSelectedRequest(req);
    setPoForm({
      vendor_name: '',
      total_amount: req.estimated_cost,
      expected_delivery: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    });
    setShowPOModal(true);
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setSubmitting(true);
    try {
      await apiClient.post('/assets/purchase-orders', {
        request_id: selectedRequest.id,
        ...poForm
      });
      setShowPOModal(false);
      await fetchData();
      alert('✅ Purchase order generated successfully!');
    } catch (e: any) {
      alert('Purchase order creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceivePO = async (id: number) => {
    if (!window.confirm('Mark this shipment/PO as Received and register asset in inventory?')) return;
    try {
      await apiClient.post(`/assets/purchase-orders/${id}/receive`);
      await fetchData();
      alert('✅ PO received and asset automatically registered in inventory!');
    } catch (e: any) {
      alert('Failed to receive PO');
    }
  };

  const handleOpenQuotations = async (req: AssetRequest) => {
    setSelectedRequest(req);
    try {
      const res = await apiClient.get(`/assets/requests/${req.id}/quotations`);
      setQuotations(res.data?.data || []);
      setQuotationForm({ vendor_name: '', quotation_amount: req.estimated_cost, delivery_days: 3 });
      setShowQuotationModal(true);
    } catch (e) {
      alert('Failed to load quotations');
    }
  };

  const handleAddQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setSubmitting(true);
    try {
      await apiClient.post(`/assets/requests/${selectedRequest.id}/quotations`, quotationForm);
      const res = await apiClient.get(`/assets/requests/${selectedRequest.id}/quotations`);
      setQuotations(res.data?.data || []);
      setQuotationForm({ vendor_name: '', quotation_amount: selectedRequest.estimated_cost, delivery_days: 3 });
      alert('✅ Quotation added successfully!');
    } catch (e: any) {
      alert('Failed to add quotation');
    } finally {
      setSubmitting(false);
    }
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
              <h2 className="text-xl font-black text-white tracking-tight">Enterprise Asset Management</h2>
              <p className="text-xs text-sky-300/70 font-mono mt-0.5">Asset Requisitions • Procurement Flows • Inventory Custody & Track</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowRequestModal(true)} className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg">
              <PlusCircle className="w-4 h-4 inline mr-1" /> Request Asset
            </button>
            {isAssetMgr && (
              <>
                <button onClick={() => setShowTransferModal(true)} className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl border border-white/20">
                  <ArrowRight className="w-3.5 h-3.5 inline mr-1" /> Transfer
                </button>
                <button onClick={() => setShowAssignModal(true)} className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl border border-white/20">
                  <Users className="w-3.5 h-3.5 inline mr-1" /> Assign Custodian
                </button>
                <button onClick={() => setShowAddModal(true)} className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl border border-white/20">
                  <Plus className="w-4 h-4 inline mr-1" /> Register Inventory
                </button>
              </>
            )}
          </div>
        </div>

        {/* Real-time Asset KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-sky-200 font-mono uppercase">Master Stock</p>
            <p className="text-xl font-black text-white mt-0.5 font-mono">{assets.length} Items</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-emerald-300 font-mono uppercase">Allocated Custody</p>
            <p className="text-xl font-black text-emerald-400 mt-0.5 font-mono">{assets.filter(a => a.status === 'ALLOCATED').length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-sky-200 font-mono uppercase">Available Stock</p>
            <p className="text-xl font-black text-sky-300 mt-0.5 font-mono">{assets.filter(a => a.status === 'AVAILABLE').length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-sky-200 font-mono uppercase">Portfolio Valuation</p>
            <p className="text-lg font-black text-white mt-0.5 font-mono">{fmtCurr(totalValue)}</p>
          </div>
        </div>
      </div>

      {/* ─── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200 overflow-x-auto">
        <button onClick={() => setTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
            tab === 'inventory' ? 'bg-white text-sky-700 shadow-sm border border-sky-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Laptop className="w-4 h-4" /> Master Inventory ({assets.length})
        </button>
        <button onClick={() => setTab('my-assets')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
            tab === 'my-assets' ? 'bg-white text-sky-700 shadow-sm border border-sky-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Users className="w-4 h-4" /> My Custody ({myAssets.length})
        </button>
        <button onClick={() => setTab('requests')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
            tab === 'requests' ? 'bg-white text-sky-700 shadow-sm border border-sky-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <ShoppingBag className="w-4 h-4" /> Requisitions & Requests ({requests.length})
        </button>
        {isAssetMgr && (
          <button onClick={() => setTab('purchase-orders')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              tab === 'purchase-orders' ? 'bg-white text-sky-700 shadow-sm border border-sky-100' : 'text-slate-500 hover:text-slate-800'
            }`}>
            <List className="w-4 h-4" /> Purchase Orders ({purchaseOrders.length})
          </button>
        )}
      </div>

      {/* ─── MASTER INVENTORY TAB ─────────────────────────────────────────── */}
      {tab === 'inventory' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700 min-w-[700px]">
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
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">ACTIVE_CUSTODY</span>
              </div>
              <div className="space-y-1 text-xs text-slate-600 font-mono">
                <p>• Category: {ma.category}</p>
                <p>• Serial: {ma.serial_number}</p>
                <p>• Valuation: {fmtCurr(ma.value)}</p>
              </div>
            </div>
          ))}
          {myAssets.length === 0 && (
            <div className="col-span-full bg-slate-50 border rounded-2xl p-10 text-center text-slate-400 font-mono text-xs">
              No assets currently assigned to your profile.
            </div>
          )}
        </div>
      )}

      {/* ─── REQUISITIONS TAB ─────────────────────────────────────────────── */}
      {tab === 'requests' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700 min-w-[900px]">
            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
              <tr>
                <th className="p-3">Req Code</th>
                <th className="p-3">Requester</th>
                <th className="p-3">Category</th>
                <th className="p-3">Est. Cost</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {requests.map(r => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-sky-700">{r.request_number}</td>
                  <td className="p-3 font-sans font-bold text-slate-900">{r.first_name ? `${r.first_name} ${r.last_name}` : `Emp #${r.employee_id}`}</td>
                  <td className="p-3 text-slate-600">{r.category}</td>
                  <td className="p-3 text-slate-900 font-bold">{fmtCurr(r.estimated_cost)}</td>
                  <td className="p-3 font-sans text-slate-500 max-w-[200px] truncate">{r.reason}</td>
                  <td className="p-3 font-sans">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      r.priority === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' :
                      r.priority === 'HIGH' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-700'
                    }`}>{r.priority}</span>
                  </td>
                  <td className="p-3 font-sans">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      r.status === 'SUBMITTED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      r.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      r.status === 'IN_PROCUREMENT' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                      r.status === 'COMPLETED' ? 'bg-slate-100 text-slate-800' : 'bg-red-50 text-red-700'
                    }`}>{r.status}</span>
                  </td>
                  <td className="p-3 font-sans flex items-center gap-1.5">
                    {r.status === 'SUBMITTED' && isAssetMgr && (
                      <>
                        <button onClick={() => handleReviewRequest(r.id, 'APPROVED')} className="text-emerald-600 hover:text-emerald-700 p-1 border rounded bg-emerald-50"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleReviewRequest(r.id, 'REJECTED')} className="text-red-600 hover:text-red-700 p-1 border rounded bg-red-50"><Ban className="w-3.5 h-3.5" /></button>
                      </>
                    )}
                    {r.status === 'APPROVED' && isAssetMgr && (
                      <button onClick={() => handleOpenPOModal(r)} className="bg-sky-600 text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-sky-700">Procure PO</button>
                    )}
                    <button onClick={() => handleOpenQuotations(r)} className="text-sky-700 hover:text-sky-800 text-[10px] font-bold border rounded px-2 py-1">Quotes</button>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400 font-mono text-xs">No active asset requests.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── PURCHASE ORDERS TAB ─────────────────────────────────────────── */}
      {tab === 'purchase-orders' && isAssetMgr && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700 min-w-[700px]">
            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
              <tr>
                <th className="p-3">PO Code</th>
                <th className="p-3">Requisition</th>
                <th className="p-3">Vendor</th>
                <th className="p-3">Total Cost</th>
                <th className="p-3">Expected Delivery</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {purchaseOrders.map(po => (
                <tr key={po.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">{po.po_number}</td>
                  <td className="p-3 font-bold text-sky-700">{po.request_number || 'Direct'}</td>
                  <td className="p-3 font-sans text-slate-700">{po.vendor_name}</td>
                  <td className="p-3 font-bold text-slate-950">{fmtCurr(po.total_amount)}</td>
                  <td className="p-3 text-slate-600">{po.expected_delivery ? new Date(po.expected_delivery).toLocaleDateString() : 'N/A'}</td>
                  <td className="p-3 font-sans">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      po.status === 'ORDERED' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-700'
                    }`}>{po.status}</span>
                  </td>
                  <td className="p-3 font-sans">
                    {po.status === 'ORDERED' && (
                      <button onClick={() => handleReceivePO(po.id)} className="bg-emerald-600 text-white px-2.5 py-1 rounded text-[10px] font-bold hover:bg-emerald-700">Receive Shipment</button>
                    )}
                  </td>
                </tr>
              ))}
              {purchaseOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400 font-mono text-xs">No purchase orders generated.</td>
                </tr>
              )}
            </tbody>
          </table>
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
                <input required placeholder="MacBook Pro 14 M3" value={addForm.asset_name} onChange={e => setAddForm({...addForm, asset_name: e.target.value})}
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
                    <option value="Furniture">Furniture</option>
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
                <input required placeholder="C02G..." value={addForm.serial_number} onChange={e => setAddForm({...addForm, serial_number: e.target.value})}
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
              <h3 className="font-bold text-slate-900">Assign Custodian</h3>
              <button onClick={() => setShowAssignModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAssignAsset} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Select Available Asset *</label>
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

      {/* ─── TRANSFER ASSET MODAL ─────────────────────────────────────────── */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Transfer Custodian</h3>
              <button onClick={() => setShowTransferModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleTransferAsset} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Select Allocated Asset *</label>
                <select required value={transferForm.asset_id} onChange={e => {
                  const asset = assets.find(a => a.id === Number(e.target.value));
                  setTransferForm({
                    ...transferForm,
                    asset_id: e.target.value,
                    from_employee_id: asset?.assigned_to_employee_id ? String(asset.assigned_to_employee_id) : ''
                  });
                }}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                  <option value="">-- Choose Assigned Asset --</option>
                  {assets.filter(a => a.status === 'ALLOCATED').map(a => <option key={a.id} value={a.id}>{a.asset_name} (Custodian: {a.first_name} {a.last_name})</option>)}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">New Custodian Employee *</label>
                <select required value={transferForm.to_employee_id} onChange={e => setTransferForm({...transferForm, to_employee_id: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                  <option value="">-- Select New Custodian --</option>
                  {employees.filter(emp => String(emp.id) !== transferForm.from_employee_id).map(emp => <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>)}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Transfer Reason *</label>
                <textarea required value={transferForm.reason} onChange={e => setTransferForm({...transferForm, reason: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-sans" rows={3} />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowTransferModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-sky-600 text-white rounded-xl font-bold shadow">{submitting ? 'Transferring...' : 'Complete Transfer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── REQUEST ASSET MODAL ───────────────────────────────────────────── */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Submit Asset Requisition</h3>
              <button onClick={() => setShowRequestModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateRequest} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Category *</label>
                  <select required value={requestForm.category} onChange={e => setRequestForm({...requestForm, category: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                    <option value="Laptop">Laptop</option>
                    <option value="Desktop">Desktop</option>
                    <option value="Monitor">Monitor</option>
                    <option value="Mobile Phone">Mobile Phone</option>
                    <option value="Furniture">Furniture</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Priority *</label>
                  <select value={requestForm.priority} onChange={e => setRequestForm({...requestForm, priority: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Estimated Cost (₹) *</label>
                  <input required type="number" value={requestForm.estimated_cost} onChange={e => setRequestForm({...requestForm, estimated_cost: Number(e.target.value)})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Required By Date *</label>
                  <input required type="date" value={requestForm.required_date} onChange={e => setRequestForm({...requestForm, required_date: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Reason / Justification *</label>
                <textarea required placeholder="Explain why you require this asset..." value={requestForm.reason} onChange={e => setRequestForm({...requestForm, reason: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-sans" rows={3} />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowRequestModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-sky-600 text-white rounded-xl font-bold shadow">{submitting ? 'Submitting...' : 'Submit Request'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── CREATE PO MODAL ──────────────────────────────────────────────── */}
      {showPOModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Generate Purchase Order (Req: {selectedRequest.request_number})</h3>
              <button onClick={() => setShowPOModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreatePO} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Vendor Name *</label>
                <input required placeholder="Dell India Pvt Ltd" value={poForm.vendor_name} onChange={e => setPoForm({...poForm, vendor_name: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Total Value (₹) *</label>
                  <input required type="number" value={poForm.total_amount} onChange={e => setPoForm({...poForm, total_amount: Number(e.target.value)})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Expected Delivery *</label>
                  <input required type="date" value={poForm.expected_delivery} onChange={e => setPoForm({...poForm, expected_delivery: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowPOModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow">{submitting ? 'Generating...' : 'Approve & Place Order'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── VENDOR QUOTATIONS MODAL ───────────────────────────────────────── */}
      {showQuotationModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Vendor Quotations (Req: {selectedRequest.request_number})</h3>
              <button onClick={() => setShowQuotationModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            
            {/* Quotations List */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-700 text-[10px] uppercase">Received Quotations</h4>
              {quotations.map(q => (
                <div key={q.id} className="border rounded-xl p-3 flex justify-between items-center text-xs font-mono bg-slate-50">
                  <div>
                    <p className="font-bold text-slate-800">{q.vendor_name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Delivery: {q.delivery_days} days</p>
                  </div>
                  <p className="font-bold text-sky-700 text-sm">{fmtCurr(q.quotation_amount)}</p>
                </div>
              ))}
              {quotations.length === 0 && (
                <p className="text-slate-400 font-mono text-[10px] text-center p-3">No quotations submitted by vendors yet.</p>
              )}
            </div>

            {/* Add Quotation Form */}
            {isAssetMgr && selectedRequest.status === 'SUBMITTED' && (
              <form onSubmit={handleAddQuotation} className="border-t pt-3 mt-3 space-y-3 text-xs">
                <h4 className="font-bold text-slate-800">Add New Vendor Quotation</h4>
                <div>
                  <label className="font-semibold text-slate-700">Vendor Name *</label>
                  <input required placeholder="Lenovo Direct Partner" value={quotationForm.vendor_name} onChange={e => setQuotationForm({...quotationForm, vendor_name: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700">Quotation Price (₹) *</label>
                    <input required type="number" value={quotationForm.quotation_amount} onChange={e => setQuotationForm({...quotationForm, quotation_amount: Number(e.target.value)})}
                      className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Delivery Timeline (Days) *</label>
                    <input required type="number" value={quotationForm.delivery_days} onChange={e => setQuotationForm({...quotationForm, delivery_days: Number(e.target.value)})}
                      className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-sky-600 text-white rounded-xl font-bold shadow">{submitting ? 'Adding...' : 'Add Quotation'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
