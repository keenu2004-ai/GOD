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
  Menu,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import apiClient from '../../services/apiClient.js';
import { attendanceService } from '../../services/attendanceService.js';
import { NotificationItem } from '../../types/index.js';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
  onNavigate?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu, onNavigate }) => {
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

  const formatTimer = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isCheckedIn = !!attendanceStatus?.record?.punch_in && !attendanceStatus?.record?.punch_out;
  const isCheckedOut = !!attendanceStatus?.record?.punch_out;

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm text-slate-800">
      {/* Left: Organization & Branch info */}
      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors shrink-0"
          title="Open Navigation Menu"
        >
          <Menu className="w-5 h-5 text-slate-700" />
        </button>

        <div className="md:hidden flex items-center gap-2 ml-1">
          <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm text-xs">
            T1
          </div>
          <span className="font-extrabold text-slate-950 text-xs tracking-tight uppercase font-sans">
            THEIAKSHI ENTERPRISE
          </span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium">
          <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-slate-900 font-semibold truncate max-w-[140px] md:max-w-none">{user?.branch_name || 'THEIAKSHI HQ'}</span>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold hidden lg:inline-block">
            HQ GEOFENCE
          </span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-slate-600 text-xs font-mono bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
          <span>{time || '09:00:00 AM'} IST</span>
        </div>
      </div>

      {/* Right: Attendance Status Badge & Profile Dropdown */}
      <div className="flex items-center gap-3">
        {/* Header Attendance Status Badge (Interactive & Synced with Dashboard Punch Action) */}
        <button
          onClick={() => {
            if (punching) return;
            if (!isCheckedIn && !isCheckedOut) {
              handlePunchIn();
            } else if (isCheckedIn) {
              if (window.confirm('Do you want to Clock Out now?')) {
                handlePunchOut();
              }
            } else {
              onNavigate?.('attendance');
            }
          }}
          disabled={punching}
          title={!isCheckedIn && !isCheckedOut ? 'Click to Clock In Now' : isCheckedIn ? 'Click to Clock Out' : 'View Attendance Details'}
          className={`flex items-center gap-2 border px-3 py-1.5 rounded-xl text-xs font-medium transition-all shadow-sm active:scale-95 ${
            isCheckedIn
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100 cursor-pointer'
              : isCheckedOut
              ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 cursor-pointer'
              : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100 cursor-pointer animate-pulse'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${isCheckedIn ? 'bg-emerald-500 animate-ping' : isCheckedOut ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
            <span className="font-extrabold uppercase text-[11px] tracking-tight">
              {punching ? 'Processing...' : isCheckedIn ? 'Checked In' : isCheckedOut ? 'Shift Completed' : 'NOT CHECKED IN'}
            </span>
          </div>

          {isCheckedIn && (
            <span className="font-mono text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[11px] border border-emerald-200 shadow-inner">
              {formatTimer(seconds)}
            </span>
          )}

          {!isCheckedIn && !isCheckedOut && (
            <span className="bg-amber-200 text-amber-900 font-black text-[10px] px-1.5 py-0.5 rounded uppercase">
              CLICK TO PUNCH
            </span>
          )}
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
              <p className="text-[10px] text-slate-500 font-mono">{user?.role || 'EMPLOYEE'}</p>
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

              <div className="py-1 border-b border-slate-100 font-medium space-y-0.5">
                <button
                  onClick={() => { onNavigate?.('employees'); setShowProfileMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer font-bold flex items-center justify-between"
                >
                  <span>My Profile</span>
                  <span className="text-[10px] text-slate-400 font-mono">{user?.employee_code || 'EMP-101'}</span>
                </button>
                <button
                  onClick={() => { onNavigate?.('attendance'); setShowProfileMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer flex items-center justify-between"
                >
                  <span>My Attendance</span>
                </button>
                <button
                  onClick={() => { onNavigate?.('leave'); setShowProfileMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer flex items-center justify-between"
                >
                  <span>My Leave</span>
                </button>
                <button
                  onClick={() => { onNavigate?.('payslip-portal'); setShowProfileMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer flex items-center justify-between"
                >
                  <span>My Payroll & Payslips</span>
                </button>
                <button
                  onClick={() => { onNavigate?.('daily-standup'); setShowProfileMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer flex items-center justify-between"
                >
                  <span>My Tasks & Standups</span>
                </button>
                <button
                  onClick={() => { onNavigate?.('helpdesk'); setShowProfileMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer flex items-center justify-between"
                >
                  <span>Helpdesk</span>
                </button>
                <button
                  onClick={() => { onNavigate?.('settings'); setShowProfileMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer flex items-center justify-between"
                >
                  <span>Settings</span>
                </button>
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
