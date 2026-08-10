import db from './src/backend/database/db.js';
import { helpdeskService } from './src/backend/services/helpdeskService.js';
import { dashboardRepository } from './src/backend/repositories/dashboardRepository.js';
import { calendarService } from './src/backend/services/calendarService.js';
import { getAppBusinessDate } from './src/backend/utils/dateUtils.js';

async function testHelpdeskStage6() {
  console.log('================================================================');
  console.log('--- TESTING STAGE 6 HELPDESK & ANNOUNCEMENTS MODULE ---');
  console.log('================================================================\n');

  try {
    const requesterId = 1;
    const assigneeId = 2;
    const todayStr = getAppBusinessDate();

    // Step 1: Initial Dashboard Open Ticket Count
    const initialMetrics = await dashboardRepository.getMetrics();
    console.log(`[1] Initial Open Helpdesk Tickets on Dashboard: ${initialMetrics.openHelpdesk}`);

    // Step 2: Create Helpdesk Ticket
    console.log(`\n[2] Creating Helpdesk Ticket (Category: IT_SUPPORT, Priority: HIGH)...`);
    const ticket = await helpdeskService.createTicket({
      subject: 'Stage 6 Workstation Display Port Issue',
      description: 'Secondary monitor flickering on HDMI connection',
      category: 'IT_SUPPORT',
      type: 'HARDWARE',
      priority: 'HIGH'
    }, requesterId);

    console.log(`✅ Helpdesk Ticket Created in PostgreSQL (ID: ${ticket.id}, Code: ${ticket.ticket_code}, Status: ${ticket.status})`);

    // Verify Dashboard Open Ticket Count Incremented
    const postCreateMetrics = await dashboardRepository.getMetrics();
    console.log(`   Post-Creation Dashboard Open Ticket Count: ${postCreateMetrics.openHelpdesk}`);
    if (postCreateMetrics.openHelpdesk !== initialMetrics.openHelpdesk + 1) {
      throw new Error(`Expected open count ${initialMetrics.openHelpdesk + 1}, got ${postCreateMetrics.openHelpdesk}`);
    }

    // Step 3: Add Ticket Comment
    console.log(`\n[3] Adding Comment to Ticket #${ticket.id}...`);
    const comment = await helpdeskService.addComment(ticket.id, requesterId, 'Replaced HDMI cable, issue persists.', false);
    console.log(`✅ Ticket Comment Recorded in PostgreSQL (Comment ID: ${comment.id})`);

    // Step 4: Assign Ticket & Notification Verification
    console.log(`\n[4] Assigning Ticket #${ticket.id} to Employee #${assigneeId}...`);
    const assignedTicket = await helpdeskService.assignTicket(ticket.id, assigneeId, requesterId);
    console.log(`✅ Ticket Assigned to Employee #${assignedTicket.assigned_to}`);

    // Verify Notification Dispatched
    const notifRes = await db.query(
      `SELECT * FROM notifications WHERE employee_id = $1 AND type = 'TICKET_ASSIGNED' ORDER BY id DESC LIMIT 1`,
      [assigneeId]
    );
    if (notifRes.rows.length === 0) {
      throw new Error('Assignment notification was not dispatched to assignee!');
    }
    console.log(`✅ Assignment Notification Verified in PostgreSQL: "${notifRes.rows[0].title}"`);

    // Step 5: Transition Status -> IN_PROGRESS
    console.log(`\n[5] Updating Ticket Status -> IN_PROGRESS...`);
    const progressTicket = await helpdeskService.updateStatus(ticket.id, 'IN_PROGRESS', assigneeId);
    console.log(`✅ Ticket Status Updated: ${progressTicket.status}`);

    // Verify Ticket History Logged
    const historyRes = await db.query(
      `SELECT * FROM helpdesk_ticket_history WHERE ticket_id = $1 AND action = 'STATUS_CHANGED' ORDER BY id DESC LIMIT 1`,
      [ticket.id]
    );
    console.log(`✅ Ticket History Logged in PostgreSQL: ${historyRes.rows[0].old_value} -> ${historyRes.rows[0].new_value}`);

    // Step 6: Resolve Ticket & Dashboard Count Deduction
    console.log(`\n[6] Resolving Ticket (Status -> RESOLVED)...`);
    const resolvedTicket = await helpdeskService.updateStatus(ticket.id, 'RESOLVED', assigneeId);
    console.log(`✅ Ticket Status Updated: ${resolvedTicket.status}`);

    const postResolveMetrics = await dashboardRepository.getMetrics();
    console.log(`   Post-Resolution Dashboard Open Ticket Count: ${postResolveMetrics.openHelpdesk}`);
    if (postResolveMetrics.openHelpdesk !== initialMetrics.openHelpdesk) {
      throw new Error(`Expected open count to return to ${initialMetrics.openHelpdesk}, got ${postResolveMetrics.openHelpdesk}`);
    }
    console.log(`✅ Dashboard Open Ticket count accurately decremented upon resolution!`);

    // Step 7: Announcements Test
    console.log(`\n[7] Testing Announcement Creation & Unified Calendar Projection...`);
    const annRes = await db.query(
      `INSERT INTO announcements (title, content) VALUES ($1, $2) RETURNING id`,
      ['Stage 6 Network Infrastructure Maintenance', 'Upgrading core switches this Sunday']
    );
    const annId = annRes.rows[0].id;
    console.log(`✅ Announcement Saved to PostgreSQL (ID: ${annId})`);

    // Verify Unified Calendar Feed includes Announcement
    const events = await calendarService.getUnifiedEvents(todayStr, todayStr);
    const annEvent = events.find(e => e.type === 'ANNOUNCEMENT' && e.sourceId === annId);
    if (!annEvent) {
      throw new Error('Announcement was not projected onto Unified Calendar feed!');
    }
    console.log(`✅ Announcement Projected onto Unified Calendar: "${annEvent.title}"`);

    // Step 8: Cleanup Test Records
    console.log(`\n[8] Cleaning up Stage 6 test records...`);
    await db.query('DELETE FROM ticket_comments WHERE ticket_id = $1', [ticket.id]);
    await db.query('DELETE FROM helpdesk_ticket_history WHERE ticket_id = $1', [ticket.id]);
    await db.query('DELETE FROM helpdesk_tickets WHERE id = $1', [ticket.id]);
    await db.query('DELETE FROM announcements WHERE id = $1', [annId]);
    console.log(`✅ Stage 6 test records cleaned up`);

    console.log('\n================================================================');
    console.log('✅ ALL STAGE 6 HELPDESK & ANNOUNCEMENT TESTS PASSED!');
    console.log('================================================================\n');
    process.exit(0);

  } catch (err: any) {
    console.error('\n❌ STAGE 6 TEST FAILED:', err.message || err);
    process.exit(1);
  }
}

testHelpdeskStage6();
