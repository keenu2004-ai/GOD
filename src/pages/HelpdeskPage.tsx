import React, { useState, useEffect } from 'react';
import { HelpCircle, Megaphone, Plus, Check, MessageSquare, X, ShieldAlert, LifeBuoy, Filter } from 'lucide-react';
import apiClient from '../services/apiClient.js';

export const HelpdeskPage: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const [formData, setFormData] = useState({
    category: 'IT_SUPPORT',
    priority: 'HIGH',
    subject: '',
    description: '',
  });

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/helpdesk');
      if (res.data?.success) setTickets(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await apiClient.post('/helpdesk', formData);
      if (res.data?.success) {
        alert('Support ticket raised successfully! Ticket ID assigned.');
        setShowCreateModal(false);
        setFormData({ category: 'IT_SUPPORT', priority: 'HIGH', subject: '', description: '' });
        fetchTickets();
      } else {
        alert(res.data?.message || 'Failed to raise ticket');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to raise support ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      const res = await apiClient.put(`/helpdesk/${id}/status`, { status });
      if (res.data?.success) {
        fetchTickets();
      }
    } catch (err: any) {
      alert('Failed to update ticket status');
    }
  };

  const filteredTickets = tickets.filter(t => !categoryFilter || t.category === categoryFilter);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-amber-500" />
            <span>IT, HR & Operations Helpdesk Desk</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Submit technical tickets, payroll queries, hardware requests, or HR policy assistance.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Raise Support Ticket</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <Filter className="w-4 h-4 text-slate-400" />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-1.5 outline-none font-medium"
        >
          <option value="">All Ticket Categories</option>
          <option value="IT_SUPPORT">IT & Hardware Support</option>
          <option value="HR_QUERY">HR & Policy Query</option>
          <option value="PAYROLL_ISSUE">Payroll & Salary Slip</option>
          <option value="FINANCE_CLAIM">Finance & Expense Claims</option>
          <option value="ASSET_REPAIR">Asset Repair & Replacement</option>
        </select>
        <span className="text-xs text-slate-500 font-mono ml-auto">Total Tickets: <b>{filteredTickets.length}</b></span>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">Ticket ID & Subject</th>
                <th className="p-4">Category</th>
                <th className="p-4">Requested By</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">Loading tickets...</td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">No support tickets raised yet.</td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{t.subject}</p>
                      <p className="text-[10px] text-amber-600 font-mono font-bold mt-0.5">{t.ticket_code}</p>
                    </td>
                    <td className="p-4 font-mono font-semibold text-slate-700">{t.category}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <img src={t.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'} className="w-6 h-6 rounded-full object-cover" alt="" />
                        <span className="font-medium text-slate-800">{t.first_name} {t.last_name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        t.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                        t.priority === 'HIGH' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                        'bg-blue-100 text-blue-700 border-blue-200'
                      }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        t.status === 'RESOLVED' || t.status === 'CLOSED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        t.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {t.status !== 'RESOLVED' && t.status !== 'CLOSED' ? (
                        <button
                          onClick={() => handleStatusUpdate(t.id, 'RESOLVED')}
                          className="px-2.5 py-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-lg text-[11px] font-bold border border-emerald-300"
                        >
                          Mark Resolved
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusUpdate(t.id, 'OPEN')}
                          className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-[11px] font-bold border border-slate-300"
                        >
                          Reopen
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raise Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 text-xs text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <span>Raise Support Ticket</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 font-semibold">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white mt-1"
                  >
                    <option value="IT_SUPPORT">IT & Hardware Support</option>
                    <option value="HR_QUERY">HR & Policy Query</option>
                    <option value="PAYROLL_ISSUE">Payroll & Salary Slip</option>
                    <option value="FINANCE_CLAIM">Finance & Expense Claims</option>
                    <option value="ASSET_REPAIR">Asset Repair & Replacement</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 font-semibold">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white mt-1"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold">Subject / Ticket Title</label>
                <input
                  type="text"
                  placeholder="e.g. Laptop charger failure or HR leave credit discrepancy"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold">Detailed Description</label>
                <textarea
                  rows={4}
                  placeholder="Explain the issue in detail..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white mt-1"
                  required
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl">
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const AnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('COMPANY_NEWS');

  const fetchAnn = async () => {
    try {
      const res = await apiClient.get('/announcements');
      if (res.data?.success) setAnnouncements(res.data.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchAnn();
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await apiClient.post('/announcements', { title, content, category, is_pinned: true });
      if (res.data?.success) {
        alert('Announcement broadcasted successfully!');
        setShowModal(false);
        setTitle('');
        setContent('');
        fetchAnn();
      }
    } catch (err: any) {
      alert('Failed to post announcement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-amber-500" />
            Corporate Announcements Broadcast
          </h2>
          <p className="text-xs text-slate-500 mt-1">Official updates from THEIAKSHI ENTERPRISES leadership.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Post Broadcast</span>
        </button>
      </div>

      <div className="space-y-4">
        {announcements.map((a) => (
          <div key={a.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-amber-600 font-mono uppercase font-bold">{a.category}</span>
              {a.is_pinned && <span className="bg-amber-100 text-amber-800 text-[9px] px-2 py-0.5 rounded font-mono font-bold border border-amber-200">PINNED BROADCAST</span>}
            </div>
            <h3 className="font-bold text-slate-900 text-base">{a.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{a.content}</p>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 text-xs text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-500" />
                <span>Post Corporate Broadcast</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handlePost} className="space-y-4">
              <div>
                <label className="text-slate-400 font-semibold">Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white mt-1" required />
              </div>
              <div>
                <label className="text-slate-400 font-semibold">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white mt-1">
                  <option value="COMPANY_NEWS">Company News</option>
                  <option value="HOLIDAY_ALERT">Holiday Alert</option>
                  <option value="POLICY_UPDATE">Policy Update</option>
                  <option value="TOWN_HALL">Town Hall Meeting</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 font-semibold">Message Content</label>
                <textarea rows={4} value={content} onChange={(e) => setContent(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white mt-1" required></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl">
                  {submitting ? 'Broadcasting...' : 'Post Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
