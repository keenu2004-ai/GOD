import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import apiClient from '../services/apiClient.js';
import {
  LifeBuoy, BarChart2, List, PlusCircle, Inbox, BookOpen,
  Settings, Layers, AlertTriangle, CheckCircle, Clock,
  Search, Filter, Users, ShieldAlert, Star, MessageSquare,
  Activity, X, ChevronRight, FileText, Send, ArrowLeft
} from 'lucide-react';

// --- Types ---
interface HelpdeskMetrics {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  escalatedTickets: number;
  slaBreachedTickets: number;
  slaCompliance: number;
  avgSatisfaction: number;
  avgResolutionHours: number;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  topAgents: { agentName: string; resolvedCount: number }[];
}

interface Ticket {
  _id: string;
  ticketCode: string;
  requesterId: string;
  requesterName: string;
  subject: string;
  description: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'URGENT';
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'ON_HOLD' | 'RESOLVED' | 'CLOSED' | 'ESCALATED';
  agentId?: string;
  agentName?: string;
  slaDueDate?: string;
  slaStatus: 'PENDING' | 'MET' | 'BREACHED';
  satisfactionRating?: number;
  tags: string[];
  watchers: string[];
  createdAt: string;
  updatedAt: string;
  commentCount?: number;
}

interface Comment {
  _id: string;
  ticketId: string;
  userId: string;
  userName: string;
  content: string;
  isInternalNote: boolean;
  createdAt: string;
}

interface Category {
  _id: string;
  name: string;
  description: string;
  defaultPriority: string;
  isActive: boolean;
}

interface Article {
  _id: string;
  title: string;
  content: string;
  authorName: string;
  viewCount: number;
  createdAt: string;
}

interface SLARule {
  _id: string;
  priority: string;
  resolutionTimeHours: number;
  active: boolean;
}

interface EscalationRule {
  _id: string;
  condition: string;
  action: string;
  active: boolean;
}

