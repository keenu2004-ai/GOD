import React, { useState, useEffect, useCallback } from 'react';
import {
  LifeBuoy, ShieldCheck, Clock, CheckCircle2, Plus, RefreshCw, X,
  UserCheck, AlertTriangle, MessageSquare, Lock, Layers
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

interface Ticket {
  id: number;
  ticket_code: string;
  category: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  req_first: string;
  req_last: string;
  agent_first?: string;
  agent_last?: string;
  assigned_to?: number;
  sla_due_date?: string;
}

interface TicketComment {
  id: number;
  author_id: number;
  first_name: string;
  last_name: string;
  comment_text: string;
  is_internal_note: boolean;
  created_at: string;
}

export const EnterpriseHelpdeskPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const isAgent = ['ADMIN', 'HR_MANAGER', 'IT_MANAGER', 'SUPER_ADMIN'].includes(userRole);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);

  const [createForm, setCreateForm] = useState({
    category: 'IT Support',
    subject: 'VPN Connection Failure & Security Certificate Alert',
    description: 'Unable to connect to internal staging VPN server. Certificate expired message displayed.',
    priority: 'HIGH',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/helpdesk/all');
      setTickets(res.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/helpdesk/create', createForm);
      setShowCreateModal(false);
      await fetchData();
      alert('✅ Support ticket raised successfully!');
    } catch (e: any) { alert(e.response?.data?.message || 'Ticket creation failed'); }
    finally { setSubmitting(false); }
  };

  const handleAssignTicket = async (ticketId: number) => {
    try {
      await apiClient.patch(`/helpdesk/tickets/${ticketId}/assign`, { agent_id: user?.id || 1 });
      await fetchData();
      alert('✅ Ticket assigned to you!');
    } catch (e) { alert('Assignment failed'); }
  };

  const handleResolveTicket = async (ticketId: number) => {
    const notes = prompt('Enter resolution summary for requester:', 'Issue investigated and resolved by support agent.');
    if (!notes) return;
    try {
      await apiClient.patch(`/helpdesk/tickets/${ticketId}/resolve`, { resolution_notes: notes });
      await fetchData();
      alert('✅ Ticket marked as RESOLVED!');
    } catch (e) { alert('Resolution failed'); }
  };

  const loadComments = async (t: Ticket) => {
    setSelectedTicket(t);
    try {
      const res = await apiClient.get(`/helpdesk/tickets/${t.id}/comments`);
      setComments(res.data?.data || []);
    } catch (e) { console.error(e); }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !newComment.trim()) return;
    try {
      await apiClient.post(`/helpdesk/tickets/${selectedTicket.id}/comments`, {
        message: newComment,
        is_internal_note: isInternalNote
      });
      setNewComment('');
      loadComments(selectedTicket);
    } catch (e) { alert('Comment failed'); }
  };

  return (
    <div className="space-y-5 min-h-screen pb-10">
      {/* ─── Header Workspace ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-indigo-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/30 rounded-xl">
              <LifeBuoy className="w-7 h-7 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Enterprise Helpdesk & Support Operations Center</h2>
              <p className="text-xs text-indigo-300/70 font-mono mt-0.5">SLA Tracking • Automated Escalations • Internal Support Notes • Asset Issue Integration</p>
            </div>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg">
            <Plus className="w-4 h-4 inline mr-1" /> Raise Ticket
          </button>
        </div>

        {/* Real-time Ticket KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-indigo-200 font-mono uppercase">Total Support Requisitions</p>
            <p className="text-xl font-black text-white mt-0.5 font-mono">{tickets.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-amber-300 font-mono uppercase">Open & Active Tickets</p>
            <p className="text-xl font-black text-amber-400 mt-0.5 font-mono">{tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-emerald-300 font-mono uppercase">Resolved Tickets</p>
            <p className="text-xl font-black text-emerald-400 mt-0.5 font-mono">{tickets.filter(t => t.status === 'RESOLVED').length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-indigo-200 font-mono uppercase">SLA Compliance Rate</p>
            <p className="text-sm font-bold text-emerald-300 mt-1">98.4% Compliant</p>
          </div>
        </div>
      </div>

      {/* ─── ALL TICKETS TABLE ─────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-xs text-left text-slate-700">
          <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
            <tr>
              <th className="p-3">Ticket Code</th>
              <th className="p-3">Subject</th>
              <th className="p-3">Requester</th>
              <th className="p-3">Category</th>
              <th className="p-3">Priority</th>
              <th className="p-3">Assigned Agent</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {tickets.map(t => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="p-3 font-bold text-indigo-700">{t.ticket_code}</td>
                <td className="p-3 font-sans font-bold text-slate-900 line-clamp-1">{t.subject}</td>
                <td className="p-3 font-sans text-slate-700">{t.req_first} {t.req_last}</td>
                <td className="p-3 text-slate-600">{t.category}</td>
                <td className="p-3 font-sans">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    t.priority === 'CRITICAL' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    t.priority === 'HIGH' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>{t.priority}</span>
                </td>
                <td className="p-3 font-sans font-bold text-slate-900">{t.agent_first ? `${t.agent_first} ${t.agent_last}` : 'Unassigned'}</td>
                <td className="p-3 font-sans">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    t.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  }`}>{t.status}</span>
                </td>
                <td className="p-3 font-sans flex items-center gap-1">
                  <button onClick={() => loadComments(t)} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded">
                    Conversation
                  </button>
                  {isAgent && !t.assigned_to && (
                    <button onClick={() => handleAssignTicket(t.id)} className="px-2 py-1 bg-indigo-600 text-white font-bold text-[10px] rounded hover:bg-indigo-700">
                      Assign Me
                    </button>
                  )}
                  {isAgent && t.status !== 'RESOLVED' && (
                    <button onClick={() => handleResolveTicket(t.id)} className="px-2 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded hover:bg-emerald-700">
                      Resolve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ─── RAISE TICKET MODAL ───────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Raise Support Ticket</h3>
              <button onClick={() => setShowCreateModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Category *</label>
                <select required value={createForm.category} onChange={e => setCreateForm({...createForm, category: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                  <option value="IT Support">IT Support</option>
                  <option value="HR Support">HR Support</option>
                  <option value="Finance & Payroll">Finance & Payroll</option>
                  <option value="Asset Maintenance">Asset Maintenance</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Priority *</label>
                <select required value={createForm.priority} onChange={e => setCreateForm({...createForm, priority: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                  <option value="LOW">LOW (48 Hours SLA)</option>
                  <option value="MEDIUM">MEDIUM (24 Hours SLA)</option>
                  <option value="HIGH">HIGH (8 Hours SLA)</option>
                  <option value="CRITICAL">CRITICAL (2 Hours SLA)</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Subject *</label>
                <input required value={createForm.subject} onChange={e => setCreateForm({...createForm, subject: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold" />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Description *</label>
                <textarea required value={createForm.description} onChange={e => setCreateForm({...createForm, description: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" rows={3} />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow">{submitting ? 'Submitting...' : 'Submit Ticket'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── CONVERSATION & COMMENTS MODAL ───────────────────────────────── */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200">{selectedTicket.ticket_code}</span>
                <h3 className="font-bold text-slate-900 text-sm mt-1">{selectedTicket.subject}</h3>
              </div>
              <button onClick={() => setSelectedTicket(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 p-2 font-sans text-xs">
              {comments.map(c => (
                <div key={c.id} className={`p-3 rounded-xl border ${c.is_internal_note ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold">{c.first_name} {c.last_name} {c.is_internal_note && '(INTERNAL SUPPORT NOTE)'}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{new Date(c.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p>{c.comment_text}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddComment} className="pt-3 border-t space-y-2">
              {isAgent && (
                <label className="flex items-center gap-2 text-xs font-bold text-amber-800 cursor-pointer">
                  <input type="checkbox" checked={isInternalNote} onChange={e => setIsInternalNote(e.target.checked)} className="rounded" />
                  Internal Support Note (Hidden from requester)
                </label>
              )}
              <div className="flex gap-2">
                <input required value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Type comment..."
                  className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-xs" />
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow">Send</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
