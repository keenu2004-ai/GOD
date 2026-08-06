import apiClient from './apiClient.js';

export interface ApplyLeavePayload {
  leave_type_id: number;
  start_date: string;
  end_date: string;
  is_half_day?: boolean;
  half_day_session?: string;
  reason: string;
  emergency_contact?: string;
  attachment_url?: string;
  status?: string;
}

export const leaveService = {
  async getLeaveTypes() {
    const response = await apiClient.get('/leaves/types');
    return response.data;
  },

  async getLeaveBalances(employeeId?: number) {
    const url = employeeId ? `/leaves/balances/${employeeId}` : '/leaves/balances';
    const response = await apiClient.get(url);
    return response.data;
  },

  async getAllLeaves(params: { employeeId?: number; status?: string } = {}) {
    const response = await apiClient.get('/leaves', { params });
    return response.data;
  },

  async getHolidays() {
    const response = await apiClient.get('/leaves/holidays');
    return response.data;
  },

  async getLeaveCalendar(month?: number, year?: number) {
    const response = await apiClient.get('/leaves/calendar', { params: { month, year } });
    return response.data;
  },

  async applyLeave(payload: ApplyLeavePayload) {
    const response = await apiClient.post('/leaves/apply', payload);
    return response.data;
  },

  async updateLeave(id: number, payload: Partial<ApplyLeavePayload>) {
    const response = await apiClient.put(`/leaves/${id}`, payload);
    return response.data;
  },

  async cancelLeave(id: number) {
    const response = await apiClient.post(`/leaves/${id}/cancel`);
    return response.data;
  },

  async bulkApprove(ids: number[], action: 'APPROVED' | 'REJECTED', rejectionReason?: string) {
    const response = await apiClient.post('/leaves/bulk-approve', { ids, action, rejectionReason });
    return response.data;
  },

  async processApproval(id: number, action: 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'HR_PENDING', rejectionReason?: string) {
    const response = await apiClient.post(`/leaves/${id}/approve`, { status: action, rejectionReason });
    return response.data;
  },
};

export default leaveService;
