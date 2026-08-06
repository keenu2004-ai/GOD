import React, { useState, useEffect } from 'react';
import { Calendar, Sparkles, CheckSquare, Plus, Send, Bot, User } from 'lucide-react';
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

export const AIAssistantPage: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [messages, setMessages] = useState<any[]>([
    {
      sender: 'bot',
      text: 'Hello Executive! I am THEIAKSHI ONE HR Intelligence AI powered by Gemini models. How can I assist you with workforce analytics, leave policy compliance, or attendance forecasting today?',
    },
  ]);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userText = query;
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setQuery('');
    setLoading(true);

    try {
      const res = await apiClient.post('/dashboard/ai-insights', { query: userText });
      if (res.data?.success) {
        setMessages((prev) => [...prev, { sender: 'bot', text: res.data.data.insights }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { sender: 'bot', text: 'Error connecting to Gemini AI Engine.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center gap-3 text-white shadow-sm">
        <Sparkles className="w-8 h-8 text-amber-400 animate-bounce" />
        <div>
          <h2 className="text-lg font-bold text-white">THEIAKSHI ONE HR Executive AI Assistant</h2>
          <p className="text-xs text-slate-300">Server-side Gemini Integration for Enterprise HR Analytics</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl h-[480px] flex flex-col justify-between p-4 shadow-sm">
        <div className="flex-1 overflow-y-auto space-y-3 p-2">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex items-start gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.sender === 'bot' && <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0"><Bot className="w-4 h-4 text-white" /></div>}
              <div className={`p-3.5 rounded-xl max-w-lg text-xs leading-relaxed ${m.sender === 'user' ? 'bg-blue-600 text-white font-medium' : 'bg-slate-50 text-slate-800 border border-slate-200 font-medium'}`}>
                {m.text}
              </div>
              {m.sender === 'user' && <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0"><User className="w-4 h-4 text-white" /></div>}
            </div>
          ))}
          {loading && <p className="text-xs text-indigo-600 font-mono font-bold animate-pulse">Gemini AI generating response...</p>}
        </div>

        <form onSubmit={handleSend} className="flex gap-2 pt-3 border-t border-slate-100">
          <input
            type="text"
            placeholder="Ask about retention rates, attendance anomalies, or payroll budgets..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 font-medium"
          />
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all">
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
