import { attendanceService } from './src/backend/services/attendanceService.js';
import db from './src/backend/database/db.js';
import { getAppBusinessDate } from './src/backend/utils/dateUtils.js';

async function runE2E() {
  console.log('--- STARTING E2E ATTENDANCE STATUS TEST ---');
  const empId = 3; // Using Employee #3 to ensure a fresh record
  const todayStr = getAppBusinessDate();

  console.log(`[0] Validating Business Date Tooling...`);
  console.log(`    Timezone String: ${todayStr}`);

  try {
    // 1. Clear any existing record to start fresh
    await db.query('DELETE FROM attendance WHERE employee_id = $1 AND date = $2', [empId, todayStr]);

    // 2. Initial Get Status (Before Check In)
    const initial = await attendanceService.getMyStatus(empId);
    console.log(`[1] Before Check-In (API response):`);
    console.log(`    Record payload exists: ${!!initial.record}`);
    
    // 3. Punch In
    console.log(`[2] Executing Punch-In...`);
    const punchInRes = await attendanceService.punchIn(empId, 12.9716, 77.5946, 'GENERAL');
    console.log(`✅ Clock In Successful! (Status: ${punchInRes.record.status})`);

    // 4. Refresh Simulation (Checking getMyStatus again)
    const afterIn = await attendanceService.getMyStatus(empId);
    console.log(`[3] After Check-In Refresh:`);
    console.log(`    Punch In Time: ${afterIn.record.punch_in}`);
    console.log(`    Punch Out Time: ${afterIn.record.punch_out || 'null (Correct)'}`);
    console.log(`    isClockedIn logic equivalent: ${!!(afterIn.record && afterIn.record.punch_in && !afterIn.record.punch_out)}`);

    // 5. Punch Out
    console.log(`[4] Executing Punch-Out...`);
    const punchOutRes = await attendanceService.punchOut(empId, 12.9716, 77.5946);
    console.log(`✅ Clock Out Successful! (Work Hours: ${punchOutRes.record.work_hours}, Final Status: ${punchOutRes.record.status})`);

    // 6. History / Analytics Logic Check
    const history = await attendanceService.getHistory(empId);
    console.log(`[5] Attendance History:`);
    console.log(`    Found ${history.length} total records.`);
    console.log(`    Top record date: ${history[0].date}`);
    console.log(`    Top record status: ${history[0].status}`);

    console.log('\n--- E2E ATTENDANCE TEST PASSED ---');
    process.exit(0);

  } catch (err: any) {
    console.error('\n❌ E2E TEST FAILED:', err.message || err);
    process.exit(1);
  }
}

runE2E();
