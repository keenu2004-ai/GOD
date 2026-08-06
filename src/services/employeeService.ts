import apiClient from './apiClient.js';
import { UserProfile } from '../types/index.js';

export interface EmployeeFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: number;
  role?: string;
  status?: string;
  includeDeleted?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface EmployeeListResponse {
  employees: UserProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const employeeService = {
  async getEmployees(params: EmployeeFilterParams = {}) {
    const response = await apiClient.get('/employees', { params });
    return response.data;
  },

  async getEmployeeById(id: number) {
    const response = await apiClient.get(`/employees/${id}`);
    return response.data;
  },

  async createEmployee(employeeData: Partial<UserProfile> & { password?: string }) {
    const response = await apiClient.post('/employees', employeeData);
    return response.data;
  },

  async updateEmployee(id: number, employeeData: Partial<UserProfile>) {
    const response = await apiClient.put(`/employees/${id}`, employeeData);
    return response.data;
  },

  async softDeleteEmployee(id: number) {
    const response = await apiClient.delete(`/employees/${id}`);
    return response.data;
  },

  async restoreEmployee(id: number) {
    const response = await apiClient.post(`/employees/${id}/restore`);
    return response.data;
  },
};

export default employeeService;
