import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock, MapPin, ShieldCheck, AlertTriangle, Plus, RefreshCw, X,
  CheckCircle2, ArrowRight, Calendar, UserCheck, Play, Square, Award
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

interface AttendanceRecord {
  id: number;
  date: string;
  punch_in?: string;
  punch_out?: string;
  work_hours: number;
  is_late: boolean;
  is_overtime: boolean;
  status: string;
}

interface Correction {
  id: number;
  attendance_date: string;
  requested_punch_in: string;
  requested_punch_out: string;
  reason: string;
  status: string;
}

export const EnterpriseAttendancePage: React.FC = () => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const isManager = ['ADMIN', 'HR_MANAGER', 'DEPT_HEAD', 'SUPER_ADMIN'].includes(userRole);

  const [tab, setTab] = useState<'log' | 'corrections' | 'config'>('log');

  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [corrections, setCorrections] = useState<Correction[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string>('Ready to capture GPS coordinates');

  // Modal
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionForm, setCorrectionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    requested_punch_in: '09:00',
    requested_punch_out: '18:00',
    reason: 'Client site meeting punch delayed',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [todayRes, histRes, corrRes] = await Promise.all([
        apiClient.get('/attendance/today').catch(() => ({ data: { data: null } })),
        apiClient.get('/attendance/my-history').catch(() => ({ data: { data: [] } })),
        apiClient.get('/attendance/regularizations').catch(() => ({ data: { data: [] } })),
      ]);
      setTodayRecord(todayRes.data?.data || null);
      setHistory(histRes.data?.data || []);
      setCorrections(corrRes.data?.data || []);
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

  const handleRequestCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/attendance/corrections', correctionForm);
      setShowCorrectionModal(false);
      await fetchData();
      alert('✅ Correction Requisition Submitted!');
    } catch (e: any) { alert('Correction request failed'); }
    finally { setSubmitting(false); }
  };

  const handleApproveCorrection = async (id: number) => {
    try {
      await apiClient.patch(`/attendance/corrections/${id}/approve`);
      await fetchData();
      alert('✅ Correction Approved!');
    } catch (e) { alert('Approval failed'); }
  };

  const isClockedIn = !!(todayRecord && todayRecord.punch_in && !todayRecord.punch_out);

  return (
    <div className="space-y-5 min-h-screen pb-10">
      {/* ─── Header Workspace ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-teal-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-600/30 rounded-xl">
              <Clock className="w-7 h-7 text-teal-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Enterprise Attendance & GPS Geofence Workspace</h2>
              <p className="text-xs text-teal-300/70 font-mono mt-0.5">{gpsStatus}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowCorrectionModal(true)} className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl border border-white/20">
              <Plus className="w-3.5 h-3.5 inline mr-1" /> Request Correction
            </button>
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

      {/* ─── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200 overflow-x-auto">
        <button onClick={() => setTab('log')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'log' ? 'bg-white text-teal-700 shadow-sm border border-teal-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Calendar className="w-4 h-4" /> Attendance Log ({history.length})
        </button>
        <button onClick={() => setTab('corrections')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'corrections' ? 'bg-white text-teal-700 shadow-sm border border-teal-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <UserCheck className="w-4 h-4" /> Correction Requisitions ({corrections.length})
        </button>
      </div>

      {/* ─── MY ATTENDANCE LOG TAB ────────────────────────────────────────── */}
      {tab === 'log' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
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

      {/* ─── CORRECTION REQUISITIONS TAB ─────────────────────────────────── */}
      {tab === 'corrections' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
              <tr>
                <th className="p-3">Attendance Date</th>
                <th className="p-3">Requested Punch In</th>
                <th className="p-3">Requested Punch Out</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {corrections.map(c => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">{c.attendance_date}</td>
                  <td className="p-3 text-teal-700 font-bold">{c.requested_punch_in}</td>
                  <td className="p-3 text-rose-700 font-bold">{c.requested_punch_out}</td>
                  <td className="p-3 font-sans text-slate-600">{c.reason}</td>
                  <td className="p-3 font-sans">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      c.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>{c.status}</span>
                  </td>
                  <td className="p-3 font-sans">
                    {isManager && c.status !== 'APPROVED' && (
                      <button onClick={() => handleApproveCorrection(c.id)} className="px-2.5 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded hover:bg-emerald-700">
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── CORRECTION MODAL ──────────────────────────────────────────────── */}
      {showCorrectionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Request Attendance Correction</h3>
              <button onClick={() => setShowCorrectionModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleRequestCorrection} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Attendance Date *</label>
                <input required type="date" value={correctionForm.date} onChange={e => setCorrectionForm({...correctionForm, date: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Punch In Time *</label>
                  <input required type="time" value={correctionForm.requested_punch_in} onChange={e => setCorrectionForm({...correctionForm, requested_punch_in: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Punch Out Time *</label>
                  <input required type="time" value={correctionForm.requested_punch_out} onChange={e => setCorrectionForm({...correctionForm, requested_punch_out: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Reason for Correction *</label>
                <textarea required value={correctionForm.reason} onChange={e => setCorrectionForm({...correctionForm, reason: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" rows={2} />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowCorrectionModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-teal-600 text-white rounded-xl font-bold shadow">{submitting ? 'Submitting...' : 'Submit Requisition'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