export const EnterpriseHelpdeskPage: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const isAgent = ['ADMIN', 'HR_MANAGER', 'IT_MANAGER', 'SUPER_ADMIN', 'SUPPORT_AGENT'].includes(userRole);
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(userRole);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [activeTab, setActiveTab] = useState<string>('DASHBOARD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [metrics, setMetrics] = useState<HelpdeskMetrics | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [slaRules, setSlaRules] = useState<SLARule[]>([]);
  const [escalationRules, setEscalationRules] = useState<EscalationRule[]>([]);
  
  // Modal states
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketComments, setTicketComments] = useState<Comment[]>([]);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  // Forms states
  const [newTicket, setNewTicket] = useState({ subject: '', description: '', category: '', priority: 'LOW', tags: '' });
  const [newComment, setNewComment] = useState({ content: '', isInternalNote: false });
  const [newCategory, setNewCategory] = useState({ name: '', description: '', defaultPriority: 'MEDIUM' });
  const [newArticle, setNewArticle] = useState({ title: '', content: '' });
  const [newSlaRule, setNewSlaRule] = useState({ priority: 'LOW', resolutionTimeHours: 24 });
  const [newEscalationRule, setNewEscalationRule] = useState({ condition: '', action: '' });
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const handleApiError = (err: any) => {
    setError(err?.response?.data?.message || err.message || 'An error occurred');
    setTimeout(() => setError(null), 5000);
  };

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/helpdesk/analytics');
      setMetrics(res.data?.data || null);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTickets = useCallback(async (endpoint: string) => {
    try {
      setLoading(true);
      const res = await apiClient.get(endpoint);
      setTickets(res.data?.data || []);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await apiClient.get('/helpdesk/categories');
      setCategories(res.data?.data || []);
    } catch (err) {
      handleApiError(err);
    }
  }, []);

  const fetchArticles = useCallback(async () => {
    try {
      const res = await apiClient.get('/helpdesk/knowledge-base');
      setArticles(res.data?.data || []);
    } catch (err) {
      handleApiError(err);
    }
  }, []);

  const fetchSlaRules = useCallback(async () => {
    try {
      const res = await apiClient.get('/helpdesk/sla-rules');
      setSlaRules(res.data?.data || []);
    } catch (err) {
      handleApiError(err);
    }
  }, []);

  const fetchEscalationRules = useCallback(async () => {
    try {
      const res = await apiClient.get('/helpdesk/escalation-rules');
      setEscalationRules(res.data?.data || []);
    } catch (err) {
      handleApiError(err);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'DASHBOARD') fetchMetrics();
    else if (activeTab === 'ALL_TICKETS') fetchTickets('/helpdesk/all');
    else if (activeTab === 'MY_TICKETS') fetchTickets('/helpdesk/my-tickets');
    else if (activeTab === 'AGENT_QUEUE') fetchTickets('/helpdesk/agent-queue');
    else if (activeTab === 'RAISE_TICKET') fetchCategories();
    else if (activeTab === 'KNOWLEDGE_BASE') fetchArticles();
    else if (activeTab === 'SLA_RULES') { fetchSlaRules(); fetchEscalationRules(); }
    else if (activeTab === 'CATEGORIES') fetchCategories();
  }, [activeTab, fetchMetrics, fetchTickets, fetchCategories, fetchArticles, fetchSlaRules, fetchEscalationRules]);

  // Actions
  const handleRaiseTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await apiClient.post('/helpdesk/create', {
        ...newTicket,
        tags: newTicket.tags.split(',').map(t => t.trim()).filter(t => t)
      });
      setNewTicket({ subject: '', description: '', category: '', priority: 'LOW', tags: '' });
      setActiveTab('MY_TICKETS');
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTicketStatus = async (id: string, status: string) => {
    try {
      await apiClient.patch(`/helpdesk/tickets/${id}/status`, { status });
      if (activeTab === 'ALL_TICKETS') fetchTickets('/helpdesk/all');
      if (activeTab === 'AGENT_QUEUE') fetchTickets('/helpdesk/agent-queue');
      if (activeTab === 'MY_TICKETS') fetchTickets('/helpdesk/my-tickets');
      if (selectedTicket && selectedTicket._id === id) {
        setSelectedTicket({ ...selectedTicket, status: status as any });
      }
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleAssignTicket = async (id: string) => {
    try {
      await apiClient.post(`/helpdesk/tickets/${id}/assign`);
      if (activeTab === 'ALL_TICKETS') fetchTickets('/helpdesk/all');
    } catch (err) {
      handleApiError(err);
    }
  };

  const openTicketDetail = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsTicketModalOpen(true);
    try {
      const res = await apiClient.get(`/helpdesk/tickets/${ticket._id}/comments`);
      setTicketComments(res.data?.data || []);
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleAddComment = async () => {
    if (!selectedTicket || !newComment.content) return;
    try {
      await apiClient.post(`/helpdesk/tickets/${selectedTicket._id}/comments`, newComment);
      const res = await apiClient.get(`/helpdesk/tickets/${selectedTicket._id}/comments`);
      setTicketComments(res.data?.data || []);
      setNewComment({ content: '', isInternalNote: false });
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleRateTicket = async (id: string, rating: number) => {
    try {
      await apiClient.post(`/helpdesk/tickets/${id}/rate`, { rating });
      fetchTickets('/helpdesk/my-tickets');
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/helpdesk/categories', newCategory);
      setNewCategory({ name: '', description: '', defaultPriority: 'MEDIUM' });
      fetchCategories();
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/helpdesk/knowledge-base', newArticle);
      setNewArticle({ title: '', content: '' });
      fetchArticles();
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleCreateSlaRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/helpdesk/sla-rules', newSlaRule);
      fetchSlaRules();
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleSeedCategories = async () => {
    try {
      await apiClient.post('/helpdesk/seed-categories');
      fetchCategories();
    } catch (err) {
      handleApiError(err);
    }
  };

  // Render Helpers
  const renderPriorityBadge = (priority: string) => {
    const map: Record<string, string> = {
      LOW: 'bg-slate-100 text-slate-800',
      MEDIUM: 'bg-blue-100 text-blue-800',
      HIGH: 'bg-amber-100 text-amber-800',
      CRITICAL: 'bg-rose-100 text-rose-800',
      URGENT: 'bg-red-100 text-red-800'
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${map[priority] || map.LOW}`}>{priority}</span>;
  };

  const renderStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      OPEN: 'bg-blue-100 text-blue-800',
      ASSIGNED: 'bg-indigo-100 text-indigo-800',
      IN_PROGRESS: 'bg-amber-100 text-amber-800',
      ON_HOLD: 'bg-purple-100 text-purple-800',
      RESOLVED: 'bg-emerald-100 text-emerald-800',
      CLOSED: 'bg-slate-100 text-slate-800',
      ESCALATED: 'bg-red-100 text-red-800'
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${map[status] || map.OPEN}`}>{status}</span>;
  };

  const filteredTickets = tickets.filter(t => 
    (t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || t.ticketCode.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (statusFilter ? t.status === statusFilter : true)
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {isMobile ? (
        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm mx-4 mt-4 text-slate-800">
          <button onClick={() => onNavigate?.('dashboard')} className="p-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-extrabold text-sm uppercase tracking-tight">Helpdesk Workspace</span>
        </div>
      ) : null}

      {/* Header */}
      <div className={isMobile ? "bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 shadow-lg mx-4 mt-4 rounded-2xl border border-indigo-900/40" : "bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 shadow-lg"}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className={isMobile ? "text-xl font-bold flex items-center gap-2" : "text-3xl font-bold flex items-center gap-2"}><LifeBuoy className="w-6 h-6" /> Enterprise Helpdesk</h1>
            <p className="text-[10px] text-slate-300 mt-1">Manage, track, and resolve organizational issues efficiently.</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setActiveTab('RAISE_TICKET')} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded shadow flex items-center gap-2 transition-colors">
              <PlusCircle className="w-4 h-4" /> Raise Ticket
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto w-full mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto w-full mt-6 px-4">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
          <button onClick={() => setActiveTab('DASHBOARD')} className={`px-4 py-2 rounded-t-lg font-medium flex items-center gap-2 transition-colors ${activeTab === 'DASHBOARD' ? 'bg-white text-indigo-600 border-t border-x border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
            <BarChart2 className="w-4 h-4" /> Dashboard
          </button>
          <button onClick={() => setActiveTab('MY_TICKETS')} className={`px-4 py-2 rounded-t-lg font-medium flex items-center gap-2 transition-colors ${activeTab === 'MY_TICKETS' ? 'bg-white text-indigo-600 border-t border-x border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
            <Inbox className="w-4 h-4" /> My Tickets
          </button>
          <button onClick={() => setActiveTab('RAISE_TICKET')} className={`px-4 py-2 rounded-t-lg font-medium flex items-center gap-2 transition-colors ${activeTab === 'RAISE_TICKET' ? 'bg-white text-indigo-600 border-t border-x border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
            <PlusCircle className="w-4 h-4" /> Raise Ticket
          </button>
          
          {isAgent && (
            <>
              <button onClick={() => setActiveTab('ALL_TICKETS')} className={`px-4 py-2 rounded-t-lg font-medium flex items-center gap-2 transition-colors ${activeTab === 'ALL_TICKETS' ? 'bg-white text-indigo-600 border-t border-x border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
                <List className="w-4 h-4" /> All Tickets
              </button>
              <button onClick={() => setActiveTab('AGENT_QUEUE')} className={`px-4 py-2 rounded-t-lg font-medium flex items-center gap-2 transition-colors ${activeTab === 'AGENT_QUEUE' ? 'bg-white text-indigo-600 border-t border-x border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
                <Users className="w-4 h-4" /> Agent Queue
              </button>
            </>
          )}
          
          <button onClick={() => setActiveTab('KNOWLEDGE_BASE')} className={`px-4 py-2 rounded-t-lg font-medium flex items-center gap-2 transition-colors ${activeTab === 'KNOWLEDGE_BASE' ? 'bg-white text-indigo-600 border-t border-x border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
            <BookOpen className="w-4 h-4" /> Knowledge Base
          </button>

          {isAdmin && (
            <>
              <button onClick={() => setActiveTab('SLA_RULES')} className={`px-4 py-2 rounded-t-lg font-medium flex items-center gap-2 transition-colors ${activeTab === 'SLA_RULES' ? 'bg-white text-indigo-600 border-t border-x border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
                <ShieldAlert className="w-4 h-4" /> SLA Rules
              </button>
              <button onClick={() => setActiveTab('CATEGORIES')} className={`px-4 py-2 rounded-t-lg font-medium flex items-center gap-2 transition-colors ${activeTab === 'CATEGORIES' ? 'bg-white text-indigo-600 border-t border-x border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}>
                <Layers className="w-4 h-4" /> Categories
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto w-full p-4 flex-1">
        {loading && <div className="text-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div><p className="mt-4 text-slate-500">Loading...</p></div>}
        
        {!loading && activeTab === 'DASHBOARD' && metrics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-lg"><List className="w-6 h-6 text-blue-600"/></div>
                <div><p className="text-sm text-slate-500 font-medium">Total Tickets</p><h3 className="text-2xl font-bold">{metrics.totalTickets}</h3></div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="bg-emerald-100 p-3 rounded-lg"><CheckCircle className="w-6 h-6 text-emerald-600"/></div>
                <div><p className="text-sm text-slate-500 font-medium">Resolved</p><h3 className="text-2xl font-bold">{metrics.resolvedTickets}</h3></div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="bg-amber-100 p-3 rounded-lg"><Clock className="w-6 h-6 text-amber-600"/></div>
                <div><p className="text-sm text-slate-500 font-medium">Open / Pending</p><h3 className="text-2xl font-bold">{metrics.openTickets}</h3></div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="bg-red-100 p-3 rounded-lg"><AlertTriangle className="w-6 h-6 text-red-600"/></div>
                <div><p className="text-sm text-slate-500 font-medium">SLA Breached</p><h3 className="text-2xl font-bold">{metrics.slaBreachedTickets}</h3></div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-lg font-semibold mb-4 border-b pb-2">Status Breakdown</h3>
                <div className="space-y-3">
                  {Object.entries(metrics.byStatus || {}).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-600">{status}</span>
                      <span className="text-sm font-bold bg-slate-100 px-2 py-1 rounded">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-lg font-semibold mb-4 border-b pb-2">Priority Breakdown</h3>
                <div className="space-y-3">
                  {Object.entries(metrics.byPriority || {}).map(([priority, count]) => (
                    <div key={priority} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-600">{priority}</span>
                      <span className="text-sm font-bold bg-slate-100 px-2 py-1 rounded">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-semibold mb-4 border-b pb-2">Performance KPIs</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg text-center">
                  <p className="text-sm text-slate-500 mb-1">SLA Compliance</p>
                  <p className="text-3xl font-bold text-indigo-600">{metrics.slaCompliance.toFixed(1)}%</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg text-center">
                  <p className="text-sm text-slate-500 mb-1">Avg Satisfaction</p>
                  <p className="text-3xl font-bold text-emerald-600 flex justify-center items-center gap-1">
                    {metrics.avgSatisfaction.toFixed(1)} <Star className="w-5 h-5 fill-emerald-600" />
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg text-center">
                  <p className="text-sm text-slate-500 mb-1">Avg Resolution Time</p>
                  <p className="text-3xl font-bold text-amber-600">{metrics.avgResolutionHours.toFixed(1)}h</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && ['ALL_TICKETS', 'MY_TICKETS', 'AGENT_QUEUE'].includes(activeTab) && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-full">
            <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 justify-between items-center">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search tickets..." 
                  className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 w-64 outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 items-center">
                <Filter className="w-5 h-5 text-slate-500" />
                <select 
                  className="border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-sm uppercase tracking-wider">
                    <th className="px-6 py-4 font-medium">Code</th>
                    <th className="px-6 py-4 font-medium">Subject</th>
                    <th className="px-6 py-4 font-medium">Requester</th>
                    <th className="px-6 py-4 font-medium">Priority</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredTickets.map(ticket => (
                    <tr key={ticket._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-indigo-600">#{ticket.ticketCode}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800 flex items-center gap-2">
                          {ticket.subject}
                          {ticket.slaStatus === 'BREACHED' && <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" title="SLA Breached"></span>}
                        </div>
                        <div className="text-xs text-slate-500">{ticket.category}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">{ticket.requesterName}</td>
                      <td className="px-6 py-4">{renderPriorityBadge(ticket.priority)}</td>
                      <td className="px-6 py-4">{renderStatusBadge(ticket.status)}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => openTicketDetail(ticket)} className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">View</button>
                      </td>
                    </tr>
                  ))}
                  {filteredTickets.length === 0 && (
                    <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">No tickets found matching your criteria.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && activeTab === 'RAISE_TICKET' && (
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-xl font-bold mb-6 text-slate-800">Submit a New Request</h2>
            <form onSubmit={handleRaiseTicket} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                <input required type="text" value={newTicket.subject} onChange={e => setNewTicket({...newTicket, subject: e.target.value})} className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Brief summary of the issue" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select required value={newTicket.category} onChange={e => setNewTicket({...newTicket, category: e.target.value})} className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select required value={newTicket.priority} onChange={e => setNewTicket({...newTicket, priority: e.target.value})} className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea required rows={5} value={newTicket.description} onChange={e => setNewTicket({...newTicket, description: e.target.value})} className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Provide detailed information..."></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tags (comma separated)</label>
                <input type="text" value={newTicket.tags} onChange={e => setNewTicket({...newTicket, tags: e.target.value})} className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. login, network, urgent" />
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-colors shadow">Submit Ticket</button>
              </div>
            </form>
          </div>
        )}

        {!loading && activeTab === 'KNOWLEDGE_BASE' && (
          <div className="space-y-6">
            {isAgent && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold mb-4">Create Article</h3>
                <form onSubmit={handleCreateArticle} className="space-y-4">
                  <input required type="text" placeholder="Article Title" value={newArticle.title} onChange={e => setNewArticle({...newArticle, title: e.target.value})} className="w-full border rounded-lg px-4 py-2" />
                  <textarea required placeholder="Content..." rows={4} value={newArticle.content} onChange={e => setNewArticle({...newArticle, content: e.target.value})} className="w-full border rounded-lg px-4 py-2"></textarea>
                  <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg">Publish Article</button>
                </form>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map(article => (
                <div key={article._id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center gap-2 text-indigo-600 mb-3"><FileText className="w-5 h-5" /> <h4 className="font-bold">{article.title}</h4></div>
                  <p className="text-slate-600 text-sm line-clamp-3">{article.content}</p>
                  <div className="mt-4 text-xs text-slate-400 flex justify-between">
                    <span>By {article.authorName}</span>
                    <span>{article.viewCount} views</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && activeTab === 'CATEGORIES' && isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit lg:col-span-1">
              <h3 className="text-lg font-bold mb-4">New Category</h3>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <input required type="text" placeholder="Name" value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} className="w-full border rounded-lg px-4 py-2" />
                <textarea required placeholder="Description" value={newCategory.description} onChange={e => setNewCategory({...newCategory, description: e.target.value})} className="w-full border rounded-lg px-4 py-2"></textarea>
                <select value={newCategory.defaultPriority} onChange={e => setNewCategory({...newCategory, defaultPriority: e.target.value})} className="w-full border rounded-lg px-4 py-2 bg-white">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
                <button type="submit" className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg">Add Category</button>
              </form>
              <button onClick={handleSeedCategories} className="w-full mt-4 bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-300">Seed Defaults</button>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-2">
              <h3 className="text-lg font-bold mb-4">Existing Categories</h3>
              <div className="space-y-3">
                {categories.map(c => (
                  <div key={c._id} className="p-4 border rounded-lg flex justify-between items-center">
                    <div><h4 className="font-semibold text-slate-800">{c.name}</h4><p className="text-sm text-slate-500">{c.description}</p></div>
                    {renderPriorityBadge(c.defaultPriority)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Ticket Modal */}
      {isTicketModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-start bg-slate-50">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-slate-800">#{selectedTicket.ticketCode} - {selectedTicket.subject}</h2>
                  {renderPriorityBadge(selectedTicket.priority)}
                  {renderStatusBadge(selectedTicket.status)}
                </div>
                <div className="text-sm text-slate-500 flex gap-4">
                  <span>Requested by <strong>{selectedTicket.requesterName}</strong></span>
                  <span>Category: {selectedTicket.category}</span>
                  <span>Created: {new Date(selectedTicket.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <button onClick={() => setIsTicketModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border rounded-xl p-5 shadow-sm">
                  <h3 className="font-semibold text-slate-800 mb-2">Description</h3>
                  <p className="text-slate-600 whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800">Conversation</h3>
                  {ticketComments.map(comment => (
                    <div key={comment._id} className={`p-4 rounded-xl border ${comment.isInternalNote ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm text-slate-800">{comment.userName} {comment.isInternalNote && <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded ml-2">Internal Note</span>}</span>
                        <span className="text-xs text-slate-500">{new Date(comment.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))}
                  
                  <div className="bg-white border rounded-xl p-4 shadow-sm mt-4">
                    <textarea value={newComment.content} onChange={e => setNewComment({...newComment, content: e.target.value})} rows={3} placeholder="Type your reply here..." className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-sm mb-3"></textarea>
                    <div className="flex justify-between items-center">
                      {isAgent && (
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                          <input type="checkbox" checked={newComment.isInternalNote} onChange={e => setNewComment({...newComment, isInternalNote: e.target.checked})} className="rounded text-indigo-600" />
                          Internal Note (Hidden from requester)
                        </label>
                      )}
                      <button onClick={handleAddComment} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ml-auto">
                        <Send className="w-4 h-4" /> Send Reply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
                  <h3 className="font-semibold text-slate-800 border-b pb-2">Ticket Details</h3>
                  <div><p className="text-xs text-slate-500">Agent</p><p className="font-medium text-sm">{selectedTicket.agentName || 'Unassigned'}</p></div>
                  <div><p className="text-xs text-slate-500">SLA Due Date</p><p className="font-medium text-sm text-red-600">{selectedTicket.slaDueDate ? new Date(selectedTicket.slaDueDate).toLocaleString() : 'N/A'}</p></div>
                  
                  {isAgent && (
                    <div className="pt-4 border-t space-y-3">
                      <h4 className="text-xs font-semibold uppercase text-slate-500">Actions</h4>
                      {!selectedTicket.agentId && <button onClick={() => handleAssignTicket(selectedTicket._id)} className="w-full bg-indigo-50 text-indigo-700 border border-indigo-200 py-2 rounded text-sm font-medium hover:bg-indigo-100">Assign to Me</button>}
                      <select value={selectedTicket.status} onChange={e => handleUpdateTicketStatus(selectedTicket._id, e.target.value)} className="w-full border rounded px-3 py-2 text-sm bg-white outline-none">
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="ON_HOLD">On Hold</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </div>
                  )}

                  {!isAgent && selectedTicket.status === 'RESOLVED' && (
                    <div className="pt-4 border-t space-y-3">
                      <h4 className="text-xs font-semibold uppercase text-slate-500">Rate Support</h4>
                      <div className="flex gap-2">
                        {[1,2,3,4,5].map(star => (
                          <button key={star} onClick={() => handleRateTicket(selectedTicket._id, star)}>
                            <Star className={`w-6 h-6 ${selectedTicket.satisfactionRating && selectedTicket.satisfactionRating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
