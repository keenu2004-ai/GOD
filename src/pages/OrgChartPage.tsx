import React, { useState, useEffect } from 'react';
import { Network, Award, Shield, UserCheck, Star, Crown, Building2, ChevronDown, ChevronRight, Mail, Phone, Plus, X } from 'lucide-react';
import apiClient from '../services/apiClient.js';

export const OrgChartPage: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/employees?limit=100');
        if (res.data?.success) setEmployees(res.data.data.employees || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrg();
  }, []);

  const ceo = employees.find(e => e.role === 'ADMIN' || e.role === 'SUPER_ADMIN' || e.designation?.includes('Chief') || e.designation?.includes('CEO')) || employees[0];
  const departmentHeads = employees.filter(e => e.id !== ceo?.id && (e.role === 'HR_MANAGER' || e.role === 'DEPT_HEAD' || e.designation?.includes('Lead') || e.designation?.includes('Manager')));
  const teamMembers = employees.filter(e => e.id !== ceo?.id && !departmentHeads.some(dh => dh.id === e.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Network className="w-6 h-6 text-blue-600" />
            <span>Interactive Corporate Organization Hierarchy</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Real-time reporting tree across THEIAKSHI ENTERPRISES leadership, managers & team members.</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-12 text-center text-slate-400 rounded-2xl border border-slate-200">Loading organization tree...</div>
      ) : (
        <div className="space-y-8">
          {/* Level 1: CEO / Executive Leadership */}
          {ceo && (
            <div className="flex flex-col items-center">
              <div className="text-center mb-2">
                <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-3 py-1 rounded-full border border-amber-300 font-mono tracking-wider">
                  EXECUTIVE LEADERSHIP & BOARD
                </span>
              </div>

              <div
                onClick={() => setSelectedEmp(ceo)}
                className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-5 rounded-2xl border border-amber-500/50 shadow-xl w-80 text-center cursor-pointer hover:scale-105 transition-transform"
              >
                <div className="relative inline-block">
                  <img src={ceo.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'} className="w-16 h-16 rounded-full object-cover ring-4 ring-amber-500/40 mx-auto" alt="" />
                  <Crown className="w-6 h-6 text-amber-400 absolute -top-2 -right-2 bg-slate-900 rounded-full p-1 border border-amber-400" />
                </div>
                <h3 className="font-extrabold text-base mt-2 text-white">{ceo.first_name} {ceo.last_name}</h3>
                <p className="text-xs text-amber-400 font-mono font-bold">{ceo.designation || 'Chief Executive Officer'}</p>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">{ceo.email}</p>
              </div>

              {/* Connecting Line */}
              <div className="w-0.5 h-8 bg-slate-300"></div>
            </div>
          )}

          {/* Level 2: Department Heads & Managers */}
          {departmentHeads.length > 0 && (
            <div className="space-y-4">
              <div className="text-center">
                <span className="bg-blue-100 text-blue-900 text-[10px] font-black px-3 py-1 rounded-full border border-blue-300 font-mono tracking-wider">
                  DEPARTMENT HEADS & FUNCTIONAL MANAGERS
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {departmentHeads.map((emp) => (
                  <div
                    key={emp.id}
                    onClick={() => setSelectedEmp(emp)}
                    className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                  >
                    <img src={emp.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'} className="w-12 h-12 rounded-xl object-cover ring-2 ring-blue-100" alt="" />
                    <div className="overflow-hidden">
                      <p className="font-bold text-slate-900 text-xs truncate">{emp.first_name} {emp.last_name}</p>
                      <p className="text-[11px] text-blue-600 font-mono font-bold truncate">{emp.designation}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{emp.department_name || 'Engineering'}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Connecting Line */}
              <div className="w-0.5 h-8 bg-slate-300 mx-auto"></div>
            </div>
          )}

          {/* Level 3: Individual Contributors */}
          {teamMembers.length > 0 && (
            <div className="space-y-4">
              <div className="text-center">
                <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-300 font-mono tracking-wider">
                  ENGINEERING & OPERATIONS TEAM MEMBERS
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {teamMembers.map((emp) => (
                  <div
                    key={emp.id}
                    onClick={() => setSelectedEmp(emp)}
                    className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 shadow-xs hover:border-emerald-300 transition-all cursor-pointer"
                  >
                    <img src={emp.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'} className="w-9 h-9 rounded-lg object-cover" alt="" />
                    <div className="overflow-hidden">
                      <p className="font-bold text-slate-900 text-[11px] truncate">{emp.first_name} {emp.last_name}</p>
                      <p className="text-[10px] text-emerald-700 font-mono truncate">{emp.designation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Employee Details Modal */}
      {selectedEmp && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 text-xs text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Network className="w-5 h-5 text-blue-400" />
                <span>Employee Profile & Reporting Line</span>
              </h3>
              <button onClick={() => setSelectedEmp(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="text-center space-y-2">
              <img src={selectedEmp.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'} className="w-20 h-20 rounded-full object-cover ring-4 ring-blue-500/30 mx-auto" alt="" />
              <h4 className="font-extrabold text-lg text-white">{selectedEmp.first_name} {selectedEmp.last_name}</h4>
              <p className="text-xs text-blue-400 font-mono font-bold">{selectedEmp.designation}</p>
              <span className="bg-blue-500/20 text-blue-300 font-mono text-[10px] px-2.5 py-0.5 rounded-full border border-blue-400/30">
                {selectedEmp.employee_code}
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl space-y-2.5 border border-slate-800 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Department:</span>
                <strong className="text-white">{selectedEmp.department_name || 'Engineering'}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Branch Location:</span>
                <strong className="text-white">{selectedEmp.branch_name || 'THEIAKSHI HQ'}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Corporate Email:</span>
                <strong className="text-white font-mono text-[11px]">{selectedEmp.email}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Phone:</span>
                <strong className="text-white font-mono">{selectedEmp.phone || '+91 9876543210'}</strong>
              </div>
            </div>

            <button onClick={() => setSelectedEmp(null)} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl">
              Close Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const PerformancePage: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    employee_id: '',
    review_period: 'Q3 2026',
    rating: 4.5,
    feedback: '',
    goals: 'Deliver scalable API endpoints and optimize database queries',
  });

  const fetchReviews = async () => {
    try {
      const res = await apiClient.get('/performance');
      if (res.data?.success) setReviews(res.data.data);
    } catch (e) { console.error(e); }
  };

  const fetchEmployees = async () => {
    try {
      const res = await apiClient.get('/employees');
      if (res.data?.success) setEmployees(res.data.data.employees || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchReviews();
    fetchEmployees();
  }, []);

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await apiClient.post('/performance', {
        ...formData,
        employee_id: Number(formData.employee_id),
      });
      if (res.data?.success) {
        alert('Performance appraisal review submitted successfully!');
        setShowModal(false);
        fetchReviews();
      }
    } catch (err: any) {
      alert('Failed to submit performance review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" />
            <span>Quarterly Performance Appraisals & Reviews</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Quarterly appraisal ratings, manager feedback & goal milestones.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Conduct Appraisal</span>
        </button>
      </div>

      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{r.first_name} {r.last_name}</h3>
                <p className="text-xs text-slate-500">{r.designation} • Review Period: <strong className="text-blue-600 font-mono">{r.review_period}</strong></p>
              </div>
              <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-3 py-1 rounded-lg border border-amber-200 text-sm font-bold font-mono">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span>{r.rating} / 5.0</span>
              </div>
            </div>
            <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200">{r.feedback}</p>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 text-xs text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span>Submit Performance Appraisal</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateReview} className="space-y-4">
              <div>
                <label className="text-slate-400 font-semibold">Select Employee</label>
                <select value={formData.employee_id} onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white mt-1" required>
                  <option value="">Choose Employee...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.designation})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 font-semibold">Review Period</label>
                  <input type="text" value={formData.review_period} onChange={(e) => setFormData({ ...formData, review_period: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white mt-1" required />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold">Rating (1.0 to 5.0)</label>
                  <input type="number" step="0.1" max="5" min="1" value={formData.rating} onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white mt-1" required />
                </div>
              </div>
              <div>
                <label className="text-slate-400 font-semibold">Manager Feedback Comments</label>
                <textarea rows={3} value={formData.feedback} onChange={(e) => setFormData({ ...formData, feedback: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white mt-1" required></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl">
                  {submitting ? 'Submitting...' : 'Submit Appraisal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
