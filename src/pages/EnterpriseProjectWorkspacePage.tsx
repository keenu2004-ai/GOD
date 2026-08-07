import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderGit2, Plus, Search, Filter, RefreshCw, Calendar, Users, DollarSign,
  CheckCircle2, Clock, AlertTriangle, Shield, FileText, Upload, Sparkles, X,
  Layers, ChevronRight, Eye, UserPlus, File, MessageSquare
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

interface Project {
  id: number;
  name: string;
  code: string;
  description: string;
  project_type: string;
  priority: string;
  risk_level: string;
  status: string;
  health_status: string;
  budget: number;
  start_date?: string;
  end_date?: string;
  progress_percentage: number;
  manager_first?: string;
  manager_last?: string;
  member_count: number;
}

interface WorkspaceData {
  project: Project;
  members: any[];
  documents: any[];
  notes: any[];
}

const fmtCurr = (v: number | string) => `₹${parseFloat(String(v || 0)).toLocaleString('en-IN')}`;
const fmtDate = (s: string) => s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const EnterpriseProjectWorkspacePage: React.FC = () => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const isProjectAdmin = ['ADMIN', 'PROJECT_MANAGER', 'SUPER_ADMIN'].includes(userRole);

  const [projects, setProjects] = useState<Project[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Workspace Modal
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<'overview' | 'members' | 'files' | 'notes'>('overview');

  // Creation Modals
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Forms
  const [projForm, setProjForm] = useState({
    name: 'Enterprise Mobile App Refactor', code: 'MOB-2026', description: 'Complete React Native UI/UX refactor and backend sync optimization',
    project_type: 'DEVELOPMENT', priority: 'HIGH', risk_level: 'LOW', status: 'ACTIVE', budget: '250000',
    start_date: '2026-08-01', end_date: '2026-11-30', manager_id: '',
  });

  const [memberForm, setMemberForm] = useState({ employee_id: '', role_in_project: 'DEVELOPER' });
  const [docForm, setDocForm] = useState({ document_name: 'Architecture Diagram v1.0', file_url: 'https://docs.theiakshi.com/arch.pdf', file_type: 'PDF' });
  const [noteForm, setNoteForm] = useState({ title: 'Kickoff Meeting Minutes', note_content: 'Discussed sprint timeline, deliverables, and API dependencies.' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [projRes, kpiRes, empRes] = await Promise.all([
        apiClient.get(`/projects${statusFilter ? `?status=${statusFilter}` : ''}`),
        apiClient.get('/projects/analytics/kpis').catch(() => ({ data: { data: null } })),
        apiClient.get('/employees').catch(() => ({ data: { data: [] } })),
      ]);
      setProjects(projRes.data?.data || []);
      setKpis(kpiRes.data?.data || null);
      setEmployees(empRes.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchWorkspace = useCallback(async (id: number) => {
    try {
      const res = await apiClient.get(`/projects/${id}/workspace`);
      setWorkspace(res.data?.data || null);
      setSelectedProjectId(id);
    } catch (e: any) { alert(e.response?.data?.message || 'Failed to fetch workspace'); }
  }, []);

  const handleSeedCategories = async () => {
    try {
      await apiClient.post('/projects/seed');
      await fetchData();
      alert('✅ Standard project categories pre-seeded!');
    } catch (e: any) { alert(e.response?.data?.message || 'Seeding failed'); }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/projects', {
        ...projForm,
        budget: parseFloat(projForm.budget),
        manager_id: projForm.manager_id ? parseInt(projForm.manager_id) : undefined,
      });
      setShowProjectModal(false);
      await fetchData();
      alert('✅ Project created successfully!');
    } catch (e: any) { alert(e.response?.data?.message || 'Creation failed'); }
    finally { setSubmitting(false); }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    try {
      await apiClient.post('/projects/members', {
        project_id: selectedProjectId,
        employee_id: parseInt(memberForm.employee_id),
        role_in_project: memberForm.role_in_project,
      });
      setShowMemberModal(false);
      await fetchWorkspace(selectedProjectId);
      alert('✅ Team member assigned to project!');
    } catch (e: any) { alert(e.response?.data?.message || 'Assignment failed'); }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    try {
      await apiClient.post('/projects/documents', {
        project_id: selectedProjectId,
        document_name: docForm.document_name,
        file_url: docForm.file_url,
        file_type: docForm.file_type,
      });
      setShowDocModal(false);
      await fetchWorkspace(selectedProjectId);
      alert('✅ Document uploaded to project!');
    } catch (e: any) { alert(e.response?.data?.message || 'Upload failed'); }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    try {
      await apiClient.post('/projects/notes', {
        project_id: selectedProjectId,
        title: noteForm.title,
        note_content: noteForm.note_content,
      });
      setShowNoteModal(false);
      await fetchWorkspace(selectedProjectId);
      alert('✅ Meeting note created!');
    } catch (e: any) { alert(e.response?.data?.message || 'Note creation failed'); }
  };

  return (
    <div className="space-y-5 min-h-screen pb-10">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-cyan-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-600/30 rounded-xl">
              <FolderGit2 className="w-7 h-7 text-cyan-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Enterprise Project Workspaces & Portfolio Platform</h2>
              <p className="text-xs text-cyan-300/70 font-mono mt-0.5">ClickUp / Jira Workspaces • Team Allocation • Documents • Meeting Notes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSeedCategories} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-xl border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Seed Categories
            </button>
            <button onClick={() => setShowProjectModal(true)} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg">
              <Plus className="w-4 h-4" /> Create Project
            </button>
          </div>
        </div>

        {/* Portfolio BI Banner */}
        {kpis && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-2xl font-black text-white">{kpis.total_projects}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Total Portfolio Projects</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-2xl font-black text-cyan-300">{kpis.active_projects}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Active / In Planning</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-2xl font-black text-emerald-300">{kpis.completed_projects}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Completed Projects</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-2xl font-black text-amber-300">{fmtCurr(kpis.total_portfolio_budget)}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Total Portfolio Budget</p>
            </div>
          </div>
        )}
      </div>

      {/* ─── Filters Bar ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Filter Status:</span>
          {['', 'ACTIVE', 'PLANNING', 'COMPLETED', 'BLOCKED'].map(st => (
            <button key={st} onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === st ? 'bg-cyan-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              {st || 'All Projects'}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 font-semibold">{projects.length} Projects Found</p>
      </div>

      {/* ─── PROJECT CARDS GRID ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map(p => (
          <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                  <span className="text-[10px] font-mono text-slate-400">Code: {p.code}</span>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                  p.health_status === 'HEALTHY' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  p.health_status === 'ATTENTION_REQUIRED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {p.health_status}
                </span>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2">{p.description}</p>

              {/* Progress Bar */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                  <span>Completion</span>
                  <span>{p.progress_percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div style={{ width: `${p.progress_percentage}%` }} className="bg-cyan-600 h-full rounded-full" />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="text-[10px] text-slate-500 font-mono">
                <span>Manager: <strong>{p.manager_first || 'HR'}</strong></span> • <span>Budget: <strong>{fmtCurr(p.budget)}</strong></span>
              </div>
              <button onClick={() => fetchWorkspace(p.id)} className="flex items-center gap-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow">
                <Eye className="w-3.5 h-3.5" /> Workspace
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ─── CLICKUP/JIRA STYLE WORKSPACE MODAL ──────────────────────────── */}
      {selectedProjectId && workspace && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl p-6 shadow-2xl space-y-5 text-slate-900 border">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">{workspace.project.name} <span className="font-mono text-xs font-normal text-slate-400">({workspace.project.code})</span></h3>
                <p className="text-xs text-slate-500">{workspace.project.project_type} • Priority: <strong>{workspace.project.priority}</strong></p>
              </div>
              <button onClick={() => setSelectedProjectId(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            {/* Workspace Sub-tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button onClick={() => setWorkspaceTab('overview')} className={`px-4 py-2 rounded-lg ${workspaceTab === 'overview' ? 'bg-white text-cyan-700 shadow' : 'text-slate-500'}`}>Overview</button>
              <button onClick={() => setWorkspaceTab('members')} className={`px-4 py-2 rounded-lg ${workspaceTab === 'members' ? 'bg-white text-cyan-700 shadow' : 'text-slate-500'}`}>Team Members ({workspace.members.length})</button>
              <button onClick={() => setWorkspaceTab('files')} className={`px-4 py-2 rounded-lg ${workspaceTab === 'files' ? 'bg-white text-cyan-700 shadow' : 'text-slate-500'}`}>Files ({workspace.documents.length})</button>
              <button onClick={() => setWorkspaceTab('notes')} className={`px-4 py-2 rounded-lg ${workspaceTab === 'notes' ? 'bg-white text-cyan-700 shadow' : 'text-slate-500'}`}>Meeting Notes ({workspace.notes.length})</button>
            </div>

            {/* Tab 1: Overview */}
            {workspaceTab === 'overview' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border">
                  <div><span className="text-[10px] text-slate-400">HEALTH</span> <p className="font-bold text-slate-900">{workspace.project.health_status}</p></div>
                  <div><span className="text-[10px] text-slate-400">BUDGET</span> <p className="font-bold font-mono text-slate-900">{fmtCurr(workspace.project.budget)}</p></div>
                  <div><span className="text-[10px] text-slate-400">START DATE</span> <p className="font-bold font-mono text-slate-900">{fmtDate(workspace.project.start_date || '')}</p></div>
                  <div><span className="text-[10px] text-slate-400">END DATE</span> <p className="font-bold font-mono text-slate-900">{fmtDate(workspace.project.end_date || '')}</p></div>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-slate-700">Project Description</span>
                  <p className="p-3 bg-slate-50 border rounded-xl text-slate-600">{workspace.project.description}</p>
                </div>
              </div>
            )}

            {/* Tab 2: Team Members */}
            {workspaceTab === 'members' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">Assigned Team Members</span>
                  <button onClick={() => setShowMemberModal(true)} className="bg-cyan-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow">
                    <UserPlus className="w-3.5 h-3.5 inline mr-1" /> Add Member
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {workspace.members.map(m => (
                    <div key={m.id} className="p-3 bg-slate-50 border rounded-xl text-xs flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-900">{m.first_name} {m.last_name}</p>
                        <p className="text-[10px] text-slate-400">{m.department_name || 'Engineering'}</p>
                      </div>
                      <span className="bg-cyan-100 text-cyan-800 text-[10px] font-bold px-2 py-0.5 rounded">{m.role_in_project}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: Files */}
            {workspaceTab === 'files' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">Project Attachments & Specifications</span>
                  <button onClick={() => setShowDocModal(true)} className="bg-cyan-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow">
                    <Upload className="w-3.5 h-3.5 inline mr-1" /> Add Document
                  </button>
                </div>
                <div className="space-y-2">
                  {workspace.documents.map(d => (
                    <div key={d.id} className="p-3 bg-slate-50 border rounded-xl text-xs flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <File className="w-4 h-4 text-cyan-600" />
                        <div>
                          <p className="font-bold text-slate-900">{d.document_name}</p>
                          <a href={d.file_url} target="_blank" rel="noreferrer" className="text-[10px] text-cyan-600 hover:underline">{d.file_url}</a>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 rounded">{d.file_type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Notes */}
            {workspaceTab === 'notes' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">Meeting Minutes & Architecture Notes</span>
                  <button onClick={() => setShowNoteModal(true)} className="bg-cyan-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow">
                    <Plus className="w-3.5 h-3.5 inline mr-1" /> Create Note
                  </button>
                </div>
                <div className="space-y-2">
                  {workspace.notes.map(n => (
                    <div key={n.id} className="p-3 bg-slate-50 border rounded-xl text-xs space-y-1">
                      <p className="font-bold text-slate-900">{n.title}</p>
                      <p className="text-slate-600">{n.note_content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── CREATE PROJECT MODAL ───────────────────────────────────────── */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Create Enterprise Project</h3>
              <button onClick={() => setShowProjectModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Project Name *</label>
                <input required value={projForm.name} onChange={e => setProjForm({...projForm, name: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Project Code *</label>
                  <input required value={projForm.code} onChange={e => setProjForm({...projForm, code: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono uppercase" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Budget (₹) *</label>
                  <input required type="number" value={projForm.budget} onChange={e => setProjForm({...projForm, budget: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold" />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Description *</label>
                <textarea required value={projForm.description} onChange={e => setProjForm({...projForm, description: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" rows={2} />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowProjectModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-cyan-600 text-white rounded-xl font-bold shadow">{submitting ? 'Creating...' : 'Create Project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD MEMBER MODAL ───────────────────────────────────────────── */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Assign Member to Project</h3>
              <button onClick={() => setShowMemberModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddMember} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Employee *</label>
                <select required value={memberForm.employee_id} onChange={e => setMemberForm({...memberForm, employee_id: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                  <option value="">-- Choose Employee --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_code})</option>)}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Role in Project *</label>
                <select value={memberForm.role_in_project} onChange={e => setMemberForm({...memberForm, role_in_project: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                  <option value="PROJECT_MANAGER">Project Manager</option>
                  <option value="TEAM_LEAD">Team Lead</option>
                  <option value="DEVELOPER">Developer</option>
                  <option value="QA">QA Lead</option>
                  <option value="MEMBER">Team Member</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowMemberModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-cyan-600 text-white rounded-xl font-bold shadow">Assign Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD DOC MODAL ──────────────────────────────────────────────── */}
      {showDocModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Add Project Document</h3>
              <button onClick={() => setShowDocModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddDocument} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Document Title *</label>
                <input required value={docForm.document_name} onChange={e => setDocForm({...docForm, document_name: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
              </div>
              <div>
                <label className="font-semibold text-slate-700">File URL *</label>
                <input required value={docForm.file_url} onChange={e => setDocForm({...docForm, file_url: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowDocModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-cyan-600 text-white rounded-xl font-bold shadow">Save Document</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD NOTE MODAL ─────────────────────────────────────────────── */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Create Meeting Note</h3>
              <button onClick={() => setShowNoteModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateNote} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Title *</label>
                <input required value={noteForm.title} onChange={e => setNoteForm({...noteForm, title: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Content / Minutes *</label>
                <textarea required value={noteForm.note_content} onChange={e => setNoteForm({...noteForm, note_content: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" rows={3} />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowNoteModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-cyan-600 text-white rounded-xl font-bold shadow">Save Note</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
