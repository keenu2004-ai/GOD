import db from './src/backend/database/db.js';
import { employeeManagementRepository } from './src/backend/repositories/employeeManagementRepository.js';
import { dashboardRepository } from './src/backend/repositories/dashboardRepository.js';
import { attendanceService } from './src/backend/services/attendanceService.js';
import { calendarService } from './src/backend/services/calendarService.js';
import { leaveService } from './src/backend/services/leaveService.js';
import { helpdeskService } from './src/backend/services/helpdeskService.js';
import { getAppBusinessDate } from './src/backend/utils/dateUtils.js';

async function runFullIntegrationTest() {
  console.log('====================================================');
  console.log('--- STARTING THEIAKSHI ONE FULL E2E INTEGRATION ---');
  console.log('====================================================\n');

  try {
    // 1. Initial State
    const initialMetrics = await dashboardRepository.getMetrics();
    console.log(`[1] Initial Dashboard Metrics (SQL aggregated):`);
    console.log(`    Total Employees: ${initialMetrics.totalEmployees}`);
    console.log(`    Present Today: ${initialMetrics.presentToday}`);
    console.log(`    Pending Leaves: ${initialMetrics.pendingLeaves}\n`);

    // 2. Create Employee A & Employee B via Atomic SQL Transactions
    console.log(`[2] Creating Employee A & Employee B via dbService.transaction...`);
    const empA = await employeeManagementRepository.createEmployee({
      first_name: 'TestEmpA',
      last_name: 'Integration',
      email: `empA_${Date.now()}@theiakshi.com`,
      phone: '9988776655',
      designation: 'Senior QA Engineer',
      joining_date: '2026-08-01',
      role: 'EMPLOYEE'
    }, 1);

    const empB = await employeeManagementRepository.createEmployee({
      first_name: 'TestEmpB',
      last_name: 'Integration',
      email: `empB_${Date.now()}@theiakshi.com`,
      phone: '9988776644',
      designation: 'Software Developer',
      joining_date: '2026-08-01',
      role: 'EMPLOYEE'
    }, 1);

    console.log(`✅ Employee A Created (ID: ${empA.id}, Code: ${empA.employee_code})`);
    console.log(`✅ Employee B Created (ID: ${empB.id}, Code: ${empB.employee_code})\n`);

    // Verify Dashboard Metrics updated from database count
    const postEmpMetrics = await dashboardRepository.getMetrics();
    console.log(`[3] Dashboard Metrics After Employee Creation:`);
    console.log(`    Total Active Employees: ${postEmpMetrics.totalEmployees} (Increased by 2)`);
    if (postEmpMetrics.totalEmployees !== initialMetrics.totalEmployees + 2) {
      throw new Error(`Expected employee count ${initialMetrics.totalEmployees + 2}, got ${postEmpMetrics.totalEmployees}`);
    }

    // 3. Employee A Punch In & Punch Out
    const todayStr = getAppBusinessDate();
    console.log(`\n[4] Executing Punch-In for Employee A (${empA.id}) on ${todayStr}...`);
    // Delete pre-existing today record if any
    await db.query('DELETE FROM attendance WHERE employee_id = $1 AND date = $2', [empA.id, todayStr]);

    const punchInRes = await attendanceService.punchIn(empA.id, 12.9716, 77.5946, 'GENERAL');
    console.log(`✅ Clock-In Recorded (Status: ${punchInRes.record.status})`);

    const punchOutRes = await attendanceService.punchOut(empA.id, 12.9716, 77.5946);
    console.log(`✅ Clock-Out Recorded (Work Hours: ${punchOutRes.record.work_hours}, Status: ${punchOutRes.record.status})`);

    // 4. Create Calendar Task
    console.log(`\n[5] Testing Calendar Task Creation & CRUD...`);
    const calTask = await calendarService.createTask({
      title: 'Integration Test Task',
      description: 'E2E Validation Task',
      task_date: todayStr,
      start_time: '10:00',
      end_time: '11:00',
      priority: 'HIGH',
      status: 'PENDING',
      assigned_to: empA.id,
      created_by: 1,
      location: 'Conference Room 1'
    });
    console.log(`✅ Calendar Task Created (ID: ${calTask.id}, Title: "${calTask.title}")`);

    // Update Task
    const updatedTask = await calendarService.updateTask(calTask.id, { status: 'COMPLETED' });
    console.log(`✅ Calendar Task Status Updated -> ${updatedTask.status}`);

    // 5. Query Unified Calendar Feed
    console.log(`\n[6] Fetching Unified Calendar Aggregation Feed...`);
    const unifiedEvents = await calendarService.getUnifiedEvents(todayStr, todayStr);
    console.log(`✅ Aggregated ${unifiedEvents.length} events for ${todayStr}:`);
    unifiedEvents.forEach(ev => {
      console.log(`   - [${ev.type}] ${ev.title} (Source ID: ${ev.sourceId})`);
    });

    const taskEvent = unifiedEvents.find(e => e.id === `task-${calTask.id}`);
    const attEvent = unifiedEvents.find(e => e.id === `attendance-${punchInRes.record.id}`);

    if (!taskEvent) throw new Error('Calendar task event not found in Unified Calendar Feed');
    if (!attEvent) throw new Error('Attendance event not found in Unified Calendar Feed');

    // 6. Helpdesk Ticket Creation
    console.log(`\n[7] Testing Helpdesk Ticket Data Flow...`);
    const ticket = await helpdeskService.createTicket({
      subject: 'Hardware Upgrade Request',
      description: 'Need extra RAM for dev environment',
      category: 'IT_SUPPORT',
      priority: 'HIGH'
    }, empA.id);
    console.log(`✅ Helpdesk Ticket Created (Number: ${ticket.ticket_number})`);

    // 7. Cleanup Test Task
    await calendarService.deleteTask(calTask.id);
    console.log(`\n[8] Cleaned up temporary test task.`);

    console.log('\n====================================================');
    console.log('✅ ALL FULL-STACK DATA INTEGRATION TESTS PASSED!');
    console.log('====================================================\n');
    process.exit(0);

  } catch (err: any) {
    console.error('\n❌ E2E INTEGRATION TEST FAILED:', err.message || err);
    process.exit(1);
  }
}

runFullIntegrationTest();
