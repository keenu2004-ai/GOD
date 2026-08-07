import React from 'react';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarCheck2,
  DollarSign,
  Receipt,
  FolderGit2,
  UserPlus,
  Laptop,
  HelpCircle,
  Megaphone,
  Network,
  Award,
  Calendar,
  Settings,
  Building,
  X,
  AlarmClock,
  FileEdit,
  BarChart2,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpenMobile, onCloseMobile }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employees Directory', icon: Users },
    { id: 'attendance', label: 'Attendance & GPS', icon: Clock },
    { id: 'regularization', label: 'Attendance Regularization', icon: FileEdit },
    { id: 'attendance-analytics', label: 'Attendance Analytics', icon: BarChart2 },
    { id: 'leave', label: 'Leave Management', icon: CalendarCheck2 },
    { id: 'holidays', label: 'Holidays & Calendar', icon: Calendar },
    { id: 'leave-analytics', label: 'Leave Analytics', icon: BarChart2 },
    { id: 'payroll', label: 'Payroll & Payslips', icon: DollarSign },
    { id: 'expenses', label: 'Expense Claims', icon: Receipt },
    { id: 'projects', label: 'Projects & Tasks', icon: FolderGit2 },
    { id: 'assets', label: 'Asset Management', icon: Laptop },
    { id: 'helpdesk', label: 'IT & HR Helpdesk', icon: HelpCircle },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'orgchart', label: 'Organization Chart', icon: Network },
    { id: 'performance', label: 'Performance Reviews', icon: Award },
    { id: 'planner', label: 'Weekly Planner', icon: Calendar },
    { id: 'shifts', label: 'Shift Management', icon: AlarmClock },
    { id: 'settings', label: 'Company Settings & Audits', icon: Settings },
  ];

  const handleItemClick = (id: string) => {
    setActiveTab(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      <aside className={`w-64 bg-[#0F172A] border-r border-slate-200/20 flex flex-col h-screen fixed md:sticky top-0 left-0 z-50 shrink-0 text-slate-300 transition-transform duration-300 md:translate-x-0 ${
        isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
      }`}>
        {/* Company Branding & Mobile Close Button */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm text-sm">
              T1
            </div>
            <div className="leading-none">
              <h1 className="text-white font-bold text-sm tracking-tight font-sans">THEIAKSHI ONE</h1>
              <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-1">Enterprise HRMS</p>
            </div>
          </div>

          {/* Close Button on Mobile */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-[#0B132B] text-[11px] text-slate-400 flex items-center justify-between font-mono">
        <div className="flex items-center gap-1.5">
          <Building className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-sans font-semibold text-slate-300">THEIAKSHI</span>
        </div>
        <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          v2.4 Active
        </span>
      </div>
    </aside>
  </>
  );
};
