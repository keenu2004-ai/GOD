import React, { useState, useEffect } from 'react';
import { UserPlus, Laptop, Briefcase, Plus, CheckCircle, Clock, X, Shield, QrCode } from 'lucide-react';
import apiClient from '../services/apiClient.js';

export const RecruitmentPage: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    title: '',
    department_id: 2,
    job_code: '',
    experience_level: 'MID_LEVEL',
    positions_count: 2,
    salary_range_max: 1200000,
    description: '',
  });

  const fetchJobs = async () => {
    try {
      const res = await apiClient.get('/recruitments');
      if (res.data?.success) setJobs(res.data.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await apiClient.post('/recruitments', {
        ...formData,
        job_code: formData.job_code || `JOB-${Math.floor(100 + Math.random() * 900)}`,
      });
      if (res.data?.success) {
        alert('Job requisition posted successfully!');
        setShowModal(false);
        fetchJobs();
      }
    } catch (err: any) {
      alert('Failed to post job requisition');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-purple-600" />
            Recruitment & Applicant Tracking (ATS)
          </h2>
          <p className="text-xs text-slate-500 mt-1">Manage active corporate requisitions, candidate pipelines & interviews.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Post Requisition</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-purple-600 font-mono font-bold">{job.job_code}</span>
                <h3 className="font-bold text-slate-900 text-base mt-0.5">{job.title}</h3>
                <p className="text-xs text-slate-500">{job.department_name || 'Engineering'} • {job.experience_level}</p>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                {job.status || 'OPEN'}
              </span>
            </div>
            <p className="text-xs text-slate-600">{job.description}</p>
            <div className="flex justify-between items-center pt-2 text-xs font-mono border-t border-slate-100">
              <span className="text-slate-500">Positions Open: <strong className="text-slate-900">{job.positions_count}</strong></span>
              <span className="text-emerald-700 font-bold">CTC: ₹{(Number(job.salary_range_max || 1200000)/100000).toFixed(1)} LPA</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 text-xs text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-500" />
                <span>Post Job Requisition</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateJob} className="space-y-4">
              <div>
                <label className="text-slate-400 font-semibold">Job Title</label>
                <input type="text" placeholder="e.g. Senior Full Stack Engineer" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white mt-1" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 font-semibold">Positions Open</label>
                  <input type="number" value={formData.positions_count} onChange={(e) => setFormData({ ...formData, positions_count: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white mt-1" required />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold">Experience Level</label>
                  <select value={formData.experience_level} onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white mt-1">
                    <option value="JUNIOR">Junior (0-2 Yrs)</option>
                    <option value="MID_LEVEL">Mid Level (2-5 Yrs)</option>
                    <option value="SENIOR">Senior (5+ Yrs)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-slate-400 font-semibold">Description</label>
                <textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white mt-1" required></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl">
                  {submitting ? 'Posting...' : 'Post Requisition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const AssetsPage: React.FC = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    name: '',
    category: 'LAPTOP',
    serial_number: '',
    cost: 75000,
    purchase_date: new Date().toISOString().split('T')[0],
    condition: 'EXCELLENT',
    assigned_to: '',
  });

  const fetchAssets = async () => {
    try {
      const res = await apiClient.get('/assets');
      if (res.data?.success) setAssets(res.data.data);
    } catch (e) { console.error(e); }
  };

  const fetchEmployees = async () => {
    try {
      const res = await apiClient.get('/employees');
      if (res.data?.success) setEmployees(res.data.data.employees || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchAssets();
    fetchEmployees();
  }, []);

  const handleRegisterAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await apiClient.post('/assets', {
        ...formData,
        assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null,
      });
      if (res.data?.success) {
        alert('Corporate Asset registered successfully in inventory!');
        setShowModal(false);
        setFormData({ name: '', category: 'LAPTOP', serial_number: '', cost: 75000, purchase_date: new Date().toISOString().split('T')[0], condition: 'EXCELLENT', assigned_to: '' });
        fetchAssets();
      }
    } catch (err: any) {
      alert('Failed to register corporate asset');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Laptop className="w-6 h-6 text-cyan-600" />
            IT & Company Hardware Asset Lifecycle Tracking
          </h2>
          <p className="text-xs text-slate-500 mt-1">Enterprise hardware inventory, serial numbers & employee allocations.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Register Corporate Asset</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">Asset Code / Model</th>
                <th className="p-4">Category</th>
                <th className="p-4">Serial Number</th>
                <th className="p-4">Condition</th>
                <th className="p-4">Assigned Employee</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assets.map((ast) => (
                <tr key={ast.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-slate-900">{ast.name}</p>
                    <p className="text-[10px] text-cyan-600 font-mono font-bold mt-0.5">{ast.asset_code || `AST-${ast.id}`}</p>
                  </td>
                  <td className="p-4 font-mono font-semibold text-slate-700">{ast.category}</td>
                  <td className="p-4 font-mono text-slate-600 flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-cyan-600" />
                    <span>{ast.serial_number || 'SN-892182'}</span>
                  </td>
                  <td className="p-4">
                    <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">
                      {ast.condition || 'EXCELLENT'}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-slate-800">
                    {ast.first_name ? (
                      <div className="flex items-center gap-2">
                        <img src={ast.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'} className="w-6 h-6 rounded-full object-cover" alt="" />
                        <span>{ast.first_name} {ast.last_name}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned (In Inventory)</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      ast.status === 'ALLOCATED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                      'bg-amber-100 text-amber-800 border-amber-200'
                    }`}>
                      {ast.status || 'AVAILABLE'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 text-xs text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Laptop className="w-5 h-5 text-cyan-400" />
                <span>Register Corporate Asset</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleRegisterAsset} className="space-y-4">
              <div>
                <label className="text-slate-400 font-semibold">Asset Name / Model</label>
                <input type="text" placeholder="e.g. MacBook Pro M3 Max 16-inch" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white mt-1" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 font-semibold">Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white mt-1">
                    <option value="LAPTOP">Laptop / Workstation</option>
                    <option value="DESKTOP">Desktop Workstation</option>
                    <option value="MONITOR">Monitor Screen</option>
                    <option value="PHONE">Mobile Phone</option>
                    <option value="PERIPHERAL">Peripheral / Keyboards</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 font-semibold">Serial Number</label>
                  <input type="text" placeholder="e.g. C02G918237" value={formData.serial_number} onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white mt-1" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 font-semibold">Cost (₹)</label>
                  <input type="number" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white mt-1" required />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold">Assigned Employee</label>
                  <select value={formData.assigned_to} onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white mt-1">
                    <option value="">Keep in Inventory (Unassigned)</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_code})</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl">
                  {submitting ? 'Registering...' : 'Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
