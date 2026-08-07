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
  Coffee,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import apiClient from '../../services/apiClient.js';
import { attendanceService } from '../../services/attendanceService.js';
import { NotificationItem } from '../../types/index.js';

export const Header: React.FC = () => {
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

  const [attendanceStatus, setAttendanceStatus] = useState<any>(null);
  const [punching, setPunching] = useState<boolean>(false);
  const [seconds, setSeconds] = useState<number>(0);
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({ lat: 12.9716, lng: 77.5946 });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchAttendanceStatus = async () => {
    try {
      const res = await attendanceService.getMyStatus();
      if (res?.success) {
        setAttendanceStatus(res.data);
        setSeconds(res.data?.currentWorkSeconds || 0);
      }
    } catch (e) {
      console.error('Error fetching header attendance status:', e);
    }
  };

  useEffect(() => {
    fetchAttendanceStatus();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log('Using default HQ coordinates')
      );
    }

    const handleSync = () => fetchAttendanceStatus();
    window.addEventListener('attendance-updated', handleSync);
    return () => window.removeEventListener('attendance-updated', handleSync);
  }, []);

  // Live timer for active punch session
  useEffect(() => {
    let interval: any = null;
    if (attendanceStatus?.record?.punch_in && !attendanceStatus?.record?.punch_out) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [attendanceStatus]);

  const handlePunchIn = async () => {
    try {
      setPunching(true);
      const res = await attendanceService.punchIn(coords.lat, coords.lng, 'GENERAL');
      if (res?.success) {
        fetchAttendanceStatus();
        window.dispatchEvent(new Event('attendance-updated'));
      } else {
        alert(res?.message || 'Failed to punch in');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to punch in');
    } finally {
      setPunching(false);
    }
  };

  const handlePunchOut = async () => {
    try {
      setPunching(true);
      const res = await attendanceService.punchOut(coords.lat, coords.lng);
      if (res?.success) {
        fetchAttendanceStatus();
        window.dispatchEvent(new Event('attendance-updated'));
      } else {
        alert(res?.message || 'Failed to punch out');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to punch out');
    } finally {
      setPunching(false);
    }
  };

  const handleBreak = async () => {
    try {
      setPunching(true);
      const res = await attendanceService.recordBreak(15);
      if (res?.success) {
        alert('15-minute break recorded successfully!');
        fetchAttendanceStatus();
        window.dispatchEvent(new Event('attendance-updated'));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record break');
    } finally {
      setPunching(false);
    }
  };

  const formatTimer = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isCheckedIn = !!attendanceStatus?.record?.punch_in && !attendanceStatus?.record?.punch_out;
  const isCheckedOut = !!attendanceStatus?.record?.punch_out;

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

        {/* Global Search Input */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl w-64 text-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search employees, payroll, tasks..."
            className="bg-transparent border-none outline-none w-full text-slate-800 placeholder-slate-400"
          />
          <kbd className="hidden xl:inline-block bg-slate-200 text-slate-600 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold">⌘K</kbd>
        </div>
      </div>

      {/* Center/Right: Global Attendance Punch Widget */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${isCheckedIn ? 'bg-emerald-500 animate-ping' : isCheckedOut ? 'bg-rose-500' : 'bg-amber-400'}`}></span>
            <span className="font-bold text-slate-800 uppercase text-[11px]">
              {isCheckedIn ? 'Checked In' : isCheckedOut ? 'Checked Out' : 'Not Checked In'}
            </span>
          </div>

          {isCheckedIn && (
            <span className="font-mono text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
              {formatTimer(seconds)}
            </span>
          )}
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {!isCheckedIn && !isCheckedOut && (
            <button
              onClick={handlePunchIn}
              disabled={punching}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded-lg text-xs transition-all shadow-sm flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{punching ? 'PUNCHING...' : 'PUNCH IN'}</span>
            </button>
          )}

          {isCheckedIn && (
            <>
              <button
                onClick={handleBreak}
                disabled={punching}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-2.5 py-1 rounded-lg text-xs transition-all shadow-sm flex items-center gap-1"
                title="Record 15 Min Break"
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>BREAK</span>
              </button>
              <button
                onClick={handlePunchOut}
                disabled={punching}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1 rounded-lg text-xs transition-all shadow-sm flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{punching ? 'PUNCHING...' : 'PUNCH OUT'}</span>
              </button>
            </>
          )}
        </div>

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

          {/* Smart Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl p-3 z-50 text-slate-800">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Notifications</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                </div>
                <button
                  onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold uppercase tracking-tight"
                >
                  Mark All Read
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto mt-2 space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No new notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => setNotifications((prev) => prev.map((item) => item.id === n.id ? { ...item, is_read: true } : item))}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${n.is_read ? 'bg-slate-50 border-slate-200 opacity-75' : 'bg-blue-50/50 border-blue-200 font-semibold'}`}
                    >
                      <div className="flex items-center justify-between text-slate-900">
                        <span className="font-bold">{n.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Just now</span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-1 font-normal">{n.message}</p>
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
