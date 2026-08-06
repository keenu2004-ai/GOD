import React, { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  Building2,
  Clock,
  Sparkles,
  LogOut,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import apiClient from '../../services/apiClient.js';
import { NotificationItem } from '../../types/index.js';

export const Header: React.FC<{ onOpenAiAssistant?: () => void }> = ({ onOpenAiAssistant }) => {
  const { user, logout } = useAuth();
  const [time, setTime] = useState<string>('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await apiClient.get('/notifications');
        if (res.data?.success) setNotifications(res.data.data);
      } catch (e) {
        // silent fallback
      }
    };
    fetchNotifs();
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm text-slate-800">
      {/* Left: Organization & Branch info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium">
          <Building2 className="w-4 h-4 text-emerald-600" />
          <span className="text-slate-900 font-semibold">{user?.branch_name || 'THEIAKSHI HQ - Bengaluru'}</span>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
            HQ GEOFENCE
          </span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-slate-600 text-xs font-mono bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
          <span>{time || '09:00:00 AM'} IST</span>
        </div>
      </div>

      {/* Right: Search, AI Brief trigger, Notifications, User Menu */}
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="relative hidden lg:block w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search employees, tasks, documents..."
            className="w-full bg-slate-100 border-none rounded-md pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* AI Assistant Quick Trigger */}
        <button
          onClick={onOpenAiAssistant}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>AI Insights</span>
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl p-3 z-50 text-slate-800">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Enterprise Notifications</span>
                <span className="text-[10px] text-blue-600 font-bold">{unreadCount} unread</span>
              </div>
              <div className="max-h-64 overflow-y-auto mt-2 space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center justify-between text-slate-900 font-semibold">
                        <span>{n.title}</span>
                        <span className="text-[10px] text-slate-400">Just now</span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-1">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-left"
          >
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
              alt="Avatar"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/30"
            />
            <div className="hidden sm:block leading-tight">
              <p className="text-xs font-bold text-slate-900">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">{user?.role || 'ADMIN'}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl p-2 z-50 text-xs text-slate-800">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-900">{user?.first_name} {user?.last_name}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{user?.email}</p>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-600 font-bold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Authenticated Session</span>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1 font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
