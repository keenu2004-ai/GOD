import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, Sliders, Clock, Building, Save, CheckCircle2, History, AlertCircle, Key, Lock, Laptop, RefreshCw, Layers } from 'lucide-react';
import apiClient from '../services/apiClient.js';

const ENTERPRISE_ROLES = [
  'SUPER_ADMIN',
  'COMPANY_ADMIN',
  'HR_MANAGER',
  'HR_EXECUTIVE',
  'PAYROLL_MANAGER',
  'FINANCE_MANAGER',
  'PROJECT_MANAGER',
  'TEAM_LEAD',
  'DEPARTMENT_HEAD',
  'BUSINESS_ASSOCIATE',
  'EMPLOYEE',
  'INTERN',
  'CONTRACTOR',
];

export const SettingsPage: React.FC = () => {
  const [config, setConfig] = useState<any>({
    company_name: 'THEIAKSHI ENTERPRISES',
    shift_start_time: '09:00',
    shift_end_time: '18:00',
    grace_minutes: 15,
    half_day_threshold_time: '11:30',
    auto_deduct_leave_for_two_half_days: true,
    currency: 'INR',
  });

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'settings' | 'security' | 'rbac' | 'audit'>('settings');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Password state
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [pwdSubmitting, setPwdSubmitting] = useState<boolean>(false);

  const fetchConfigAndLogs = async () => {
    try {
      setLoading(true);
      const [cRes, aRes, hRes] = await Promise.all([
        apiClient.get('/config').catch(() => ({ data: { data: {} } })),
        apiClient.get('/audit-logs').catch(() => ({ data: { data: [] } })),
        apiClient.get('/auth/login-history').catch(() => ({ data: { data: [] } })),
      ]);
      if (cRes.data?.success) setConfig(cRes.data.data);
      if (aRes.data?.success) setAuditLogs(aRes.data.data);
      if (hRes.data?.success) setLoginHistory(hRes.data.data || []);
    } catch (e) {
      console.error('Error fetching settings and audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigAndLogs();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await apiClient.put('/config', config);
      if (res.data?.success) {
        setSuccessMsg('System shift configuration and grace rules saved successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('New password and confirm password do not match');
      return;
    }
    try {
      setPwdSubmitting(true);
      const res = await apiClient.post('/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      if (res.data?.success) {
        alert('Password updated successfully!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update password');
    } finally {
      setPwdSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            System Configuration & Security Audit
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Global HRMS shift rules, 13 Enterprise RBAC roles, security session logs, and system audit trails.
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'settings' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            System Rules
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'security' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Security & Sessions
          </button>
          <button
            onClick={() => setActiveTab('rbac')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'rbac' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            RBAC Roles Matrix
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'audit' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Audit Logs
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-4 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tab 1: System Rules & Shift Settings */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveConfig} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-xs">
          <h3 className="text-sm font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Attendance & Shift Configuration</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="text-slate-600 font-semibold">Company Name</label>
              <input
                type="text"
                value={config.company_name}
                onChange={(e) => setConfig({ ...config, company_name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 mt-1 font-bold"
                required
              />
            </div>

            <div>
              <label className="text-slate-600 font-semibold">Shift Start Time</label>
              <input
                type="time"
                value={config.shift_start_time}
                onChange={(e) => setConfig({ ...config, shift_start_time: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 mt-1 font-mono"
                required
              />
            </div>

            <div>
              <label className="text-slate-600 font-semibold">Shift End Time</label>
              <input
                type="time"
                value={config.shift_end_time}
                onChange={(e) => setConfig({ ...config, shift_end_time: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 mt-1 font-mono"
                required
              />
            </div>

            <div>
              <label className="text-slate-600 font-semibold">Grace Period (Minutes)</label>
              <input
                type="number"
                value={config.grace_minutes}
                onChange={(e) => setConfig({ ...config, grace_minutes: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 mt-1 font-mono"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">Punches after this period are flagged as LATE in PostgreSQL.</p>
            </div>

            <div>
              <label className="text-slate-600 font-semibold">Half-Day Threshold Time</label>
              <input
                type="time"
                value={config.half_day_threshold_time}
                onChange={(e) => setConfig({ ...config, half_day_threshold_time: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 mt-1 font-mono"
                required
              />
            </div>

            <div>
              <label className="text-slate-600 font-semibold">Payroll Default Currency</label>
              <input
                type="text"
                value={config.currency}
                onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 mt-1 font-mono font-bold"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Config...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Security & Password Reset */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          {/* Change Password Card */}
          <form onSubmit={handleChangePassword} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" />
              <span>Change Password</span>
            </h3>

            <div>
              <label className="text-slate-600 font-semibold">Current Password</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 mt-1 font-mono"
                required
              />
            </div>

            <div>
              <label className="text-slate-600 font-semibold">New Password (min 6 chars)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 mt-1 font-mono"
                required
              />
            </div>

            <div>
              <label className="text-slate-600 font-semibold">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 mt-1 font-mono"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={pwdSubmitting}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4" />
                <span>{pwdSubmitting ? 'Updating...' : 'Update Password'}</span>
              </button>
            </div>
          </form>

          {/* Active Sessions & Login Audit History */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Laptop className="w-4 h-4 text-emerald-600" />
                <span>Active Login History Audit</span>
              </h3>
              <button onClick={fetchConfigAndLogs} className="text-slate-400 hover:text-slate-700"><RefreshCw className="w-4 h-4" /></button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {loginHistory.length === 0 ? (
                <p className="text-slate-400 p-4 text-center">No authentication log history recorded.</p>
              ) : (
                loginHistory.map((h, i) => (
                  <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{h.action}</p>
                      <p className="text-[11px] text-slate-500">{h.details || 'Browser session'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[10px] text-slate-400">{h.ip_address || '127.0.0.1'}</p>
                      <p className="text-[10px] text-slate-400">{new Date(h.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Enterprise RBAC Roles Matrix */}
      {activeTab === 'rbac' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <span>13 Enterprise RBAC Role Permissions Matrix</span>
            </h3>
            <span className="bg-indigo-100 text-indigo-800 text-[10px] px-2.5 py-1 rounded-full font-mono font-bold">PostgreSQL RBAC Enforced</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3">Role Code</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Employee Directory</th>
                  <th className="p-3">Attendance & GPS</th>
                  <th className="p-3">Leave Approval</th>
                  <th className="p-3">Payroll & Tax</th>
                  <th className="p-3">Projects</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {ENTERPRISE_ROLES.map((role) => {
                  const isSuper = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'SUPER_BOSS'].includes(role);
                  const isHR = role.startsWith('HR_');
                  const isPayroll = role.includes('PAYROLL') || role.includes('FINANCE');
                  const isBA = role === 'BUSINESS_ASSOCIATE';

                  return (
                    <tr key={role} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-slate-900 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isSuper ? 'bg-amber-500' : isHR ? 'bg-blue-500' : isPayroll ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        {role}
                      </td>
                      <td className="p-3 text-slate-500">{isSuper ? 'Executive' : isHR ? 'HR Ops' : isPayroll ? 'Finance' : isBA ? 'Restricted' : 'General'}</td>
                      <td className="p-3">{isSuper || isHR ? 'FULL CRUD' : 'VIEW ONLY'}</td>
                      <td className="p-3">{isSuper || isHR ? 'MANAGE & GEOFENCE' : 'PUNCH ONLY'}</td>
                      <td className="p-3">{isSuper || isHR ? 'APPROVE / REJECT' : 'APPLY ONLY'}</td>
                      <td className="p-3">{isSuper || isPayroll ? 'GENERATE & DISBURSE' : isBA ? 'BLOCKED' : 'OWN PAYSLIP ONLY'}</td>
                      <td className="p-3">{isSuper || role.includes('PROJECT') || isBA ? 'ASSIGNED PROJECTS' : 'READ ONLY'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: System Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <History className="w-5 h-5 text-purple-600" />
              <span>Audit Trail Logs</span>
            </h3>
            <button onClick={fetchConfigAndLogs} className="text-blue-600 font-bold hover:underline">Refresh Logs</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Module</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {auditLogs.length === 0 ? (
                  <tr><td colSpan={5} className="p-4 text-center text-slate-400">No audit logs recorded.</td></tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="p-3 text-slate-400 font-mono text-[10px]">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="p-3 font-bold text-slate-900">{log.action}</td>
                      <td className="p-3 font-mono text-blue-600">{log.module}</td>
                      <td className="p-3 font-mono text-slate-500">{log.ip_address || '127.0.0.1'}</td>
                      <td className="p-3 text-slate-600 max-w-xs truncate">{log.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
