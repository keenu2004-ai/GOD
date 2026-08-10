import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart2, Calendar, FileText, Download, RefreshCw,
  TrendingUp, Users, Clock, AlertTriangle, CheckCircle2,
  XCircle, MapPin, Filter, ChevronLeft, ChevronRight,
  Activity, Zap, Eye, Building2, DollarSign, Shield
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

// ─── Types ─────────────────────────────────────────────────────────────────
interface KPI {
  total_employees: number;
  present_today: number;
  absent_today: number;
  working_now: number;
  late_today: number;
  half_day_today: number;
  wfh_today: number;
  on_leave_today: number;
  overtime_count: number;
  avg_work_hours: number;
  attendance_rate: number;
  pending_regularizations: number;
}

interface TrendPoint {
  date: string;
  present_count: number;
  late_count: number;
  overtime_count: number;
  avg_hours: number;
  half_day_count: number;
}

interface DeptRow { department_name: string; total_employees: number; attendance_rate: number; avg_work_hours: number; late_count: number; }
interface BranchRow { branch_name: string; total_employees: number; attendance_rate: number; avg_work_hours: number; late_count: number; }

interface LeaveKPI {
  total_applications: number;
  pending_requests: number;
  approved_requests: number;
  rejected_requests: number;
  avg_duration: number;
  balance_utilization: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
const fmtDate = (s: string) => s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = (s: string | null) => s ? new Date(s).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';

function exportCSV(data: any[], filename: string) {
  if (!data || !data.length) return alert('No data to export');
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(r =>
    Object.values(r).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
  );
  const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
}

// ─── Mini SVG Bar Chart ────────────────────────────────────────────────────
const MiniBar: React.FC<{ value: number; max: number; color: string; label: string }> = ({ value, max, color, label }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 text-slate-600 truncate text-right">{label}</span>
      <div className="flex-1 h-4 bg-slate-100 rounded overflow-hidden">
        <div className="h-full rounded transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="w-10 text-right font-mono text-slate-700">{value}</span>
    </div>
  );
};

