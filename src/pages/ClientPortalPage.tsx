import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, FolderGit2, CheckCircle2, XCircle, AlertCircle, FileText,
  Plus, Shield, UserCheck, RefreshCw, X, MessageSquare, Clock, ArrowRight
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

interface ClientProject {
  id: number;
  name: string;
  code: string;
  description?: string;
  progress_percentage: number;
  access_level: string;
  client_company_name: string;
  manager_first_name?: string;
  manager_last_name?: string;
}

interface Deliverable {
  id: number;
  project_id: number;
  project_name: string;
  title: string;
  description?: string;
  due_date?: string;
  version: string;
  status: string;
  approval_status: string;
  client_comments?: string;
}

interface ChangeRequest {
  id: number;
  project_name: string;
  title: string;
  description: string;
  reason?: string;
  priority: string;
  status: string;
}

const fmtDate = (s?: string) => s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const ClientPortalPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const isManager = ['ADMIN', 'PROJECT_MANAGER', 'DEPT_HEAD', 'SUPER_ADMIN'].includes(userRole);

  const [tab, setTab] = useState<'projects' | 'deliverables' | 'change-requests'>('projects');
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [allProjects, setAllProjects] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showDeliverableModal, setShowDeliverableModal] = useState(false);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const [reviewItem, setReviewItem] = useState<Deliverable | null>(null);
  const [reviewForm, setReviewForm] = useState({ status: 'APPROVED' as any, client_comments: 'Deliverable meets project scope and requirement criteria' });

  // Forms
  const [orgForm, setOrgForm] = useState({
    name: 'Acme Global Client Portal',
    company_name: 'Acme Corporation',
    contact_person: 'Sarah Jenkins',
    email: 'sarah.j@acme.com',
    phone: '+91 98765 43210',
    industry: 'Enterprise Software',
  });

  const [deliverableForm, setDeliverableForm] = useState({
    project_id: '',
    title: 'UI/UX Design Guidelines & Component Specs',
    description: 'Complete Figma design system and front-end spec sheet',
    due_date: '2026-08-25',
    version: 'v1.0',
  });

  const [changeForm, setChangeForm] = useState({
    project_id: '',
    title: 'Add Multi-Currency Support to Checkout',
    description: 'Support international payments in USD, EUR, and GBP',
    reason: 'Client expanding sales to European markets',
    priority: 'HIGH' as any,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [prjRes, delRes, crRes, allPrjRes] = await Promise.all([
        apiClient.get('/client/projects').catch(() => ({ data: { data: [] } })),
        apiClient.get('/client/deliverables').catch(() => ({ data: { data: [] } })),
        apiClient.get('/client/change-requests').catch(() => ({ data: { data: [] } })),
        apiClient.get('/projects').catch(() => ({ data: { data: [] } })),
      ]);
      setProjects(prjRes.data?.data || []);
      setDeliverables(delRes.data?.data || []);
      setChangeRequests(crRes.data?.data || []);
      setAllProjects(allPrjRes.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/client/organizations', orgForm);
      setShowOrgModal(false);
      await fetchData();
      alert('✅ Client organization onboarded!');
    } catch (e: any) { alert(e.response?.data?.message || 'Onboarding failed'); }
    finally { setSubmitting(false); }
  };

  const handleCreateDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/client/deliverables', {
        ...deliverableForm,
        project_id: parseInt(deliverableForm.project_id),
      });
      setShowDeliverableModal(false);
      await fetchData();
      alert('✅ Deliverable submitted for client review!');
    } catch (e: any) { alert(e.response?.data?.message || 'Submission failed'); }
    finally { setSubmitting(false); }
  };

  const handleCreateChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/client/change-requests', {
        ...changeForm,
        project_id: parseInt(changeForm.project_id),
      });
      setShowChangeModal(false);
      await fetchData();
      alert('✅ Change request submitted!');
    } catch (e: any) { alert(e.response?.data?.message || 'Submission failed'); }
    finally { setSubmitting(false); }
  };

  const handleReviewDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewItem) return;
    try {
      await apiClient.patch(`/client/deliverables/${reviewItem.id}/review`, reviewForm);
      setShowReviewModal(false);
      await fetchData();
      alert(`✅ Deliverable review saved: ${reviewForm.status}`);
    } catch (e: any) { alert(e.response?.data?.message || 'Review failed'); }
  };

  return (
    <div className="space-y-5 min-h-screen pb-10">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-sky-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-600/30 rounded-xl">
              <Building2 className="w-7 h-7 text-sky-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Enterprise Client Portal & Collaboration Hub</h2>
              <p className="text-xs text-sky-300/70 font-mono mt-0.5">External Client Workspace • Deliverable Approvals • Change Requests</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isManager && (
              <button onClick={() => setShowOrgModal(true)} className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-white/20">
                <Plus className="w-3.5 h-3.5 inline mr-1" /> Onboard Client Org
              </button>
            )}
            <button onClick={() => setShowDeliverableModal(true)} className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-white/20">
              <Plus className="w-3.5 h-3.5 inline mr-1" /> Submit Deliverable
            </button>
            <button onClick={() => setShowChangeModal(true)} className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg">
              <Plus className="w-4 h-4 inline mr-1" /> Raise Change Request
            </button>
          </div>
        </div>
      </div>

      {/* ─── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200 overflow-x-auto">
        <button onClick={() => setTab('projects')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'projects' ? 'bg-white text-sky-700 shadow-sm border border-sky-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <FolderGit2 className="w-4 h-4" /> Shared Client Projects ({projects.length})
        </button>
        <button onClick={() => setTab('deliverables')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'deliverables' ? 'bg-white text-sky-700 shadow-sm border border-sky-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <CheckCircle2 className="w-4 h-4" /> Deliverables Approval Hub ({deliverables.filter(d => d.approval_status === 'UNDER_REVIEW').length})
        </button>
        <button onClick={() => setTab('change-requests')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'change-requests' ? 'bg-white text-sky-700 shadow-sm border border-sky-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <FileText className="w-4 h-4" /> Change Requests ({changeRequests.length})
        </button>
      </div>

      {/* ─── SHARED PROJECTS TAB ─────────────────────────────────────────── */}
      {tab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(p => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono text-sky-600 font-bold bg-sky-50 px-2 py-0.5 rounded border border-sky-200">{p.code}</span>
                  <h3 className="font-bold text-slate-900 text-sm mt-1">{p.name}</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">{p.access_level} ACCESS</span>
              </div>
              <p className="text-xs text-slate-600 line-clamp-2">{p.description || 'Enterprise client project workspace'}</p>
              <div className="space-y-1.5 pt-2 border-t text-xs">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Project Progress</span>
                  <span className="font-mono text-sky-700 font-bold">{p.progress_percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div style={{ width: `${p.progress_percentage}%` }} className="h-full bg-sky-600" />
                </div>
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="col-span-2 bg-white border rounded-2xl p-10 text-center text-xs text-slate-400 font-mono">
              No shared projects configured for your client organization yet.
            </div>
          )}
        </div>
      )}

      {/* ─── DELIVERABLES APPROVAL HUB TAB ────────────────────────────────── */}
      {tab === 'deliverables' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
              <tr>
                <th className="p-3">Project</th>
                <th className="p-3">Deliverable Title</th>
                <th className="p-3">Version</th>
                <th className="p-3">Target Date</th>
                <th className="p-3">Approval Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {deliverables.map(d => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="p-3 font-sans font-bold text-slate-900">{d.project_name}</td>
                  <td className="p-3 font-sans text-slate-700 font-semibold">{d.title}</td>
                  <td className="p-3 font-bold text-sky-700">{d.version}</td>
                  <td className="p-3 font-sans text-slate-600">{fmtDate(d.due_date)}</td>
                  <td className="p-3 font-sans">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      d.approval_status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      d.approval_status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>{d.approval_status}</span>
                  </td>
                  <td className="p-3 font-sans">
                    {d.approval_status === 'UNDER_REVIEW' && (
                      <button onClick={() => { setReviewItem(d); setShowReviewModal(true); }} className="px-2.5 py-1 bg-sky-600 text-white font-bold text-[10px] rounded hover:bg-sky-700">
                        Review Deliverable
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── CHANGE REQUESTS TAB ─────────────────────────────────────────── */}
      {tab === 'change-requests' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
              <tr>
                <th className="p-3">Project</th>
                <th className="p-3">Change Title</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Business Reason</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {changeRequests.map(cr => (
                <tr key={cr.id} className="hover:bg-slate-50">
                  <td className="p-3 font-sans font-bold text-slate-900">{cr.project_name}</td>
                  <td className="p-3 font-sans text-slate-700 font-semibold">{cr.title}</td>
                  <td className="p-3 font-sans">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      cr.priority === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>{cr.priority}</span>
                  </td>
                  <td className="p-3 font-sans text-slate-600">{cr.reason || 'N/A'}</td>
                  <td className="p-3 font-sans">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">{cr.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── ONBOARD CLIENT ORG MODAL ────────────────────────────────────── */}
      {showOrgModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Onboard Client Organization</h3>
              <button onClick={() => setShowOrgModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateOrg} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Client Org Name *</label>
                <input required value={orgForm.name} onChange={e => setOrgForm({...orgForm, name: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Company Name *</label>
                  <input required value={orgForm.company_name} onChange={e => setOrgForm({...orgForm, company_name: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Email *</label>
                  <input required type="email" value={orgForm.email} onChange={e => setOrgForm({...orgForm, email: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowOrgModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-sky-600 text-white rounded-xl font-bold shadow">{submitting ? 'Creating...' : 'Onboard Client'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── SUBMIT DELIVERABLE MODAL ────────────────────────────────────── */}
      {showDeliverableModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Submit Project Deliverable</h3>
              <button onClick={() => setShowDeliverableModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateDeliverable} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Select Project *</label>
                <select required value={deliverableForm.project_id} onChange={e => setDeliverableForm({...deliverableForm, project_id: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                  <option value="">-- Choose Project --</option>
                  {allProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Deliverable Title *</label>
                <input required value={deliverableForm.title} onChange={e => setDeliverableForm({...deliverableForm, title: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowDeliverableModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-sky-600 text-white rounded-xl font-bold shadow">{submitting ? 'Submitting...' : 'Submit Deliverable'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── RAISE CHANGE REQUEST MODAL ─────────────────────────────────── */}
      {showChangeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Raise Change Request</h3>
              <button onClick={() => setShowChangeModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateChangeRequest} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Select Project *</label>
                <select required value={changeForm.project_id} onChange={e => setChangeForm({...changeForm, project_id: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                  <option value="">-- Choose Project --</option>
                  {allProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Change Title *</label>
                <input required value={changeForm.title} onChange={e => setChangeForm({...changeForm, title: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Detailed Description *</label>
                <textarea required value={changeForm.description} onChange={e => setChangeForm({...changeForm, description: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" rows={2} />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowChangeModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-sky-600 text-white rounded-xl font-bold shadow">{submitting ? 'Submitting...' : 'Raise Request'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELIVERABLE REVIEW MODAL ───────────────────────────────────── */}
      {showReviewModal && reviewItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Review & Sign-Off Deliverable</h3>
              <button onClick={() => setShowReviewModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleReviewDeliverable} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Approval Decision *</label>
                <select value={reviewForm.status} onChange={e => setReviewForm({...reviewForm, status: e.target.value as any})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                  <option value="APPROVED">Approve & Sign-off Deliverable</option>
                  <option value="CHANGES_REQUESTED">Request Changes / Revisions</option>
                  <option value="REJECTED">Reject Deliverable</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Client Review Comments</label>
                <textarea value={reviewForm.client_comments} onChange={e => setReviewForm({...reviewForm, client_comments: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" rows={3} />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowReviewModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-sky-600 text-white rounded-xl font-bold shadow">Submit Sign-off Decision</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
