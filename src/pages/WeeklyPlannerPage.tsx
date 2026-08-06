import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import apiClient from '../services/apiClient.js';

export const WeeklyPlannerPage: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    const fetchPlanner = async () => {
      try {
        const res = await apiClient.get('/planner');
        if (res.data?.success) setTasks(res.data.data);
      } catch (e) { console.error(e); }
    };
    fetchPlanner();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-indigo-600" />
          Weekly Work Planner
        </h2>
        <p className="text-xs text-slate-500 mt-1">Organize weekly sprint deliverables and priority commitments.</p>
      </div>

      <div className="space-y-3">
        {tasks.map((t) => (
          <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-center text-xs shadow-sm">
            <div>
              <p className="font-bold text-slate-900">{t.title}</p>
              <p className="text-slate-500 mt-0.5">{t.description}</p>
            </div>
            <span className="bg-blue-100 text-blue-800 font-mono text-[10px] px-2 py-0.5 rounded font-bold border border-blue-200">{t.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
