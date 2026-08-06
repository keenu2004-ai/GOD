import React, { useState, useEffect } from 'react';
import { HelpCircle, Megaphone, Plus, Check, MessageSquare } from 'lucide-react';
import apiClient from '../services/apiClient.js';

export const HelpdeskPage: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await apiClient.get('/helpdesk');
        if (res.data?.success) setTickets(res.data.data);
      } catch (e) { console.error(e); }
    };
    fetchTickets();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-amber-500" />
            IT & HR Support Helpdesk
          </h2>
          <p className="text-xs text-slate-500 mt-1">Submit technical issues, access requests, or HR policy queries.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-wider border-b border-slate-200">
            <tr>
              <th className="p-4">Ticket Code / Subject</th>
              <th className="p-4">Category</th>
              <th className="p-4">Requested By</th>
              <th className="p-4">Priority</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tickets.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="p-4">
                  <p className="font-bold text-slate-900">{t.subject}</p>
                  <p className="text-[10px] text-amber-600 font-mono font-bold">{t.ticket_code}</p>
                </td>
                <td className="p-4 font-mono">{t.category}</td>
                <td className="p-4 font-medium text-slate-800">{t.first_name} {t.last_name}</td>
                <td className="p-4">
                  <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded border border-orange-200">
                    {t.priority}
                  </span>
                </td>
                <td className="p-4">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const AnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    const fetchAnn = async () => {
      try {
        const res = await apiClient.get('/announcements');
        if (res.data?.success) setAnnouncements(res.data.data);
      } catch (e) { console.error(e); }
    };
    fetchAnn();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-amber-500" />
            Corporate Announcements Broadcast
          </h2>
          <p className="text-xs text-slate-500 mt-1">Official updates from THEIAKSHI ENTERPRISES leadership.</p>
        </div>
      </div>

      <div className="space-y-4">
        {announcements.map((a) => (
          <div key={a.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-2 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-amber-600 font-mono uppercase font-bold">{a.category}</span>
              {a.is_pinned && <span className="bg-amber-100 text-amber-800 text-[9px] px-2 py-0.5 rounded font-mono font-bold border border-amber-200">PINNED BROADCAST</span>}
            </div>
            <h3 className="font-bold text-slate-900 text-base">{a.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{a.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
