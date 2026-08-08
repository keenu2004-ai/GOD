import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag, Plus, Search, Filter, RefreshCw, CheckCircle2, Clock,
  DollarSign, FileText, Truck, Shield, X, AlertCircle, ArrowRight
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

interface AssetRequest {
  id: number;
  request_number: string;
  category: string;
  request_type: string;
  reason: string;
  priority: string;
  status: string;
  estimated_cost: number;
  first_name?: string;
  last_name?: string;
  employee_code?: string;
}

interface PurchaseOrder {
  id: number;
  po_number: string;
  vendor_name: string;
  total_amount: number;
  status: string;
  expected_delivery?: string;
  request_number?: string;
  category?: string;
}

const fmtCurr = (n?: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (s?: string) => s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const EnterpriseAssetProcurementPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const isManager = ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'DEPT_HEAD'].includes(userRole);

  const [tab, setTab] = useState<'requests' | 'purchase-orders'>('requests');
  const [requests, setRequests] = useState<AssetRequest[]>([]);
  const [pos, setPos] = useState<PurchaseOrder[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [showReqModal, setShowReqModal] = useState(false);
  const [showPoModal, setShowPoModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState<AssetRequest | null>(null);

  // Forms
  const [reqForm, setReqForm] = useState({
    category: 'Laptop',
    request_type: 'NEW_ASSET',
    reason: 'High-performance laptop required for machine learning model training',
    priority: 'HIGH' as any,
    estimated_cost: 125000,
  });

  const [poForm, setPoForm] = useState({
    vendor_name: 'Dell Enterprise Solutions India',
    total_amount: 125000,
    expected_delivery: '2026-08-20',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [reqRes, poRes] = await Promise.all([
        apiClient.get('/assets/requests').catch(() => ({ data: { data: [] } })),
        apiClient.get('/assets/purchase-orders').catch(() => ({ data: { data: [] } })),
      ]);
      setRequests(reqRes.data?.data || []);
      setPos(poRes.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/assets/requests', {
        ...reqForm,
        estimated_cost: Number(reqForm.estimated_cost),
      });
      setShowReqModal(false);
      await fetchData();
      alert('✅ Equipment request submitted for approval!');
    } catch (e: any) { alert(e.response?.data?.message || 'Request failed'); }
    finally { setSubmitting(false); }
  };

  const handleReviewRequest = async (id: number, status: 'APPROVED' | 'REJECTED' | 'IN_PROCUREMENT') => {
    try {
      await apiClient.patch(`/assets/requests/${id}/review`, { status });
      await fetchData();
      alert(`✅ Request status updated to ${status}`);
    } catch (e: any) { alert('Review failed'); }
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;
    setSubmitting(true);
    try {
      await apiClient.post('/assets/purchase-orders', {
        request_id: selectedReq.id,
        ...poForm,
        total_amount: Number(poForm.total_amount),
      });
      setShowPoModal(false);
      await fetchData();
      alert('✅ Purchase Order generated & vendor notified!');
    } catch (e: any) { alert(e.response?.data?.message || 'PO generation failed'); }
    finally { setSubmitting(false); }
  };

  const handleReceivePO = async (poId: number) => {
    try {
      const res = await apiClient.post(`/assets/purchase-orders/${poId}/receive`);
      await fetchData();
      alert(`🎉 Shipment received! Asset #${res.data?.data?.registered_asset?.asset_code} registered into Master Inventory.`);
    } catch (e: any) { alert('Receive failed'); }
  };

  return (
    <div className="space-y-5 min-h-screen pb-10">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-teal-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-600/30 rounded-xl">
              <ShoppingBag className="w-7 h-7 text-teal-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Enterprise Asset Requests & Procurement Hub</h2>
              <p className="text-xs text-teal-300/70 font-mono mt-0.5">Asset Requisitions • Approvals • Purchase Orders • Vendor Receiving</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowReqModal(true)} className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg">
              <Plus className="w-4 h-4 inline mr-1" /> Request New Equipment
            </button>
          </div>
        </div>
      </div>

      {/* ─── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200 overflow-x-auto">
        <button onClick={() => setTab('requests')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'requests' ? 'bg-white text-teal-700 shadow-sm border border-teal-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <FileText className="w-4 h-4" /> Equipment Requisitions ({requests.length})
        </button>
        <button onClick={() => setTab('purchase-orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'purchase-orders' ? 'bg-white text-teal-700 shadow-sm border border-teal-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Truck className="w-4 h-4" /> Purchase Orders & Vendor Receiving ({pos.length})
        </button>
      </div>

      {/* ─── ASSET REQUESTS TAB ────────────────────────────────────────────── */}
      {tab === 'requests' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
              <tr>
                <th className="p-3">Req Number</th>
                <th className="p-3">Requested By</th>
                <th className="p-3">Category</th>
                <th className="p-3">Business Reason</th>
                <th className="p-3">Est. Cost</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {requests.map(r => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-teal-700">{r.request_number}</td>
                  <td className="p-3 font-sans font-bold text-slate-900">{r.first_name} {r.last_name}</td>
                  <td className="p-3 font-sans text-slate-600 font-semibold">{r.category}</td>
                  <td className="p-3 font-sans text-slate-600 line-clamp-1">{r.reason}</td>
                  <td className="p-3 font-bold text-slate-900">{fmtCurr(r.estimated_cost)}</td>
                  <td className="p-3 font-sans">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      r.priority === 'HIGH' || r.priority === 'URGENT' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-100 text-slate-700'
                    }`}>{r.priority}</span>
                  </td>
                  <td className="p-3 font-sans">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      r.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      r.status === 'COMPLETED' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                      r.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>{r.status}</span>
                  </td>
                  <td className="p-3 font-sans flex items-center gap-1.5">
                    {isManager && r.status === 'SUBMITTED' && (
                      <>
                        <button onClick={() => handleReviewRequest(r.id, 'APPROVED')} className="px-2 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded hover:bg-emerald-700">
                          Approve
                        </button>
                        <button onClick={() => handleReviewRequest(r.id, 'REJECTED')} className="px-2 py-1 bg-red-600 text-white font-bold text-[10px] rounded hover:bg-red-700">
                          Reject
                        </button>
                      </>
                    )}
                    {isManager && r.status === 'APPROVED' && (
                      <button onClick={() => { setSelectedReq(r); setShowPoModal(true); }} className="px-2.5 py-1 bg-teal-600 text-white font-bold text-[10px] rounded hover:bg-teal-700">
                        Generate PO
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── PURCHASE ORDERS TAB ────────────────────────────────────────────── */}
      {tab === 'purchase-orders' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
              <tr>
                <th className="p-3">PO Number</th>
                <th className="p-3">Vendor Name</th>
                <th className="p-3">Total Amount</th>
                <th className="p-3">Expected Delivery</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {pos.map(po => (
                <tr key={po.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-teal-700">{po.po_number}</td>
                  <td className="p-3 font-sans font-bold text-slate-900">{po.vendor_name}</td>
                  <td className="p-3 font-bold text-slate-900">{fmtCurr(po.total_amount)}</td>
                  <td className="p-3 font-sans text-slate-600">{fmtDate(po.expected_delivery)}</td>
                  <td className="p-3 font-sans">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      po.status === 'RECEIVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>{po.status}</span>
                  </td>
                  <td className="p-3 font-sans">
                    {isManager && po.status !== 'RECEIVED' && (
                      <button onClick={() => handleReceivePO(po.id)} className="px-2.5 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded hover:bg-emerald-700">
                        Receive Shipment
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── REQUEST ASSET MODAL ────────────────────────────────────────────── */}
      {showReqModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Request Equipment / Asset</h3>
              <button onClick={() => setShowReqModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateRequest} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Asset Category *</label>
                <select value={reqForm.category} onChange={e => setReqForm({...reqForm, category: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                  <option value="Laptop">Laptop</option>
                  <option value="Desktop">Desktop</option>
                  <option value="Mobile">Mobile Phone</option>
                  <option value="Monitor">Monitor</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Business Justification *</label>
                <textarea required value={reqForm.reason} onChange={e => setReqForm({...reqForm, reason: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" rows={3} />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowReqModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-teal-600 text-white rounded-xl font-bold shadow">{submitting ? 'Submitting...' : 'Submit Request'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── GENERATE PO MODAL ──────────────────────────────────────────────── */}
      {showPoModal && selectedReq && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Generate PO for Req #{selectedReq.request_number}</h3>
              <button onClick={() => setShowPoModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreatePO} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Vendor Name *</label>
                <input required value={poForm.vendor_name} onChange={e => setPoForm({...poForm, vendor_name: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Total Purchase Amount (₹) *</label>
                <input required type="number" value={poForm.total_amount} onChange={e => setPoForm({...poForm, total_amount: Number(e.target.value)})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowPoModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-teal-600 text-white rounded-xl font-bold shadow">{submitting ? 'Generating...' : 'Generate Purchase Order'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
