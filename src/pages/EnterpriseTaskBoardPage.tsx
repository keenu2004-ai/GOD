import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, CheckCircle2, AlertCircle, Clock,
  Filter, User, FileText, Send, Loader2, List, ShieldAlert
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

interface Standup {
  id: number;
  employee_id: number;
  first_name: string;
  last_name: string;
  standup_date: string;
  yesterday_work: string;
  today_plan: string;
  blockers?: string;
  notes?: string;
  created_at: string;
}

const fmtDate = (s?: string) => s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const EnterpriseTaskBoardPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const isManager = ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'DEPT_HEAD'].includes(userRole);

  const [activeTab, setActiveTab] = useState<'submit' | 'history' | 'team'>('submit');
  
  const [standups, setStandups] = useState<Standup[]>([]);
  const [teamStandups, setTeamStandups] = useState<Standup[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    standup_date: new Date().toISOString().split('T')[0],
    yesterday_work: '',
    today_plan: '',
    blockers: '',
    notes: ''
  });

  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');

  const fetchMyHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/tasks/daily-standups');
      setStandups(res.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTeamStandups = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/tasks/daily-standups?date=${filterDate}`;
      if (selectedEmployee) url += `&employeeId=${selectedEmployee}`;
      const res = await apiClient.get(url);
      setTeamStandups(res.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filterDate, selectedEmployee]);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await apiClient.get('/employees');
      setEmployees(res.data?.data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'history') fetchMyHistory();
    else if (activeTab === 'team' && isManager) {
      fetchTeamStandups();
      if (employees.length === 0) fetchEmployees();
    }
  }, [activeTab, fetchMyHistory, fetchTeamStandups, isManager, employees.length, fetchEmployees]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/tasks/daily-standups', formData);
      setFormData({
        standup_date: new Date().toISOString().split('T')[0],
        yesterday_work: '',
        today_plan: '',
        blockers: '',
        notes: ''
      });
      alert('Standup submitted successfully!');
      setActiveTab('history');
    } catch (e: any) {
      alert(e.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStandupCard = (s: Standup) => (
    <div key={s.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
      <div className="flex justify-between items-start border-b border-slate-100 pb-3">
        <div>
          <h4 className="font-bold text-slate-800">{s.first_name} {s.last_name}</h4>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><Calendar className="w-3.5 h-3.5"/> {fmtDate(s.standup_date)}</p>
        </div>
        <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full font-mono">{new Date(s.created_at).toLocaleTimeString()}</span>
      </div>
      
      <div className="space-y-3">
        <div>
          <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500"/> Yesterday's Work</h5>
          <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 whitespace-pre-wrap">{s.yesterday_work}</p>
        </div>
        <div>
          <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-blue-500"/> Today's Plan</h5>
          <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 whitespace-pre-wrap">{s.today_plan}</p>
        </div>
        {s.blockers && (
          <div>
            <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 text-red-500"/> Blockers</h5>
            <p className="text-sm text-red-700 bg-red-50 p-2 rounded-lg border border-red-100 whitespace-pre-wrap">{s.blockers}</p>
          </div>
        )}
        {s.notes && (
          <div>
            <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-slate-500"/> Notes</h5>
            <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 whitespace-pre-wrap">{s.notes}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 pb-10">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2"><List className="w-6 h-6" /> Daily Standups</h1>
            <p className="text-sm text-slate-300 mt-1">Track daily progress, plans, and team blockers efficiently.</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full mt-6 px-4">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 mb-6">
          <button onClick={() => setActiveTab('submit')} className={`px-4 py-2 rounded-t-lg font-medium flex items-center gap-2 transition-colors ${activeTab === 'submit' ? 'bg-white text-indigo-600 border-t border-x border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
            <Send className="w-4 h-4" /> Submit Standup
          </button>
          <button onClick={() => setActiveTab('history')} className={`px-4 py-2 rounded-t-lg font-medium flex items-center gap-2 transition-colors ${activeTab === 'history' ? 'bg-white text-indigo-600 border-t border-x border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
            <Clock className="w-4 h-4" /> My History
          </button>
          {isManager && (
            <button onClick={() => setActiveTab('team')} className={`px-4 py-2 rounded-t-lg font-medium flex items-center gap-2 transition-colors ${activeTab === 'team' ? 'bg-white text-indigo-600 border-t border-x border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
              <User className="w-4 h-4" /> Team Standups
            </button>
          )}
        </div>

        {activeTab === 'submit' && (
          <div className="max-w-3xl">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><CheckCircle2 className="text-emerald-500"/> Submit Today's Update</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Date</label>
                  <input type="date" required value={formData.standup_date} onChange={e => setFormData({...formData, standup_date: e.target.value})} className="w-full md:w-1/3 border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">What did you complete yesterday?</label>
                  <textarea required value={formData.yesterday_work} onChange={e => setFormData({...formData, yesterday_work: e.target.value})} placeholder="e.g., Finished the UI for the login page, reviewed PRs..." className="w-full border border-slate-300 rounded-lg px-4 py-3 h-24 focus:ring-2 focus:ring-indigo-500 outline-none"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">What are you planning to do today?</label>
                  <textarea required value={formData.today_plan} onChange={e => setFormData({...formData, today_plan: e.target.value})} placeholder="e.g., Start working on the API integration..." className="w-full border border-slate-300 rounded-lg px-4 py-3 h-24 focus:ring-2 focus:ring-indigo-500 outline-none"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Any blockers or challenges? (Optional)</label>
                  <textarea value={formData.blockers} onChange={e => setFormData({...formData, blockers: e.target.value})} placeholder="e.g., Blocked by the database migration..." className="w-full border border-slate-300 rounded-lg px-4 py-3 h-20 focus:ring-2 focus:ring-indigo-500 outline-none"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Additional Notes (Optional)</label>
                  <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Anything else to share?" className="w-full border border-slate-300 rounded-lg px-4 py-3 h-20 focus:ring-2 focus:ring-indigo-500 outline-none"></textarea>
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5"/>}
                    {submitting ? 'Submitting...' : 'Submit Standup'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-indigo-500"/></div>
            ) : standups.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                <List className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-700">No Standup History</h3>
                <p className="text-slate-500 mt-2">You haven't submitted any daily standups yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {standups.map(renderStandupCard)}
              </div>
            )}
          </div>
        )}

        {activeTab === 'team' && isManager && (
          <div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date Filter</label>
                <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Employee</label>
                <select value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-w-[200px]">
                  <option value="">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                  ))}
                </select>
              </div>
              <button onClick={fetchTeamStandups} className="bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 font-semibold py-2 px-4 rounded-lg flex items-center gap-2">
                <Filter className="w-4 h-4"/> Apply Filters
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-indigo-500"/></div>
            ) : teamStandups.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                <ShieldAlert className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-700">No Standups Found</h3>
                <p className="text-slate-500 mt-2">No team members have submitted a standup for the selected filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamStandups.map(renderStandupCard)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
