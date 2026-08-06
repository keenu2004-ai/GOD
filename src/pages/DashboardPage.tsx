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
import { DashboardMetrics } from '../types/index.js';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export const DashboardPage: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [payrollSummary, setPayrollSummary] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [celebrations, setCelebrations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
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
        ] = await Promise.all([
          apiClient.get('/dashboard/metrics'),
          apiClient.get('/dashboard/activity'),
          apiClient.get('/dashboard/departments'),
          apiClient.get('/dashboard/payroll'),
          apiClient.get('/dashboard/announcements'),
          apiClient.get('/dashboard/celebrations'),
        ]);

        if (mRes.data?.success) setMetrics(mRes.data.data);
        if (aRes.data?.success) setActivity(aRes.data.data);
        if (dRes.data?.success) setDepartments(dRes.data.data);
        if (pRes.data?.success) setPayrollSummary(pRes.data.data);
        if (annRes.data?.success) setAnnouncements(annRes.data.data);
        if (cRes.data?.success) setCelebrations(cRes.data.data);
      } catch (err) {
        console.error('Failed to load database dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Employees */}
        <div
          onClick={() => onNavigate('employees')}
          className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-500 transition-all cursor-pointer shadow-sm flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">Total Headcount</p>
            <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold">+12.5%</span>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-3 font-sans">{metrics?.totalEmployees || 0}</p>
          <p className="text-[11px] text-emerald-600 mt-2 flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3 h-3" />
            <span>Across {metrics?.totalBranches || 3} Branches</span>
          </p>
        </div>

        {/* Present Today */}
        <div
          onClick={() => onNavigate('attendance')}
          className="bg-white border border-slate-200 rounded-xl p-5 hover:border-emerald-500 transition-all cursor-pointer shadow-sm flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">Attendance Today</p>
            <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold">98.2%</span>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-3 font-sans">{metrics?.presentToday || 0}</p>
          <p className="text-[11px] text-amber-600 mt-2 flex items-center gap-1 font-semibold">
            <AlertCircle className="w-3 h-3" />
            <span>{metrics?.lateToday || 0} Late Punch-ins</span>
          </p>
        </div>

        {/* Pending Leaves */}
        <div
          onClick={() => onNavigate('leave')}
          className="bg-white border border-slate-200 rounded-xl p-5 hover:border-orange-500 transition-all cursor-pointer shadow-sm flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">Pending Leaves</p>
            <span className="text-[10px] px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-bold">Action Required</span>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-3 font-sans">{metrics?.pendingLeaves || 0}</p>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">Awaiting Manager Approval</p>
        </div>

        {/* Pending Expenses */}
        <div
          onClick={() => onNavigate('expenses')}
          className="bg-white border border-slate-200 rounded-xl p-5 hover:border-rose-500 transition-all cursor-pointer shadow-sm flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">Expense Approvals</p>
            <span className="text-[10px] px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-bold">Claims Active</span>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-3 font-sans">{metrics?.pendingExpenses || 0}</p>
          <p className="text-[11px] text-blue-600 mt-2 font-semibold">Claims Pending</p>
        </div>
      </div>

      {/* Main Grid Charts & Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Distribution Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Department Distribution</h3>
              <span className="text-[10px] text-slate-400 font-mono font-bold">Live DB</span>
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

        {/* Monthly Payroll Summary Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm lg:col-span-2">
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

      {/* Activity Feed, Announcements & Celebrations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Enterprise Activity Log</h3>
            <button onClick={() => onNavigate('attendance')} className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {activity.map((act, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  <span className="text-slate-800 font-medium">{act.title}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {act.timestamp ? new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Announcements & Celebrations Widget */}
        <div className="space-y-6">
          {/* Announcements */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-amber-500" />
                Announcements
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {announcements.slice(0, 2).map((ann) => (
                <div key={ann.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 truncate">{ann.title}</span>
                    {ann.is_pinned && <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">PINNED</span>}
                  </div>
                  <p className="text-slate-600 text-[11px] mt-1 line-clamp-2">{ann.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Celebrations */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Cake className="w-4 h-4 text-pink-500" />
                Celebrations
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {celebrations.map((cel) => (
                <div key={cel.id} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                  <img src={cel.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  <div>
                    <p className="font-bold text-slate-900">{cel.title}</p>
                    <p className="text-[10px] text-slate-500">{cel.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
