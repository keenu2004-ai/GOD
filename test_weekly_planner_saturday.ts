import db from './src/backend/database/db.js';
import { weeklyPlannerService } from './src/backend/services/weeklyPlannerService.js';

async function testWeeklyPlannerSaturday() {
  console.log('================================================================');
  console.log('--- TESTING WEEKLY PLANNER SATURDAY INTEGRATION & CALCULATIONS ---');
  console.log('================================================================\n');

  try {
    // Step 1: Add a Saturday task item via WeeklyPlannerService
    console.log('[1] Adding Saturday task item to Weekly Planner...');
    const satTask = await weeklyPlannerService.addWeeklyTaskItem({
      employee_id: 1,
      week_number: 32,
      year: 2026,
      day_of_week: 'SATURDAY',
      task_name: 'Saturday Database Optimization & Security Audit',
      planned_hours: 6.0,
    }, 1);

    console.log(`✅ Saturday task created in PostgreSQL (Item ID: ${satTask.id}, Day: ${satTask.day_of_week}, Hours: ${satTask.planned_hours})`);

    // Step 2: Fetch Weekly Plan details and verify Saturday inclusion
    console.log('\n[2] Fetching plan details for Week 32, 2026...');
    const details = await weeklyPlannerService.getPlanDetails(1, 32, 2026);
    const satItems = details.items.filter((i: any) => i.day_of_week === 'SATURDAY');

    if (satItems.length === 0) {
      throw new Error('Saturday task missing from plan details output');
    }
    console.log(`✅ Saturday task retrieved successfully from PostgreSQL feed (${satItems.length} Saturday items found)`);

    // Step 3: Verify Team Workload & Capacity Calculations include Saturday
    console.log('\n[3] Verifying Team Workload & Capacity calculations include Saturday...');
    const capacity = await weeklyPlannerService.getTeamCapacityPlan(undefined, 32, 2026);
    const emp1Cap = capacity.find((c: any) => c.employee_id === 1);
    if (!emp1Cap || parseFloat(emp1Cap.total_planned_hours) < 6.0) {
      throw new Error('Saturday planned hours missing from total workload calculation');
    }
    console.log(`✅ Team Capacity calculation includes Saturday: ${emp1Cap.total_planned_hours} total planned hours for Employee #1`);

    // Step 4: Verify CSV Export includes Saturday
    console.log('\n[4] Verifying CSV Export contains Saturday tasks...');
    const csvExport = await weeklyPlannerService.exportScheduleCSV(32, 2026);
    if (!csvExport.content.includes('SATURDAY') || !csvExport.content.includes('Saturday Database Optimization')) {
      throw new Error('Saturday tasks missing from CSV export payload');
    }
    console.log(`✅ CSV Export contains Saturday records: filename="${csvExport.filename}"`);

    // Step 5: Clean up test record
    console.log('\n[5] Cleaning up Saturday test task...');
    await db.query('DELETE FROM weekly_plan_items WHERE id = $1', [satTask.id]);
    console.log('✅ Cleanup completed cleanly.');

    console.log('\n================================================================');
    console.log('✅ ALL WEEKLY PLANNER SATURDAY INTEGRATION TESTS PASSED PERFECTLY!');
    console.log('================================================================\n');
    process.exit(0);

  } catch (err: any) {
    console.error('\n❌ WEEKLY PLANNER SATURDAY TEST FAILED:', err.message || err);
    process.exit(1);
  }
}

testWeeklyPlannerSaturday();
