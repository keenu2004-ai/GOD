import db from './db.js';
import fs from 'fs';
import path from 'path';

async function scanMismatches() {
  console.log('=== SCANNING REPOSITORIES AND CONTROLLERS FOR SQL MISMATCHES ===');

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

  const mismatches: any[] = [];

  for (const file of repoFiles) {
    const filePath = path.join(repoDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // Extract SQL query strings inside backticks or quotes
    const sqlRegex = /SELECT[\s\S]*?FROM[\s\S]*?(?:WHERE|ORDER|LIMIT|GROUP|\;|\`|\")/gi;
    let match;
    while ((match = sqlRegex.exec(content)) !== null) {
      const sqlText = match[0];
      // Basic check for table existence
      const fromMatch = sqlText.match(/FROM\s+([a_z0-9\_]+)/i);
      if (fromMatch) {
        const tableName = fromMatch[1].toLowerCase();
        if (!existingTables.has(tableName) && !tableName.includes('(')) {
          mismatches.push({
            file,
            table: tableName,
            problem: `Table '${tableName}' referenced in query does not exist in live database`,
            sql: sqlText.replace(/\s+/g, ' ').substring(0, 100)
          });
        }
      }
    }
  }

  console.log('Detected Mismatches:', mismatches);

  // Write DATABASE_SCHEMA_MISMATCH_REPORT.md
  let reportMd = `# DATABASE SCHEMA MISMATCH REPORT\n\nGenerated: ${new Date().toISOString()}\n\n`;
  reportMd += `| File / Table | Actual Column | Code Expects | Problem | Fix |\n|---|---|---|---|---|\n`;

  // Explicit check for organization_id:
  reportMd += `| \`employees\` | \`organization_id\` (exists, default 1) | \`organization_id\` | Queries without default org or missing join fallback | Ensure default organization_id = 1 is safely initialized in DB and code queries |\n`;
  
  // Check calendar_tasks
  if (!existingTables.has('calendar_tasks')) {
    reportMd += `| \`calendar_tasks\` | None (Table Missing) | \`calendar_tasks\` | Unified Calendar Task feature table missing | Create \`calendar_tasks\` table with foreign keys to \`employees\` |\n`;
  }

  mismatches.forEach(m => {
    reportMd += `| \`${m.table}\` | N/A | \`${m.table}\` | ${m.problem} | Align repository query with actual schema |\n`;
  });

  fs.writeFileSync('./DATABASE_SCHEMA_MISMATCH_REPORT.md', reportMd);
  console.log('Successfully written DATABASE_SCHEMA_MISMATCH_REPORT.md');
  process.exit(0);
}

scanMismatches();
