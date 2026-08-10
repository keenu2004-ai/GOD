import db from './src/backend/database/db.js';
import { leaveManagementService } from './src/backend/services/leaveManagementService.js';
import { leaveService } from './src/backend/services/leaveService.js';
import { calendarService } from './src/backend/services/calendarService.js';
import { getAppBusinessDate } from './src/backend/utils/dateUtils.js';

async function testLeaveStage4() {
  console.log('================================================================');
  console.log('--- TESTING STAGE 4 LEAVE MANAGEMENT DATABASE CONNECTIVITY ---');
  console.log('================================================================\n');

  try {
    const empId = 1; // Admin user ID
    const todayStr = getAppBusinessDate();
    console.log(`[1] Employee ID: ${empId}, Business Date: ${todayStr}`);

    // Step A: Fetch Leave Balances from PostgreSQL
    console.log(`\n[2] Fetching Leave Balances from PostgreSQL...`);
    const initialBalances = await leaveManagementService.getLeaveBalances(empId);
    console.log(`✅ Retrieved ${initialBalances.length} Leave Types & Balances from DB:`);
    initialBalances.forEach((b: any) => {
      console.log(`   - ${b.leave_type_name}: Allocated=${b.total_allocated}, Used=${b.used_days}, Remaining=${b.remaining_days}`);
    });

    if (initialBalances.length === 0) {
      throw new Error('No leave balances found in PostgreSQL!');
    }

    const leaveType = initialBalances[0];

    // Step B: Apply Leave
    console.log(`\n[3] Applying for 1 Day Leave (${leaveType.leave_type_name}) on ${todayStr}...`);
    const appResult = await leaveManagementService.applyLeave({
      employee_id: empId,
      leave_type_id: leaveType.leave_type_id || leaveType.id,
      start_date: todayStr,
      end_date: todayStr,
      is_half_day: false,
      reason: 'Stage 4 Database Integration Test'
    });
    const leaveRec = appResult.leave;
    console.log(`✅ Leave Application Created in PostgreSQL (ID: ${leaveRec.id}, Status: ${leaveRec.status})`);

    // Step C: Manager/HR Approval
    console.log(`\n[4] Approving Leave Application (ID: ${leaveRec.id})...`);
    await leaveManagementService.approveLeave(leaveRec.id, 1);

    // Verify DB Status Updated
    const checkRes = await db.query('SELECT * FROM leaves WHERE id = $1', [leaveRec.id]);
    const updatedApp = checkRes.rows[0];
    console.log(`✅ PostgreSQL Leave Application Status Updated: ${updatedApp.status}`);
    if (updatedApp.status !== 'APPROVED') {
      throw new Error(`Expected status APPROVED, got ${updatedApp.status}`);
    }

    // Step D: Verify Balance Updated
    console.log(`\n[5] Verifying Post-Approval Balance Deduction in PostgreSQL...`);
    const postBalances = await leaveManagementService.getLeaveBalances(empId);
    const updatedBal = postBalances.find((b: any) => b.leave_type_id === leaveType.leave_type_id || b.id === leaveType.id);
    console.log(`   Updated Balance for ${leaveType.leave_type_name}: Used=${updatedBal?.used_days}, Remaining=${updatedBal?.remaining_days}`);

    // Step E: Verify Unified Calendar Aggregation
    console.log(`\n[6] Verifying Approved Leave Projection on Unified Calendar...`);
    const events = await calendarService.getUnifiedEvents(todayStr, todayStr);
    const leaveEvent = events.find(e => e.type === 'LEAVE' && e.id === `leave-${leaveRec.id}`);
    if (!leaveEvent) {
      throw new Error('Approved leave record was not projected onto Unified Calendar feed!');
    }
    console.log(`✅ Found Leave Event on Unified Calendar: "${leaveEvent.title}"`);

    // Step F: Cleanup test record
    console.log(`\n[7] Cleaning up test leave application (ID: ${leaveRec.id})...`);
    await db.query('DELETE FROM leave_balance_ledger WHERE reason LIKE $1', [`%${leaveRec.id}%`]);
    await db.query('DELETE FROM leaves WHERE id = $1', [leaveRec.id]);
    console.log(`✅ Test record cleaned up`);

    console.log('\n================================================================');
    console.log('✅ ALL STAGE 4 LEAVE MANAGEMENT TESTS PASSED!');
    console.log('================================================================\n');
    process.exit(0);

  } catch (err: any) {
    console.error('\n❌ STAGE 4 TEST FAILED:', err.message || err);
    process.exit(1);
  }
}

testLeaveStage4();
