import db from './db.js';
import fs from 'fs';

async function writeAuditMarkdown() {
  try {
    const tablesRes = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const tables = tablesRes.rows.map(r => r.table_name);
    let md = `# DATABASE AUDIT\n\nGenerated: ${new Date().toISOString()}\n\n`;

    for (const table of tables) {
      const colsRes = await db.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position;
      `, [table]);

      const pkRes = await db.query(`
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = $1 AND tc.constraint_type = 'PRIMARY KEY';
      `, [table]);

      const fkRes = await db.query(`
        SELECT
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = $1;
      `, [table]);

      const countRes = await db.query(`SELECT COUNT(*) as count FROM "${table}"`);

      md += `## Table: \`${table}\`\n\n`;
      md += `- **Row Count**: ${countRes.rows[0].count}\n`;
      md += `- **Primary Key**: ${pkRes.rows.map(r => r.column_name).join(', ') || 'None'}\n`;
      if (fkRes.rows.length > 0) {
        md += `- **Foreign Keys**:\n`;
        fkRes.rows.forEach(fk => {
          md += `  - \`${fk.column_name}\` -> \`${fk.foreign_table_name}.${fk.foreign_column_name}\`\n`;
        });
      } else {
        md += `- **Foreign Keys**: None\n`;
      }
      md += `\n| Column | Data Type | Nullable | Default |\n|---|---|---|---|\n`;
      colsRes.rows.forEach(c => {
        md += `| \`${c.column_name}\` | \`${c.data_type}\` | ${c.is_nullable} | \`${c.column_default || ''}\` |\n`;
      });
      md += `\n---\n\n`;
    }

    fs.writeFileSync('./DATABASE_AUDIT.md', md);
    console.log('Successfully wrote DATABASE_AUDIT.md');
    process.exit(0);
  } catch (err) {
    console.error('Audit failed:', err);
    process.exit(1);
  }
}

writeAuditMarkdown();
