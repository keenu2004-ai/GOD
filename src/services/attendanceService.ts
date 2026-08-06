import apiClient from './apiClient.js';

export const attendanceService = {
  async punchIn(latitude?: number, longitude?: number, shiftCode = 'GENERAL') {
    const response = await apiClient.post('/attendance/punch-in', { latitude, longitude, shiftCode });
    return response.data;
  },

  async punchOut(latitude?: number, longitude?: number) {
    const response = await apiClient.post('/attendance/punch-out', { latitude, longitude });
    return response.data;
  },

  async recordBreak(breakMinutes = 15) {
    const response = await apiClient.post('/attendance/break', { breakMinutes });
    return response.data;
  },

  async getMyStatus() {
    const response = await apiClient.get('/attendance/status');
    return response.data;
  },

  async getHistory() {
    const response = await apiClient.get('/attendance/history');
    return response.data;
  },

  async getMonthlySummary(year?: number, month?: number) {
    const response = await apiClient.get('/attendance/monthly', { params: { year, month } });
    return response.data;
  },

  async getLiveManagerDashboard() {
    const response = await apiClient.get('/attendance/live');
    return response.data;
  },

  async getAnalytics(startDate?: string, endDate?: string) {
    const response = await apiClient.get('/attendance/analytics', { params: { startDate, endDate } });
    return response.data;
  },

  async applyRegularization(data: { attendance_date: string; requested_punch_in?: string; requested_punch_out?: string; reason: string }) {
    const response = await apiClient.post('/attendance/regularize', data);
    return response.data;
  },

  async getRegularizations(employeeId?: number) {
    const response = await apiClient.get('/attendance/regularizations', { params: { employeeId } });
    return response.data;
  },

  async processRegularization(id: number, status: string) {
    const response = await apiClient.put(`/attendance/regularizations/${id}/approve`, { status });
    return response.data;
  },
};

export default attendanceService;

