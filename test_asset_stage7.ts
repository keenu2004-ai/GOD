import db from './src/backend/database/db.js';
import { dashboardRepository } from './src/backend/repositories/dashboardRepository.js';

async function testAssetStage7() {
  console.log('================================================================');
  console.log('--- TESTING STAGE 7 ASSET MANAGEMENT DATABASE CONNECTIVITY ---');
  console.log('================================================================\n');

  try {
    const empId = 1;
    
    // Step 1: Initial Dashboard Metrics
    const initialMetrics = await dashboardRepository.getMetrics();
    console.log(`[1] Initial Allocated Assets on Dashboard: ${initialMetrics.activeAssets}`);

    // Step 2: Create Asset in PostgreSQL
    console.log(`\n[2] Creating New IT Asset in PostgreSQL...`);
    const assetCode = `AST-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const astRes = await db.query(
      `INSERT INTO assets (asset_code, asset_name, category, serial_number, status, purchase_date, value)
       VALUES ($1, $2, $3, $4, 'AVAILABLE', CURRENT_DATE, $5) RETURNING *`,
      [assetCode, 'Stage 7 MacBook Pro M3', 'LAPTOP', `SN-${Date.now()}`, 150000.00]
    );
    const asset = astRes.rows[0];
    console.log(`✅ Asset Created in PostgreSQL (ID: ${asset.id}, Code: ${asset.asset_code}, Status: ${asset.status})`);

    // Step 3: Assign Asset to Canonical Employee
    console.log(`\n[3] Assigning Asset #${asset.id} to Employee #${empId}...`);
    await db.query(
      `UPDATE assets SET assigned_to_employee_id = $1, status = 'ALLOCATED' WHERE id = $2`,
      [empId, asset.id]
    );

    // Verify Dashboard Active Assets Metric Incremented
    const postAllocMetrics = await dashboardRepository.getMetrics();
    console.log(`   Post-Allocation Dashboard Active Assets Count: ${postAllocMetrics.activeAssets}`);
    if (postAllocMetrics.activeAssets !== initialMetrics.activeAssets + 1) {
      throw new Error(`Expected allocated count ${initialMetrics.activeAssets + 1}, got ${postAllocMetrics.activeAssets}`);
    }
    console.log(`✅ Dashboard metric accurately incremented from PostgreSQL query!`);

    // Step 4: Asset Request Flow
    console.log(`\n[4] Creating Asset Request for Employee #${empId}...`);
    const reqNum = `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const reqRes = await db.query(
      `INSERT INTO asset_requests (request_number, employee_id, category, reason, priority, status)
       VALUES ($1, $2, $3, $4, $5, 'SUBMITTED') RETURNING *`,
      [reqNum, empId, 'MONITOR', 'Need secondary 4K display for code review', 'HIGH']
    );
    const request = reqRes.rows[0];
    console.log(`✅ Asset Request Created in PostgreSQL (Request ID: ${request.id}, Code: ${request.request_number}, Status: ${request.status})`);

    // Step 5: Approve Asset Request
    console.log(`\n[5] Approving Asset Request (ID: ${request.id})...`);
    await db.query(
      `UPDATE asset_requests SET status = 'APPROVED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [request.id]
    );
    const checkReq = await db.query('SELECT * FROM asset_requests WHERE id = $1', [request.id]);
    console.log(`✅ Asset Request Status Updated in PostgreSQL: ${checkReq.rows[0].status}`);

    // Step 6: Cleanup Test Records
    console.log(`\n[6] Cleaning up Stage 7 test records...`);
    await db.query('DELETE FROM asset_requests WHERE id = $1', [request.id]);
    await db.query('DELETE FROM assets WHERE id = $1', [asset.id]);
    console.log(`✅ Stage 7 test records cleaned up`);

    console.log('\n================================================================');
    console.log('✅ ALL STAGE 7 ASSET MANAGEMENT TESTS PASSED!');
    console.log('================================================================\n');
    process.exit(0);

  } catch (err: any) {
    console.error('\n❌ STAGE 7 TEST FAILED:', err.message || err);
    process.exit(1);
  }
}

testAssetStage7();
