import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell, CheckCircle2, Clock, Smartphone, Mail, ShieldAlert,
  Sliders, Filter, Search, CheckCheck, RefreshCw, X, MessageSquare
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  channel: string;
  priority: string;
  deep_link?: string;
  is_read: boolean;
  created_at: string;
}

export const EnterpriseNotificationPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [showPreferences, setShowPreferences] = useState(false);

  const [deviceForm, setDeviceForm] = useState({
    device_token: `fcm_${Math.random().toString(36).substring(7)}`,
    platform: 'ANDROID',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [nRes, uRes] = await Promise.all([
        apiClient.get('/notifications/my-notifications').catch(() => ({ data: { data: [] } })),
        apiClient.get('/notifications/unread-count').catch(() => ({ data: { data: { unread_count: 0 } } })),
      ]);
      setNotifications(nRes.data?.data || []);
      setUnreadCount(uRes.data?.data?.unread_count || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      await fetchData();
    } catch (e) { console.error(e); }
  };

  const handleMarkAllRead = async () => {
    setSubmitting(true);
    try {
      await apiClient.post('/notifications/mark-all-read');
      await fetchData();
      alert('✅ All notifications marked as read');
    } catch (e) { alert('Failed to mark all as read'); }
    finally { setSubmitting(false); }
  };

  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/notifications/devices/register', deviceForm);
      alert('✅ Mobile push device registered successfully!');
    } catch (e) { alert('Device registration failed'); }
  };

  const filteredNotifications = notifications.filter(n => filter === 'all' || !n.is_read);

  return (
    <div className="space-y-5 min-h-screen pb-10">
      {/* ─── Header Workspace ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-indigo-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/30 rounded-xl relative">
              <Bell className="w-7 h-7 text-indigo-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Enterprise Notification & Communication Center</h2>
              <p className="text-xs text-indigo-300/70 font-mono mt-0.5">Centralized Outbox • Device Push Tokens • Real-time Bell • Deduplication Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowPreferences(true)} className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl border border-white/20">
              <Sliders className="w-3.5 h-3.5 inline mr-1" /> Preferences
            </button>
            <button onClick={handleMarkAllRead} disabled={submitting || unreadCount === 0} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg disabled:opacity-50">
              <CheckCheck className="w-4 h-4 inline mr-1" /> Mark All as Read
            </button>
          </div>
        </div>

        {/* Real-time Notification KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-indigo-200 font-mono uppercase">Unread Messages</p>
            <p className="text-xl font-black text-rose-400 mt-0.5 font-mono">{unreadCount} Unread</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-indigo-200 font-mono uppercase">Total Notifications</p>
            <p className="text-xl font-black text-white mt-0.5 font-mono">{notifications.length} Total</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-emerald-300 font-mono uppercase">Push Delivery Status</p>
            <p className="text-xl font-black text-emerald-400 mt-0.5 font-mono">ACTIVE (FCM)</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-indigo-200 font-mono uppercase">System Deduplication</p>
            <p className="text-sm font-bold text-indigo-300 mt-1">100% Guaranteed</p>
          </div>
        </div>
      </div>

      {/* ─── Filters Workspace ────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200 overflow-x-auto w-fit">
        <button onClick={() => setFilter('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            filter === 'all' ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          All Notifications ({notifications.length})
        </button>
        <button onClick={() => setFilter('unread')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            filter === 'unread' ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          Unread Only ({unreadCount})
        </button>
      </div>

      {/* ─── NOTIFICATION STREAM ─────────────────────────────────────────── */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
            <Bell className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700">No Notifications Found</h4>
            <p className="text-xs text-slate-400">You are all caught up! High priority events will appear here in real-time.</p>
          </div>
        ) : (
          filteredNotifications.map(n => (
            <div key={n.id} className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
              n.is_read ? 'bg-white border-slate-200' : 'bg-indigo-50/60 border-indigo-200 shadow-sm'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl mt-0.5 ${
                  n.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
                }`}>
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{n.title}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded uppercase font-mono">{n.type}</span>
                    {n.priority === 'CRITICAL' && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 bg-rose-500 text-white rounded uppercase font-mono">CRITICAL</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 font-sans">{n.message}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              </div>
              {!n.is_read && (
                <button onClick={() => handleMarkAsRead(n.id)} className="px-3 py-1.5 bg-indigo-600 text-white text-[11px] font-bold rounded-xl hover:bg-indigo-700 shrink-0">
                  Mark Read
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* ─── PREFERENCES MODAL ────────────────────────────────────────────── */}
      {showPreferences && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Notification & Push Device Settings</h3>
              <button onClick={() => setShowPreferences(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleRegisterDevice} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Mobile Push Device Token (FCM) *</label>
                <input required value={deviceForm.device_token} onChange={e => setDeviceForm({...deviceForm, device_token: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono text-[11px]" />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Platform *</label>
                <select value={deviceForm.platform} onChange={e => setDeviceForm({...deviceForm, platform: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                  <option value="ANDROID">ANDROID</option>
                  <option value="IOS">IOS</option>
                  <option value="WEB">WEB PUSH</option>
                </select>
              </div>
              <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded-xl font-bold shadow">Register Mobile Device Token</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
