import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderArchive, FileText, UploadCloud, Search, Plus, Trash2, Eye, Download,
  Building2, Lock, User, ShieldCheck, X, FileCheck2, Calendar, AlertCircle,
  HardDrive, ExternalLink, Sparkles, CheckCircle2, Clock, Filter, ArrowLeft
} from 'lucide-react';
import apiClient from '../services/apiClient.js';
import { useAuth } from '../contexts/AuthContext.js';

interface Document {
  id: number;
  employee_id?: number;
  title: string;
  category: string;
  file_url: string;
  created_at?: string;
}

export const MyFolderPage: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const userRole = (user as any)?.role || 'EMPLOYEE';
  const isManagerOrAdmin = ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'].includes(userRole);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [activeTab, setActiveTab] = useState<'personal' | 'company'>('personal');
  const [personalDocs, setPersonalDocs] = useState<Document[]>([]);
  const [companyDocs, setCompanyDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: 'PERSONAL',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [persRes, compRes] = await Promise.all([
        apiClient.get('/documents').catch(() => ({ data: { data: [] } })),
        apiClient.get('/company-documents').catch(() => ({ data: { data: [] } })),
      ]);
      setPersonalDocs(persRes.data?.data || persRes.data || []);
      setCompanyDocs(compRes.data?.data || compRes.data || []);
    } catch (e) {
      console.error('Error fetching documents:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.title) {
      alert('Document Title is required!');
      return;
    }

    try {
      if (activeTab === 'personal') {
        await apiClient.post('/documents', uploadForm);
        alert('✅ Personal document uploaded successfully!');
      } else {
        await apiClient.post('/company-documents', uploadForm);
        alert('✅ Company document uploaded successfully!');
      }
      setIsUploadModalOpen(false);
      setUploadForm({
        title: '',
        category: 'PERSONAL',
        file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upload document.');
    }
  };

  const getDocIcon = (category: string) => {
    switch (category) {
      case 'GOVT':
        return <ShieldCheck className="w-5 h-5 text-amber-500" />;
      case 'PERSONAL':
        return <User className="w-5 h-5 text-blue-500" />;
      case 'FINANCIAL':
        return <HardDrive className="w-5 h-5 text-emerald-500" />;
      default:
        return <FileText className="w-5 h-5 text-purple-500" />;
    }
  };

  const currentDocs = activeTab === 'personal' ? personalDocs : companyDocs;
  const filteredDocs = currentDocs.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-5 min-h-screen pb-10 font-sans text-slate-800">
      {/* Mobile Back Header */}
      {isMobile ? (
        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm text-slate-800">
          <button onClick={() => onNavigate?.('dashboard')} className="p-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-extrabold text-sm uppercase tracking-tight">My Folder Workspace</span>
        </div>
      ) : null}

      {/* Header Workspace */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-cyan-950 rounded-2xl p-5 shadow-xl border border-cyan-900/40 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-600/30 rounded-xl">
              <FolderArchive className="w-7 h-7 text-cyan-300" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">My Folder</h2>
              <p className="text-xs text-cyan-300/70 mt-0.5">Encrypted personal locker & central organization files</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(activeTab === 'personal' || isManagerOrAdmin) && (
              <button onClick={() => setIsUploadModalOpen(true)} className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl border border-white/20">
                <Plus className="w-3.5 h-3.5 inline mr-1" /> Add Document
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200 overflow-x-auto">
        <button onClick={() => setActiveTab('personal')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
            activeTab === 'personal' ? 'bg-white text-cyan-700 shadow-sm border border-cyan-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Lock className="w-4 h-4" /> Personal Documents ({personalDocs.length})
        </button>
        <button onClick={() => setActiveTab('company')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
            activeTab === 'company' ? 'bg-white text-cyan-700 shadow-sm border border-cyan-100' : 'text-slate-500 hover:text-slate-800'
          }`}>
          <Building2 className="w-4 h-4" /> Company Circulars ({companyDocs.length})
        </button>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs max-w-md shadow-sm">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search by filename or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none outline-none w-full text-slate-800 placeholder-slate-400"
        />
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.length === 0 ? (
            <div className="bg-white border p-8 text-center rounded-2xl col-span-full">
              <p className="text-slate-400 text-xs">No documents found in this category.</p>
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <div key={doc.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 shrink-0">
                    {getDocIcon(doc.category)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-xs truncate">{doc.title}</h4>
                    <span className="inline-block mt-1 font-mono text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                      {doc.category}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors border"
                    title="View Document"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={doc.file_url}
                    download
                    className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors border"
                    title="Download Document"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* modal Add Document */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border w-full max-w-md overflow-hidden shadow-2xl text-slate-800">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
              <h3 className="font-black text-slate-900 text-sm">Add New Document</h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aadhar Card / Rent Agreement"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border outline-none focus:ring-1 focus:ring-cyan-500 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Category</label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border outline-none bg-white"
                >
                  <option value="PERSONAL">Personal</option>
                  <option value="GOVT">Govt Proofs</option>
                  <option value="FINANCIAL">Financial/Tax</option>
                  <option value="WORK">Work Agreement</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">File Link / URL *</label>
                <input
                  type="text"
                  required
                  placeholder="https://example.com/file.pdf"
                  value={uploadForm.file_url}
                  onChange={(e) => setUploadForm({ ...uploadForm, file_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border outline-none focus:ring-1 focus:ring-cyan-500 bg-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 font-semibold text-slate-600">Cancel</button>
                <button type="submit" className="px-5 py-2 font-bold rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white shadow-md">Add Document</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
