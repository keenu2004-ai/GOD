import React, { useState, useEffect } from 'react';
import { FolderGit2, Plus, CheckCircle, Clock, Check, X } from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { Project } from '../types/index.js';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/projects');
      if (res.data?.success) setProjects(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FolderGit2 className="w-6 h-6 text-indigo-600" />
            Projects & Task Delivery
          </h2>
          <p className="text-xs text-slate-500 mt-1">Monitor active enterprise client projects, task completion, and budget allocations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((proj) => (
          <div key={proj.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-blue-600 font-mono font-bold uppercase">{proj.code}</span>
                <h3 className="font-bold text-slate-900 text-base mt-0.5">{proj.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{proj.description}</p>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                {proj.status}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-600 font-mono">
                <span>Completion Progress:</span>
                <span className="font-bold text-emerald-600">{proj.progress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div className="bg-emerald-600 h-full transition-all" style={{ width: `${proj.progress}%` }}></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs font-mono">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-400 text-[10px] font-bold">CLIENT:</span>
                <p className="font-bold text-slate-900">{proj.client_name}</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-400 text-[10px] font-bold">BUDGET ALLOCATION:</span>
                <p className="font-bold text-emerald-700">₹{Number(proj.budget).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
