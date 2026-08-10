import db from './src/backend/database/db.js';
import { dashboardRepository } from './src/backend/repositories/dashboardRepository.js';
import { getAppBusinessDate } from './src/backend/utils/dateUtils.js';

async function testStandupStage8() {
  console.log('================================================================');
  console.log('--- TESTING STAGE 8 DAILY STANDUP WORK REPORT INTEGRATION ---');
  console.log('================================================================\n');

  try {
    const empId = 1;
    const todayStr = getAppBusinessDate();
    console.log(`[1] Business Date: ${todayStr}, Employee ID: ${empId}`);

    // Step 1: Initial Dashboard Metrics
    const initialMetrics = await dashboardRepository.getMetrics();
    console.log(`[2] Initial Today's Standups on Dashboard: ${initialMetrics.todayStandups}`);

    // Clean up any existing standup for today for employee 1 to ensure clean test run
    await db.query('DELETE FROM daily_standups WHERE employee_id = $1 AND standup_date = $2', [empId, todayStr]);

    // Step 2: Submit Daily Standup
    console.log(`\n[3] Submitting Daily Standup for Employee #${empId}...`);
    const stdRes = await db.query(
      `INSERT INTO daily_standups (employee_id, standup_date, yesterday_work, today_plan, blockers)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        empId,
        todayStr,
        'Completed Stage 7 Asset Management PostgreSQL Integration',
        'Finalize Stage 8 Daily Standup Work Report Workflows',
        'None - all database queries passing'
      ]
    );
    const standup = stdRes.rows[0];
    console.log(`✅ Daily Standup Saved in PostgreSQL (ID: ${standup.id}, Date: ${standup.standup_date})`);

    // Step 3: Verify Dashboard Metric Incremented
    const postSubmitMetrics = await dashboardRepository.getMetrics();
    console.log(`   Post-Submission Dashboard Today's Standups Count: ${postSubmitMetrics.todayStandups}`);
    if (postSubmitMetrics.todayStandups < 1) {
      throw new Error(`Expected todayStandups metric to be >= 1, got ${postSubmitMetrics.todayStandups}`);
    }
    console.log(`✅ Dashboard metric accurately updated from PostgreSQL query!`);

    // Step 4: Verify Personal History Query
    console.log(`\n[4] Querying Personal Standup History for Employee #${empId}...`);
    const myHistory = await db.query(
      `SELECT * FROM daily_standups WHERE employee_id = $1 ORDER BY standup_date DESC`,
      [empId]
    );
    const foundMyRecord = myHistory.rows.find((r: any) => r.id === standup.id);
    if (!foundMyRecord) throw new Error('Submitted standup missing from personal history query!');
    console.log(`✅ Personal Standup Record Verified in History: "${foundMyRecord.today_plan}"`);

    // Step 5: Verify Team History Query for Managers
    console.log(`\n[5] Querying Team Standup History for Managers...`);
    const teamHistory = await db.query(
      `SELECT ds.*, e.first_name, e.last_name, e.designation, d.name as department_name
       FROM daily_standups ds
       JOIN employees e ON ds.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE ds.standup_date = $1
       ORDER BY ds.created_at DESC`,
      [todayStr]
    );
    const foundTeamRecord = teamHistory.rows.find((r: any) => r.id === standup.id);
    if (!foundTeamRecord) throw new Error('Submitted standup missing from team history query!');
    console.log(`✅ Team Standup Record Verified: ${foundTeamRecord.first_name} ${foundTeamRecord.last_name} (${foundTeamRecord.designation})`);

    // Step 6: Cleanup Test Record
    console.log(`\n[6] Cleaning up Stage 8 test standup record...`);
    await db.query('DELETE FROM daily_standups WHERE id = $1', [standup.id]);
    console.log(`✅ Stage 8 test record cleaned up`);

    console.log('\n================================================================');
    console.log('✅ ALL STAGE 8 DAILY STANDUP TESTS PASSED!');
    console.log('================================================================\n');
    process.exit(0);

  } catch (err: any) {
    console.error('\n❌ STAGE 8 TEST FAILED:', err.message || err);
    process.exit(1);
  }
}

testStandupStage8();
