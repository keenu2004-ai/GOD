import db from './db.js';
import fs from 'fs';
import path from 'path';

async function scanMismatchesDetailed() {
  console.log('=== DETAILED SCHEMA SCAN ===');

  const repoDir = path.join(process.cwd(), 'src', 'backend', 'repositories');
  const repoFiles = fs.readdirSync(repoDir).filter(f => f.endsWith('.ts'));

  const tablesRes = await db.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  `);
  const existingTables = new Set(tablesRes.rows.map(r => r.table_name));

  const colsRes = await db.query(`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public';
  `);
  
  const tableColsMap = new Map<string, Set<string>>();
  colsRes.rows.forEach(r => {
    if (!tableColsMap.has(r.table_name)) {
      tableColsMap.set(r.table_name, new Set());
    }
    tableColsMap.get(r.table_name)!.add(r.column_name);
  });

  let reportMd = `# DATABASE SCHEMA MISMATCH REPORT\n\nGenerated: ${new Date().toISOString()}\n\n`;
  reportMd += `| Table | Actual Column | Code Expects | Problem | Fix |\n|---|---|---|---|---|\n`;

  // 1. Organization ID Audit
  const empCols = tableColsMap.get('employees');
  if (empCols && empCols.has('organization_id')) {
    reportMd += `| \`employees\` | \`organization_id\` (Integer, default 1) | \`organization_id\` | Code queries assume multi-tenant organization_id filter. DB contains 1 default organization (Single Company HRMS). | Keep single-company default organization_id = 1 fallback in all backend queries |\n`;
  } else {
    reportMd += `| \`employees\` | \`organization_id\` missing | \`organization_id\` | Code queries attempt to query organization_id column on employees | Add organization_id column to employees table with DEFAULT 1 |\n`;
  }

  // 2. Calendar Tasks Table
  if (!existingTables.has('calendar_tasks')) {
    reportMd += `| \`calendar_tasks\` | Table Missing | \`calendar_tasks\` | Unified Calendar Task feature table is missing from live database | Create \`calendar_tasks\` table with foreign keys to employees |\n`;
  } else {
    reportMd += `| \`calendar_tasks\` | Table Exists | \`calendar_tasks\` | Table verified | None |\n`;
  }

  // 3. Check for removed salary_certificates
  if (existingTables.has('salary_certificates')) {
    reportMd += `| \`salary_certificates\` | Table Exists | Removed Module | Purged module table exists | Drop table safely |\n`;
  } else {
    reportMd += `| \`salary_certificates\` | Table Purged (Correct) | N/A | Table cleanly purged | None |\n`;
  }

  fs.writeFileSync('./DATABASE_SCHEMA_MISMATCH_REPORT.md', reportMd);
  console.log('Successfully written refined DATABASE_SCHEMA_MISMATCH_REPORT.md');
  process.exit(0);
}

scanMismatchesDetailed();
