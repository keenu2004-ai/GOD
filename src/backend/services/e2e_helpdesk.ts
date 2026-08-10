import { helpdeskService } from './helpdeskService.js';
import db from '../database/db.js';

async function runE2E() {
  try {
    console.log('--- STARTING E2E HELPDESK TEST ---');

    // Find a valid employee ID to act as requester/actor
    const empRes = await db.query('SELECT id FROM employees LIMIT 2');
    if (empRes.rows.length === 0) throw new Error('No employees found to test with.');
    const actorId = empRes.rows[0].id;
    const assigneeId = empRes.rows.length > 1 ? empRes.rows[1].id : actorId;
    console.log(`Using Employee ID ${actorId} as requester, ${assigneeId} as assignee.`);

    console.log('\n[1] Creating Ticket...');
    const ticket = await helpdeskService.createTicket({
      requester_id: actorId,
      category: 'SOFTWARE',
      type: 'IT',
      subject: 'E2E Test Ticket',
      description: 'System login is failing.',
      priority: 'HIGH'
    }, actorId);
    console.log('✅ Ticket Created:', ticket.ticket_code);

    console.log('\n[2] Getting Tickets...');
    const allTickets = await helpdeskService.getAllTickets('EMPLOYEE', actorId);
    console.log(`✅ Retrieved ${allTickets.length} tickets for user.`);

    console.log('\n[3] Assigning Ticket...');
    const assignedTicket = await helpdeskService.assignTicket(ticket.id, assigneeId, actorId);
    console.log(`✅ Ticket assigned to employee #${assignedTicket.assigned_to}`);

    console.log('\n[4] Adding Comment...');
    const comment = await helpdeskService.addComment(ticket.id, actorId, 'This is an E2E test comment.', false);
    console.log('✅ Comment Added:', comment.id);

    console.log('\n[5] Changing Status to RESOLVED...');
    const resolved = await helpdeskService.updateStatus(ticket.id, 'RESOLVED', actorId);
    console.log('✅ Status updated:', resolved.status, 'Resolved at:', resolved.resolved_at);

    console.log('\n[6] Verifying History...');
    const historyRes = await db.query('SELECT action FROM helpdesk_ticket_history WHERE ticket_id = $1 ORDER BY created_at ASC', [ticket.id]);
    const actions = historyRes.rows.map((r: any) => r.action);
    console.log('✅ History logged:', actions.join(' -> '));

    console.log('\n--- E2E HELPDESK TEST PASSED ---');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ E2E TEST FAILED:', err);
    process.exit(1);
  }
}

runE2E();
