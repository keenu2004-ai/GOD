import {
  expenseManagementRepository, CreateExpenseDTO, RequestAdvanceDTO
} from '../repositories/expenseManagementRepository.js';

export class ExpenseManagementService {
  async createExpenseClaim(dto: CreateExpenseDTO, employeeId: number) {
    return expenseManagementRepository.createExpenseClaim(dto, employeeId);
  }

  async getExpenseClaims(userRole: string, employeeId: number) {
    return expenseManagementRepository.getExpenseClaims(userRole, employeeId);
  }

  async approveManager(expenseId: number, managerId: number) {
    return expenseManagementRepository.approveManager(expenseId, managerId);
  }

  async approveFinanceAndSettle(expenseId: number, reimbursedAmount: number, paymentRef: string | undefined, financeId: number) {
    return expenseManagementRepository.approveFinanceAndSettle(expenseId, reimbursedAmount, paymentRef, financeId);
  }

  async rejectExpense(expenseId: number, reason: string, reviewerId: number) {
    return expenseManagementRepository.rejectExpense(expenseId, reason, reviewerId);
  }

  async requestAdvance(dto: RequestAdvanceDTO, employeeId: number) {
    return expenseManagementRepository.requestAdvance(dto, employeeId);
  }

  async getAdvances(userRole: string, employeeId: number) {
    return expenseManagementRepository.getAdvances(userRole, employeeId);
  }

  async settleAdvance(advanceId: number, settledAmount: number, financeId: number) {
    return expenseManagementRepository.settleAdvance(advanceId, settledAmount, financeId);
  }
}

export const expenseManagementService = new ExpenseManagementService();
