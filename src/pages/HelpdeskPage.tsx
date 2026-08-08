import React, { useState, useEffect, useCallback } from 'react';
import {
  LifeBuoy, Plus, Filter, MessageSquare, ShieldAlert, CheckCircle2, Clock,
  X, UserCheck, AlertTriangle, RefreshCw, Send, Lock
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
  sla_due_date?: string;
  resolution_notes?: string;
  req_first_name?: string;
  req_last_name?: string;
  agent_first_name?: string;
  agent_last_name?: string;
  asset_name?: string;
  asset_code?: string;
  created_at: string;
}

interface Comment {
  id: number;
  comment_text: string;
  is_internal_note: boolean;
  first_name: string;
  last_name: string;
  created_at: string;
}

interface Asset {
  id: number;
  asset_name: string;
  asset_code: string;
}

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
}

export const HelpdeskPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const isSupport = ['ADMIN', 'HR_MANAGER', 'IT_MANAGER', 'SUPER_ADMIN', 'SUPPORT_AGENT'].includes(userRole);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [agents, setAgents] = useState<Employee[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // Selected Ticket Thread Drawer
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    category: 'IT_SUPPORT',
    priority: 'HIGH' as any,
    subject: '',
    description: '',
    asset_id: '',
  });

  const [reopenReason, setReopenReason] = useState('');
  const [showReopenModal, setShowReopenModal] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const [tktRes, astRes, empRes] = await Promise.all([
        apiClient.get('/helpdesk/tickets').catch(() => ({ data: { data: [] } })),
        apiClient.get('/assets').catch(() => ({ data: { data: [] } })),
        apiClient.get('/employees').catch(() => ({ data: { data: [] } })),
      ]);
      setTickets(tktRes.data?.data || []);
      setAssets(astRes.data?.data || []);
      setAgents(empRes.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const fetchComments = async (ticketId: number) => {
    try {
      const res = await apiClient.get(`/helpdesk/tickets/${ticketId}/comments`);
      setComments(res.data?.data || []);
    } catch (e) { console.error(e); }
  };

  const handleOpenTicketDetails = (tkt: Ticket) => {
    setSelectedTicket(tkt);
    fetchComments(tkt.id);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/helpdesk/tickets', {
        ...formData,
        asset_id: formData.asset_id ? parseInt(formData.asset_id) : undefined,
      });
      alert('✅ Support ticket submitted with public ticket code!');
      setShowCreateModal(false);
      setFormData({ category: 'IT_SUPPORT', priority: 'HIGH', subject: '', description: '', asset_id: '' });
      await fetchTickets();
    } catch (err: any) { alert(err.response?.data?.message || 'Failed to submit ticket'); }
    finally { setSubmitting(false); }
  };

  const handleAssignAgent = async (ticketId: number, agentId: string) => {
    try {
      await apiClient.patch(`/helpdesk/tickets/${ticketId}/assign`, { agent_id: agentId });
      await fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: 'ASSIGNED' });
      }
      alert('✅ Ticket assigned to support agent!');
    } catch (e) { alert('Assignment failed'); }
  };

  const handleUpdateStatus = async (ticketId: number, status: string, notes?: string) => {
    try {
      await apiClient.patch(`/helpdesk/tickets/${ticketId}/status`, { status, resolution_notes: notes });
      await fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status });
      }
      alert(`✅ Ticket status updated to ${status}`);
    } catch (e) { alert('Status update failed'); }
  };

  const handleReopenTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    try {
      await apiClient.post(`/helpdesk/tickets/${selectedTicket.id}/reopen`, { reason: reopenReason });
      setShowReopenModal(false);
      setReopenReason('');
      await fetchTickets();
      fetchComments(selectedTicket.id);
      alert('✅ Ticket reopened for further investigation');
    } catch (e) { alert('Reopen failed'); }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !newCommentText.trim()) return;
    try {
      await apiClient.post(`/helpdesk/tickets/${selectedTicket.id}/comments`, {
        comment_text: newCommentText,
        is_internal_note: isInternalNote,
      });
      setNewCommentText('');
      setIsInternalNote(false);
      fetchComments(selectedTicket.id);
    } catch (e) { alert('Failed to add comment'); }
  };

  const filteredTickets = tickets.filter(t => !categoryFilter || t.category === categoryFilter);

  return (
    <div className="space-y-5 min-h-screen pb-10">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-amber-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/30 rounded-xl">
              <LifeBuoy className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Enterprise IT, HR & Ops Support Desk</h2>
              <p className="text-xs text-amber-300/70 font-mono mt-0.5">Automated SLA Routing • Asset Problem Linkage • Agent Internal Notes</p>
            </div>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg">
            <Plus className="w-4 h-4 inline mr-1" /> Raise Support Ticket
          </button>
        </div>

        {/* Real-time Support KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-amber-200 font-mono uppercase">Open Support Tickets</p>
            <p className="text-xl font-black text-amber-300 mt-0.5 font-mono">{tickets.filter(t => ['NEW', 'OPEN', 'ASSIGNED', 'IN_PROGRESS'].includes(t.status)).length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-emerald-300 font-mono uppercase">Resolved Tickets</p>
            <p className="text-xl font-black text-emerald-400 mt-0.5 font-mono">{tickets.filter(t => t.status === 'RESOLVED').length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-rose-300 font-mono uppercase">Reopened Tickets</p>
            <p className="text-xl font-black text-rose-400 mt-0.5 font-mono">{tickets.filter(t => t.status === 'REOPENED').length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-amber-200 font-mono uppercase">Total Tickets Raised</p>
            <p className="text-xl font-black text-white mt-0.5 font-mono">{tickets.length}</p>
          </div>
        </div>
      </div>

      {/* ─── Filter Bar ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <Filter className="w-4 h-4 text-slate-400" />
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-1.5 outline-none font-bold">
          <option value="">All Support Categories</option>
          <option value="IT_SUPPORT">IT & Hardware Support</option>
          <option value="HR_QUERY">HR & Policy Query</option>
          <option value="PAYROLL_ISSUE">Payroll & Salary Slips</option>
          <option value="ASSET_ISSUE">Asset Problem / Damage</option>
        </select>
      </div>

      {/* ─── Tickets Table ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-xs text-left text-slate-700">
          <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
            <tr>
              <th className="p-3">Ticket Code</th>
              <th className="p-3">Subject & Category</th>
              <th className="p-3">Requester</th>
              <th className="p-3">Priority</th>
              <th className="p-3">Assigned Agent</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {filteredTickets.map(t => (
              <tr key={t.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => handleOpenTicketDetails(t)}>
                <td className="p-3 font-bold text-amber-600">{t.ticket_code}</td>
                <td className="p-3 font-sans">
                  <p className="font-bold text-slate-900 line-clamp-1">{t.subject}</p>
                  <span className="text-[10px] text-slate-500">{t.category} {t.asset_name ? `• ${t.asset_name}` : ''}</span>
                </td>
                <td className="p-3 font-sans font-bold text-slate-800">{t.req_first_name} {t.req_last_name}</td>
                <td className="p-3 font-sans">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    t.priority === 'URGENT' ? 'bg-red-50 text-red-700 border-red-200' :
                    t.priority === 'HIGH' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>{t.priority}</span>
                </td>
                <td className="p-3 font-sans">
                  {isSupport ? (
                    <select onClick={e => e.stopPropagation()} value={t.agent_first_name ? 'assigned' : ''}
                      onChange={e => handleAssignAgent(t.id, e.target.value)}
                      className="text-[10px] bg-slate-50 border border-slate-200 rounded px-2 py-1 font-bold">
                      <option value="">{t.agent_first_name ? `${t.agent_first_name} ${t.agent_last_name}` : '-- Assign Agent --'}</option>
                      {agents.map(a => <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>)}
                    </select>
                  ) : (
                    <span className="text-slate-600">{t.agent_first_name ? `${t.agent_first_name} ${t.agent_last_name}` : 'Unassigned'}</span>
                  )}
                </td>
                <td className="p-3 font-sans">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    t.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    t.status === 'REOPENED' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>{t.status}</span>
                </td>
                <td className="p-3 font-sans" onClick={e => e.stopPropagation()}>
                  <button onClick={() => handleOpenTicketDetails(t)} className="px-2.5 py-1 bg-amber-50 text-amber-700 font-bold text-[10px] rounded border border-amber-200 hover:bg-amber-100">
                    <MessageSquare className="w-3 h-3 inline mr-1" /> Thread
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ─── RAISE TICKET MODAL ────────────────────────────────────────────── */}
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
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                  <option value="IT_SUPPORT">IT & Hardware Support</option>
                  <option value="HR_QUERY">HR & Policy Query</option>
                  <option value="PAYROLL_ISSUE">Payroll & Salary Slips</option>
                  <option value="ASSET_ISSUE">Asset Issue / Damage</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Subject *</label>
                <input required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold" />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Related Asset (Optional)</label>
                <select value={formData.asset_id} onChange={e => setFormData({...formData, asset_id: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                  <option value="">-- None --</option>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.asset_name} ({a.asset_code})</option>)}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Problem Description *</label>
                <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" rows={3} />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-amber-500 text-slate-950 rounded-xl font-black shadow">{submitting ? 'Submitting...' : 'Submit Ticket'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── TICKET THREAD & DETAILS DRAWER ────────────────────────────────── */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-lg h-full p-6 shadow-2xl flex flex-col justify-between space-y-4 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200">{selectedTicket.ticket_code}</span>
                  <h3 className="font-bold text-slate-900 text-base mt-1">{selectedTicket.subject}</h3>
                </div>
                <button onClick={() => setSelectedTicket(null)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>

              {/* Status Actions */}
              <div className="flex items-center gap-2 mt-3">
                {isSupport && selectedTicket.status !== 'RESOLVED' && (
                  <button onClick={() => handleUpdateStatus(selectedTicket.id, 'RESOLVED', 'Issue resolved by support agent')}
                    className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow">
                    Mark Resolved
                  </button>
                )}
                {selectedTicket.status === 'RESOLVED' && (
                  <button onClick={() => setShowReopenModal(true)} className="px-3 py-1.5 bg-rose-600 text-white font-bold text-xs rounded-xl shadow">
                    Reopen Ticket
                  </button>
                )}
              </div>

              {/* Description */}
              <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                <p className="font-bold text-slate-900 mb-1">Issue Description:</p>
                <p>{selectedTicket.description}</p>
              </div>

              {/* Comments Thread */}
              <div className="mt-5 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Conversation Thread</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {comments.map(c => (
                    <div key={c.id} className={`p-3 rounded-xl border text-xs ${
                      c.is_internal_note ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}>
                      <div className="flex items-center justify-between font-bold text-[10px] mb-1">
                        <span>{c.first_name} {c.last_name} {c.is_internal_note && <span className="bg-amber-200 text-amber-900 px-1 rounded">Agent Internal Note</span>}</span>
                        <span className="text-slate-400">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="font-sans">{c.comment_text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="pt-3 border-t space-y-2">
              {isSupport && (
                <label className="flex items-center gap-2 text-xs font-bold text-amber-800">
                  <input type="checkbox" checked={isInternalNote} onChange={e => setIsInternalNote(e.target.checked)} className="rounded" />
                  <Lock className="w-3 h-3 inline" /> Post as Private Agent Internal Note
                </label>
              )}
              <div className="flex gap-2">
                <input required value={newCommentText} onChange={e => setNewCommentText(e.target.value)}
                  placeholder="Type reply or note..." className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900" />
                <button type="submit" className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── REOPEN TICKET MODAL ───────────────────────────────────────────── */}
      {showReopenModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Reopen Support Ticket</h3>
              <button onClick={() => setShowReopenModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleReopenTicket} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Reason for Reopening *</label>
                <textarea required value={reopenReason} onChange={e => setReopenReason(e.target.value)}
                  placeholder="Explain why the issue persists..." className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" rows={3} />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowReopenModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-rose-600 text-white rounded-xl font-bold shadow">Reopen Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const AnnouncementsPage: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <h2 className="text-xl font-bold text-slate-900">Company Announcements & Broadcasts</h2>
      <p className="text-xs text-slate-500">Official company-wide announcements, policy updates, and executive messages.</p>
    </div>
  );
};
