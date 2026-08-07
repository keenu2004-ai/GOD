import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare, Send, CheckCircle2, AlertCircle, Clock, Calendar, Users,
  UserCheck, ThumbsUp, XCircle, Plus, RefreshCw, X, Shield, Activity
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

interface DailyReport {
  id: number;
  employee_id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
  department_name?: string;
  report_date: string;
  completed_work: string;
  upcoming_plan?: string;
  blockers?: string;
  hours_worked: number;
  status: string;
  manager_feedback?: string;
}

interface Comment {
  id: number;
  author_id: number;
  first_name: string;
  last_name: string;
  comment_text: string;
  created_at: string;
}

interface ActivityItem {
  id: number;
  actor_id: number;
  first_name?: string;
  last_name?: string;
  action_type: string;
  details?: string;
  created_at: string;
}

const fmtDate = (s?: string) => s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = (s?: string) => s ? new Date(s).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';

export const TaskCollaborationFeedPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const isManager = ['ADMIN', 'HR_MANAGER', 'DEPT_HEAD', 'SUPER_ADMIN'].includes(userRole);

  const [tab, setTab] = useState<'standup' | 'reviews' | 'discussion'>('standup');
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Standup Form
  const [reportForm, setReportForm] = useState({
    report_date: new Date().toISOString().split('T')[0],
    completed_work: 'Completed REST API endpoints for task progress management & unit tests',
    upcoming_plan: 'Build frontend task collaboration stream UI',
    blockers: 'None. On track for sprint delivery.',
    hours_worked: '8.0',
  });

  // Review Modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewReport, setReviewReport] = useState<DailyReport | null>(null);
  const [reviewForm, setReviewForm] = useState({ status: 'APPROVED' as 'APPROVED' | 'REJECTED', feedback: 'Great work! Keep it up.' });

  // Comment Input
  const [newComment, setNewComment] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [repRes, tskRes] = await Promise.all([
        apiClient.get('/tasks/daily-reports').catch(() => ({ data: { data: [] } })),
        apiClient.get('/tasks').catch(() => ({ data: { data: [] } })),
      ]);
      setReports(repRes.data?.data || []);
      const tList = tskRes.data?.data || [];
      setTasks(tList);
      if (tList.length > 0 && !selectedTaskId) {
        setSelectedTaskId(String(tList[0].id));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [selectedTaskId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchTaskCollaboration = useCallback(async (taskId: string) => {
    if (!taskId) return;
    try {
      const [cmtRes, actRes] = await Promise.all([
        apiClient.get(`/tasks/${taskId}/comments`).catch(() => ({ data: { data: [] } })),
        apiClient.get(`/tasks/${taskId}/activity`).catch(() => ({ data: { data: [] } })),
      ]);
      setComments(cmtRes.data?.data || []);
      setActivities(actRes.data?.data || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (selectedTaskId) {
      fetchTaskCollaboration(selectedTaskId);
    }
  }, [selectedTaskId, fetchTaskCollaboration]);

  const handleSubmitStandup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/tasks/daily-reports', {
        ...reportForm,
        hours_worked: parseFloat(reportForm.hours_worked),
      });
      await fetchData();
      alert('✅ Daily work standup report submitted successfully!');
    } catch (e: any) { alert(e.response?.data?.message || 'Submission failed'); }
    finally { setSubmitting(false); }
  };

  const handleReviewReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewReport) return;
    try {
      await apiClient.patch(`/tasks/daily-reports/${reviewReport.id}/review`, reviewForm);
      setShowReviewModal(false);
      await fetchData();
      alert(`✅ Daily report ${reviewForm.status.toLowerCase()}!`);
    } catch (e: any) { alert(e.response?.data?.message || 'Review failed'); }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTaskId) return;
    try {
      await apiClient.post(`/tasks/${selectedTaskId}/comments`, { comment_text: newComment });
      setNewComment('');
      await fetchTaskCollaboration(selectedTaskId);
    } catch (e: any) { alert(e.response?.data?.message || 'Comment failed'); }
  };

  return (
    <div className="space-y-5 min-h-screen pb-10">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-teal-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-600/30 rounded-xl">
              <MessageSquare className="w-7 h-7 text-teal-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Enterprise Task Collaboration & Work Reporting</h2>
              <p className="text-xs text-teal-300/70 font-mono mt-0.5">Daily Standups • Manager Approvals • Discussion Streams • Activity Logs</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200 overflow-x-auto">
        <button onClick={() => setTab('standup')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'standup' ? 'bg-white text-teal-700 shadow-sm border border-teal-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Calendar className="w-4 h-4" /> Submit Daily Standup Report
        </button>
        <button onClick={() => setTab('reviews')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'reviews' ? 'bg-white text-teal-700 shadow-sm border border-teal-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <UserCheck className="w-4 h-4" /> Manager Work Reviews ({reports.filter(r => r.status === 'SUBMITTED').length})
        </button>
        <button onClick={() => setTab('discussion')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'discussion' ? 'bg-white text-teal-700 shadow-sm border border-teal-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <MessageSquare className="w-4 h-4" /> Task Discussions & Activity Stream
        </button>
      </div>

      {/* ─── STANDUP SUBMISSION TAB ──────────────────────────────────────── */}
      {tab === 'standup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" /> Submit Today's Work Report
            </h3>
            <form onSubmit={handleSubmitStandup} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Report Date *</label>
                  <input required type="date" value={reportForm.report_date} onChange={e => setReportForm({...reportForm, report_date: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Hours Worked *</label>
                  <input required type="number" step="0.5" value={reportForm.hours_worked} onChange={e => setReportForm({...reportForm, hours_worked: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold" />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">What did you complete today? *</label>
                <textarea required value={reportForm.completed_work} onChange={e => setReportForm({...reportForm, completed_work: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" rows={3} />
              </div>

              <div>
                <label className="font-semibold text-slate-700">What are you working on tomorrow?</label>
                <textarea value={reportForm.upcoming_plan} onChange={e => setReportForm({...reportForm, upcoming_plan: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" rows={2} />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Any Blockers / Support Needed?</label>
                <input value={reportForm.blockers} onChange={e => setReportForm({...reportForm, blockers: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
              </div>

              <div className="pt-2">
                <button type="submit" disabled={submitting} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-2.5 rounded-xl shadow">
                  {submitting ? 'Submitting...' : 'Submit Daily Standup Report'}
                </button>
              </div>
            </form>
          </div>

          {/* Standup History */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" /> My Standup Report History
            </h3>
            <div className="space-y-3 text-xs max-h-[500px] overflow-y-auto pr-1">
              {reports.map(r => (
                <div key={r.id} className="p-3 bg-slate-50 border rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center font-bold text-slate-900">
                    <span>{fmtDate(r.report_date)} ({r.hours_worked} hrs)</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      r.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      r.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>{r.status}</span>
                  </div>
                  <p className="text-slate-700"><strong>Done:</strong> {r.completed_work}</p>
                  {r.manager_feedback && <p className="text-[10px] text-teal-800 italic bg-teal-50 p-1.5 rounded">Manager: "{r.manager_feedback}"</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── MANAGER REVIEWS TAB ─────────────────────────────────────────── */}
      {tab === 'reviews' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
              <tr>
                <th className="p-3">Employee</th>
                <th className="p-3">Date</th>
                <th className="p-3">Hours</th>
                <th className="p-3">Completed Work Summary</th>
                <th className="p-3">Blockers</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {reports.map(r => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="p-3 font-sans font-bold text-slate-900">{r.first_name} {r.last_name}</td>
                  <td className="p-3 font-sans text-slate-600">{fmtDate(r.report_date)}</td>
                  <td className="p-3 font-bold text-slate-900 font-sans">{r.hours_worked} hrs</td>
                  <td className="p-3 font-sans text-slate-700">{r.completed_work}</td>
                  <td className="p-3 font-sans text-amber-700">{r.blockers || 'None'}</td>
                  <td className="p-3 font-sans">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      r.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>{r.status}</span>
                  </td>
                  <td className="p-3 font-sans">
                    {isManager && r.status === 'SUBMITTED' && (
                      <button onClick={() => { setReviewReport(r); setShowReviewModal(true); }} className="px-2 py-1 bg-teal-600 text-white font-bold text-[10px] rounded hover:bg-teal-700">
                        Review Work
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── DISCUSSION & ACTIVITY STREAM TAB ──────────────────────────── */}
      {tab === 'discussion' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-700">Select Task Discussion Stream:</span>
            <select value={selectedTaskId} onChange={e => setSelectedTaskId(e.target.value)}
              className="text-xs border border-slate-300 rounded-xl px-3 py-1.5 font-semibold text-slate-900">
              {tasks.map(t => <option key={t.id} value={t.id}>{t.task_number}: {t.title}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Discussion Feed */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-teal-600" /> Discussion Stream
              </h3>
              <form onSubmit={handlePostComment} className="flex gap-2">
                <input required value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Write a comment..."
                  className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900" />
                <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 rounded-xl shadow flex items-center gap-1">
                  <Send className="w-3.5 h-3.5" /> Post
                </button>
              </form>

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {comments.map(c => (
                  <div key={c.id} className="p-3 bg-slate-50 border rounded-xl text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{c.first_name} {c.last_name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{fmtTime(c.created_at)}</span>
                    </div>
                    <p className="text-slate-700">{c.comment_text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Log */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-600" /> Real-time Activity Log
              </h3>
              <div className="space-y-2.5 max-h-[400px] overflow-y-auto text-xs">
                {activities.map(a => (
                  <div key={a.id} className="p-2.5 bg-slate-50 border rounded-xl flex items-center justify-between text-[11px]">
                    <div>
                      <span className="font-bold text-slate-900">{a.first_name || 'System'}</span>: <span className="font-mono text-teal-800">{a.action_type}</span>
                      <p className="text-slate-500">{a.details}</p>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">{fmtTime(a.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── REVIEW MODAL ────────────────────────────────────────────────── */}
      {showReviewModal && reviewReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Review Daily Standup Report</h3>
              <button onClick={() => setShowReviewModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleReviewReport} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Decision *</label>
                <select value={reviewForm.status} onChange={e => setReviewForm({...reviewForm, status: e.target.value as any})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold">
                  <option value="APPROVED">Approve Standup Report</option>
                  <option value="REJECTED">Reject / Request Revision</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Manager Feedback Comments</label>
                <textarea value={reviewForm.feedback} onChange={e => setReviewForm({...reviewForm, feedback: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" rows={3} />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowReviewModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-teal-600 text-white rounded-xl font-bold shadow">Submit Review</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
