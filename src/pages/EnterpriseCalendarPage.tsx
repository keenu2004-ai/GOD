import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Filter,
  CheckCircle2, Clock, CalendarCheck2, AlertCircle, Trash2, Edit3, X, User, MapPin, Tag
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

interface UnifiedEvent {
  id: string;
  type: 'HOLIDAY' | 'LEAVE' | 'ATTENDANCE' | 'REGULARIZATION' | 'TASK' | 'ANNOUNCEMENT';
  title: string;
  start: string;
  end?: string;
  status?: string;
  employeeId?: number;
  employeeName?: string;
  sourceId: string | number;
  metadata?: any;
}

export const EnterpriseCalendarPage: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  const [events, setEvents] = useState<UnifiedEvent[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [selectedEventType, setSelectedEventType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Task Modal State
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    task_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '10:00',
    priority: 'MEDIUM',
    status: 'PENDING',
    location: '',
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
      const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const res = await apiClient.get('/calendar/events', {
        params: {
          start: firstDay,
          end: lastDay,
          eventTypes: selectedEventType === 'ALL' ? undefined : selectedEventType
        }
      });
      setEvents(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch calendar events:', err);
    } finally {
      setLoading(false);
    }
  }, [year, month, selectedEventType]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Handle Month Navigation
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const todayMonth = () => setCurrentDate(new Date());

  // Days matrix for Month view
  const getDaysInMonth = () => {
    const days: (Date | null)[] = [];
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const getEventsForDate = (dateObj: Date) => {
    const dStr = dateObj.toISOString().split('T')[0];
    return events.filter(e => {
      if (selectedStatus !== 'ALL' && e.status !== selectedStatus) return false;
      if (e.end) {
        return dStr >= e.start && dStr <= e.end;
      }
      return e.start === dStr;
    });
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await apiClient.patch(`/calendar/tasks/${editingTask.id}`, taskForm);
      } else {
        await apiClient.post('/calendar/tasks', taskForm);
      }
      setShowTaskModal(false);
      setEditingTask(null);
      setTaskForm({
        title: '',
        description: '',
        task_date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '10:00',
        priority: 'MEDIUM',
        status: 'PENDING',
        location: '',
      });
      fetchEvents();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save task');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await apiClient.delete(`/calendar/tasks/${taskId}`);
      fetchEvents();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleEventClick = (event: UnifiedEvent) => {
    if (event.type === 'TASK') {
      const taskMeta = event.metadata || {};
      setEditingTask({ id: event.sourceId, ...taskMeta, title: event.title.replace('📌 Task: ', ''), task_date: event.start });
      setTaskForm({
        title: event.title.replace('📌 Task: ', ''),
        description: taskMeta.description || '',
        task_date: event.start,
        start_time: taskMeta.start_time || '09:00',
        end_time: taskMeta.end_time || '10:00',
        priority: taskMeta.priority || 'MEDIUM',
        status: event.status || 'PENDING',
        location: taskMeta.location || '',
      });
      setShowTaskModal(true);
    } else if (event.type === 'ATTENDANCE') {
      onNavigate?.('attendance');
    } else if (event.type === 'LEAVE') {
      onNavigate?.('leave');
    } else if (event.type === 'HOLIDAY') {
      onNavigate?.('holidays');
    }
  };

  const daysMatrix = getDaysInMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  return (
    <div className="space-y-5 min-h-screen pb-12 font-sans text-slate-800">
      {/* ─── Header Workspace ────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-indigo-900/40 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600/30 rounded-2xl border border-indigo-500/20">
            <CalendarIcon className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Unified Enterprise Calendar</h1>
            <p className="text-xs text-indigo-300/80 font-mono mt-0.5">Real-Time Event & Work Activity Aggregation Engine</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setEditingTask(null); setShowTaskModal(true); }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition-all">
            <Plus className="w-4 h-4" /> Add Calendar Task
          </button>
        </div>
      </div>

      {/* ─── Calendar Controls & Filters ──────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-xl border text-slate-600 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-black text-slate-900 font-mono min-w-[160px] text-center">
            {monthName} {year}
          </h2>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-xl border text-slate-600 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
          <button onClick={todayMonth} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors">
            Today
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Event Filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <select
              value={selectedEventType}
              onChange={e => setSelectedEventType(e.target.value)}
              className="bg-transparent font-bold text-slate-700 outline-none pr-2 cursor-pointer">
              <option value="ALL">All Event Types</option>
              <option value="TASK">Tasks Only</option>
              <option value="HOLIDAY">Holidays</option>
              <option value="LEAVE">Leaves</option>
              <option value="ATTENDANCE">Attendance</option>
              <option value="REGULARIZATION">Regularization</option>
              <option value="ANNOUNCEMENT">Announcements</option>
            </select>
          </div>

          {/* View Modes */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border text-xs font-bold">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'month' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
              Month
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'agenda' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
              Agenda
            </button>
          </div>
        </div>
      </div>

      {/* ─── Month View ──────────────────────────────────────────────── */}
      {viewMode === 'month' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 bg-slate-50 border-b text-[11px] font-black text-slate-500 uppercase text-center py-2.5">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 min-h-[500px]">
            {daysMatrix.map((dateObj, idx) => {
              if (!dateObj) {
                return <div key={`empty-${idx}`} className="bg-slate-50/50 min-h-[90px] p-2" />;
              }

              const isToday = dateObj.toDateString() === new Date().toDateString();
              const dayEvents = getEventsForDate(dateObj);

              return (
                <div key={dateObj.toISOString()} className={`min-h-[100px] p-1.5 flex flex-col justify-between hover:bg-slate-50/80 transition-colors ${isToday ? 'bg-indigo-50/30' : ''}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-black font-mono px-1.5 py-0.5 rounded-md ${
                      isToday ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-700'
                    }`}>
                      {dateObj.getDate()}
                    </span>
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-[85px] scrollbar-none">
                    {dayEvents.map(ev => {
                      const colorMap: Record<string, string> = {
                        HOLIDAY: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                        LEAVE: 'bg-amber-100 text-amber-800 border-amber-300',
                        ATTENDANCE: 'bg-teal-100 text-teal-800 border-teal-300',
                        REGULARIZATION: 'bg-purple-100 text-purple-800 border-purple-300',
                        TASK: 'bg-indigo-100 text-indigo-800 border-indigo-300',
                        ANNOUNCEMENT: 'bg-blue-100 text-blue-800 border-blue-300',
                      };
                      return (
                        <div
                          key={ev.id}
                          onClick={() => handleEventClick(ev)}
                          className={`text-[10px] font-bold p-1 rounded-md border truncate cursor-pointer transition-transform hover:scale-[1.02] ${
                            colorMap[ev.type] || 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                          {ev.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Agenda View ─────────────────────────────────────────────── */}
      {viewMode === 'agenda' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-3">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide border-b pb-2">Upcoming Events Agenda</h3>
          {events.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No unified events found for the selected filter and period.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {events.map(ev => (
                <div key={ev.id} onClick={() => handleEventClick(ev)} className="py-3 flex items-center justify-between hover:bg-slate-50 p-2 rounded-xl cursor-pointer">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black font-mono bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200">
                      {ev.start}
                    </span>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">{ev.title}</p>
                      {ev.employeeName && <p className="text-[10px] text-slate-500 font-mono">Assigned: {ev.employeeName}</p>}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg">
                    {ev.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Create / Edit Task Modal ────────────────────────────────── */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-slate-900">
                {editingTask ? 'Edit Calendar Task' : 'New Scheduled Calendar Task'}
              </h3>
              <button onClick={() => setShowTaskModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Task Title *</label>
                <input
                  type="text"
                  required
                  value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Quarterly Team Sync"
                  className="w-full mt-1 p-2.5 border rounded-xl bg-slate-50 font-bold focus:bg-white text-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Date *</label>
                  <input
                    type="date"
                    required
                    value={taskForm.task_date}
                    onChange={e => setTaskForm({ ...taskForm, task_date: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-xl bg-slate-50 font-mono font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-xl bg-slate-50 font-bold text-slate-800">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Start Time</label>
                  <input
                    type="time"
                    value={taskForm.start_time}
                    onChange={e => setTaskForm({ ...taskForm, start_time: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-xl bg-slate-50 font-mono font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Status</label>
                  <select
                    value={taskForm.status}
                    onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}
                    className="w-full mt-1 p-2 border rounded-xl bg-slate-50 font-bold text-slate-800">
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Location / Link</label>
                <input
                  type="text"
                  value={taskForm.location}
                  onChange={e => setTaskForm({ ...taskForm, location: e.target.value })}
                  placeholder="e.g. Conference Room A or Google Meet"
                  className="w-full mt-1 p-2 border rounded-xl bg-slate-50 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  value={taskForm.description}
                  onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Brief details about the task..."
                  className="w-full mt-1 p-2 border rounded-xl bg-slate-50 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                {editingTask ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(editingTask.id)}
                    className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 text-xs">
                    <Trash2 className="w-4 h-4" /> Delete Task
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTaskModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700">
                    {editingTask ? 'Update Task' : 'Create Task'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
