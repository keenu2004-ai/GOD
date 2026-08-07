import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Trash2,
  RotateCcw,
  Eye,
  Building2,
  Briefcase,
  Mail,
  Phone,
  DollarSign,
  CreditCard,
  X,
  CheckCircle,
  Shield,
  UserCheck,
} from 'lucide-react';
import { employeeService } from '../services/employeeService.js';
import apiClient from '../services/apiClient.js';
import { UserProfile } from '../types/index.js';

export const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedEmployee, setSelectedEmployee] = useState<UserProfile | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form state for employee creation
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'EMPLOYEE',
    designation: 'Software Engineer',
    department_id: 2,
    branch_id: 1,
    salary: 80000,
    bank_account: '',
    ifsc_code: '',
    pan_number: '',
    aadhaar_number: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    employee_code: '',
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await employeeService.getEmployees({
        page,
        limit: 10,
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        includeDeleted: true,
      });
      if (res?.success) {
        setEmployees(res.data.employees);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [page, search, roleFilter, statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await employeeService.createEmployee(formData);
      if (res?.success) {
        setShowCreateModal(false);
        // Reset form
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          role: 'EMPLOYEE',
          designation: 'Software Engineer',
          department_id: 2,
          branch_id: 1,
          salary: 80000,
          bank_account: '',
          ifsc_code: '',
          pan_number: '',
          aadhaar_number: '',
          emergency_contact_name: '',
          emergency_contact_phone: '',
          employee_code: '',
        });
        fetchEmployees();
      } else {
        alert(res?.message || 'Failed to create employee');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to create employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSoftDelete = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate/soft-delete this employee?')) return;
    try {
      const res = await employeeService.softDeleteEmployee(id);
      if (res?.success) {
        fetchEmployees();
      } else {
        alert(res?.message || 'Failed to delete employee');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete employee');
    }
  };

  const handleRestore = async (id: number) => {
    try {
      const res = await employeeService.restoreEmployee(id);
      if (res?.success) {
        fetchEmployees();
      } else {
        alert(res?.message || 'Failed to restore employee');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to restore employee');
    }
  };

  const handlePermanentDelete = async (id: number) => {
    if (!confirm('PERMANENT DELETE WARNING: This will permanently purge this employee record from PostgreSQL database. Proceed?')) return;
    try {
      await apiClient.delete(`/employees/${id}/permanent`);
      alert('Employee permanently deleted from database!');
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to permanently delete employee');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Employees Directory
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage enterprise headcount, payroll bank accounts, emergency contacts, and status.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, code, email or designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-100 border-none rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-slate-100 border-none text-xs text-slate-900 rounded-lg px-3 py-2 w-full sm:w-44 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
        >
          <option value="">All Roles</option>
          <option value="ADMIN">ADMIN</option>
          <option value="HR_MANAGER">HR_MANAGER</option>
          <option value="DEPT_HEAD">DEPT_HEAD</option>
          <option value="EMPLOYEE">EMPLOYEE</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-100 border-none text-xs text-slate-900 rounded-lg px-3 py-2 w-full sm:w-44 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
          <option value="PROBATION">PROBATION</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[10px] font-black tracking-wider">
              <tr>
                <th className="p-4">Employee</th>
                <th className="p-4">Code / Designation</th>
                <th className="p-4">Department / Branch</th>
                <th className="p-4">Monthly Salary</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">Loading directory...</td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">No employees found.</td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={emp.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-200" />
                        <div>
                          <p className="font-bold text-slate-900">{emp.first_name} {emp.last_name}</p>
                          <p className="text-[11px] text-slate-500">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono">
                      <p className="font-bold text-blue-600">{emp.employee_code}</p>
                      <p className="text-[10px] text-slate-500 font-sans">{emp.designation}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-800">{emp.department_name || 'Engineering'}</p>
                      <p className="text-[10px] text-slate-500">{emp.branch_name || 'THEIAKSHI HQ'}</p>
                    </td>
                    <td className="p-4 font-mono font-bold text-emerald-600">
                      ₹{Number(emp.salary || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="p-4">
                      {emp.is_deleted ? (
                        <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-200">DEACTIVATED</span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">{emp.status || 'ACTIVE'}</span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => setSelectedEmployee(emp)} title="View Profile" className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg">
                        <Eye className="w-4 h-4" />
                      </button>
                      {emp.is_deleted ? (
                        <>
                          <button onClick={() => handleRestore(emp.id)} title="Restore Employee" className="p-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg">
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button onClick={() => handlePermanentDelete(emp.id)} title="Permanently Purge from Database" className="p-1.5 bg-red-600 text-white hover:bg-red-700 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button onClick={() => handleSoftDelete(emp.id)} title="Deactivate Employee" className="p-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profile Drawer */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="font-bold text-white text-base">Employee Profile</h3>
              <button onClick={() => setSelectedEmployee(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center">
              <img src={selectedEmployee.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'} alt="" className="w-20 h-20 rounded-2xl mx-auto object-cover ring-2 ring-blue-500/50" />
              <h4 className="font-bold text-white text-lg mt-3">{selectedEmployee.first_name} {selectedEmployee.last_name}</h4>
              <p className="text-xs text-blue-400 font-mono font-semibold">{selectedEmployee.employee_code} • {selectedEmployee.designation}</p>
            </div>
            <div className="space-y-3 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Email:</span>
                <span className="font-medium text-white">{selectedEmployee.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Phone:</span>
                <span className="font-medium text-white">{selectedEmployee.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Power Role:</span>
                <select
                  value={selectedEmployee.role}
                  onChange={(e) => {
                    const newRole = e.target.value;
                    apiClient.put(`/employees/${selectedEmployee.id}/role`, { role: newRole })
                      .then(() => {
                        alert(`User power role updated to ${newRole}!`);
                        setSelectedEmployee({ ...selectedEmployee, role: newRole });
                        fetchEmployees();
                      })
                      .catch((err) => alert(err.response?.data?.message || 'Failed to update role'));
                  }}
                  className="bg-slate-950 border border-slate-700 text-blue-400 text-xs font-mono font-bold px-2 py-1 rounded cursor-pointer"
                >
                  <option value="ADMIN">ADMIN / SUPER BOSS (Full Power)</option>
                  <option value="HR_MANAGER">HR_MANAGER (Employees, Payroll, Bills)</option>
                  <option value="DEPT_HEAD">DEPT_HEAD (Approvals, Team Manager)</option>
                  <option value="EMPLOYEE">EMPLOYEE (Standard Access)</option>
                </select>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Department:</span>
                <span className="font-medium text-white">{selectedEmployee.department_name || 'Engineering'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Monthly Salary:</span>
                <span className="font-medium text-emerald-400 font-mono">₹{Number(selectedEmployee.salary || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Bank Account:</span>
                <span className="font-medium text-white font-mono">{selectedEmployee.bank_account || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">IFSC Code:</span>
                <span className="font-medium text-white font-mono">{selectedEmployee.ifsc_code || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">PAN Number:</span>
                <span className="font-medium text-white font-mono">{selectedEmployee.pan_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Emergency Contact:</span>
                <span className="font-medium text-white">{selectedEmployee.emergency_contact_name ? `${selectedEmployee.emergency_contact_name} (${selectedEmployee.emergency_contact_phone})` : 'N/A'}</span>
              </div>
            </div>

            {/* Employee Activity & Milestones Timeline */}
            <div className="space-y-3 pt-2">
              <h5 className="font-bold text-slate-300 text-xs uppercase tracking-wider">Career & Milestones Timeline</h5>
              <div className="space-y-3 text-xs border-l-2 border-slate-800 pl-3">
                <div className="relative">
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full absolute -left-[17px] top-1"></span>
                  <p className="font-bold text-white">Joined THEIAKSHI ENTERPRISES</p>
                  <p className="text-[10px] text-slate-400 font-mono">15 Jan 2021 • Onboarding Completed</p>
                </div>
                <div className="relative pt-1">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full absolute -left-[17px] top-2"></span>
                  <p className="font-bold text-white">Designation: {selectedEmployee.designation}</p>
                  <p className="text-[10px] text-slate-400 font-mono">Active Role • {selectedEmployee.department_name || 'Engineering'}</p>
                </div>
                <div className="relative pt-1">
                  <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full absolute -left-[17px] top-2"></span>
                  <p className="font-bold text-white">Monthly Payroll Verified</p>
                  <p className="text-[10px] text-slate-400 font-mono">₹{Number(selectedEmployee.salary || 0).toLocaleString('en-IN')} / month</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Add New Enterprise Employee</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400">First Name *</label>
                  <input required type="text" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white mt-1" />
                </div>
                <div>
                  <label className="text-slate-400">Last Name *</label>
                  <input required type="text" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white mt-1" />
                </div>
              </div>
              <div>
                <label className="text-slate-400">Corporate Email *</label>
                <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400">Phone</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white mt-1" />
                </div>
                <div>
                  <label className="text-slate-400">Employee Code (Leave empty for Auto)</label>
                  <input type="text" placeholder="Auto-generated" value={formData.employee_code} onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white mt-1 font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400">Role</label>
                  <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white mt-1">
                    <option value="EMPLOYEE">EMPLOYEE</option>
                    <option value="DEPT_HEAD">DEPT_HEAD</option>
                    <option value="HR_MANAGER">HR_MANAGER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400">Designation *</label>
                  <input required type="text" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400">Monthly Salary (₹)</label>
                  <input required type="number" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white mt-1" />
                </div>
                <div>
                  <label className="text-slate-400">Bank Account</label>
                  <input type="text" value={formData.bank_account} onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white mt-1 font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400">IFSC Code</label>
                  <input type="text" value={formData.ifsc_code} onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white mt-1 font-mono" />
                </div>
                <div>
                  <label className="text-slate-400">PAN Number</label>
                  <input type="text" value={formData.pan_number} onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white mt-1 font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400">Emergency Contact Name</label>
                  <input type="text" value={formData.emergency_contact_name} onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white mt-1" />
                </div>
                <div>
                  <label className="text-slate-400">Emergency Contact Phone</label>
                  <input type="text" value={formData.emergency_contact_phone} onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white mt-1" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg">
                  {submitting ? 'Saving...' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
