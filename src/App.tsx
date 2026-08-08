import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { MainLayout } from './components/layout/MainLayout.js';
import { LoginPage } from './pages/LoginPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { EmployeesPage } from './pages/EmployeesPage.js';
import { AttendancePage } from './pages/AttendancePage.js';
import { EnterpriseAttendancePage } from './pages/EnterpriseAttendancePage.js';
import { LeavePage } from './pages/LeavePage.js';
import { EnterpriseLeavePage } from './pages/EnterpriseLeavePage.js';
import { PayrollPage } from './pages/PayrollPage.js';
import { EnterprisePayrollPage } from './pages/EnterprisePayrollPage.js';
import { ExpensesPage } from './pages/ExpensesPage.js';
import { EnterpriseExpensesPage } from './pages/EnterpriseExpensesPage.js';
import { EnterpriseExpensePolicyPage } from './pages/EnterpriseExpensePolicyPage.js';
import { EnterpriseOrganizationPage } from './pages/EnterpriseOrganizationPage.js';
import { ProjectsPage } from './pages/ProjectsPage.js';
import { AssetsPage } from './pages/RecruitmentPage.js';
import { HelpdeskPage, AnnouncementsPage } from './pages/HelpdeskPage.js';
import { OrgChartPage, PerformancePage } from './pages/OrgChartPage.js';
import { WeeklyPlannerPage } from './pages/WeeklyPlannerPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { ShiftManagementPage } from './pages/ShiftManagementPage.js';
import { AttendanceRegularizationPage } from './pages/AttendanceRegularizationPage.js';
import { AttendanceAnalyticsPage } from './pages/AttendanceAnalyticsPage.js';
import { EnterpriseHolidayPage } from './pages/EnterpriseHolidayPage.js';
import { LeaveAnalyticsPage } from './pages/LeaveAnalyticsPage.js';
import { PayrollFoundationPage } from './pages/PayrollFoundationPage.js';
import { SalaryComponentEnginePage } from './pages/SalaryComponentEnginePage.js';
import { PayrollProcessingPage } from './pages/PayrollProcessingPage.js';
import { EmployeePayrollPortalPage } from './pages/EmployeePayrollPortalPage.js';
import { CompensationManagementPage } from './pages/CompensationManagementPage.js';
import { PayrollAnalyticsPage } from './pages/PayrollAnalyticsPage.js';
import { ExitManagementPage } from './pages/ExitManagementPage.js';
import { EnterpriseProjectWorkspacePage } from './pages/EnterpriseProjectWorkspacePage.js';
import { EnterpriseTaskBoardPage } from './pages/EnterpriseTaskBoardPage.js';
import { TaskCollaborationFeedPage } from './pages/TaskCollaborationFeedPage.js';
import { EnterpriseTimeTrackingPage } from './pages/EnterpriseTimeTrackingPage.js';
import { ProjectAnalyticsPage } from './pages/ProjectAnalyticsPage.js';
import { ClientPortalPage } from './pages/ClientPortalPage.js';
import { ProjectAutomationManagementPage } from './pages/ProjectAutomationManagementPage.js';
import { EnterpriseAssetsPage } from './pages/EnterpriseAssetsPage.js';
import { EnterpriseAssetProcurementPage } from './pages/EnterpriseAssetProcurementPage.js';
import { EnterpriseAssetMaintenancePage } from './pages/EnterpriseAssetMaintenancePage.js';
import { EnterpriseAssetAnalyticsPage } from './pages/EnterpriseAssetAnalyticsPage.js';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs text-slate-400 font-mono">Initializing THEIAKSHI ONE Enterprise Engine...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <MainLayout>
      {(activeTab, setActiveTab) => {
        switch (activeTab) {
          case 'dashboard':
            return <DashboardPage onNavigate={setActiveTab} />;
          case 'employees':
            return <EmployeesPage />;
          case 'attendance':
            return <EnterpriseAttendancePage />;
          case 'leave':
            return <EnterpriseLeavePage />;
          case 'holidays':
            return <EnterpriseHolidayPage />;
          case 'leave-analytics':
            return <LeaveAnalyticsPage />;
          case 'payroll':
            return <EnterprisePayrollPage />;
          case 'payroll-foundation':
            return <PayrollFoundationPage />;
          case 'salary-components':
            return <SalaryComponentEnginePage />;
          case 'payroll-processing':
            return <PayrollProcessingPage />;
          case 'payslip-portal':
            return <EmployeePayrollPortalPage />;
          case 'compensation':
            return <CompensationManagementPage />;
          case 'payroll-analytics':
            return <PayrollAnalyticsPage />;
          case 'exit-management':
            return <ExitManagementPage />;
          case 'expenses':
            return <EnterpriseExpensesPage />;
          case 'expense-policy':
            return <EnterpriseExpensePolicyPage />;
          case 'projects':
            return <EnterpriseProjectWorkspacePage />;
          case 'project-analytics':
            return <ProjectAnalyticsPage />;
          case 'client-portal':
            return <ClientPortalPage />;
          case 'project-automation':
            return <ProjectAutomationManagementPage />;
          case 'tasks-kanban':
            return <EnterpriseTaskBoardPage />;
          case 'task-collaboration':
            return <TaskCollaborationFeedPage />;
          case 'time-tracking':
            return <EnterpriseTimeTrackingPage />;
          case 'assets':
            return <EnterpriseAssetsPage />;
          case 'asset-procurement':
            return <EnterpriseAssetProcurementPage />;
          case 'asset-maintenance':
            return <EnterpriseAssetMaintenancePage />;
          case 'asset-analytics':
            return <EnterpriseAssetAnalyticsPage />;
          case 'helpdesk':
            return <HelpdeskPage />;
          case 'announcements':
            return <AnnouncementsPage />;
          case 'orgchart':
            return <EnterpriseOrganizationPage />;
          case 'performance':
            return <PerformancePage />;
          case 'planner':
            return <WeeklyPlannerPage />;
          case 'regularization':
            return <AttendanceRegularizationPage />;
          case 'attendance-analytics':
            return <AttendanceAnalyticsPage />;
          case 'shifts':
            return <ShiftManagementPage />;
          case 'settings':
            return <SettingsPage />;
          default:
            return <DashboardPage onNavigate={setActiveTab} />;
        }
      }}
    </MainLayout>
  );
};

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