// ─── SVG Sparkline ────────────────────────────────────────────────────────
const Sparkline: React.FC<{ data: number[]; color: string; height?: number }> = ({ data, color, height = 40 }) => {
  if (!data || data.length === 0) return <div style={{ height }} />;
  const max = Math.max(...data) || 1;
  const min = Math.min(...data);
  const w = 200; const h = height;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
      <polyline fill="none" stroke={color} strokeWidth="2" points={pts} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ─── Donut Ring ────────────────────────────────────────────────────────────
const DonutRing: React.FC<{ value: number; max: number; color: string; size?: number }> = ({ value, max, color, size = 64 }) => {
  const r = 20; const circ = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const dash = pct * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 50 50">
      <circle cx="25" cy="25" r={r} fill="none" stroke="#e2e8f0" strokeWidth="6" />
      <circle cx="25" cy="25" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dasharray 0.7s' }} />
      <text x="25" y="25" textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="bold" fill={color}>
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
};

// ─── Calendar ─────────────────────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const STATUS_CELL: Record<string, { bg: string; text: string; dot: string }> = {
  PRESENT:       { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: '#10B981' },
  LATE:          { bg: 'bg-amber-50 border-amber-200',   text: 'text-amber-700',   dot: '#F59E0B' },
  HALF_DAY:      { bg: 'bg-blue-50 border-blue-200',     text: 'text-blue-700',    dot: '#3B82F6' },
  WORK_FROM_HOME:{ bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700',  dot: '#6366F1' },
  REMOTE:        { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700',  dot: '#6366F1' },
  LEAVE:         { bg: 'bg-rose-50 border-rose-200',     text: 'text-rose-700',    dot: '#F43F5E' },
  HOLIDAY:       { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700',  dot: '#8B5CF6' },
  ABSENT:        { bg: 'bg-red-50 border-red-200',       text: 'text-red-600',     dot: '#EF4444' },
  OVERTIME:      { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700',  dot: '#F97316' },
};

interface CalDay { date: string; att?: any; leave?: any; holiday?: any; }

const AttendanceCalendar: React.FC<{ employeeId: number | null; isManager: boolean }> = ({ employeeId, isManager }) => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [calData, setCalData] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<CalDay | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCal = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ year: String(year), month: String(month) });
      if (isManager && employeeId) params.set('employeeId', String(employeeId));
      const res = await apiClient.get(`/analytics/attendance/calendar?${params}`);
      setCalData(res.data?.data || null);
    } catch { /* non-fatal */ }
    finally { setLoading(false); }
  }, [year, month, employeeId, isManager]);

  useEffect(() => { fetchCal(); }, [year, month]);

  const days: CalDay[] = useMemo(() => {
    if (!calData) return [];
    const result: CalDay[] = [];
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date().toISOString().split('T')[0];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const att = calData.attendance?.find((a: any) => a.date_str === dateStr);
      const leave = calData.leaves?.find((l: any) => l.date_str === dateStr);
      const holiday = calData.holidays?.find((h: any) => h.date_str === dateStr);
      result.push({ date: dateStr, att, leave, holiday });
    }
    return result;
  }, [calData, year, month]);

  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const today = new Date().toISOString().split('T')[0];

  const getStyle = (day: CalDay) => {
    if (day.holiday) return STATUS_CELL.HOLIDAY;
    if (day.leave) return STATUS_CELL.LEAVE;
    if (day.att?.status) return STATUS_CELL[day.att.status as string] || STATUS_CELL.PRESENT;
    const d = new Date(day.date);
    const isFuture = day.date > today;
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    if (isWeekend) return { bg: 'bg-slate-50', text: 'text-slate-400', dot: '' };
    if (!isFuture && !day.att) return STATUS_CELL.ABSENT;
    return { bg: '', text: 'text-slate-700', dot: '' };
  };

  const prev = () => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1); };
  const next = () => { if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1); };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Calendar header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
        <button onClick={prev} className="p-2 hover:bg-slate-200 rounded-lg"><ChevronLeft className="w-4 h-4 text-slate-600" /></button>
        <div className="text-center">
          <h3 className="font-black text-slate-900">{MONTHS[month - 1]} {year}</h3>
          <p className="text-xs text-slate-500">{loading ? 'Loading...' : `${days.filter(d => d.att).length} attendance records`}</p>
        </div>
        <button onClick={next} className="p-2 hover:bg-slate-200 rounded-lg"><ChevronRight className="w-4 h-4 text-slate-600" /></button>
      </div>

      {/* Legend */}
      <div className="px-5 py-2 flex flex-wrap gap-3 border-b border-slate-100 text-[10px] bg-slate-50">
        {Object.entries(STATUS_CELL).filter(([k]) => !['REMOTE','OVERTIME'].includes(k)).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: v.dot }} />
            <span className="text-slate-600">{k.replace(/_/g, ' ')}</span>
          </span>
        ))}
      </div>

      {/* Grid */}
      <div className="p-4">
        <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-500 uppercase mb-2">
          {DAY_NAMES.map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
          {days.map(day => {
            const dayNum = parseInt(day.date.split('-')[2]);
            const isToday = day.date === today;
            const isFuture = day.date > today;
            const style = getStyle(day);
            return (
              <button key={day.date}
                onClick={() => setSelectedDay(selectedDay?.date === day.date ? null : day)}
                className={`relative rounded-xl border p-1 aspect-square flex flex-col items-center justify-start transition-all text-xs
                  ${style.bg || 'border-transparent hover:bg-slate-50'}
                  ${isToday ? 'ring-2 ring-violet-500 ring-offset-1' : ''}
                  ${isFuture ? 'opacity-40 cursor-default' : 'cursor-pointer hover:shadow-sm'}`}
              >
                <span className={`font-bold text-xs leading-none mt-0.5 ${style.text || 'text-slate-700'} ${isToday ? 'text-violet-700' : ''}`}>
                  {dayNum}
                </span>
                {style.dot && <span className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ backgroundColor: style.dot }} />}
                {day.att?.is_overtime && <span className="text-[8px] text-orange-500 font-bold leading-none">OT</span>}
                {day.att?.is_late && !day.att?.is_overtime && <span className="text-[8px] text-amber-500 font-bold leading-none">L</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day detail panel */}
      {selectedDay && (
        <div className="border-t border-slate-200 bg-slate-50 p-4 text-xs space-y-2">
          <p className="font-black text-slate-900">{fmtDate(selectedDay.date)}</p>
          {selectedDay.holiday && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 text-purple-700">
              🎉 <b>{selectedDay.holiday.holiday_name}</b> ({selectedDay.holiday.holiday_type})
            </div>
          )}
          {selectedDay.leave && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 text-rose-700">
              🏖️ On Leave: <b>{selectedDay.leave.leave_type}</b>
            </div>
          )}
          {selectedDay.att ? (
            <div className="bg-white border border-slate-200 rounded-lg p-3 grid grid-cols-3 gap-2 text-slate-700">
              <div><p className="text-slate-400">Status</p><p className="font-bold">{selectedDay.att.status}</p></div>
              <div><p className="text-slate-400">Clock In</p><p className="font-mono">{fmtTime(selectedDay.att.punch_in)}</p></div>
              <div><p className="text-slate-400">Clock Out</p><p className="font-mono">{fmtTime(selectedDay.att.punch_out)}</p></div>
              <div><p className="text-slate-400">Work Hours</p><p className="font-bold">{parseFloat(selectedDay.att.work_hours || 0).toFixed(2)}h</p></div>
              <div><p className="text-slate-400">Break</p><p>{selectedDay.att.break_duration_mins || 0} min</p></div>
              <div><p className="text-slate-400">Shift</p><p className="truncate">{selectedDay.att.shift_name || '—'}</p></div>
              {selectedDay.att.is_late && <div className="col-span-3 bg-amber-50 border border-amber-200 rounded-lg p-1.5 text-amber-700 font-bold text-center">⚠️ Late Arrival</div>}
              {selectedDay.att.is_overtime && <div className="col-span-3 bg-orange-50 border border-orange-200 rounded-lg p-1.5 text-orange-700 font-bold text-center">⏰ Overtime</div>}
            </div>
          ) : !selectedDay.holiday && !selectedDay.leave ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-red-600 font-bold text-center">
              ❌ Absent — No attendance record
            </div>
          ) : null}
        </div>
      )}

      {/* Monthly summary footer */}
      <div className="border-t border-slate-100 px-5 py-3 grid grid-cols-5 text-center text-[10px]">
        {[
          { label: 'Present', value: days.filter(d => d.att && !['HALF_DAY'].includes(d.att.status)).length, color: '#10B981' },
          { label: 'Half Day', value: days.filter(d => d.att?.status === 'HALF_DAY').length, color: '#3B82F6' },
          { label: 'Late', value: days.filter(d => d.att?.is_late).length, color: '#F59E0B' },
          { label: 'Absent', value: days.filter(d => !d.att && !d.leave && !d.holiday && d.date <= today && new Date(d.date).getDay() !== 0 && new Date(d.date).getDay() !== 6).length, color: '#EF4444' },
          { label: 'Leave', value: days.filter(d => d.leave).length, color: '#F43F5E' },
        ].map(s => (
          <div key={s.label}>
            <p className="font-black text-base" style={{ color: s.color }}>{s.value}</p>
            <p className="text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────
export const AttendanceAnalyticsTab: React.FC = () => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const userId = (user as any)?.id || 0;
  const isManager = ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'DEPT_HEAD'].includes(userRole);

  const [tab, setTab] = useState<'overview' | 'calendar' | 'reports' | 'payroll' | 'leave_analytics'>('overview');
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  
  const [leaveKpi, setLeaveKpi] = useState<LeaveKPI | null>(null);
  const [leaveTrend, setLeaveTrend] = useState<any[]>([]);
  const [leaveDepts, setLeaveDepts] = useState<any[]>([]);
  const [depts, setDepts] = useState<DeptRow[]>([]);
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [hourDist, setHourDist] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Report state
  const [reportType, setReportType] = useState('monthly-summary');
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Payroll sync
  const [payrollData, setPayrollData] = useState<any[]>([]);
  const [payMonth, setPayMonth] = useState(() => new Date().getMonth() + 1);
  const [payYear, setPayYear] = useState(() => new Date().getFullYear());
  const [payLoading, setPayLoading] = useState(false);

  const fetchOverview = useCallback(async () => {
    if (!isManager) return;
    setLoading(true);
    try {
      const [kpiRes, trendRes, deptRes, branchRes, distRes] = await Promise.all([
        apiClient.get('/analytics/attendance/dashboard'),
        apiClient.get('/analytics/attendance/trend?days=30'),
        apiClient.get('/analytics/attendance/departments'),
        apiClient.get('/analytics/attendance/branches'),
        apiClient.get('/analytics/attendance/work-hour-distribution'),
      ]);
      setKpi(kpiRes.data?.data || null);
      setTrend(trendRes.data?.data || []);
      setDepts(deptRes.data?.data || []);
      setBranches(branchRes.data?.data || []);
      setHourDist(distRes.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [isManager]);

  const fetchLeaveAnalytics = useCallback(async () => {
    if (!isManager) return;
    setLoading(true);
    try {
      const [kpiRes, trendRes, deptRes] = await Promise.all([
        apiClient.get('/analytics/leave/kpis'),
        apiClient.get('/analytics/leave/trend'),
        apiClient.get('/analytics/leave/departments'),
      ]);
      setLeaveKpi(kpiRes.data?.data || null);
      setLeaveTrend(trendRes.data?.data || []);
      setLeaveDepts(deptRes.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [isManager]);

  useEffect(() => { 
    if (tab === 'overview') fetchOverview(); 
    else if (tab === 'leave_analytics') fetchLeaveAnalytics();
  }, [tab, fetchOverview, fetchLeaveAnalytics]);

  const runReport = async () => {
    setReportLoading(true);
    setReportData([]);
    try {
      const base = '/analytics/attendance';
      let url = '';
      const params = `startDate=${startDate}&endDate=${endDate}`;
      if (reportType === 'monthly-summary') url = `${base}/monthly-summary?${params}`;
      else if (reportType === 'late-report') url = `${base}/late-report?${params}`;
      else if (reportType === 'overtime-report') url = `${base}/overtime-report?${params}`;
      else if (reportType === 'absent-report') url = `${base}/absent-report?date=${endDate}`;
      else if (reportType === 'gps-compliance') url = `${base}/gps-compliance?${params}`;
      else if (reportType === 'employee-report') url = `${base}/employee-report?${params}`;
      const res = await apiClient.get(url);
      const d = res.data?.data;
      setReportData(Array.isArray(d) ? d : (d?.records || []));
    } catch (e: any) { alert(e.response?.data?.message || 'Report failed'); }
    finally { setReportLoading(false); }
  };

  const fetchPayroll = async () => {
    setPayLoading(true);
    try {
      const res = await apiClient.get(`/analytics/attendance/payroll-sync?year=${payYear}&month=${payMonth}`);
      setPayrollData(res.data?.data || []);
    } catch (e: any) { alert(e.response?.data?.message || 'Payroll sync failed'); }
    finally { setPayLoading(false); }
  };

  const maxPresent = Math.max(...trend.map(t => t.present_count), 1);

  const KPI_CARDS = kpi ? [
    { label: 'Total Employees', value: kpi.total_employees, icon: <Users className="w-5 h-5" />, color: '#6366F1', sub: 'Active headcount' },
    { label: 'Present Today', value: kpi.present_today, icon: <CheckCircle2 className="w-5 h-5" />, color: '#10B981', sub: `${kpi.attendance_rate}% rate` },
    { label: 'Absent Today', value: kpi.absent_today, icon: <XCircle className="w-5 h-5" />, color: '#EF4444', sub: 'Not marked' },
    { label: 'Late Today', value: kpi.late_today, icon: <AlertTriangle className="w-5 h-5" />, color: '#F59E0B', sub: 'After grace time' },
    { label: 'On Leave', value: kpi.on_leave_today, icon: <Calendar className="w-5 h-5" />, color: '#F43F5E', sub: 'Approved leave' },
    { label: 'WFH Today', value: kpi.wfh_today, icon: <Building2 className="w-5 h-5" />, color: '#3B82F6', sub: 'Remote / Hybrid' },
    { label: 'Overtime', value: kpi.overtime_count, icon: <Zap className="w-5 h-5" />, color: '#F97316', sub: 'Worked >9 hrs' },
    { label: 'Avg Hours', value: kpi.avg_work_hours?.toFixed(1) + 'h', icon: <Clock className="w-5 h-5" />, color: '#8B5CF6', sub: 'Today avg' },
  ] : [];

  const TABS = [
    { key: 'overview', label: 'Analytics Overview', icon: <BarChart2 className="w-4 h-4" /> },
    { key: 'calendar', label: 'Attendance Calendar', icon: <Calendar className="w-4 h-4" /> },
    { key: 'reports', label: 'Reports Center', icon: <FileText className="w-4 h-4" /> },
    ...(isManager ? [{ key: 'payroll', label: 'Payroll Sync', icon: <DollarSign className="w-4 h-4" /> }] : []),
  ];

  const REPORT_TYPES = [
    { value: 'monthly-summary', label: 'Monthly Attendance Summary' },
    { value: 'late-report', label: 'Late Arrival Report' },
    { value: 'overtime-report', label: 'Overtime Report' },
    { value: 'absent-report', label: 'Absent Employees (by date)' },
    { value: 'gps-compliance', label: 'GPS Compliance Report' },
    { value: 'employee-report', label: 'My Attendance Detail' },
  ];

  return (
    <div className="space-y-5 min-h-screen pb-10">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-indigo-900/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/30 rounded-xl">
            <Activity className="w-7 h-7 text-indigo-300" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Attendance Analytics & Reports</h2>
            <p className="text-xs text-indigo-300/70 mt-0.5 font-mono">Live KPIs • Calendar • Multi-format Reports • Payroll Sync</p>
          </div>
        </div>

        {/* Quick KPI strip */}
        {kpi && (
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mt-5">
            {KPI_CARDS.map(k => (
              <div key={k.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <p className="text-xl font-black" style={{ color: k.color }}>{k.value}</p>
                <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">{k.label}</p>
              </div>
            ))}
          </div>
        )}
        {!kpi && isManager && (
          <div className="mt-5 text-center text-indigo-300/60 text-sm animate-pulse">Loading live analytics…</div>
        )}
      </div>

      {/* ─── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              tab === t.key ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-500 hover:text-slate-800'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ─── OVERVIEW TAB ────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {!isManager && (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <Shield className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-600">Manager / Admin access required</p>
              <p className="text-xs text-slate-400 mt-1">Use the Calendar tab to view your own attendance</p>
            </div>
          )}

          {isManager && (
            <>
              <div className="flex justify-end">
                <button onClick={fetchOverview} className="flex items-center gap-2 text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-3 py-2 rounded-xl">
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>

              {/* 30-day trend sparkline panel */}
              {trend.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="font-black text-slate-900 text-sm mb-1 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-500" /> 30-Day Attendance Trend
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">Daily present count over the last 30 days</p>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-black text-indigo-600">{trend[trend.length-1]?.present_count ?? '—'}</p>
                      <p className="text-xs text-slate-500">Latest Day Present</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black text-amber-500">{trend.reduce((s, t) => s + parseInt(String(t.late_count)), 0)}</p>
                      <p className="text-xs text-slate-500">Total Late (30d)</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black text-orange-500">{trend.reduce((s, t) => s + parseInt(String(t.overtime_count)), 0)}</p>
                      <p className="text-xs text-slate-500">Total OT (30d)</p>
                    </div>
                  </div>

                  {/* Present trend */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>{fmtDate(trend[0]?.date)}</span>
                      <span className="font-bold text-indigo-600">Present Count</span>
                      <span>{fmtDate(trend[trend.length-1]?.date)}</span>
                    </div>
                    <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                      <Sparkline data={trend.map(t => parseInt(String(t.present_count)))} color="#6366F1" height={48} />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                      <div className="flex justify-between text-[10px] text-amber-500 mb-1">
                        <span>Late Trend</span>
                        <AlertTriangle className="w-3 h-3" />
                      </div>
                      <Sparkline data={trend.map(t => parseInt(String(t.late_count)))} color="#F59E0B" height={32} />
                    </div>
                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
                      <div className="flex justify-between text-[10px] text-orange-500 mb-1">
                        <span>Overtime Trend</span>
                        <Zap className="w-3 h-3" />
                      </div>
                      <Sparkline data={trend.map(t => parseInt(String(t.overtime_count)))} color="#F97316" height={32} />
                    </div>
                  </div>
                </div>
              )}

              {/* Department + Branch Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Department */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="font-black text-slate-900 text-sm mb-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-500" /> Department Comparison
                  </h3>
                  <div className="space-y-2.5">
                    {depts.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No data</p>}
                    {depts.map((d, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-700 truncate">{d.department_name}</span>
                          <span className="font-mono text-slate-500">{d.total_employees} emp</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${d.attendance_rate || 0}%` }} />
                          </div>
                          <span className="text-xs font-bold text-indigo-600 w-10 text-right">{d.attendance_rate || 0}%</span>
                        </div>
                        <p className="text-[10px] text-slate-400">Avg {d.avg_work_hours || 0}h • Late: {d.late_count}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Branch */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="font-black text-slate-900 text-sm mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-500" /> Branch Comparison
                  </h3>
                  <div className="space-y-2.5">
                    {branches.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No branch data</p>}
                    {branches.map((b, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-700 truncate">{b.branch_name}</span>
                          <span className="font-mono text-slate-500">{b.total_employees} emp</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${b.attendance_rate || 0}%` }} />
                          </div>
                          <span className="text-xs font-bold text-emerald-600 w-10 text-right">{b.attendance_rate || 0}%</span>
                        </div>
                        <p className="text-[10px] text-slate-400">Avg {b.avg_work_hours || 0}h • Late: {b.late_count}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Work Hour Distribution */}
              {hourDist.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="font-black text-slate-900 text-sm mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-500" /> Work Hour Distribution (30 days)
                  </h3>
                  <div className="space-y-2">
                    {hourDist.map(h => (
                      <MiniBar key={h.bucket} label={h.bucket}
                        value={parseInt(h.count)} max={Math.max(...hourDist.map(d => parseInt(d.count)))}
                        color="#6366F1" />
                    ))}
                  </div>
                </div>
              )}

              {/* KPI cards grid */}
              {kpi && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Attendance Rate', value: kpi.attendance_rate, icon: <DonutRing value={kpi.attendance_rate} max={100} color="#10B981" />, desc: 'Today' },
                    { label: 'WFH Rate', value: Math.round(kpi.total_employees > 0 ? (kpi.wfh_today / kpi.total_employees) * 100 : 0), icon: <DonutRing value={kpi.wfh_today} max={kpi.total_employees} color="#3B82F6" />, desc: 'Today' },
                    { label: 'Late Rate', value: Math.round(kpi.total_employees > 0 ? (kpi.late_today / kpi.total_employees) * 100 : 0), icon: <DonutRing value={kpi.late_today} max={kpi.total_employees} color="#F59E0B" />, desc: 'Today' },
                    { label: 'OT Rate', value: Math.round(kpi.total_employees > 0 ? (kpi.overtime_count / kpi.total_employees) * 100 : 0), icon: <DonutRing value={kpi.overtime_count} max={kpi.total_employees} color="#F97316" />, desc: 'Today' },
                  ].map(k => (
                    <div key={k.label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                      {k.icon}
                      <div>
                        <p className="font-black text-slate-900 text-lg">{k.value}%</p>
                        <p className="text-xs font-semibold text-slate-500">{k.label}</p>
                        <p className="text-[10px] text-slate-400">{k.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ─── CALENDAR TAB ────────────────────────────────────────────────── */}
      {tab === 'calendar' && (
        <AttendanceCalendar employeeId={userId} isManager={isManager} />
      )}

      {/* ─── REPORTS TAB ─────────────────────────────────────────────────── */}
      {tab === 'reports' && (
        <div className="space-y-4">
          {/* Report Controls */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="font-black text-slate-900 text-sm mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-500" /> Report Configuration
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-1">
                <label className="text-xs font-semibold text-slate-500">Report Type</label>
                <select value={reportType} onChange={e => setReportType(e.target.value)}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none">
                  {REPORT_TYPES.filter(r => isManager || r.value === 'employee-report').map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">End Date</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="flex items-end gap-2">
                <button onClick={runReport} disabled={reportLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow">
                  <BarChart2 className="w-3.5 h-3.5" />{reportLoading ? 'Loading…' : 'Run Report'}
                </button>
                {reportData.length > 0 && (
                  <button onClick={() => exportCSV(reportData, `${reportType}_${startDate}_${endDate}.csv`)}
                    className="flex items-center gap-1 bg-emerald-600 text-white text-xs font-bold px-3 py-2.5 rounded-xl shadow">
                    <Download className="w-3.5 h-3.5" /> CSV
                  </button>
                )}
              </div>
            </div>

            {/* Quick date presets */}
            <div className="flex flex-wrap gap-2 mt-4">
              {[
                { label: 'Today', fn: () => { const d = new Date().toISOString().split('T')[0]; setStartDate(d); setEndDate(d); }},
                { label: 'This Week', fn: () => { const now = new Date(); const mon = new Date(now); mon.setDate(now.getDate() - now.getDay() + 1); setStartDate(mon.toISOString().split('T')[0]); setEndDate(now.toISOString().split('T')[0]); }},
                { label: 'This Month', fn: () => { const now = new Date(); setStartDate(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`); setEndDate(now.toISOString().split('T')[0]); }},
                { label: 'Last 30d', fn: () => { setStartDate(new Date(Date.now()-30*86400000).toISOString().split('T')[0]); setEndDate(new Date().toISOString().split('T')[0]); }},
              ].map(p => (
                <button key={p.label} onClick={p.fn} className="text-[11px] bg-slate-100 text-slate-600 font-bold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-200">
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Report Results */}
          {reportLoading && (
            <div className="text-center py-12 text-slate-400 animate-pulse">
              <BarChart2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p>Generating report from PostgreSQL…</p>
            </div>
          )}

          {!reportLoading && reportData.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{REPORT_TYPES.find(r => r.value === reportType)?.label}</h4>
                  <p className="text-xs text-slate-500">{reportData.length} records • {fmtDate(startDate)} – {fmtDate(endDate)}</p>
                </div>
                <button onClick={() => exportCSV(reportData, `${reportType}_${startDate}_${endDate}.csv`)}
                  className="flex items-center gap-2 text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-2 rounded-lg border border-indigo-200">
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                    <tr>{Object.keys(reportData[0]).map(k => <th key={k} className="p-3 whitespace-nowrap">{k.replace(/_/g, ' ')}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        {Object.values(row).map((v: any, j) => (
                          <td key={j} className="p-3 whitespace-nowrap font-mono">
                            {v === null || v === undefined ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!reportLoading && reportData.length === 0 && reportType && (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <FileText className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-slate-500 font-bold">Click "Run Report" to generate data</p>
              <p className="text-xs text-slate-400 mt-1">All reports fetch live data from PostgreSQL</p>
            </div>
          )}
        </div>
      )}

      {/* ─── PAYROLL SYNC TAB ────────────────────────────────────────────── */}
      {tab === 'payroll' && isManager && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="font-black text-slate-900 text-sm mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" /> Payroll-Attendance Synchronization
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              This report calculates payable days, deductions, and overtime pay based on attendance data for the selected period. All values are for reference; final payroll is processed in the Payroll module.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500">Month</label>
                <select value={payMonth} onChange={e => setPayMonth(parseInt(e.target.value))}
                  className="mt-1 block border border-slate-300 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none">
                  {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Year</label>
                <select value={payYear} onChange={e => setPayYear(parseInt(e.target.value))}
                  className="mt-1 block border border-slate-300 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500 outline-none">
                  {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <button onClick={fetchPayroll} disabled={payLoading}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow">
                <Activity className="w-3.5 h-3.5" />{payLoading ? 'Calculating…' : 'Sync Attendance → Payroll'}
              </button>
              {payrollData.length > 0 && (
                <button onClick={() => exportCSV(payrollData, `Payroll_Sync_${MONTHS[payMonth-1]}_${payYear}.csv`)}
                  className="flex items-center gap-2 bg-slate-100 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200">
                  <Download className="w-3.5 h-3.5" /> Export
                </button>
              )}
            </div>
          </div>

          {payrollData.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Payroll Attendance Data — {MONTHS[payMonth-1]} {payYear}</h4>
                  <p className="text-xs text-slate-500">{payrollData.length} employees</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Employee</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Present</th>
                      <th className="p-3">Leave</th>
                      <th className="p-3">Absent</th>
                      <th className="p-3">Late Days</th>
                      <th className="p-3">OT Hrs</th>
                      <th className="p-3">Work Hrs</th>
                      <th className="p-3">Late Ded.</th>
                      <th className="p-3">OT Pay</th>
                      <th className="p-3 text-emerald-700">Gross Payable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payrollData.map((r: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{r.first_name} {r.last_name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{r.employee_code}</p>
                        </td>
                        <td className="p-3 text-slate-600">{r.department_name}</td>
                        <td className="p-3 font-semibold text-emerald-600">{r.present_days}</td>
                        <td className="p-3 text-blue-600">{r.approved_leave_days}</td>
                        <td className="p-3 text-red-600">{r.absent_days}</td>
                        <td className="p-3 text-amber-600">{r.late_days}</td>
                        <td className="p-3 text-orange-600">{r.total_ot_hours}</td>
                        <td className="p-3 font-mono">{r.total_work_hours}h</td>
                        <td className="p-3 text-red-600 font-mono">-₹{r.late_deduction}</td>
                        <td className="p-3 text-emerald-600 font-mono">+₹{r.overtime_pay}</td>
                        <td className="p-3 font-black text-emerald-700 font-mono">₹{Number(r.gross_payable).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-xs">
                    <tr>
                      <td colSpan={2} className="p-3">TOTAL</td>
                      <td className="p-3 text-emerald-600">{payrollData.reduce((s, r) => s + parseInt(r.present_days || '0'), 0)}</td>
                      <td className="p-3 text-blue-600">{payrollData.reduce((s, r) => s + parseInt(r.approved_leave_days || '0'), 0)}</td>
                      <td className="p-3 text-red-600">{payrollData.reduce((s, r) => s + parseFloat(r.absent_days || '0'), 0).toFixed(1)}</td>
                      <td className="p-3 text-amber-600">{payrollData.reduce((s, r) => s + parseInt(r.late_days || '0'), 0)}</td>
                      <td className="p-3 text-orange-600">{payrollData.reduce((s, r) => s + parseFloat(r.total_ot_hours || '0'), 0).toFixed(2)}</td>
                      <td className="p-3">{payrollData.reduce((s, r) => s + parseFloat(r.total_work_hours || '0'), 0).toFixed(2)}h</td>
                      <td className="p-3 text-red-600">-₹{payrollData.reduce((s, r) => s + parseFloat(r.late_deduction || '0'), 0).toFixed(2)}</td>
                      <td className="p-3 text-emerald-600">+₹{payrollData.reduce((s, r) => s + parseFloat(r.overtime_pay || '0'), 0).toFixed(2)}</td>
                      <td className="p-3 text-emerald-700">₹{payrollData.reduce((s, r) => s + parseFloat(r.gross_payable || '0'), 0).toLocaleString('en-IN')}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {!payLoading && payrollData.length === 0 && (
            <div className="text-center py-14 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-500">Click "Sync" to calculate payroll from attendance data</p>
              <p className="text-xs text-slate-400 mt-1">Calculates present days, absent days, late deductions, OT pay, and gross payable for each employee</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
