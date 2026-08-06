import React, { useState, useEffect } from 'react';
import { UserPlus, Laptop, Briefcase, Plus, CheckCircle, Clock } from 'lucide-react';
import apiClient from '../services/apiClient.js';

export const RecruitmentPage: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await apiClient.get('/recruitments');
        if (res.data?.success) setJobs(res.data.data);
      } catch (e) { console.error(e); }
    };
    fetchJobs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-purple-600" />
            Recruitment & Applicant Tracking (ATS)
          </h2>
          <p className="text-xs text-slate-500 mt-1">Manage active corporate requisitions, candidate pipelines & interviews.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-purple-600 font-mono font-bold">{job.job_code}</span>
                <h3 className="font-bold text-slate-900 text-base mt-0.5">{job.title}</h3>
                <p className="text-xs text-slate-500">{job.department_name} • {job.experience_level}</p>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                {job.status}
              </span>
            </div>
            <p className="text-xs text-slate-600">{job.description}</p>
            <div className="flex justify-between items-center pt-2 text-xs font-mono border-t border-slate-100">
              <span className="text-slate-500">Positions Open: <strong className="text-slate-900">{job.positions_count}</strong></span>
              <span className="text-emerald-700 font-bold">CTC: ₹{(job.salary_range_max/100000).toFixed(1)} LPA</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AssetsPage: React.FC = () => {
  const [assets, setAssets] = useState<any[]>([]);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const res = await apiClient.get('/assets');
        if (res.data?.success) setAssets(res.data.data);
      } catch (e) { console.error(e); }
    };
    fetchAssets();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Laptop className="w-6 h-6 text-cyan-600" />
            IT & Company Hardware Asset Tracking
          </h2>
          <p className="text-xs text-slate-500 mt-1">Enterprise hardware inventory, serial numbers & employee allocations.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-wider border-b border-slate-200">
            <tr>
              <th className="p-4">Asset Code / Model</th>
              <th className="p-4">Category</th>
              <th className="p-4">Serial Number</th>
              <th className="p-4">Assigned Employee</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {assets.map((ast) => (
              <tr key={ast.id} className="hover:bg-slate-50">
                <td className="p-4">
                  <p className="font-bold text-slate-900">{ast.name}</p>
                  <p className="text-[10px] text-cyan-600 font-mono font-bold">{ast.asset_code}</p>
                </td>
                <td className="p-4 font-mono">{ast.category}</td>
                <td className="p-4 font-mono text-slate-500">{ast.serial_number}</td>
                <td className="p-4 font-semibold text-slate-800">
                  {ast.first_name ? `${ast.first_name} ${ast.last_name}` : 'Unassigned'}
                </td>
                <td className="p-4">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                    {ast.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
