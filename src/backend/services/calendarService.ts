import { calendarRepository, CreateCalendarTaskDTO, UpdateCalendarTaskDTO } from '../repositories/calendarRepository.js';
import { getAppBusinessDate } from '../utils/dateUtils.js';

export interface UnifiedCalendarEvent {
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

export class CalendarService {
  async getUnifiedEvents(
    startDate?: string,
    endDate?: string,
    employeeId?: number,
    eventTypes?: string[]
  ): Promise<UnifiedCalendarEvent[]> {
    const todayStr = getAppBusinessDate();
    
    // Default to current month window if not provided
    const start = startDate || `${todayStr.substring(0, 7)}-01`;
    const end = endDate || `${todayStr.substring(0, 7)}-31`;

    const events: UnifiedCalendarEvent[] = [];

    // 1. HOLIDAYS
    if (!eventTypes || eventTypes.includes('HOLIDAY') || eventTypes.includes('ALL')) {
      const holidays = await calendarRepository.getHolidays(start, end);
      holidays.forEach(h => {
        const dStr = typeof h.date === 'string' ? h.date.split('T')[0] : h.date.toISOString().split('T')[0];
        events.push({
          id: `holiday-${h.id}`,
          type: 'HOLIDAY',
          title: `🌴 ${h.name || h.title}`,
          start: dStr,
          status: 'HOLIDAY',
          sourceId: h.id,
          metadata: { category: h.type || 'COMPANY_HOLIDAY', description: h.description }
        });
      });
    }

    // 2. LEAVE
    if (!eventTypes || eventTypes.includes('LEAVE') || eventTypes.includes('ALL')) {
      const leaves = await calendarRepository.getLeaves(start, end, employeeId);
      leaves.forEach(l => {
        const sStr = typeof l.start_date === 'string' ? l.start_date.split('T')[0] : l.start_date.toISOString().split('T')[0];
        const eStr = typeof l.end_date === 'string' ? l.end_date.split('T')[0] : l.end_date.toISOString().split('T')[0];
        events.push({
          id: `leave-${l.id}`,
          type: 'LEAVE',
          title: `🏥 Leave: ${l.first_name} ${l.last_name} (${l.leave_type || 'PTO'})`,
          start: sStr,
          end: eStr,
          status: l.status,
          employeeId: l.employee_id,
          employeeName: `${l.first_name} ${l.last_name}`,
          sourceId: l.id,
          metadata: { reason: l.reason, leave_type: l.leave_type }
        });
      });
    }

    // 3. ATTENDANCE
    if (!eventTypes || eventTypes.includes('ATTENDANCE') || eventTypes.includes('ALL')) {
      const attendance = await calendarRepository.getAttendance(start, end, employeeId);
      attendance.forEach(a => {
        const dStr = typeof a.date === 'string' ? a.date.split('T')[0] : a.date.toISOString().split('T')[0];
        const statusLabel = a.status || (a.is_late ? 'LATE' : 'PRESENT');
        events.push({
          id: `attendance-${a.id}`,
          type: 'ATTENDANCE',
          title: `⏰ ${a.first_name} ${a.last_name}: ${statusLabel}`,
          start: dStr,
          status: statusLabel,
          employeeId: a.employee_id,
          employeeName: `${a.first_name} ${a.last_name}`,
          sourceId: a.id,
          metadata: { punch_in: a.punch_in, punch_out: a.punch_out, work_hours: a.work_hours }
        });
      });
    }

    // 4. REGULARIZATION
    if (!eventTypes || eventTypes.includes('REGULARIZATION') || eventTypes.includes('ALL')) {
      const regs = await calendarRepository.getRegularizations(start, end, employeeId);
      regs.forEach(r => {
        const dStr = typeof r.attendance_date === 'string' ? r.attendance_date.split('T')[0] : r.attendance_date.toISOString().split('T')[0];
        events.push({
          id: `regularization-${r.id}`,
          type: 'REGULARIZATION',
          title: `📝 Regularization (${r.status}): ${r.first_name} ${r.last_name}`,
          start: dStr,
          status: r.status,
          employeeId: r.employee_id,
          employeeName: `${r.first_name} ${r.last_name}`,
          sourceId: r.id,
          metadata: { reason: r.reason }
        });
      });
    }

    // 5. CALENDAR TASKS
    if (!eventTypes || eventTypes.includes('TASK') || eventTypes.includes('ALL')) {
      const tasks = await calendarRepository.getTasks(employeeId, start, end);
      tasks.forEach(t => {
        const dStr = typeof t.task_date === 'string' ? t.task_date.split('T')[0] : t.task_date.toISOString().split('T')[0];
        events.push({
          id: `task-${t.id}`,
          type: 'TASK',
          title: `📌 Task: ${t.title}`,
          start: dStr,
          status: t.status,
          employeeId: t.assigned_to,
          employeeName: t.assignee_first_name ? `${t.assignee_first_name} ${t.assignee_last_name}` : undefined,
          sourceId: t.id,
          metadata: {
            description: t.description,
            priority: t.priority,
            start_time: t.start_time,
            end_time: t.end_time,
            location: t.location
          }
        });
      });
    }

    // 6. ANNOUNCEMENTS (with created_at date)
    if (!eventTypes || eventTypes.includes('ANNOUNCEMENT') || eventTypes.includes('ALL')) {
      const ann = await calendarRepository.getAnnouncements();
      ann.forEach(an => {
        const dStr = typeof an.created_at === 'string' ? an.created_at.split('T')[0] : (an.created_at ? an.created_at.toISOString().split('T')[0] : todayStr);
        if (dStr >= start && dStr <= end) {
          events.push({
            id: `announcement-${an.id}`,
            type: 'ANNOUNCEMENT',
            title: `📢 ${an.title}`,
            start: dStr,
            status: 'PUBLISHED',
            sourceId: an.id,
            metadata: { category: an.category, content: an.content }
          });
        }
      });
    }

    return events;
  }

  async createTask(dto: CreateCalendarTaskDTO) {
    if (!dto.title || !dto.task_date) {
      throw new Error('Title and Task Date are required');
    }
    return calendarRepository.createTask(dto);
  }

  async getTasks(assignedTo?: number, startDate?: string, endDate?: string) {
    return calendarRepository.getTasks(assignedTo, startDate, endDate);
  }

  async getTaskById(id: number) {
    const task = await calendarRepository.getTaskById(id);
    if (!task) throw new Error('Task not found');
    return task;
  }

  async updateTask(id: number, dto: UpdateCalendarTaskDTO) {
    const existing = await calendarRepository.getTaskById(id);
    if (!existing) throw new Error('Task not found');
    return calendarRepository.updateTask(id, dto);
  }

  async deleteTask(id: number) {
    const existing = await calendarRepository.getTaskById(id);
    if (!existing) throw new Error('Task not found');
    return calendarRepository.deleteTask(id);
  }
}

export const calendarService = new CalendarService();
