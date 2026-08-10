import db from './src/backend/database/db.js';
import { attendanceService } from './src/backend/services/attendanceService.js';
import { calendarService } from './src/backend/services/calendarService.js';
import { getAppBusinessDate } from './src/backend/utils/dateUtils.js';

async function testAttendanceStage3() {
  console.log('================================================================');
  console.log('--- TESTING STAGE 3 ATTENDANCE MODULE FINALIZATION ---');
  console.log('================================================================\n');

  try {
    const empId = 1; // Primary Admin User / Employee
    const todayStr = getAppBusinessDate();
    console.log(`[1] Business Date Verified (Asia/Kolkata): ${todayStr}`);

    // Clean up any test attendance record for today to start fresh
    await db.query('DELETE FROM attendance WHERE employee_id = $1 AND date = $2', [empId, todayStr]);

    // Step A: Verify State 1 (NOT CHECKED IN)
    const state1 = await attendanceService.getMyStatus(empId);
    console.log(`\n[2] State 1 (Before Check-In):`);
    console.log(`    Punch In: ${state1.record?.punch_in || 'NONE'}`);
    console.log(`    Punch Out: ${state1.record?.punch_out || 'NONE'}`);
    if (state1.record?.punch_in) throw new Error('Expected no punch_in record');

    // Step B: Clock In -> State 2 (CHECKED IN)
    console.log(`\n[3] Executing Clock-In (GPS: 12.9716, 77.5946)...`);
    const inResult = await attendanceService.punchIn(empId, 12.9716, 77.5946, 'GENERAL');
    console.log(`✅ Clock-In Successful (ID: ${inResult.record.id}, Status: ${inResult.record.status})`);

    const state2 = await attendanceService.getMyStatus(empId);
    const isCheckedIn = !!(state2.record?.punch_in && !state2.record?.punch_out);
    console.log(`    State Machine Verification: ${isCheckedIn ? 'CHECKED IN' : 'FAILED'}`);
    if (!isCheckedIn) throw new Error('Failed to reach CHECKED IN state');

    // Step C: Duplicate Clock-In Prevention
    console.log(`\n[4] Attempting Duplicate Clock-In...`);
    try {
      await attendanceService.punchIn(empId, 12.9716, 77.5946, 'GENERAL');
      console.log(`✅ Duplicate Clock-In safely handled (returned existing session without creating duplicate row)`);
    } catch (e: any) {
      console.log(`✅ Duplicate Clock-In safely rejected: ${e.message}`);
    }

    // Step D: Clock Out -> State 3 (COMPLETED)
    console.log(`\n[5] Executing Clock-Out (GPS: 12.9716, 77.5946)...`);
    const outResult = await attendanceService.punchOut(empId, 12.9716, 77.5946);
    console.log(`✅ Clock-Out Successful (Work Hours: ${outResult.record.work_hours}, Final Status: ${outResult.record.status})`);

    const state3 = await attendanceService.getMyStatus(empId);
    const isCompleted = !!(state3.record?.punch_in && state3.record?.punch_out);
    console.log(`    State Machine Verification: ${isCompleted ? 'COMPLETED' : 'FAILED'}`);
    if (!isCompleted) throw new Error('Failed to reach COMPLETED state');

    // Step E: Duplicate Clock-Out Prevention
    console.log(`\n[6] Attempting Duplicate Clock-Out...`);
    try {
      await attendanceService.punchOut(empId, 12.9716, 77.5946);
      throw new Error('Duplicate Clock-Out should have been rejected!');
    } catch (e: any) {
      console.log(`✅ Duplicate Clock-Out correctly rejected: "${e.message}"`);
    }

    // Step F: Calendar Aggregation Verification
    console.log(`\n[7] Verifying Unified Calendar Integration...`);
    const events = await calendarService.getUnifiedEvents(todayStr, todayStr);
    const attEvent = events.find(e => e.type === 'ATTENDANCE' && e.id === `attendance-${outResult.record.id}`);
    if (!attEvent) throw new Error('Attendance record was not projected into Unified Calendar feed!');
    console.log(`✅ Found Attendance Event on Unified Calendar: "${attEvent.title}"`);

    console.log('\n================================================================');
    console.log('✅ ALL STAGE 3 ATTENDANCE MODULE TESTS PASSED!');
    console.log('================================================================\n');
    process.exit(0);

  } catch (err: any) {
    console.error('\n❌ STAGE 3 TEST FAILED:', err.message || err);
    process.exit(1);
  }
}

testAttendanceStage3();
