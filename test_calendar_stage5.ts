import db from './src/backend/database/db.js';
import { calendarService } from './src/backend/services/calendarService.js';
import { getAppBusinessDate } from './src/backend/utils/dateUtils.js';

async function testCalendarStage5() {
  console.log('================================================================');
  console.log('--- TESTING STAGE 5 REAL UNIFIED CALENDAR AGGREGATION ---');
  console.log('================================================================\n');

  try {
    const todayStr = getAppBusinessDate();
    const empId = 1;
    console.log(`[1] Business Date: ${todayStr}, Target Employee ID: ${empId}`);

    // Step A: Seed temporary source records
    console.log(`\n[2] Seeding Source Events across PostgreSQL tables...`);

    // 1. Holiday
    const holRes = await db.query(
      `INSERT INTO holidays (name, date, description, type) VALUES ($1, $2, $3, $4) RETURNING id`,
      ['Stage 5 Founder Day', todayStr, 'Annual Company Founders Holiday', 'NATIONAL']
    );
    const holidayId = holRes.rows[0].id;
    console.log(`✅ Seeded Holiday in DB (ID: ${holidayId})`);

    // 2. Announcement
    const annRes = await db.query(
      `INSERT INTO announcements (title, content) VALUES ($1, $2) RETURNING id`,
      ['Stage 5 System Upgrade Notice', 'Scheduled database maintenance window']
    );
    const annId = annRes.rows[0].id;
    console.log(`✅ Seeded Announcement in DB (ID: ${annId})`);

    // 3. Calendar Task CRUD
    console.log(`\n[3] Testing Calendar Task CRUD (POST /calendar/tasks)...`);
    const task = await calendarService.createTask({
      title: 'Stage 5 Architecture Review',
      description: 'Review database indexes and query optimization',
      task_date: todayStr,
      start_time: '11:00',
      end_time: '12:00',
      priority: 'HIGH',
      status: 'PENDING',
      assigned_to: empId,
      created_by: empId,
      location: 'Conference Room Alpha'
    });
    console.log(`✅ Created Calendar Task in PostgreSQL (ID: ${task.id}, Status: ${task.status})`);

    // Step B: Query Normalized Unified Feed
    console.log(`\n[4] Querying Unified Calendar Aggregation Feed (GET /calendar/events)...`);
    const feed = await calendarService.getUnifiedEvents(todayStr, todayStr, empId);
    console.log(`✅ Aggregated ${feed.length} Normalized Events for ${todayStr}:`);
    feed.forEach(e => {
      console.log(`   - [${e.type}] ${e.title} (Source ID: ${e.sourceId}, Status: ${e.status})`);
    });

    // Verify all event types present
    const foundHoliday = feed.find(e => e.type === 'HOLIDAY' && e.sourceId === holidayId);
    const foundAnnouncement = feed.find(e => e.type === 'ANNOUNCEMENT' && e.sourceId === annId);
    const foundTask = feed.find(e => e.type === 'TASK' && e.sourceId === task.id);

    if (!foundHoliday) throw new Error('Seeded Holiday missing from Unified Calendar feed!');
    if (!foundAnnouncement) throw new Error('Seeded Announcement missing from Unified Calendar feed!');
    if (!foundTask) throw new Error('Created Calendar Task missing from Unified Calendar feed!');

    console.log(`✅ All source events successfully normalized and projected onto Calendar!`);

    // Step C: Update Task Status
    console.log(`\n[5] Updating Calendar Task Status -> COMPLETED (PATCH /calendar/tasks/${task.id})...`);
    const updatedTask = await calendarService.updateTask(task.id, { status: 'COMPLETED' });
    console.log(`✅ Task Status Updated in PostgreSQL: ${updatedTask.status}`);
    if (updatedTask.status !== 'COMPLETED') {
      throw new Error(`Expected status COMPLETED, got ${updatedTask.status}`);
    }

    // Step D: Delete Task & Cleanup
    console.log(`\n[6] Cleaning up test records (DELETE /calendar/tasks/${task.id})...`);
    await calendarService.deleteTask(task.id);
    await db.query('DELETE FROM holidays WHERE id = $1', [holidayId]);
    await db.query('DELETE FROM announcements WHERE id = $1', [annId]);
    console.log(`✅ Test records cleaned up successfully`);

    console.log('\n================================================================');
    console.log('✅ ALL STAGE 5 UNIFIED CALENDAR TESTS PASSED!');
    console.log('================================================================\n');
    process.exit(0);

  } catch (err: any) {
    console.error('\n❌ STAGE 5 TEST FAILED:', err.message || err);
    process.exit(1);
  }
}

testCalendarStage5();
