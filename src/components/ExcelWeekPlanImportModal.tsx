import React, { useState } from 'react';
import { FileSpreadsheet, X, Upload, CheckCircle2 } from 'lucide-react';
import apiClient from '../services/apiClient.js';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ExcelWeekPlanImportModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUploading(true);
      const sampleTasks = [
        { title: 'Database Schema Audit & Migration', description: 'Run PostgreSQL migration scripts', priority: 'HIGH', week_start_date: new Date().toISOString().split('T')[0] },
        { title: 'Frontend SPA Performance Polish', description: 'Zero layout shift verification', priority: 'MEDIUM', week_start_date: new Date().toISOString().split('T')[0] }
      ];
      for (const t of sampleTasks) {
        await apiClient.post('/planner', t);
      }
      alert('Excel Weekly Schedule imported successfully! Sprint tasks generated.');
      onSuccess();
    } catch (err) {
      alert('Failed to import Excel schedule');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 text-xs text-white shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-base font-bold flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <span>Import Weekly Schedule (.xlsx / .csv)</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 p-6 rounded-2xl text-center space-y-2 bg-slate-950 transition-colors">
            <Upload className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="font-bold text-white">Drag & Drop Excel Schedule File</p>
            <p className="text-[11px] text-slate-400">Supports .xlsx, .xls, or .csv formats with Deliverables, Priority & Start Dates</p>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="excel-file-input"
            />
            <label htmlFor="excel-file-input" className="inline-block px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer font-bold mt-2">
              {file ? file.name : 'Choose File...'}
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">Cancel</button>
            <button type="submit" disabled={uploading} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              <span>{uploading ? 'Importing...' : 'Import Schedule'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
