import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Gift, Award, PartyPopper, Sparkles, Building,
  Plus, Search, Filter, RefreshCw, ChevronLeft, ChevronRight,
  Shield, MapPin, Users, Info, CheckCircle2, Clock, Trash2, X, Download
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

// ─── Types ─────────────────────────────────────────────────────────────────
interface Holiday {
  id: number;
  name: string;
  date: string;
  type: string;
  region_code: string;
  branch_name?: string;
  is_optional: boolean;
  description: string;
}

interface CompanyEvent {
  id: number;
  title: string;
  description: string;
  event_date: string;
  event_type: string;
  branch_name?: string;
  department_name?: string;
}

interface Birthday {
  id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
  date_of_birth: string;
}

interface WorkAnniversary {
  id: number;
  first_name: string;
  last_name: string;
  employee_code: string;
  joining_date: string;
  milestone_years: number;
}

interface UnifiedFeed {
  holidays: Holiday[];
  company_events: CompanyEvent[];
  birthdays: Birthday[];
  work_anniversaries: WorkAnniversary[];
  approved_leaves: any[];
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const REGIONS = ['ALL', 'COMMON', 'NORTH_INDIA', 'SOUTH_INDIA', 'WEST_INDIA', 'EAST_INDIA'];

const fmtDate = (s: string) => s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const EnterpriseHolidayPage: React.FC = () => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const isHRAdmin = ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'].includes(userRole);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [tab, setTab] = useState<'calendar' | 'holidays' | 'optional' | 'events'>('calendar');
  const [regionFilter, setRegionFilter] = useState('ALL');

