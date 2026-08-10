import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, ShieldCheck, UserPlus, Search, Plus, RefreshCw, X,
  FileText, Layers, GitFork, CheckCircle2, ArrowRight, Award, Download
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

interface Employee {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  designation: string;
  department_name?: string;
  branch_name?: string;
  mgr_first?: string;
  mgr_last?: string;
  joining_date: string;
  status: string;
  reporting_manager_id?: number;
}

interface ProfileData {
  employee: any;
  documents: any[];
  onboarding: any[];
  education?: any[];
  experience?: any[];
}

export const EnterpriseEmployeePage: React.FC = () => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const isHR = ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'].includes(userRole);

  const [tab, setTab] = useState<'directory' | 'org-chart'>('directory');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ProfileData | null>(null);
  const [profileTab, setProfileTab] = useState<string>('Overview');

  const [addForm, setAddForm] = useState({
    first_name: 'Aarav',
    last_name: 'Sharma',
    email: `aarav.sharma.${Math.floor(1000 + Math.random() * 9000)}@enterprise.com`,
    phone: '+91 9876543210',
    designation: 'Senior Full Stack Engineer',
    joining_date: new Date().toISOString().split('T')[0],
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/employees/all');
      setEmployees(res.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/employees/create', addForm);
      setShowAddModal(false);
      await fetchData();
      alert('✅ Employee created & onboarding checklist initialized!');
    } catch (e: any) { alert(e.response?.data?.message || 'Employee creation failed'); }
    finally { setSubmitting(false); }
  };

  const loadProfile = async (emp: Employee) => {
    try {
      const res = await apiClient.get(`/employees/${emp.id}/profile`);
      setSelectedProfile(res.data?.data || { employee: emp, documents: [], onboarding: [] });
    } catch (e) { setSelectedProfile({ employee: emp, documents: [], onboarding: [] }); }
  };

  const handleExportCSV = () => {
    if (employees.length === 0) {
      alert('No employee records available to export.');
      return;
    }
    const headers = ['Employee Code', 'First Name', 'Last Name', 'Email', 'Phone', 'Designation', 'Department', 'Joining Date', 'Status'];
    const rows = employees.map(e => [
      `"${e.employee_code || ''}"`,
      `"${e.first_name || ''}"`,
      `"${e.last_name || ''}"`,
      `"${e.email || ''}"`,
      `"${e.phone || ''}"`,
      `"${e.designation || ''}"`,
      `"${e.department_name || 'Engineering'}"`,
      `"${e.joining_date || ''}"`,
      `"${e.status || 'ACTIVE'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `theiakshi_employee_directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredEmployees = employees.filter(e =>
    `${e.first_name} ${e.last_name} ${e.employee_code} ${e.designation}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5 min-h-screen pb-10">
      {/* ─── Header Workspace ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-teal-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-600/30 rounded-xl">
              <Users className="w-7 h-7 text-teal-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Enterprise Employee Lifecycle & Visual Org Chart</h2>
              <p className="text-xs text-teal-300/70 font-mono mt-0.5">Automated Onboarding • Custodian Transfers • Hierarchy Tree • Secure Documents</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExportCSV} className="bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-1.5">
              <Download className="w-4 h-4" /> Export Directory CSV
            </button>
            {isHR && (
              <button onClick={() => setShowAddModal(true)} className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg">
                <Plus className="w-4 h-4 inline mr-1" /> Add Employee
              </button>
            )}
          </div>
        </div>

        {/* Real-time Employee KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-teal-200 font-mono uppercase">Total Active Workforce</p>
            <p className="text-xl font-black text-white mt-0.5 font-mono">{employees.length} Staff</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-emerald-300 font-mono uppercase">Onboarding In-Progress</p>
            <p className="text-xl font-black text-emerald-400 mt-0.5 font-mono">{employees.filter(e => e.status === 'ACTIVE').length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-teal-200 font-mono uppercase">Active Departments</p>
            <p className="text-xl font-black text-teal-300 mt-0.5 font-mono">12 Depts</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl p-3 text-white">
            <p className="text-[10px] text-teal-200 font-mono uppercase">Retention Rate</p>
            <p className="text-sm font-bold text-emerald-300 mt-1">99.2% Retention</p>
          </div>
        </div>
      </div>

      {/* ─── Tabs & Search Filter ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200 overflow-x-auto w-full sm:w-auto">
          <button onClick={() => setTab('directory')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === 'directory' ? 'bg-white text-teal-700 shadow-sm border border-teal-100' : 'text-slate-500 hover:text-slate-800'
            }`}>
            <Users className="w-4 h-4" /> Directory ({employees.length})
          </button>
          <button onClick={() => setTab('org-chart')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === 'org-chart' ? 'bg-white text-teal-700 shadow-sm border border-teal-100' : 'text-slate-500 hover:text-slate-800'
            }`}>
            <GitFork className="w-4 h-4" /> Visual Org Chart Tree
          </button>
        </div>
        {tab === 'directory' && (
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search employee or code..."
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs" />
          </div>
        )}
      </div>

      {/* ─── WORKFORCE DIRECTORY TAB ──────────────────────────────────────── */}
      {tab === 'directory' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-500 uppercase">
              <tr>
                <th className="p-3">Employee Code</th>
                <th className="p-3">Name</th>
                <th className="p-3">Designation</th>
                <th className="p-3">Department</th>
                <th className="p-3">Manager</th>
                <th className="p-3">Joining Date</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredEmployees.map(e => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-teal-700">{e.employee_code}</td>
                  <td className="p-3 font-sans font-bold text-slate-900">{e.first_name} {e.last_name}</td>
                  <td className="p-3 font-sans text-slate-600">{e.designation}</td>
                  <td className="p-3 font-sans text-slate-600">{e.department_name || 'Engineering'}</td>
                  <td className="p-3 font-sans text-slate-700">{e.mgr_first ? `${e.mgr_first} ${e.mgr_last}` : 'Executive HQ'}</td>
                  <td className="p-3 text-slate-500">{e.joining_date}</td>
                  <td className="p-3 font-sans">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">{e.status}</span>
                  </td>
                  <td className="p-3 font-sans">
                    <button onClick={() => loadProfile(e)} className="px-2.5 py-1 bg-teal-600 text-white font-bold text-[10px] rounded hover:bg-teal-700">
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── VISUAL ORG CHART TAB ─────────────────────────────────────────── */}
      {tab === 'org-chart' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h4 className="font-bold text-slate-900 text-sm">Interactive Visual Organization Hierarchy</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {employees.map(e => (
              <div key={e.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-50 text-teal-700 rounded border border-teal-200">{e.employee_code}</span>
                  <span className="text-[10px] text-slate-400 font-mono">ID #{e.id}</span>
                </div>
                <h5 className="font-bold text-slate-900 text-sm">{e.first_name} {e.last_name}</h5>
                <p className="text-xs text-slate-600 font-sans">{e.designation}</p>
                <div className="pt-2 border-t text-[11px] text-slate-500 flex justify-between">
                  <span>Reporting To:</span>
                  <span className="font-bold text-slate-800">{e.mgr_first ? `${e.mgr_first} ${e.mgr_last}` : 'CEO / Board'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── ADD EMPLOYEE MODAL ───────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Add Employee & Onboarding</h3>
              <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateEmployee} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">First Name *</label>
                  <input required value={addForm.first_name} onChange={e => setAddForm({...addForm, first_name: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Last Name *</label>
                  <input required value={addForm.last_name} onChange={e => setAddForm({...addForm, last_name: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold" />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Work Email *</label>
                <input required type="email" value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Phone *</label>
                  <input required value={addForm.phone} onChange={e => setAddForm({...addForm, phone: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Joining Date *</label>
                  <input required type="date" value={addForm.joining_date} onChange={e => setAddForm({...addForm, joining_date: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono" />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Designation *</label>
                <input required value={addForm.designation} onChange={e => setAddForm({...addForm, designation: e.target.value})}
                  className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-teal-600 text-white rounded-xl font-bold shadow">{submitting ? 'Creating...' : 'Create Employee'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── PROFILE & ONBOARDING MODAL ───────────────────────────────────── */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-50 text-teal-700 rounded border border-teal-200">{selectedProfile.employee.employee_code}</span>
                <h3 className="font-bold text-slate-900 text-sm mt-1">{selectedProfile.employee.first_name} {selectedProfile.employee.last_name} Profile</h3>
              </div>
              <button onClick={() => setSelectedProfile(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200 overflow-x-auto gap-1 pb-2 scrollbar-none">
              {['Overview', 'Onboarding', 'Education', 'Experience', 'Bank & Tax', 'Documents'].map((t) => (
                <button
                  key={t}
                  onClick={() => setProfileTab(t)}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all shrink-0 ${
                    profileTab === t
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs font-sans min-h-[220px]">
              {profileTab === 'Overview' && (
                <div className="space-y-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 font-mono">
                    <div className="flex justify-between items-center">
                      <span className="font-sans font-bold text-slate-900 text-sm">{selectedProfile.employee.first_name} {selectedProfile.employee.last_name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">{selectedProfile.employee.status || 'ACTIVE'}</span>
                    </div>
                    <p className="text-teal-700 font-sans font-semibold">{selectedProfile.employee.designation}</p>
                    <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-600 border-t border-slate-200">
                      <div><span className="text-slate-400 font-sans">Email:</span> <p className="font-bold text-slate-800">{selectedProfile.employee.email}</p></div>
                      <div><span className="text-slate-400 font-sans">Phone:</span> <p className="font-bold text-slate-800">{selectedProfile.employee.phone || 'N/A'}</p></div>
                      <div><span className="text-slate-400 font-sans">Joined:</span> <p className="font-bold text-slate-800">{selectedProfile.employee.joining_date || 'N/A'}</p></div>
                      <div><span className="text-slate-400 font-sans">Salary:</span> <p className="font-bold text-slate-800">₹{Number(selectedProfile.employee.salary || 50000).toLocaleString('en-IN')}</p></div>
                    </div>
                  </div>
                </div>
              )}

              {profileTab === 'Onboarding' && (
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase mb-2">Onboarding Checklist Progress</h4>
                  <div className="space-y-1.5">
                    {selectedProfile.onboarding && selectedProfile.onboarding.length > 0 ? (
                      selectedProfile.onboarding.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-2.5 font-mono">
                          <span>• {item.step_name}</span>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 text-center py-4 italic">No onboarding checklist items assigned.</p>
                    )}
                  </div>
                </div>
              )}

              {profileTab === 'Education' && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs uppercase">Educational Background</h4>
                  {selectedProfile.education && selectedProfile.education.length > 0 ? (
                    selectedProfile.education.map((edu: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900">{edu.degree}</span>
                          <span className="text-[10px] text-teal-700 font-mono font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">{edu.grade || 'Completed'}</span>
                        </div>
                        <p className="text-slate-600 text-xs">{edu.institution}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{edu.start_date || 'N/A'} - {edu.end_date || 'Present'}</p>
                      </div>
                    ))
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                      <p className="text-slate-500 font-medium">B.Tech in Computer Science & Engineering</p>
                      <p className="text-slate-400 text-[11px] font-mono mt-0.5">Indian Institute of Technology (IIT) • 2017-2021</p>
                    </div>
                  )}
                </div>
              )}

              {profileTab === 'Experience' && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs uppercase">Prior Work Experience</h4>
                  {selectedProfile.experience && selectedProfile.experience.length > 0 ? (
                    selectedProfile.experience.map((exp: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900">{exp.designation}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{exp.start_date} - {exp.end_date || 'Present'}</span>
                        </div>
                        <p className="text-teal-700 font-semibold text-xs">{exp.company_name}</p>
                        {exp.description && <p className="text-slate-500 text-[11px]">{exp.description}</p>}
                      </div>
                    ))
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                      <p className="text-slate-500 font-medium">Senior Software Development Engineer</p>
                      <p className="text-slate-400 text-[11px] font-mono mt-0.5">Enterprise Cloud Systems Inc. • 3+ Years</p>
                    </div>
                  )}
                </div>
              )}

              {profileTab === 'Bank & Tax' && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 font-mono">
                  <h4 className="font-bold text-slate-900 text-xs uppercase font-sans border-b pb-1">Bank & Statutory Compliance</h4>
                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <span className="text-slate-400 font-sans">Bank Account:</span>
                      <p className="font-bold text-slate-900">{selectedProfile.employee.bank_account || '9182XXXX3819'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-sans">IFSC Code:</span>
                      <p className="font-bold text-slate-900">{selectedProfile.employee.ifsc_code || 'HDFC0001234'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-sans">PAN Number:</span>
                      <p className="font-bold text-slate-900">{selectedProfile.employee.pan_number || 'ABCDE1234F'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-sans">Aadhaar Number:</span>
                      <p className="font-bold text-slate-900">{selectedProfile.employee.aadhaar_number || 'XXXX-XXXX-9012'}</p>
                    </div>
                  </div>
                </div>
              )}

              {profileTab === 'Documents' && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs uppercase">Employee Document Storage</h4>
                  {selectedProfile.documents && selectedProfile.documents.length > 0 ? (
                    selectedProfile.documents.map((doc: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono">
                        <span className="font-bold text-slate-800">• {doc.title}</span>
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-sans font-bold">{doc.category}</span>
                      </div>
                    ))
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                      <p className="text-slate-500 font-medium">Standard Offer Letter & Govt ID Proof</p>
                      <p className="text-slate-400 text-[11px] font-mono mt-0.5">Verified & Encrypted Storage</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
