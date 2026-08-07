import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, Sliders, Clock, Building, Save, CheckCircle2, History, AlertCircle } from 'lucide-react';
import apiClient from '../services/apiClient.js';

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
  const [activeTab, setActiveTab] = useState<'settings' | 'audit'>('settings');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  const fetchConfigAndLogs = async () => {
    try {
      setLoading(true);
      const [cRes, aRes] = await Promise.all([
        apiClient.get('/config'),
        apiClient.get('/audit-logs'),
      ]);
      if (cRes.data?.success) setConfig(cRes.data.data);
      if (aRes.data?.success) setAuditLogs(aRes.data.data);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-600" />
            Company Settings & Security Audit Logs
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure shift rules, grace periods, auto leave deductions & monitor security audit trails.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'settings' ? 'bg-white text-indigo-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Shift & Attendance Rules</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'audit' ? 'bg-white text-indigo-600 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Security Audit Logs ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tab 1: System Config & Shift Rules */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveConfig} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              Company Shift & Grace Period Engine
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Define official work hours, late grace thresholds, and automatic leave deduction rules.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Company Legal Name</label>
              <input
                type="text"
                value={config.company_name}
                onChange={(e) => setConfig({ ...config, company_name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Functional Currency</label>
              <input
                type="text"
                value={config.currency}
                onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">General Shift Start Time (24h)</label>
              <input
                type="text"
                value={config.shift_start_time}
                onChange={(e) => setConfig({ ...config, shift_start_time: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-900 font-semibold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">General Shift End Time (24h)</label>
              <input
                type="text"
                value={config.shift_end_time}
                onChange={(e) => setConfig({ ...config, shift_end_time: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-900 font-semibold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Late Arrival Grace Period (Minutes)</label>
              <input
                type="number"
                value={config.grace_minutes}
                onChange={(e) => setConfig({ ...config, grace_minutes: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-900 font-semibold"
              />
              <p className="text-[11px] text-slate-400 mt-1">Punches within shift start + grace minutes are marked On Time.</p>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Half-Day Threshold Cutoff Time</label>
              <input
                type="text"
                value={config.half_day_threshold_time}
                onChange={(e) => setConfig({ ...config, half_day_threshold_time: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-900 font-semibold"
              />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 text-xs">Auto Leave Deduction Rule</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Automatically deduct 1 day Casual Leave for every 2 recorded Half Days.</p>
            </div>
            <input
              type="checkbox"
              checked={config.auto_deduct_leave_for_two_half_days}
              onChange={(e) => setConfig({ ...config, auto_deduct_leave_for_two_half_days: e.target.checked })}
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-lg text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'SAVING...' : 'SAVE SETTINGS'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Security Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">System Action Audit Trail</h3>
            <span className="text-[10px] bg-slate-100 text-slate-700 font-mono font-bold px-2 py-0.5 rounded">POSTGRESQL AUDIT</span>
          </div>
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[10px] font-black tracking-wider">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Action</th>
                <th className="p-4">Module</th>
                <th className="p-4">Details</th>
                <th className="p-4">IP Address</th>
                <th className="p-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">No audit logs recorded.</td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-4 font-semibold text-slate-900">
                      {log.first_name ? `${log.first_name} ${log.last_name}` : log.email || 'System / Service'}
                    </td>
                    <td className="p-4 font-mono font-bold text-indigo-600">{log.action}</td>
                    <td className="p-4 font-mono font-semibold text-slate-700">{log.module}</td>
                    <td className="p-4 text-slate-600 max-w-xs truncate">{log.details}</td>
                    <td className="p-4 font-mono text-slate-500">{log.ip_address || '127.0.0.1'}</td>
                    <td className="p-4 font-mono text-slate-400 text-right">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
