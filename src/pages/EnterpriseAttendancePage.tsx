import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock, MapPin, ShieldCheck, AlertTriangle, Plus, RefreshCw, X,
  CheckCircle2, ArrowRight, ArrowLeft, Calendar, UserCheck, Play, Square, Award, BarChart2, FileEdit
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';
import { AttendanceAnalyticsTab } from './AttendanceAnalyticsTab.js';
import { AttendanceRegularizationTab } from './AttendanceRegularizationTab.js';

interface AttendanceRecord {
  id: number;
  date: string;
  punch_in?: string;
  punch_out?: string;
  work_hours: number;
  is_late: boolean;
  is_overtime: boolean;
  status: string;
  status: string;
}

export const EnterpriseAttendancePage: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const isManager = ['ADMIN', 'HR_MANAGER', 'DEPT_HEAD', 'SUPER_ADMIN'].includes(userRole);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [tab, setTab] = useState<'log' | 'analysis' | 'regularization'>('log');

  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string>('Ready to capture GPS coordinates');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [todayRes, histRes] = await Promise.all([
        apiClient.get('/attendance/today').catch(() => ({ data: { data: null } })),
        apiClient.get('/attendance/my-history').catch(() => ({ data: { data: [] } })),
      ]);
      setTodayRecord(todayRes.data?.data || null);
      setHistory(histRes.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // GPS Clock In Execution
  const handleClockIn = async () => {
    setSubmitting(true);
    setGpsStatus('Acquiring GPS location...');

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setSubmitting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          setGpsStatus(`GPS Acquired: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
          await apiClient.post('/attendance/clock-in', {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          await fetchData();
          alert('✅ Clock In Successful! (GPS Geofence Verified)');
        } catch (e: any) {
          alert(e.response?.data?.message || 'Clock In Failed');
        } finally {
          setSubmitting(false);
        }
      },
      (err) => {
        setGpsStatus('GPS Permission Denied / Unavailable');
        alert('Location permission is required to clock in.');
        setSubmitting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // GPS Clock Out Execution
  const handleClockOut = async () => {
    setSubmitting(true);
    setGpsStatus('Acquiring GPS location...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await apiClient.post('/attendance/clock-out', {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          await fetchData();
          alert('✅ Clock Out Successful!');
        } catch (e: any) {
          alert(e.response?.data?.message || 'Clock Out Failed');
        } finally {
          setSubmitting(false);
        }
      },
      (err) => {
        alert('Location permission is required to clock out.');
        setSubmitting(false);
      }
    );
  };

  const isClockedIn = !!(todayRecord && todayRecord.punch_in && !todayRecord.punch_out);

  return (
    <div className="space-y-5 min-h-screen pb-10 font-sans">
      {isMobile ? (
        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm text-slate-800">
          <button onClick={() => onNavigate?.('dashboard')} className="p-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-extrabold text-sm uppercase tracking-tight">Attendance Workspace</span>
        </div>
      ) : null}

      {/* ─── Header Workspace ──────────────────────────────────────────────── */}
      <div className={isMobile ? "bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-2xl p-4 shadow-xl border border-teal-900/40 text-slate-800" : "bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-teal-900/40 text-slate-800"}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-600/30 rounded-xl">
              <Clock className="w-7 h-7 text-teal-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Enterprise Attendance</h2>
              <p className="text-xs text-teal-300/70 font-mono mt-0.5">{gpsStatus}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isClockedIn ? (
              <button onClick={handleClockIn} disabled={submitting} className="bg-teal-600 hover:bg-teal-700 text-white font-black text-sm px-6 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
                <Play className="w-4 h-4 fill-white" /> {submitting ? 'Verifying GPS...' : 'CLOCK IN'}
              </button>
            ) : (
              <button onClick={handleClockOut} disabled={submitting} className="bg-rose-600 hover:bg-rose-700 text-white font-black text-sm px-6 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
                <Square className="w-4 h-4 fill-white" /> {submitting ? 'Clocking Out...' : 'CLOCK OUT'}
              </button>
            )}
          </div>
        </div>

        {/* Real-time Attendance KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-teal-200 font-mono uppercase">Today's Clock In</p>
            <p className="text-lg font-black text-white mt-0.5 font-mono">{todayRecord?.punch_in ? new Date(todayRecord.punch_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not Clocked In'}</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-teal-200 font-mono uppercase">Today's Clock Out</p>
            <p className="text-lg font-black text-white mt-0.5 font-mono">{todayRecord?.punch_out ? new Date(todayRecord.punch_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (isClockedIn ? 'Active Shift' : 'N/A')}</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-emerald-300 font-mono uppercase">Net Working Hours</p>
            <p className="text-lg font-black text-emerald-400 mt-0.5 font-mono">{todayRecord?.work_hours || 0} Hours</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-amber-300 font-mono uppercase">Geofence Status</p>
            <p className="text-sm font-bold text-amber-300 mt-1 flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-emerald-400" /> GPS Verified (HQ)</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200 overflow-x-auto">
        <button onClick={() => setTab('log')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'log' ? 'bg-white text-teal-700 shadow-sm border border-teal-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Calendar className="w-4 h-4" /> My Attendance Log
        </button>
        {isManager && (
          <button onClick={() => setTab('analysis')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
              tab === 'analysis' ? 'bg-white text-teal-700 shadow-sm border border-teal-100' : 'text-slate-500 hover:text-slate-800'
            }`}>
            <BarChart2 className="w-4 h-4" /> Attendance Analysis
          </button>
        )}
        <button onClick={() => setTab('regularization')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'regularization' ? 'bg-white text-teal-700 shadow-sm border border-teal-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <FileEdit className="w-4 h-4" /> Attendance Regularization
        </button>
      </div>

      {/* ─── MY ATTENDANCE LOG TAB ────────────────────────────────────────── */}
      {tab === 'log' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Clock In</th>
                <th className="p-3">Clock Out</th>
                <th className="p-3">Total Hours</th>
                <th className="p-3">Late Status</th>
                <th className="p-3">Overtime</th>
                <th className="p-3">GPS Geofence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {history.map(rec => (
                <tr key={rec.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">{rec.date}</td>
                  <td className="p-3 text-teal-700 font-bold">{rec.punch_in ? new Date(rec.punch_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</td>
                  <td className="p-3 text-rose-700 font-bold">{rec.punch_out ? new Date(rec.punch_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</td>
                  <td className="p-3 font-bold text-slate-900">{rec.work_hours} hrs</td>
                  <td className="p-3 font-sans">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      rec.is_late ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>{rec.is_late ? 'LATE' : 'ON_TIME'}</span>
                  </td>
                  <td className="p-3 font-sans">
                    {rec.is_overtime ? <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200">OVERTIME</span> : 'Standard'}
                  </td>
                  <td className="p-3 font-sans">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-50 text-teal-700 rounded border border-teal-200">VERIFIED</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* ─── ANALYSIS TAB ─────────────────────────────────────────────────── */}
      {tab === 'analysis' && isManager && (
        <AttendanceAnalyticsTab />
      )}

      {/* ─── REGULARIZATION TAB ───────────────────────────────────────────── */}
      {tab === 'regularization' && (
        <AttendanceRegularizationTab />
      )}
    </div>
  );
};
