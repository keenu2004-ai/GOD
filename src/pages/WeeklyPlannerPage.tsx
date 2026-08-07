import React, { useState, useEffect } from 'react';
import { Calendar, Plus, CheckCircle2, Clock, Upload, FileSpreadsheet, X, AlertCircle } from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { ExcelWeekPlanImportModal } from '../components/ExcelWeekPlanImportModal.js';

export const WeeklyPlannerPage: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showExcelModal, setShowExcelModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'HIGH',
    week_start_date: new Date().toISOString().split('T')[0],
  });

  const fetchPlanner = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/planner');
      if (res.data?.success) setTasks(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanner();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await apiClient.post('/planner', formData);
      if (res.data?.success) {
        alert('Weekly sprint task added successfully!');
        setShowAddModal(false);
        setFormData({ title: '', description: '', priority: 'HIGH', week_start_date: new Date().toISOString().split('T')[0] });
        fetchPlanner();
      }
    } catch (err: any) {
      alert('Failed to add planner task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'DONE' ? 'PENDING' : 'DONE';
      const res = await apiClient.put(`/planner/${id}/status`, { status: nextStatus });
      if (res.data?.success) fetchPlanner();
    } catch (err) {
      alert('Failed to update task status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            <span>Weekly Work Planner & Sprint Commitment</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Organize weekly sprint deliverables, import Excel schedules, and track completion progress.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExcelModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Import Excel Schedule</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Commitment</span>
          </button>
        </div>
      </div>

      {/* Task List Grid */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white p-8 text-center text-slate-400 rounded-2xl border border-slate-200">Loading planner tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="bg-white p-8 text-center text-slate-400 rounded-2xl border border-slate-200">
            No weekly commitments added yet. Click <strong>+ Add Commitment</strong> or <strong>Import Excel Schedule</strong> to begin.
          </div>
        ) : (
          tasks.map((t) => (
            <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs shadow-sm hover:border-indigo-200 transition-all">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleStatus(t.id, t.status)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${
                    t.status === 'DONE' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-indigo-500 text-transparent'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <div>
                  <p className={`font-bold text-slate-900 ${t.status === 'DONE' ? 'line-through text-slate-400' : ''}`}>{t.title}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">{t.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  t.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                  t.priority === 'HIGH' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                  'bg-blue-100 text-blue-700 border-blue-200'
                }`}>
                  {t.priority}
                </span>

                <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border ${
                  t.status === 'DONE' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {t.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 text-xs text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                <span>Add Weekly Sprint Commitment</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-slate-400 font-semibold">Deliverable Title</label>
                <input
                  type="text"
                  placeholder="e.g. Implement OAuth2 Refresh Token Auto-Rotation"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white mt-1"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 font-semibold">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white mt-1"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-semibold">Week Start Date</label>
                  <input
                    type="date"
                    value={formData.week_start_date}
                    onChange={(e) => setFormData({ ...formData, week_start_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white mt-1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold">Sprint Description & Requirements</label>
                <textarea
                  rows={3}
                  placeholder="Details of what needs to be delivered..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white mt-1"
                  required
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl">
                  {submitting ? 'Adding...' : 'Add Commitment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      {showExcelModal && (
        <ExcelWeekPlanImportModal
          isOpen={showExcelModal}
          onClose={() => setShowExcelModal(false)}
          onSuccess={() => {
            fetchPlanner();
            setShowExcelModal(false);
          }}
        />
      )}
    </div>
  );
};
