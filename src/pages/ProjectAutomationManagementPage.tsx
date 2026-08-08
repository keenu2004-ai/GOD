import React, { useState, useEffect, useCallback } from 'react';
import {
  Zap, Search, CheckSquare, AlertTriangle, RefreshCw, Shield, Layers,
  CheckCircle2, Clock, Filter, ArrowRight, UserCheck, Play
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

interface Task {
  id: number;
  task_number: string;
  title: string;
  status: string;
  priority: string;
  due_date?: string;
  project_name?: string;
}

interface Project {
  id: number;
  name: string;
  code: string;
  health_status?: string;
  status: string;
  progress_percentage: number;
}

export const ProjectAutomationManagementPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const isManager = ['ADMIN', 'PROJECT_MANAGER', 'DEPT_HEAD', 'SUPER_ADMIN'].includes(userRole);

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [loading, setLoading] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('COMPLETED');
  const [bulkPriority, setBulkPriority] = useState('HIGH');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [prjRes, tskRes] = await Promise.all([
        apiClient.get('/projects').catch(() => ({ data: { data: [] } })),
        apiClient.get('/tasks').catch(() => ({ data: { data: [] } })),
      ]);
      setProjects(prjRes.data?.data || []);
      setTasks(tskRes.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleGlobalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await apiClient.get(`/projects/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res.data?.data?.results || []);
    } catch (e: any) { alert('Search failed'); }
    finally { setIsSearching(false); }
  };

  const handleRunDeadlineCheck = async () => {
    try {
      const res = await apiClient.post('/projects/automation/check-deadlines');
      alert(`⚡ Deadline check completed! Marked ${res.data?.data?.overdue_tasks_marked || 0} tasks as OVERDUE.`);
      await fetchData();
    } catch (e: any) { alert('Automation failed'); }
  };

  const handleRecalculateHealth = async (projectId: number) => {
    try {
      const res = await apiClient.post(`/projects/${projectId}/recalculate-health`);
      alert(`✅ Project health recalculated: ${res.data?.data?.health_status}`);
      await fetchData();
    } catch (e: any) { alert('Recalculation failed'); }
  };

  const handleBulkUpdateStatus = async () => {
    if (selectedTaskIds.length === 0) return alert('Select tasks first');
    try {
      await apiClient.post('/tasks/bulk-update', {
        task_ids: selectedTaskIds,
        status: bulkStatus,
      });
      setSelectedTaskIds([]);
      await fetchData();
      alert(`✅ Bulk status updated to ${bulkStatus}!`);
    } catch (e: any) { alert('Bulk update failed'); }
  };

  const toggleSelectTask = (id: number) => {
    setSelectedTaskIds(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-5 min-h-screen pb-10">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-amber-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-600/30 rounded-xl">
              <Zap className="w-7 h-7 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Enterprise Project Automation & Bulk Workspace</h2>
              <p className="text-xs text-amber-300/70 font-mono mt-0.5">Deadline Automation • Health Recalculations • Global Search • Bulk Task Operations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleRunDeadlineCheck} className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg">
              <Play className="w-4 h-4 fill-current" /> Run Deadline Check Engine
            </button>
          </div>
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleGlobalSearch} className="mt-5 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Global Enterprise Search across Projects, Tasks & Milestones..."
              className="w-full pl-9 pr-4 py-2.5 bg-white/10 text-white placeholder-slate-400 rounded-xl text-xs border border-white/20" />
          </div>
          <button type="submit" className="bg-white/20 hover:bg-white/30 text-white font-bold text-xs px-5 rounded-xl border border-white/20">
            Search
          </button>
        </form>
      </div>

      {/* Global Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider">Search Results ({searchResults.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {searchResults.map((r, i) => (
              <div key={i} className="p-3 bg-slate-50 border rounded-xl space-y-1 text-xs">
                <span className="text-[9px] font-mono text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">{r.category}</span>
                <p className="font-bold text-slate-900">{r.title}</p>
                <p className="text-[10px] text-slate-500">{r.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── BULK TASK OPERATIONS & AUTOMATION GRID ─────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Bulk Task Manager */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-amber-600" /> Bulk Task Operations
            </h3>
            {selectedTaskIds.length > 0 && (
              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {selectedTaskIds.length} Selected
              </span>
            )}
          </div>

          {selectedTaskIds.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-2 py-1 font-bold text-slate-900">
                <option value="IN_PROGRESS">Set IN_PROGRESS</option>
                <option value="IN_REVIEW">Set IN_REVIEW</option>
                <option value="COMPLETED">Set COMPLETED</option>
                <option value="BLOCKED">Set BLOCKED</option>
              </select>
              <button onClick={handleBulkUpdateStatus} className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3 py-1 rounded-lg">
                Apply Bulk Action
              </button>
            </div>
          )}

          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {tasks.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-2.5 bg-slate-50 border rounded-xl text-xs hover:bg-slate-100/80">
                <input type="checkbox" checked={selectedTaskIds.includes(t.id)} onChange={() => toggleSelectTask(t.id)} className="rounded" />
                <div className="flex-1">
                  <span className="font-mono text-[10px] text-slate-500 font-bold">{t.task_number}: </span>
                  <span className="font-bold text-slate-900">{t.title}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded">{t.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Project Health Recalculation Engine */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-600" /> Automated Project Health Monitor
          </h3>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {projects.map(p => (
              <div key={p.id} className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">{p.name} ({p.code})</p>
                  <p className="text-[10px] text-slate-500">Progress: {p.progress_percentage}%</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    p.health_status === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' :
                    p.health_status === 'AT_RISK' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>{p.health_status || 'HEALTHY'}</span>
                  <button onClick={() => handleRecalculateHealth(p.id)} className="px-2 py-1 bg-slate-200 text-slate-800 font-bold text-[10px] rounded hover:bg-slate-300">
                    Recalculate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