  const [feed, setFeed] = useState<UnifiedFeed>({ holidays: [], company_events: [], birthdays: [], work_anniversaries: [], approved_leaves: [] });
  const [myOptional, setMyOptional] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);

  // Forms
  const [holidayForm, setHolidayForm] = useState({
    name: '', date: new Date().toISOString().split('T')[0],
    type: 'NATIONAL', region_code: 'COMMON', is_optional: false, description: '',
  });

  const [eventForm, setEventForm] = useState({
    title: '', description: '', event_date: new Date().toISOString().split('T')[0],
    event_type: 'TOWNHALL',
  });

  const fetchUnifiedFeed = useCallback(async () => {
    setLoading(true);
    try {
      const [feedRes, optRes] = await Promise.all([
        apiClient.get(`/calendar/unified-feed?year=${year}&month=${month}`),
        apiClient.get(`/holidays/optional/my?year=${year}`).catch(() => ({ data: { data: [] } })),
      ]);
      setFeed(feedRes.data?.data || { holidays: [], company_events: [], birthdays: [], work_anniversaries: [], approved_leaves: [] });
      setMyOptional(optRes.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [year, month]);

  useEffect(() => { fetchUnifiedFeed(); }, [fetchUnifiedFeed]);

  const handleSeedDefaults = async () => {
    try {
      await apiClient.post('/holidays/seed-defaults');
      await fetchUnifiedFeed();
      alert('✅ 2026 Indian Festival & Regional Holidays seeded!');
    } catch (e: any) { alert(e.response?.data?.message || 'Seeding failed'); }
  };

  const handleCreateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/holidays', holidayForm);
      setShowHolidayModal(false);
      await fetchUnifiedFeed();
      alert('✅ Holiday created!');
    } catch (e: any) { alert(e.response?.data?.message || 'Holiday creation failed'); }
    finally { setSubmitting(false); }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/company-events', eventForm);
      setShowEventModal(false);
      await fetchUnifiedFeed();
      alert('✅ Company event created!');
    } catch (e: any) { alert(e.response?.data?.message || 'Event creation failed'); }
    finally { setSubmitting(false); }
  };

  const handleSelectOptional = async (holidayId: number) => {
    try {
      await apiClient.post('/holidays/optional/select', { holiday_id: holidayId, year });
      await fetchUnifiedFeed();
      alert('✅ Optional holiday selected!');
    } catch (e: any) { alert(e.response?.data?.message || 'Selection failed'); }
  };

  const prevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1); };

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayIndex = new Date(year, month - 1, 1).getDay();

  const TABS = [
    { key: 'calendar', label: 'Unified Calendar', icon: <Calendar className="w-4 h-4" /> },
    { key: 'holidays', label: 'Regional Holiday Manager', icon: <MapPin className="w-4 h-4" />, count: feed.holidays.length },
    { key: 'optional', label: 'Optional Holidays', icon: <Sparkles className="w-4 h-4" />, count: myOptional.length },
    { key: 'events', label: 'Company Events', icon: <PartyPopper className="w-4 h-4" />, count: feed.company_events.length },
  ];

  return (
    <div className="space-y-5 min-h-screen pb-10">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-2xl p-6 shadow-xl border border-purple-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-600/30 rounded-xl">
              <Calendar className="w-7 h-7 text-purple-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Enterprise Holiday & Company Calendar</h2>
              <p className="text-xs text-purple-300/70 font-mono mt-0.5">Regional Holidays • Company Events • Birthdays • Work Anniversaries</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isHRAdmin && (
              <button onClick={handleSeedDefaults} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-xl border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Seed 2026 Indian Holidays
              </button>
            )}
            {isHRAdmin && (
              <button onClick={() => setShowHolidayModal(true)} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg">
                <Plus className="w-4 h-4" /> Add Holiday
              </button>
            )}
          </div>
        </div>

        {/* Quick Month Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <p className="text-xl font-black text-purple-300">{feed.holidays.length}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Holidays ({MONTHS[month-1]})</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <p className="text-xl font-black text-pink-300">{feed.birthdays.length}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Birthdays</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <p className="text-xl font-black text-amber-300">{feed.work_anniversaries.length}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Anniversaries</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <p className="text-xl font-black text-blue-300">{feed.company_events.length}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Events</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <p className="text-xl font-black text-emerald-300">{feed.approved_leaves.length}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Approved Leaves</p>
          </div>
        </div>
      </div>

      {/* ─── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              tab === t.key ? 'bg-white text-purple-700 shadow-sm border border-purple-100' : 'text-slate-500 hover:text-slate-800'
            }`}>
            {t.icon} {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${tab === t.key ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-600'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── UNIFIED CALENDAR TAB ────────────────────────────────────────── */}
      {tab === 'calendar' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <button onClick={prevMonth} className="p-2 hover:bg-slate-200 rounded-lg"><ChevronLeft className="w-4 h-4" /></button>
              <div className="text-center">
                <h3 className="font-black text-slate-900 text-base">{MONTHS[month - 1]} {year}</h3>
                <p className="text-xs text-slate-500">Company Unified Schedule</p>
              </div>
              <button onClick={nextMonth} className="p-2 hover:bg-slate-200 rounded-lg"><ChevronRight className="w-4 h-4" /></button>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-500 uppercase mb-2">
                {DAY_NAMES.map(d => <div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayIndex }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dNum = i + 1;
                  const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(dNum).padStart(2,'0')}`;
                  const dayHolidays = feed.holidays.filter(h => h.date.slice(0,10) === dateStr);
                  const dayEvents = feed.company_events.filter(e => e.event_date.slice(0,10) === dateStr);
                  const dayBdays = feed.birthdays.filter(b => b.date_of_birth && new Date(b.date_of_birth).getDate() === dNum);
                  const dayAnnivs = feed.work_anniversaries.filter(a => a.joining_date && new Date(a.joining_date).getDate() === dNum);

                  return (
                    <div key={dNum} className="border border-slate-100 rounded-xl p-1.5 min-h-[72px] flex flex-col justify-between bg-slate-50/50 hover:bg-white hover:border-purple-200 transition-all">
                      <span className="font-bold text-xs text-slate-700">{dNum}</span>
                      <div className="space-y-0.5">
                        {dayHolidays.map(h => (
                          <div key={h.id} className="text-[9px] font-bold bg-purple-100 text-purple-800 rounded px-1 truncate" title={h.name}>
                            🎉 {h.name}
                          </div>
                        ))}
                        {dayEvents.map(e => (
                          <div key={e.id} className="text-[9px] font-bold bg-blue-100 text-blue-800 rounded px-1 truncate" title={e.title}>
                            🎈 {e.title}
                          </div>
                        ))}
                        {dayBdays.map(b => (
                          <div key={b.id} className="text-[9px] font-bold bg-pink-100 text-pink-800 rounded px-1 truncate">
                            🎂 {b.first_name}
                          </div>
                        ))}
                        {dayAnnivs.map(a => (
                          <div key={a.id} className="text-[9px] font-bold bg-amber-100 text-amber-800 rounded px-1 truncate">
                            🏆 {a.first_name} ({a.milestone_years}y)
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── REGIONAL HOLIDAYS TAB ───────────────────────────────────────── */}
      {tab === 'holidays' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              {REGIONS.map(r => (
                <button key={r} onClick={() => setRegionFilter(r)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
                    regionFilter === r ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-600 border-slate-300'
                  }`}>
                  {r.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
            {isHRAdmin && (
              <button onClick={() => setShowHolidayModal(true)} className="flex items-center gap-2 bg-purple-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow">
                <Plus className="w-4 h-4" /> Add Holiday
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feed.holidays.filter(h => regionFilter === 'ALL' || h.region_code === regionFilter || h.region_code === 'COMMON').map(h => (
              <div key={h.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
                <div className="flex items-start justify-between">
                  <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-600" /> {h.name}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${h.is_optional ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'}`}>
                    {h.is_optional ? 'Optional' : h.type}
                  </span>
                </div>
                <p className="text-xs font-mono font-bold text-purple-700">{fmtDate(h.date)}</p>
                {h.description && <p className="text-xs text-slate-500">{h.description}</p>}
                <p className="text-[10px] text-slate-400 font-mono">Region: {h.region_code || 'COMMON'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── OPTIONAL HOLIDAYS TAB ───────────────────────────────────────── */}
      {tab === 'optional' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" /> Optional Holiday Selector (Quota: 2 per year)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Pick your preferred restricted festival holidays</p>
              </div>
              <span className="bg-amber-50 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-amber-200">
                {myOptional.length} / 2 Selected
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feed.holidays.filter(h => h.is_optional).map(h => {
                const isSelected = myOptional.some(m => m.holiday_id === h.id);
                return (
                  <div key={h.id} className="border border-slate-200 rounded-2xl p-4 flex items-center justify-between bg-slate-50/50">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{h.name}</p>
                      <p className="text-xs font-mono text-amber-700">{fmtDate(h.date)}</p>
                    </div>
                    {isSelected ? (
                      <span className="bg-emerald-100 text-emerald-800 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                      </span>
                    ) : (
                      <button onClick={() => handleSelectOptional(h.id)} disabled={myOptional.length >= 2}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow disabled:opacity-50">
                        Select Holiday
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── COMPANY EVENTS TAB ──────────────────────────────────────────── */}
      {tab === 'events' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500 font-semibold">{feed.company_events.length} Upcoming Company Events</p>
            {isHRAdmin && (
              <button onClick={() => setShowEventModal(true)} className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow">
                <Plus className="w-4 h-4" /> Add Company Event
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {feed.company_events.map(e => (
              <div key={e.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
                <div className="flex items-start justify-between">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <PartyPopper className="w-4 h-4 text-blue-600" /> {e.title}
                  </h4>
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">{e.event_type}</span>
                </div>
                <p className="text-xs font-mono font-bold text-blue-600">{fmtDate(e.event_date)}</p>
                {e.description && <p className="text-xs text-slate-600">{e.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── ADD HOLIDAY MODAL ────────────────────────────────────────────── */}
      {showHolidayModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Add Holiday</h3>
              <button onClick={() => setShowHolidayModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateHoliday} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Holiday Name *</label>
                <input required value={holidayForm.name} onChange={e => setHolidayForm({...holidayForm, name: e.target.value})}
                  placeholder="e.g. Diwali / Deepavali" className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Date *</label>
                  <input required type="date" value={holidayForm.date} onChange={e => setHolidayForm({...holidayForm, date: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Region *</label>
                  <select value={holidayForm.region_code} onChange={e => setHolidayForm({...holidayForm, region_code: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                    <option value="COMMON">Company Wide</option>
                    <option value="NORTH_INDIA">North India</option>
                    <option value="SOUTH_INDIA">South India</option>
                    <option value="WEST_INDIA">West India</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowHolidayModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-purple-600 text-white rounded-xl font-bold shadow">{submitting ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD COMPANY EVENT MODAL ─────────────────────────────────────── */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Add Company Event</h3>
              <button onClick={() => setShowEventModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Event Title *</label>
                <input required value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})}
                  placeholder="e.g. Q3 All Hands Townhall" className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Date *</label>
                  <input required type="date" value={eventForm.event_date} onChange={e => setEventForm({...eventForm, event_date: e.target.value})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Event Type *</label>
                  <select value={eventForm.event_type} onChange={e => setEventForm({...eventForm, event_type: e.target.value as any})}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900">
                    <option value="TOWNHALL">Townhall</option>
                    <option value="HACKATHON">Hackathon</option>
                    <option value="FESTIVAL">Festival</option>
                    <option value="OFFICE_PARTY">Office Party</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowEventModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold shadow">{submitting ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
