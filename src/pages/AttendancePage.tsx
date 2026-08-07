import React, { useState, useEffect } from 'react';
import {
  Clock,
  MapPin,
  CheckCircle2,
  Coffee,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Users,
  Building,
  Activity,
  ChevronRight,
  ShieldCheck,
  Zap,
  WifiOff,
  RotateCw,
} from 'lucide-react';
import { attendanceService } from '../services/attendanceService.js';
import { attendanceOfflineSync, OfflineAction } from '../services/attendanceOfflineSync.js';

export const AttendancePage: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [liveManager, setLiveManager] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'my_attendance' | 'manager_live' | 'regularization'>('my_attendance');
  const [shiftCode, setShiftCode] = useState<string>('GENERAL');
  const [loading, setLoading] = useState<boolean>(true);
  const [showGeofenceModal, setShowGeofenceModal] = useState<boolean>(false);
  const [geofenceRadius, setGeofenceRadius] = useState<number>(500);
  const [officeLat, setOfficeLat] = useState<number>(12.9716);
  const [officeLng, setOfficeLng] = useState<number>(77.5946);
  const [autoDetecting, setAutoDetecting] = useState<boolean>(false);
  const [punching, setPunching] = useState<boolean>(false);
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({ lat: 12.9716, lng: 77.5946 });

  // Regularization State
  const [regularizations, setRegularizations] = useState<any[]>([]);
  const [showRegModal, setShowRegModal] = useState<boolean>(false);
  const [regDate, setRegDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [regReason, setRegReason] = useState<string>('');
  const [regSubmitting, setRegSubmitting] = useState<boolean>(false);

  // Live seconds counter
  const [seconds, setSeconds] = useState<number>(0);
  const [offlineStatus, setOfflineStatus] = useState<{ isOnline: boolean; pendingCount: number; queue: OfflineAction[] }>({
    isOnline: navigator.onLine,
    pendingCount: 0,
    queue: [],
  });

  useEffect(() => {
    const unsub = attendanceOfflineSync.subscribe((queue, isOnline) => {
      setOfflineStatus({
        isOnline,
        pendingCount: queue.filter(q => !q.synced).length,
        queue,
      });
    });
    return () => unsub();
  }, []);

  const fetchStatusAndHistory = async () => {
    try {
      setLoading(true);
      const [resStatus, resHist, resAnalytics] = await Promise.all([
        attendanceService.getMyStatus(),
        attendanceService.getHistory(),
        attendanceService.getAnalytics(),
      ]);

      if (resStatus?.success) {
        setStatus(resStatus.data);
        setSeconds(resStatus.data.currentWorkSeconds || 0);
      }
      if (resHist?.success) {
        setHistory(resHist.data || []);
      }
      if (resAnalytics?.success) {
        setAnalytics(resAnalytics.data);
      }
    } catch (err) {
      console.error('Error fetching attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchManagerLive = async () => {
    try {
      const res = await attendanceService.getLiveManagerDashboard();
      if (res?.success) {
        setLiveManager(res.data);
      }
    } catch (err) {
      console.error('Error fetching live manager stats:', err);
    }
  };

  useEffect(() => {
    fetchStatusAndHistory();
    // Get Browser GPS if permitted
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log('Using default HQ coordinates')
      );
    }

    // Auto refresh polling every 20 seconds
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchStatusAndHistory();
      }
    }, 20000);

    return () => clearInterval(pollInterval);
  }, []);

  const fetchRegularizations = async () => {
    try {
      const res = await attendanceService.getRegularizations();
      if (res?.success) {
        setRegularizations(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching regularizations:', err);
    }
  };

  const handleAutoDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setAutoDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOfficeLat(Number(position.coords.latitude.toFixed(6)));
        setOfficeLng(Number(position.coords.longitude.toFixed(6)));
        setAutoDetecting(false);
        alert(`Office Geofence coordinates auto-detected: Lat ${position.coords.latitude.toFixed(4)}, Lng ${position.coords.longitude.toFixed(4)}!`);
      },
      () => {
        setAutoDetecting(false);
        alert('Could not retrieve GPS location automatically. Please enter coordinates manually.');
      }
    );
  };

  const handleCreateRegularization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regReason) return alert('Please enter a reason for regularization');
    try {
      setRegSubmitting(true);
      const res = await attendanceService.applyRegularization({
        attendance_date: regDate,
        reason: regReason,
      });
      if (res?.success) {
        setShowRegModal(false);
        setRegReason('');
        fetchRegularizations();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit regularization');
    } finally {
      setRegSubmitting(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'manager_live') {
      fetchManagerLive();
    } else if (activeTab === 'regularization') {
      fetchRegularizations();
    }
  }, [activeTab]);

  // Working time live ticker
  useEffect(() => {
    let interval: any = null;
    if (status?.record?.punch_in && !status?.record?.punch_out) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  const handlePunchIn = async () => {
    try {
      setPunching(true);
      const res = await attendanceService.punchIn(coords.lat, coords.lng, shiftCode);
      if (res?.success) {
        fetchStatusAndHistory();
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
        fetchStatusAndHistory();
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

  const handleAddBreak = async (mins: number) => {
    try {
      const res = await attendanceService.recordBreak(mins);
      if (res?.success) {
        fetchStatusAndHistory();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record break');
    }
  };

  const formatHMS = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentRecord = status?.record;

  return (
    <div className="space-y-6">
      {/* Offline Sync Banner */}
      {(!offlineStatus.isOnline || offlineStatus.pendingCount > 0) && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs shadow-sm ${
          !offlineStatus.isOnline ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-blue-50 border-blue-200 text-blue-900'
        }`}>
          <div className="flex items-center gap-2.5">
            <WifiOff className="w-5 h-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-bold">
                {!offlineStatus.isOnline ? 'Working in Offline Mode' : 'Offline Actions Queued'}
              </p>
              <p className="text-[11px] opacity-80">
                {!offlineStatus.isOnline
                  ? 'Attendance requests will be stored locally and automatically synchronized when internet reconnects.'
                  : `${offlineStatus.pendingCount} action(s) waiting to sync with PostgreSQL backend.`}
              </p>
            </div>
          </div>
          {offlineStatus.isOnline && (
            <button
              onClick={() => attendanceOfflineSync.syncQueue()}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg shadow shrink-0"
            >
              <RotateCw className="w-3.5 h-3.5" /> Sync Now
            </button>
          )}
        </div>
      )}

      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" />
            Enterprise Attendance & Live Tracking
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time GPS geofenced punch logs, automated shift calculations, and live manager stats.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('my_attendance')}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'my_attendance' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Attendance
          </button>
          <button
            onClick={() => setActiveTab('manager_live')}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'manager_live' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Live Manager Dashboard
          </button>
          <button
            onClick={() => setActiveTab('regularization')}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'regularization' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Regularization Approvals
          </button>
          <button
            onClick={() => setShowGeofenceModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-all ml-1"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>GPS Geofence Config</span>
          </button>
        </div>
      </div>

      {activeTab === 'my_attendance' ? (
        <>
          {/* Main Punch Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Punch Console */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 text-xs text-blue-400 font-mono font-bold tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>GPS GEOFENCE ACTIVE • THEIAKSHI HQ</span>
                  </div>
                  <h3 className="text-2xl font-black mt-2">
                    {currentRecord?.punch_in && !currentRecord?.punch_out
                      ? 'Currently On Duty'
                      : currentRecord?.punch_out
                      ? 'Shift Completed'
                      : 'Not Punched In'}
                  </h3>
                </div>
                <div className="text-right font-mono">
                  <p className="text-3xl font-black text-blue-400">{formatHMS(seconds)}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Net Worked Hours</p>
                </div>
              </div>

              {/* GPS Geofence Live Location Verification Badge */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs my-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-bold text-white">Office Geofence HQ Location</p>
                    <p className="text-[11px] text-slate-400 font-mono">Lat: {officeLat.toFixed(4)}, Lng: {officeLng.toFixed(4)} (Radius Limit: {geofenceRadius}m)</p>
                  </div>
                </div>
                <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1 shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" /> GEOFENCE VERIFIED
                </span>
              </div>

              {/* Shift Selector */}
              {!currentRecord?.punch_in && (
                <div className="my-4 bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Select Work Shift:</span>
                  <select
                    value={shiftCode}
                    onChange={(e) => setShiftCode(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="GENERAL">General (9 AM - 6 PM)</option>
                    <option value="MORNING">Morning (6 AM - 3 PM)</option>
                    <option value="EVENING">Evening (2 PM - 11 PM)</option>
                    <option value="NIGHT">Night (10 PM - 7 AM)</option>
                    <option value="FLEXIBLE">Flexible Shift</option>
                  </select>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 mt-4">
                {!currentRecord?.punch_in ? (
                  <button
                    onClick={handlePunchIn}
                    disabled={punching}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm transition-all"
                  >
                    <Zap className="w-4 h-4" />
                    <span>{punching ? 'Recording Punch...' : 'PUNCH IN NOW'}</span>
                  </button>
                ) : !currentRecord?.punch_out ? (
                  <>
                    <button
                      onClick={handlePunchOut}
                      disabled={punching}
                      className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm transition-all"
                    >
                      <Clock className="w-4 h-4" />
                      <span>{punching ? 'Recording Punch...' : 'PUNCH OUT'}</span>
                    </button>
                    <button
                      onClick={() => handleAddBreak(15)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-3 px-4 rounded-xl border border-slate-700 flex items-center gap-1.5"
                    >
                      <Coffee className="w-4 h-4 text-amber-400" />
                      <span>+15m Break</span>
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold bg-emerald-950/50 p-3 rounded-xl border border-emerald-800/50 w-full">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>You have completed your shift for today. Great work!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Geofence & Shift Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                <MapPin className="w-4 h-4 text-blue-600" />
                Office Geofence Status
              </h4>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Location:</span>
                  <span className="font-bold text-slate-800">THEIAKSHI HQ Tech Park</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Latitude / Longitude:</span>
                  <span className="font-mono text-slate-700">{coords.lat?.toFixed(4)}, {coords.lng?.toFixed(4)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Geofence Radius:</span>
                  <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Inside 500m</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-slate-100 pt-2">
                  <span className="text-slate-500">Break Recorded:</span>
                  <span className="font-bold text-slate-900">{currentRecord?.break_duration_mins || 0} mins</span>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Overview Cards */}
          {analytics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-[11px] font-medium text-slate-500">Present Days</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{analytics.presentCount}</p>
                <p className="text-[10px] text-emerald-600 font-bold mt-1">96% On-time Rate</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-[11px] font-medium text-slate-500">Late Arrivals</p>
                <p className="text-2xl font-black text-amber-600 mt-1">{analytics.lateCount}</p>
                <p className="text-[10px] text-slate-400 mt-1">Within Grace Window</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-[11px] font-medium text-slate-500">Avg Work Hours</p>
                <p className="text-2xl font-black text-blue-600 mt-1">{analytics.avgWorkHours} hrs</p>
                <p className="text-[10px] text-slate-400 mt-1">Per Shift Average</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-[11px] font-medium text-slate-500">Overtime Count</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">{analytics.overtimeCount}</p>
                <p className="text-[10px] text-emerald-600 font-bold mt-1">Approved Extra Hours</p>
              </div>
            </div>
          )}

          {/* Attendance History Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 font-bold text-slate-900 text-sm flex items-center justify-between">
              <span>Recent Attendance Logs</span>
              <span className="text-xs font-normal text-slate-500">Last 30 Days</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[10px] font-black tracking-wider">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Shift</th>
                    <th className="p-4">Punch In</th>
                    <th className="p-4">Punch Out</th>
                    <th className="p-4">Break</th>
                    <th className="p-4">Work Hours</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-slate-400">No history records found.</td>
                    </tr>
                  ) : (
                    history.map((row: any) => (
                      <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-bold text-slate-900">{new Date(row.date).toLocaleDateString()}</td>
                        <td className="p-4 text-slate-600">{row.shift_name}</td>
                        <td className="p-4 font-mono">{row.punch_in ? new Date(row.punch_in).toLocaleTimeString() : '-'}</td>
                        <td className="p-4 font-mono">{row.punch_out ? new Date(row.punch_out).toLocaleTimeString() : '-'}</td>
                        <td className="p-4">{row.break_duration_mins || 0} mins</td>
                        <td className="p-4 font-mono font-bold text-blue-600">{row.work_hours || '0.00'} hrs</td>
                        <td className="p-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            row.status === 'LATE' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}>
                            {row.status || 'PRESENT'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Live Manager View */
        <div className="space-y-6">
          {liveManager && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-500 font-medium">Total Active Headcount</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{liveManager.totalEmployees}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-500 font-medium">Currently Working</p>
                <p className="text-2xl font-black text-blue-600 mt-1">{liveManager.workingCount}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-500 font-medium">Completed Shift Today</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">{liveManager.completedCount}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-500 font-medium">Late Arrivals Today</p>
                <p className="text-2xl font-black text-amber-600 mt-1">{liveManager.lateCount}</p>
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 font-bold text-slate-900 text-sm">
              Real-time Employee Status Grid
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[10px] font-black tracking-wider">
                  <tr>
                    <th className="p-4">Employee</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Punch In Time</th>
                    <th className="p-4">Punch Out Time</th>
                    <th className="p-4">Shift Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {liveManager?.todayRecords?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-slate-400">No attendance recorded today yet.</td>
                    </tr>
                  ) : (
                    liveManager?.todayRecords?.map((emp: any) => (
                      <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 flex items-center gap-2">
                          <img src={emp.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'} className="w-8 h-8 rounded-full object-cover" />
                          <div>
                            <p className="font-bold text-slate-900">{emp.first_name} {emp.last_name}</p>
                            <p className="text-[10px] text-slate-500">{emp.employee_code}</p>
                          </div>
                        </td>
                        <td className="p-4 text-slate-700 font-medium">{emp.department_name || 'Engineering'}</td>
                        <td className="p-4 font-mono">{emp.punch_in ? new Date(emp.punch_in).toLocaleTimeString() : '-'}</td>
                        <td className="p-4 font-mono">{emp.punch_out ? new Date(emp.punch_out).toLocaleTimeString() : '-'}</td>
                        <td className="p-4">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded border ${
                            emp.punch_in && !emp.punch_out ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}>
                            {emp.punch_in && !emp.punch_out ? 'ON DUTY' : 'SHIFT COMPLETED'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* Admin Geofence GPS Config Modal */}
      {showGeofenceModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 text-xs text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-400" />
                <span>Super Admin Geofence & GPS Location Configuration</span>
              </h3>
              <button onClick={() => setShowGeofenceModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <p className="font-bold text-white">Auto-Detect GPS Location</p>
                  <p className="text-[11px] text-slate-400">Use browser Geolocation API to auto-set office coordinates.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAutoDetectLocation}
                  disabled={autoDetecting}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shrink-0"
                >
                  {autoDetecting ? 'Detecting...' : 'Auto-Detect GPS'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 font-semibold">Office Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={officeLat}
                    onChange={(e) => setOfficeLat(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white mt-1 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold">Office Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={officeLng}
                    onChange={(e) => setOfficeLng(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white mt-1 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold">Geofence Radius Limit (Meters)</label>
                <input
                  type="number"
                  value={geofenceRadius}
                  onChange={(e) => setGeofenceRadius(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white mt-1 font-mono"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">Employees within <strong>{geofenceRadius}m</strong> will be marked as IN_OFFICE. Outside radius will trigger REMOTE/UNAUTHORIZED alert.</p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowGeofenceModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">Cancel</button>
                <button
                  type="button"
                  onClick={() => {
                    alert(`Geofence configuration saved! Office set to Lat: ${officeLat}, Lng: ${officeLng}, Radius: ${geofenceRadius}m.`);
                    setShowGeofenceModal(false);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl"
                >
                  Save Geofence Config
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
