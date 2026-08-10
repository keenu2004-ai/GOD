import db from './db.js';

async function verify() {
  try {
    const res = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    const tables = res.rows.map((r: any) => r.table_name);
    console.log('Exists helpdesk_tickets:', tables.includes('helpdesk_tickets'));
    console.log('Exists helpdesk_ticket_comments:', tables.includes('helpdesk_ticket_comments'));
    console.log('Exists helpdesk_ticket_history:', tables.includes('helpdesk_ticket_history'));
    console.log('Exists daily_standups:', tables.includes('daily_standups'));
    console.log('Exists salary_certificates:', tables.includes('salary_certificates'));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

verify();
