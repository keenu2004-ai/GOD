import React, { useState, useEffect } from 'react';
import { Network, Award, Shield, UserCheck, Star } from 'lucide-react';
import apiClient from '../services/apiClient.js';

export const OrgChartPage: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const res = await apiClient.get('/employees?limit=50');
        if (res.data?.success) setEmployees(res.data.data.employees);
      } catch (e) { console.error(e); }
    };
    fetchOrg();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Network className="w-6 h-6 text-blue-600" />
          Organization Hierarchy
        </h2>
        <p className="text-xs text-slate-500 mt-1">Interactive reporting lines across THEIAKSHI ENTERPRISES departments.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {employees.map((emp) => (
          <div key={emp.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm hover:border-slate-300 transition-all">
            <img src={emp.avatar_url} alt="" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
            <div>
              <p className="font-bold text-slate-900 text-sm">{emp.first_name} {emp.last_name}</p>
              <p className="text-xs text-blue-600 font-mono font-bold">{emp.designation}</p>
              <p className="text-[10px] text-slate-500">{emp.department_name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const PerformancePage: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await apiClient.get('/performance');
        if (res.data?.success) setReviews(res.data.data);
      } catch (e) { console.error(e); }
    };
    fetchReviews();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-6 h-6 text-amber-500" />
          Performance Appraisals & Reviews
        </h2>
        <p className="text-xs text-slate-500 mt-1">Quarterly appraisal ratings, manager feedback & goal milestones.</p>
      </div>

      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
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
            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">{r.feedback}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
