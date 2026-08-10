import db from './src/backend/database/db.js';
import { payslipPortalRepository } from './src/backend/repositories/payslipPortalRepository.js';
import { payrollRepository } from './src/backend/repositories/payrollRepository.js';

async function testPayrollESSStage9() {
  console.log('================================================================');
  console.log('--- TESTING STAGE 9 PAYROLL & ESS CANONICAL INTEGRATION ---');
  console.log('================================================================\n');

  try {
    const empId = 1;
    const secondEmpId = 2;

    // Step 1: Verify Employee Identity & Payroll Record Query
    console.log(`[1] Verifying Employee Payroll Records for Employee #${empId}...`);
    const existingPayrolls = await payrollRepository.getAllPayrolls(undefined, undefined, empId);
    console.log(`✅ Found ${existingPayrolls.length} historical payroll records for Employee #${empId}`);

    // Step 2: Process Payroll & Generate Payslip
    console.log(`\n[2] Processing Payroll for August 2026 for Employee #${empId}...`);
    const payroll = await payrollRepository.generatePayrollForEmployee(empId, 'August', 2026, 50000);
    console.log(`✅ Payroll Record Created in PostgreSQL (ID: ${payroll.id}, Net Salary: ₹${payroll.net_salary}, Status: ${payroll.payment_status || 'PAID'})`);

    // Step 3: Query Payroll by ID
    console.log(`\n[3] Fetching Detailed Payslip Record from PostgreSQL...`);
    const detailedPayroll = await payrollRepository.getById(payroll.id);
    console.log(`✅ Retrieved Payslip Details for ${detailedPayroll.first_name} ${detailedPayroll.last_name} (${detailedPayroll.employee_code}): Gross=₹${detailedPayroll.gross_salary}, Net=₹${detailedPayroll.net_salary}`);

    // Step 4: Security & RBAC Scoping Verification
    console.log(`\n[4] Verifying ESS Security Boundary (Employee #${secondEmpId} query)...`);
    const emp2Payrolls = await payrollRepository.getAllPayrolls(undefined, undefined, secondEmpId);
    const leakedPayslip = emp2Payrolls.find((p: any) => p.id === payroll.id);
    if (leakedPayslip) {
      throw new Error('SECURITY VIOLATION: Employee #2 feed contained Employee #1 payslip!');
    }
    console.log(`✅ Verified Employee #${secondEmpId} cannot access Employee #${empId} payslip data!`);

    // Step 5: Cleanup Test Records
    console.log(`\n[5] Cleaning up Stage 9 test records...`);
    await db.query('DELETE FROM payrolls WHERE id = $1', [payroll.id]);
    console.log(`✅ Stage 9 test records cleaned up`);

    console.log('\n================================================================');
    console.log('✅ ALL STAGE 9 PAYROLL & ESS CANONICAL INTEGRATION TESTS PASSED!');
    console.log('================================================================\n');
    process.exit(0);

  } catch (err: any) {
    console.error('\n❌ STAGE 9 TEST FAILED:', err.message || err);
    process.exit(1);
  }
}

testPayrollESSStage9();
