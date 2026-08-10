import db from './db.js';

async function align() {
  try {
    await db.query(`ALTER TABLE helpdesk_tickets ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'IT'`);
    await db.query(`ALTER TABLE helpdesk_tickets ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP`);
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS helpdesk_ticket_history (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER NOT NULL REFERENCES helpdesk_tickets(id) ON DELETE CASCADE,
        actor_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL,
        old_value TEXT,
        new_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const res = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    const tables = res.rows.map((r: any) => r.table_name);
    console.log('Exists helpdesk_tickets:', tables.includes('helpdesk_tickets'));
    console.log('Exists ticket_comments:', tables.includes('ticket_comments'));
    console.log('Exists helpdesk_ticket_history:', tables.includes('helpdesk_ticket_history'));
    console.log('Exists daily_standups:', tables.includes('daily_standups'));
    console.log('Exists salary_certificates:', tables.includes('salary_certificates'));

    console.log('Successfully aligned DB schemas.');
    process.exit(0);
  } catch (e) {
    console.error('Error during alignment:', e);
    process.exit(1);
  }
}
align();
