import {
  expensePolicyRepository, CreateBudgetDTO
} from '../repositories/expensePolicyRepository.js';

export class ExpensePolicyService {
  async evaluateExpenseRisk(expenseId: number, amount: number, merchantName: string | undefined, date: string) {
    return expensePolicyRepository.evaluateExpenseRisk(expenseId, amount, merchantName, date);
  }

  async getRiskFlags() {
    return expensePolicyRepository.getRiskFlags();
  }

  async clearRiskFlag(flagId: number, reviewerId: number) {
    return expensePolicyRepository.clearRiskFlag(flagId, reviewerId);
  }

  async createExpenseBudget(dto: CreateBudgetDTO) {
    return expensePolicyRepository.createExpenseBudget(dto);
  }

  async getExpenseBudgets() {
    return expensePolicyRepository.getExpenseBudgets();
  }

  async reconcilePayment(expenseId: number, approvedAmount: number, paidAmount: number, paymentRef: string, reviewerId: number) {
    return expensePolicyRepository.reconcilePayment(expenseId, approvedAmount, paidAmount, paymentRef, reviewerId);
  }

  async getReconciliations() {
    return expensePolicyRepository.getReconciliations();
  }

  async lockPeriod(periodName: string, lockBy: number) {
    return expensePolicyRepository.lockPeriod(periodName, lockBy);
  }

  async getPeriodLocks() {
    return expensePolicyRepository.getPeriodLocks();
  }
}

export const expensePolicyService = new ExpensePolicyService();
