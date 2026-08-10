import db from './src/backend/database/db.js';
import { employeeManagementRepository } from './src/backend/repositories/employeeManagementRepository.js';
import { dashboardRepository } from './src/backend/repositories/dashboardRepository.js';
import { attendanceService } from './src/backend/services/attendanceService.js';
import { calendarService } from './src/backend/services/calendarService.js';
import { leaveService } from './src/backend/services/leaveService.js';
import { helpdeskService } from './src/backend/services/helpdeskService.js';
import { getAppBusinessDate } from './src/backend/utils/dateUtils.js';

async function runTeamNestTestSuite() {
  console.log('================================================================');
  console.log('--- STARTING THEIAKSHI ONE TEAMNEST-INSPIRED E2E SUITE ---');
  console.log('================================================================\n');

  try {
    // 1. Initial State Audit
    const initialMetrics = await dashboardRepository.getMetrics();
    console.log(`[1] Initial PostgreSQL Dashboard Metrics:`);
    console.log(`    Total Active Employees: ${initialMetrics.totalEmployees}`);
    console.log(`    Present Today: ${initialMetrics.presentToday}`);
    console.log(`    Pending Leaves: ${initialMetrics.pendingLeaves}\n`);

    // 2. Employee Creation & Dynamic Count Propagation
    console.log(`[2] Executing Atomic Employee Creation (Employee X & Y)...`);
    const empX = await employeeManagementRepository.createEmployee({
      first_name: 'TeamNestEmpX',
      last_name: 'SuiteTest',
      email: `tn_empX_${Date.now()}@theiakshi.com`,
      phone: '9876543210',
      designation: 'Senior HR Specialist',
      joining_date: '2026-08-01',
      role: 'EMPLOYEE'
    }, 1);

    const empY = await employeeManagementRepository.createEmployee({
      first_name: 'TeamNestEmpY',
      last_name: 'SuiteTest',
      email: `tn_empY_${Date.now()}@theiakshi.com`,
      phone: '9876543211',
      designation: 'Staff Backend Engineer',
      joining_date: '2026-08-01',
      role: 'EMPLOYEE'
    }, 1);

    console.log(`✅ Employee X Created (ID: ${empX.id}, Code: ${empX.employee_code})`);
    console.log(`✅ Employee Y Created (ID: ${empY.id}, Code: ${empY.employee_code})\n`);

    // Verify Dashboard Metrics updated from database count
    const postEmpMetrics = await dashboardRepository.getMetrics();
    console.log(`[3] Post-Creation Dashboard Metrics Verification:`);
    console.log(`    Total Active Employees: ${postEmpMetrics.totalEmployees} (Increased by 2)`);
    if (postEmpMetrics.totalEmployees !== initialMetrics.totalEmployees + 2) {
      throw new Error(`Expected employee count ${initialMetrics.totalEmployees + 2}, got ${postEmpMetrics.totalEmployees}`);
    }

    // 3. Attendance State Machine & Timezone Verification
    const todayStr = getAppBusinessDate();
    console.log(`\n[4] Testing Attendance State Machine for Employee X (${empX.id}) on ${todayStr}...`);
    
    // Clear any previous today record for clean test run
    await db.query('DELETE FROM attendance WHERE employee_id = $1 AND date = $2', [empX.id, todayStr]);

    // State 1: NOT CHECKED IN
    const statusBefore = await attendanceService.getMyStatus(empX.id);
    const stateBefore = !statusBefore.record?.punch_in ? 'NOT CHECKED IN' : 'UNKNOWN';
    console.log(`    State 1 (Before Check-In): ${stateBefore}`);

    // State 2: CLOCK IN -> CHECKED IN
    const punchInRes = await attendanceService.punchIn(empX.id, 12.9716, 77.5946, 'GENERAL');
    const statusAfterIn = await attendanceService.getMyStatus(empX.id);
    const isCheckedIn = !!(statusAfterIn.record?.punch_in && !statusAfterIn.record?.punch_out);
    console.log(`    State 2 (After Punch-In): ${isCheckedIn ? 'CHECKED IN' : 'FAILED'} (Status: ${punchInRes.record.status})`);
    if (!isCheckedIn) throw new Error('State machine failed to transition to CHECKED IN');

    // State 3: CLOCK OUT -> COMPLETED
    const punchOutRes = await attendanceService.punchOut(empX.id, 12.9716, 77.5946);
    const statusAfterOut = await attendanceService.getMyStatus(empX.id);
    const isCompleted = !!(statusAfterOut.record?.punch_in && statusAfterOut.record?.punch_out);
    console.log(`    State 3 (After Punch-Out): ${isCompleted ? 'COMPLETED' : 'FAILED'} (Work Hours: ${punchOutRes.record.work_hours}, Final Status: ${punchOutRes.record.status})`);
    if (!isCompleted) throw new Error('State machine failed to transition to COMPLETED');

    // 4. Helpdesk Ticket Workflow
    console.log(`\n[5] Testing Helpdesk Ticket Creation & Notification Engine...`);
    const ticket = await helpdeskService.createTicket({
      subject: 'VPN Access Configuration Issue',
      description: 'Unable to connect to internal staging environment',
      category: 'IT_SUPPORT',
      priority: 'HIGH'
    }, empX.id);
    console.log(`✅ Helpdesk Ticket Created (ID: ${ticket.id})`);

    // Add Comment
    await helpdeskService.addComment(ticket.id, empX.id, 'Attached network traceroute logs.', false);
    console.log(`✅ Ticket Comment Recorded`);

    // Update Status
    await helpdeskService.updateStatus(ticket.id, 'IN_PROGRESS', 1);
    console.log(`✅ Ticket Status Updated -> IN_PROGRESS`);

    // 5. Daily Standup Submission
    console.log(`\n[6] Submitting Daily Standup for Employee Y...`);
    await db.query(
      `INSERT INTO daily_standups (employee_id, standup_date, yesterday_work, today_plan, blockers)
       VALUES ($1, $2, $3, $4, $5)`,
      [empY.id, todayStr, 'Implemented TeamNest Leave Workflow APIs', 'Write E2E Integration Suite', 'None']
    );
    console.log(`✅ Daily Standup Saved to PostgreSQL`);

    // 6. Calendar Task CRUD & Unified Events Feed
    console.log(`\n[7] Testing Scheduled Calendar Task & Aggregation Feed...`);
    const task = await calendarService.createTask({
      title: 'TeamNest Compliance Review',
      description: 'Review statutory ECR and ESIC filings',
      task_date: todayStr,
      start_time: '14:00',
      end_time: '15:00',
      priority: 'HIGH',
      status: 'PENDING',
      assigned_to: empY.id,
      created_by: 1,
      location: 'Main Boardroom'
    });
    console.log(`✅ Calendar Task Created (ID: ${task.id}, Title: "${task.title}")`);

    const unifiedFeed = await calendarService.getUnifiedEvents(todayStr, todayStr);
    console.log(`✅ Unified Calendar Feed aggregated ${unifiedFeed.length} real events for ${todayStr}:`);
    unifiedFeed.forEach(e => {
      console.log(`   - [${e.type}] ${e.title} (Source ID: ${e.sourceId})`);
    });

    // Cleanup test task
    await calendarService.deleteTask(task.id);
    console.log(`✅ Test task cleaned up`);

    console.log('\n================================================================');
    console.log('✅ ALL TEAMNEST-INSPIRED HRMS E2E SUITE TESTS PASSED!');
    console.log('================================================================\n');
    process.exit(0);

  } catch (err: any) {
    console.error('\n❌ E2E SUITE TEST FAILED:', err.message || err);
    process.exit(1);
  }
}

runTeamNestTestSuite();
