import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { MainLayout } from './components/layout/MainLayout.js';
import { LoginPage } from './pages/LoginPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { EnterpriseEmployeePage } from './pages/EnterpriseEmployeePage.js';
import { EnterpriseAttendancePage } from './pages/EnterpriseAttendancePage.js';
import { EnterpriseLeavePage } from './pages/EnterpriseLeavePage.js';
import { EnterprisePayrollPage } from './pages/EnterprisePayrollPage.js';
import { EnterpriseExpensesPage } from './pages/EnterpriseExpensesPage.js';
import { EnterpriseOrganizationPage } from './pages/EnterpriseOrganizationPage.js';
import { EnterpriseProjectTaskPage } from './pages/EnterpriseProjectTaskPage.js';
import { EnterpriseAssetPage } from './pages/EnterpriseAssetPage.js';
import { EnterpriseHelpdeskPage } from './pages/EnterpriseHelpdeskPage.js';
import { EnterpriseNotificationPage } from './pages/EnterpriseNotificationPage.js';
import { WeeklyPlannerPage } from './pages/WeeklyPlannerPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { EnterpriseHolidayPage } from './pages/EnterpriseHolidayPage.js';
import { PayrollFoundationPage } from './pages/PayrollFoundationPage.js';
import { EmployeePayrollPortalPage } from './pages/EmployeePayrollPortalPage.js';
import { EnterpriseTaskBoardPage } from './pages/EnterpriseTaskBoardPage.js';
import { EngagementPage } from './pages/EngagementPage.js';
import { RoostPage } from './pages/RoostPage.js';
import { MyFolderPage } from './pages/MyFolderPage.js';

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
            return <EnterpriseEmployeePage />;
          case 'attendance':
            return <EnterpriseAttendancePage onNavigate={setActiveTab} />;
          case 'leave':
            return <EnterpriseLeavePage onNavigate={setActiveTab} />;
          case 'holidays':
            return <EnterpriseHolidayPage />;
          case 'payroll':
            return <EnterprisePayrollPage />;
          case 'payroll-foundation':
            return <PayrollFoundationPage />;
          case 'payslip-portal':
            return <EmployeePayrollPortalPage />;
          case 'expenses':
            return <EnterpriseExpensesPage onNavigate={setActiveTab} />;
          case 'projects':
            return <EnterpriseProjectTaskPage />;
          case 'tasks-kanban':
            return <EnterpriseTaskBoardPage />;
          case 'assets':
            return <EnterpriseAssetPage />;
          case 'helpdesk':
            return <EnterpriseHelpdeskPage onNavigate={setActiveTab} />;
          case 'engagement':
            return <EngagementPage onNavigate={setActiveTab} />;
          case 'roost':
            return <RoostPage onNavigate={setActiveTab} />;
          case 'documents':
            return <MyFolderPage onNavigate={setActiveTab} />;
          case 'notifications':
            return <EnterpriseNotificationPage />;
          case 'orgchart':
            return <EnterpriseOrganizationPage />;
          case 'planner':
            return <WeeklyPlannerPage />;
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
