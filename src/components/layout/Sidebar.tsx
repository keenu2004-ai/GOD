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
  FileText,
  Gift,
  LogOut,
  CheckSquare,
  MessageSquare,
  Building2,
  Zap,
  ShoppingBag,
  Wrench,
  ShieldAlert,
  User,
  Key,
  Info,
  Bell,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpenMobile, onCloseMobile }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employees Directory', icon: Users, roles: ['ADMIN', 'HR_MANAGER'] },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'leave', label: 'Leave Management', icon: CalendarCheck2 },
    { id: 'holidays', label: 'Holidays & Calendar', icon: Calendar },
    { id: 'payroll', label: 'Payroll & Payslips', icon: DollarSign, roles: ['ADMIN', 'HR_MANAGER'] },
    { id: 'payroll-foundation', label: 'Payroll Foundation & CTC', icon: DollarSign, roles: ['ADMIN', 'HR_MANAGER'] },
    { id: 'payslip-portal', label: 'Employee Payroll Portal', icon: FileText },
    { id: 'expenses', label: 'Expense Claims', icon: Receipt },
    { id: 'projects', label: 'Projects & Workspaces', icon: FolderGit2 },
    { id: 'tasks-kanban', label: 'Task & Work Report', icon: CheckSquare },
    { id: 'assets', label: 'Asset Management', icon: Laptop, roles: ['ADMIN', 'HR_MANAGER'] },
    { id: 'helpdesk', label: 'Helpdesk & Announcement', icon: HelpCircle },
    { id: 'orgchart', label: 'Organization Chart', icon: Network },
    { id: 'planner', label: 'Weekly Planner & Workload', icon: Calendar },
    { id: 'settings', label: 'Company Settings & Audits', icon: Settings, roles: ['ADMIN', 'HR_MANAGER'] },
  ];

  const { user, logout } = useAuth();
  const userRole = user?.role || 'EMPLOYEE';
  const filteredMenuItems = menuItems.filter(item => !item.roles || item.roles.includes(userRole));

  const handleItemClick = (id: string) => {
    setActiveTab(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

        {isMobile ? (
          <>
            {/* User Profile Card for Mobile */}
            <div className="p-5 border-b border-slate-800 bg-[#0B132B]">
              <div className="flex items-center gap-3">
                <img
                  src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/50"
                />
                <div className="leading-tight">
                  <h3 className="font-bold text-white text-xs">
                    {user?.first_name} {user?.last_name}
                  </h3>
                  <p className="text-[9px] text-slate-400 font-mono mt-0.5">{user?.email}</p>
                  <span className="inline-block bg-blue-500/20 text-blue-400 font-mono text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded mt-1 border border-blue-500/20">
                    {user?.role || 'EMPLOYEE'}
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Drawer Menu Links */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              <button
                onClick={() => handleItemClick('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="truncate">Home Dashboard</span>
              </button>

              <button
                onClick={() => {
                  alert('Profile Info: ' + user?.first_name + ' ' + user?.last_name + ' (' + user?.role + ')');
                  if (onCloseMobile) onCloseMobile();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <User className="w-4 h-4" />
                <span className="truncate">My Profile</span>
              </button>

              {(userRole === 'ADMIN' || userRole === 'HR_MANAGER') && (
                <button
                  onClick={() => handleItemClick('settings')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'settings'
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span className="truncate">Settings</span>
                </button>
              )}

              <button
                onClick={() => handleItemClick('notifications')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'notifications'
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span className="truncate">Notifications</span>
              </button>

              <button
                onClick={() => {
                  alert('Change Password is managed in settings.');
                  handleItemClick('settings');
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <Key className="w-4 h-4" />
                <span className="truncate">Change Password</span>
              </button>

              <button
                onClick={() => {
                  alert('Please open a ticket under IT & HR Helpdesk for any platform support.');
                  handleItemClick('helpdesk');
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="truncate">Help & FAQ</span>
              </button>

              <button
                onClick={() => {
                  alert('THEIAKSHI ONE Enterprise HRMS v2.4 Active.');
                  if (onCloseMobile) onCloseMobile();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <Info className="w-4 h-4" />
                <span className="truncate">About Platform</span>
              </button>

              <button
                onClick={() => {
                  logout();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 transition-all mt-4 font-semibold"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span className="truncate">Sign Out</span>
              </button>
            </nav>
          </>
        ) : (
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {filteredMenuItems.map((item) => {
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
        )}

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
