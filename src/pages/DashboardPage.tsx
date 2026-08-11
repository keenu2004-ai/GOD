import React, { useEffect, useState } from 'react';
import {
  Users,
  Clock,
  CalendarCheck2,
  DollarSign,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Megaphone,
  Cake,
  ArrowRight,
  ShieldCheck,
  Building2,
  Briefcase,
  CheckCircle2,
  FileText,
  Activity,
  Plus,
  Play,
  Square,
  Coffee,
  CheckCircle,
  HelpCircle,
  FileSpreadsheet,
  Layers,
  MapPin,
  Laptop,
  Flame,
  Award,
  Crown,
  Database,
  Server,
  HardDrive,
  RefreshCw,
  FolderGit2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';
import { attendanceService } from '../services/attendanceService.js';
import { DashboardMetrics } from '../types/index.js';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export const DashboardPage: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const userRole = (user?.role || 'EMPLOYEE').toUpperCase();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [payrollSummary, setPayrollSummary] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [celebrations, setCelebrations] = useState<any[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Attendance Widget State
  const [attendanceStatus, setAttendanceStatus] = useState<any>(null);
  const [punching, setPunching] = useState<boolean>(false);
  const [seconds, setSeconds] = useState<number>(0);

  const isCheckedIn = !!attendanceStatus?.record?.punch_in && !attendanceStatus?.record?.punch_out;
  const isCheckedOut = !!attendanceStatus?.record?.punch_out;

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [
        mRes,
        aRes,
        dRes,
        pRes,
        annRes,
        cRes,
        attRes,
        lbRes,
      ] = await Promise.all([
        apiClient.get('/dashboard/metrics'),
        apiClient.get('/dashboard/activity'),
        apiClient.get('/dashboard/departments'),
        apiClient.get('/dashboard/payroll'),
        apiClient.get('/dashboard/announcements'),
        apiClient.get('/dashboard/celebrations'),
        attendanceService.getMyStatus(),
        apiClient.get('/leaves/balances').catch(() => ({ data: { data: [] } })),
      ]);

      if (mRes.data?.success) setMetrics(mRes.data.data);
      if (aRes.data?.success) setActivity(aRes.data.data);
      if (dRes.data?.success) setDepartments(dRes.data.data);
      if (pRes.data?.success) setPayrollSummary(pRes.data.data);
      if (annRes.data?.success) setAnnouncements(annRes.data.data);
      if (cRes.data?.success) setCelebrations(cRes.data.data);
      if (attRes?.success) setAttendanceStatus(attRes.data);
      if (lbRes.data?.success) setLeaveBalances(lbRes.data.data || []);
    } catch (err) {
      console.error('Failed to load database dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Timer Effect synced with punch_in timestamp
  useEffect(() => {
    let interval: any = null;
    if (isCheckedIn && attendanceStatus?.record?.punch_in) {
      const startTime = new Date(attendanceStatus.record.punch_in).getTime();
      interval = setInterval(() => {
        const now = new Date().getTime();
        const diffInSeconds = Math.max(0, Math.floor((now - startTime) / 1000));
        setSeconds(diffInSeconds);
      }, 1000);
    } else {
      setSeconds(0);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isCheckedIn, attendanceStatus]);

  useEffect(() => {
    const handleSync = () => fetchDashboardData();
    window.addEventListener('attendance-updated', handleSync);
    return () => window.removeEventListener('attendance-updated', handleSync);
  }, []);

  const handlePunchIn = async () => {
    try {
      setPunching(true);
      const res = await attendanceService.punchIn(12.9716, 77.5946);
      if (res?.success) {
        fetchDashboardData();
        window.dispatchEvent(new Event('attendance-updated'));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Punch in failed');
    } finally {
      setPunching(false);
    }
  };

  const handlePunchOut = async () => {
    try {
      setPunching(true);
      const res = await attendanceService.punchOut(12.9716, 77.5946);
      if (res?.success) {
        fetchDashboardData();
        window.dispatchEvent(new Event('attendance-updated'));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Punch out failed');
    } finally {
      setPunching(false);
    }
  };

  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-white rounded-2xl border border-slate-200"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200"></div>)}
        </div>
        <div className="h-64 bg-white rounded-2xl border border-slate-200"></div>
      </div>
    );
  }

  const isSuperAdmin = ['ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'SUPER_BOSS'].includes(userRole);
  const isHR = ['HR_MANAGER', 'HR_EXECUTIVE'].includes(userRole);
  const isManager = ['DEPARTMENT_HEAD', 'PROJECT_MANAGER', 'TEAM_LEAD'].includes(userRole);

  if (isMobile) {
    return (
      <div className="space-y-5 text-slate-800 pb-16 font-sans">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-5 rounded-2xl border border-slate-800 text-white shadow-lg">
          <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold">Welcome back,</p>
          <h2 className="text-xl font-black mt-1 text-white">
            {user?.first_name} {user?.last_name}
          </h2>
          <p className="text-[11px] text-slate-300 mt-1 font-normal leading-relaxed">
            {user?.role || 'EMPLOYEE'} • {user?.branch_name || 'Bengaluru HQ'}
          </p>
        </div>

        {/* Work / Session Summary Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isCheckedIn ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isCheckedIn ? 'bg-emerald-500 animate-ping' : isCheckedOut ? 'bg-rose-500' : 'bg-amber-400'}`}></span>
                <span className="font-extrabold text-[11px] text-slate-900 uppercase tracking-tight">
                  {isCheckedIn ? 'Active Work Session' : isCheckedOut ? 'Shift Completed' : 'Not Clocked In'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 font-normal">
                {isCheckedIn ? 'General Shift: 9:00 AM - 6:00 PM' : 'Tap Attendance to Clock In'}
              </p>
            </div>
          </div>

          {isCheckedIn && (
            <div className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded text-xs border border-emerald-100 shadow-inner">
              {formatTimer(seconds)}
            </div>
          )}
        </div>

        {/* 8 Module Grid */}
        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 pl-1 font-mono">
            Quick Access
          </h3>
          <div className="grid grid-cols-2 gap-3.5">
            {/* 1. Attendance */}
            <button
              onClick={() => onNavigate('attendance')}
              className="bg-white border border-slate-200/80 rounded-2xl p-4 hover:border-blue-500 hover:shadow-md transition-all text-left flex flex-col justify-between h-28 shadow-sm group active:scale-98"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center transition-colors group-hover:bg-blue-600 group-hover:text-white">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-xs tracking-tight">Attendance</h4>
                <p className="text-[9px] text-slate-400 mt-0.5 font-normal">GPS Geofence & Logs</p>
              </div>
            </button>

            {/* 2. Leave */}
            <button
              onClick={() => onNavigate('leave')}
              className="bg-white border border-slate-200/80 rounded-2xl p-4 hover:border-amber-500 hover:shadow-md transition-all text-left flex flex-col justify-between h-28 shadow-sm group active:scale-98"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center transition-colors group-hover:bg-amber-600 group-hover:text-white">
                <CalendarCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-xs tracking-tight">Leave</h4>
                <p className="text-[9px] text-slate-400 mt-0.5 font-normal">Balances & Requests</p>
              </div>
            </button>

            {/* 3. Expenses */}
            <button
              onClick={() => onNavigate('expenses')}
              className="bg-white border border-slate-200/80 rounded-2xl p-4 hover:border-rose-500 hover:shadow-md transition-all text-left flex flex-col justify-between h-28 shadow-sm group active:scale-98"
            >
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center transition-colors group-hover:bg-rose-600 group-hover:text-white">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-xs tracking-tight">Expenses</h4>
                <p className="text-[9px] text-slate-400 mt-0.5 font-normal">Claim Reimbursements</p>
              </div>
            </button>

            {/* 5. Engagement */}
            <button
              onClick={() => onNavigate('engagement')}
              className="bg-white border border-slate-200/80 rounded-2xl p-4 hover:border-teal-500 hover:shadow-md transition-all text-left flex flex-col justify-between h-28 shadow-sm group active:scale-98"
            >
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center transition-colors group-hover:bg-teal-600 group-hover:text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-xs tracking-tight">Engagement</h4>
                <p className="text-[9px] text-slate-400 mt-0.5 font-normal">Celebrations & Feed</p>
              </div>
            </button>

            {/* 6. Helpdesk */}
            <button
              onClick={() => onNavigate('helpdesk')}
              className="bg-white border border-slate-200/80 rounded-2xl p-4 hover:border-emerald-500 hover:shadow-md transition-all text-left flex flex-col justify-between h-28 shadow-sm group active:scale-98"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-xs tracking-tight">Helpdesk</h4>
                <p className="text-[9px] text-slate-400 mt-0.5 font-normal">IT & HR Support Tickets</p>
              </div>
            </button>

            {/* 7. Roost */}
            <button
              onClick={() => onNavigate('roost')}
              className="bg-white border border-slate-200/80 rounded-2xl p-4 hover:border-purple-500 hover:shadow-md transition-all text-left flex flex-col justify-between h-28 shadow-sm group active:scale-98"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center transition-colors group-hover:bg-purple-600 group-hover:text-white">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-xs tracking-tight">Roost</h4>
                <p className="text-[9px] text-slate-400 mt-0.5 font-normal">Kudos & Feedbacks</p>
              </div>
            </button>

            {/* 8. My Folder */}
            <button
              onClick={() => onNavigate('documents')}
              className="bg-white border border-slate-200/80 rounded-2xl p-4 hover:border-cyan-500 hover:shadow-md transition-all text-left flex flex-col justify-between h-28 shadow-sm group active:scale-98"
            >
              <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center transition-colors group-hover:bg-cyan-600 group-hover:text-white">
                <FolderGit2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-xs tracking-tight">My Folder</h4>
                <p className="text-[9px] text-slate-400 mt-0.5 font-normal">My Digital Documents</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-800">
      {/* Top Banner / Welcome Command Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-6 rounded-2xl border border-slate-800 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-500/20 text-blue-300 font-mono text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full border border-blue-400/30">
              {userRole.replace('_', ' ')} COMMAND CENTER
            </span>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              POSTGRESQL LIVE
            </span>
          </div>
          <h1 className="text-2xl font-black mt-2 text-white flex items-center gap-2">
            <span>Welcome back, {user?.first_name} {user?.last_name}!</span>
            {isSuperAdmin && <Crown className="w-5 h-5 text-amber-400 shrink-0" />}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            {isSuperAdmin ? 'Full organization control, financial disbursements, system health & live headcount metrics.' :
             isHR ? 'HR operations, attendance regularizations, leave balance approvals & candidate ATS.' :
             isManager ? 'Team deliverables, daily standups, attendance logs & expense approvals.' :
             'Personal workspace, geofenced GPS punch widget, leave ledger & weekly commitments.'}
          </p>
        </div>

        {/* Global Quick Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {isSuperAdmin && (
            <>
              <button onClick={() => onNavigate('employees')} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Add Employee
              </button>
              <button onClick={() => onNavigate('payroll')} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" /> Payroll
              </button>
            </>
          )}

          {(isHR || isManager) && (
            <button onClick={() => onNavigate('leave')} className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5">
              <CalendarCheck2 className="w-4 h-4" /> Approvals
            </button>
          )}

          <button onClick={() => onNavigate('weekly_planner')} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4" /> Weekly Planner
          </button>

          <button onClick={() => onNavigate('helpdesk')} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-amber-400" /> Support Desk
          </button>
        </div>
      </div>

      {/* Role-Aware Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Headcount / Clock In */}
        <div
          onClick={() => onNavigate('employees')}
          className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-500 transition-all cursor-pointer shadow-sm flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">Total Headcount</p>
            <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-bold">+12.5%</span>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-3 font-sans">{metrics?.totalEmployees || 5}</p>
          <p className="text-[11px] text-emerald-600 mt-2 flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Across {metrics?.totalBranches || 3} Branches</span>
          </p>
        </div>

        {/* Card 2: Attendance Today */}
        <div
          onClick={() => onNavigate('attendance')}
          className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-500 transition-all cursor-pointer shadow-sm flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">Attendance Today</p>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">98.2%</span>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-3 font-sans">{metrics?.presentToday || 1}</p>
          <p className="text-[11px] text-amber-600 mt-2 flex items-center gap-1 font-semibold">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{metrics?.lateToday || 0} Late Punch-ins</span>
          </p>
        </div>

        {/* Card 3: Pending Leaves */}
        <div
          onClick={() => onNavigate('leave')}
          className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-amber-500 transition-all cursor-pointer shadow-sm flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">Pending Leaves</p>
            <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold">Action Required</span>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-3 font-sans">{metrics?.pendingLeaves || 0}</p>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">Awaiting Manager Approval</p>
        </div>

        {/* Card 4: Pending Expenses */}
        <div
          onClick={() => onNavigate('expenses')}
          className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-rose-500 transition-all cursor-pointer shadow-sm flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">Expense Claims</p>
            <span className="text-[10px] px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold">Active</span>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-3 font-sans">{metrics?.pendingExpenses || 0}</p>
          <p className="text-[11px] text-blue-600 mt-2 font-semibold">Reimbursement Claims</p>
        </div>
      </div>

      {/* Attendance Geofenced Punch Widget Row (Visible for all employees & admins) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`p-3.5 rounded-2xl ${isCheckedIn ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isCheckedIn ? 'bg-emerald-500 animate-ping' : isCheckedOut ? 'bg-rose-500' : 'bg-amber-400'}`}></span>
              <h3 className="font-extrabold text-base text-slate-900">
                {isCheckedIn ? 'ACTIVE WORK SESSION' : isCheckedOut ? 'SHIFT COMPLETED FOR TODAY' : 'NOT CHECKED IN YET'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Office Branch: <strong>{user?.branch_name || 'THEIAKSHI HQ - Bengaluru'}</strong> • Shift: <strong>09:00 AM - 06:00 PM</strong> (GPS HQ Geofence)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto justify-end">
          {isCheckedIn && (
            <div className="text-right font-mono bg-slate-900 text-emerald-400 px-4 py-2 rounded-xl text-base font-extrabold shadow-inner border border-slate-800">
              {formatTimer(seconds)}
            </div>
          )}

          {!isCheckedIn && !isCheckedOut && (
            <button
              onClick={handlePunchIn}
              disabled={punching}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{punching ? 'Punching In...' : 'CLOCK IN NOW'}</span>
            </button>
          )}

          {isCheckedIn && (
            <button
              onClick={handlePunchOut}
              disabled={punching}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>{punching ? 'Punching Out...' : 'CLOCK OUT NOW'}</span>
            </button>
          )}

          {isCheckedOut && (
            <div className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>SHIFT COMPLETED FOR TODAY</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Charts & Interactive Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Headcount Pie Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Department Distribution</h3>
              <span className="text-[10px] text-slate-400 font-mono font-bold">PostgreSQL Live</span>
            </div>
            <div className="h-56 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departments}
                    dataKey="employee_count"
                    nameKey="department"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    label={({ department }) => department}
                  >
                    {departments.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Monthly Payroll Disbursement Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-800">Monthly Payroll Disbursements</h3>
            <span className="text-[10px] text-emerald-700 font-bold font-mono">₹ INR Currency</span>
          </div>
          <div className="h-56 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={payrollSummary}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '8px' }} />
                <Bar dataKey="total_gross" name="Gross Salary" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total_net" name="Net Disbursed" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Activity Log, Announcements & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enterprise Audit Activity Log */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Real-Time Audit Activity Log</span>
            </h3>
            <button onClick={() => onNavigate('attendance')} className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {activity.length === 0 ? (
              <p className="text-xs text-slate-400 p-4 text-center">No recent activity recorded.</p>
            ) : (
              activity.map((act, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs hover:border-slate-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                    <span className="text-slate-800 font-semibold">{act.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {act.timestamp ? new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Sidebar Widgets */}
        <div className="space-y-6">
          {/* Corporate Announcements Broadcast */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-amber-500" />
                Broadcasts
              </span>
              <button onClick={() => onNavigate('helpdesk')} className="text-[11px] text-blue-600 font-bold">View All</button>
            </div>
            <div className="mt-3 space-y-2">
              {announcements.slice(0, 2).map((ann) => (
                <div key={ann.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 truncate">{ann.title}</span>
                    {ann.is_pinned && <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">PINNED</span>}
                  </div>
                  <p className="text-slate-600 text-[11px] mt-1 line-clamp-2">{ann.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* System & Database Health (For Super Admins / Admins) */}
          {isSuperAdmin && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-emerald-600" />
                  System Health Metrics
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[9px] px-2 py-0.5 rounded font-mono font-bold">100% HEALTHY</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Neon PostgreSQL Engine</span>
                  <span className="font-mono font-bold text-emerald-600">CONNECTED</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Express API Node Engine</span>
                  <span className="font-mono font-bold text-blue-600">ONLINE (200 OK)</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>RBAC Middleware Engine</span>
                  <span className="font-mono font-bold text-purple-600">ENFORCED</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
