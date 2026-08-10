import db from './db.js';

async function check() {
  try {
    const res = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'ticket_comments'");
    console.log(res.rows.map((r: any) => r.column_name));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
