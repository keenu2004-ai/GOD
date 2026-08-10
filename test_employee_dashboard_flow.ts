import db from './src/backend/database/db.js';
import { employeeManagementRepository } from './src/backend/repositories/employeeManagementRepository.js';
import { dashboardRepository } from './src/backend/repositories/dashboardRepository.js';

async function runEmployeeDashboardTest() {
  console.log('================================================================');
  console.log('--- TESTING DATABASE-CONNECTED EMPLOYEE & DASHBOARD FLOW ---');
  console.log('================================================================\n');

  try {
    // Step 1: Initial Count Audit
    const initialMetrics = await dashboardRepository.getMetrics();
    const initialCount = initialMetrics.totalEmployees;
    console.log(`[Step 1] Initial Active Employee Count in PostgreSQL: ${initialCount}`);

    // Step 2: Create Employee A
    console.log(`\n[Step 2] Creating Employee A via dbService.transaction...`);
    const empA = await employeeManagementRepository.createEmployee({
      first_name: 'TestEmpFlowA',
      last_name: 'DatabaseTest',
      email: `emp_flow_a_${Date.now()}@theiakshi.com`,
      phone: '9900112233',
      designation: 'QA Automation Engineer',
      joining_date: '2026-08-01',
      role: 'EMPLOYEE'
    }, 1);
    console.log(`✅ Created Employee A (ID: ${empA.id}, Code: ${empA.employee_code})`);

    const postEmpAMetrics = await dashboardRepository.getMetrics();
    console.log(`   Post-Employee A Count: ${postEmpAMetrics.totalEmployees}`);
    if (postEmpAMetrics.totalEmployees !== initialCount + 1) {
      throw new Error(`Expected count ${initialCount + 1}, got ${postEmpAMetrics.totalEmployees}`);
    }

    // Step 3: Create Employee B
    console.log(`\n[Step 3] Creating Employee B via dbService.transaction...`);
    const empB = await employeeManagementRepository.createEmployee({
      first_name: 'TestEmpFlowB',
      last_name: 'DatabaseTest',
      email: `emp_flow_b_${Date.now()}@theiakshi.com`,
      phone: '9900112234',
      designation: 'DevOps Specialist',
      joining_date: '2026-08-01',
      role: 'EMPLOYEE'
    }, 1);
    console.log(`✅ Created Employee B (ID: ${empB.id}, Code: ${empB.employee_code})`);

    const postEmpBMetrics = await dashboardRepository.getMetrics();
    console.log(`   Post-Employee B Count: ${postEmpBMetrics.totalEmployees}`);
    if (postEmpBMetrics.totalEmployees !== initialCount + 2) {
      throw new Error(`Expected count ${initialCount + 2}, got ${postEmpBMetrics.totalEmployees}`);
    }

    // Step 4: Verify Directory Query contains new employees
    console.log(`\n[Step 4] Querying Employee Directory list from PostgreSQL...`);
    const allEmps = await employeeManagementRepository.getEmployees();
    const foundA = allEmps.find((e: any) => e.id === empA.id);
    const foundB = allEmps.find((e: any) => e.id === empB.id);

    if (!foundA || !foundB) {
      throw new Error('Newly created employees were not returned in getEmployees() query!');
    }
    console.log(`✅ Verified both Employee A & B are present in Employee Directory query.`);

    // Step 5: Deactivation / Status Respect Verification
    console.log(`\n[Step 5] Deactivating Employee B (status = 'INACTIVE')...`);
    await db.query(`UPDATE employees SET status = 'INACTIVE' WHERE id = $1`, [empB.id]);

    const postDeactMetrics = await dashboardRepository.getMetrics();
    console.log(`   Post-Deactivation Active Employee Count: ${postDeactMetrics.totalEmployees}`);
    if (postDeactMetrics.totalEmployees !== initialCount + 1) {
      throw new Error(`Expected count to decrease to ${initialCount + 1}, got ${postDeactMetrics.totalEmployees}`);
    }
    console.log(`✅ Active count correctly excludes INACTIVE status employees.`);

    // Step 6: Reactivate and Cleanup
    console.log(`\n[Step 6] Cleaning up test records...`);
    await db.query(`DELETE FROM employee_onboarding_checklists WHERE employee_id IN ($1, $2)`, [empA.id, empB.id]);
    await db.query(`DELETE FROM audit_logs WHERE employee_id IN ($1, $2)`, [empA.id, empB.id]);
    await db.query(`DELETE FROM employees WHERE id IN ($1, $2)`, [empA.id, empB.id]);

    const finalMetrics = await dashboardRepository.getMetrics();
    console.log(`   Final Employee Count after cleanup: ${finalMetrics.totalEmployees}`);
    if (finalMetrics.totalEmployees !== initialCount) {
      throw new Error(`Count did not restore to initial ${initialCount}`);
    }

    console.log('\n================================================================');
    console.log('✅ DATABASE-CONNECTED EMPLOYEE & DASHBOARD FLOW TEST PASSED!');
    console.log('================================================================\n');
    process.exit(0);

  } catch (err: any) {
    console.error('\n❌ TEST FAILED:', err.message || err);
    process.exit(1);
  }
}

runEmployeeDashboardTest();
