import {
  salaryComponentEngineRepository,
  ComponentMasterDTO, LoanRequestDTO, AdvanceRequestDTO, BankDetailsDTO, BenefitDTO
} from '../repositories/salaryComponentEngineRepository.js';

export class SalaryComponentEngineService {
  async seedComponentMaster() {
    return salaryComponentEngineRepository.seedComponentMaster();
  }

  async getComponentMaster() {
    return salaryComponentEngineRepository.getComponentMaster();
  }

  async createCustomComponent(dto: ComponentMasterDTO, creatorId: number) {
    return salaryComponentEngineRepository.createCustomComponent(dto, creatorId);
  }

  async requestLoan(dto: LoanRequestDTO) {
    return salaryComponentEngineRepository.requestLoan(dto);
  }

  async approveLoan(loanId: number, approverId: number) {
    return salaryComponentEngineRepository.approveLoan(loanId, approverId);
  }

  async getLoans(employeeId?: number) {
    return salaryComponentEngineRepository.getLoans(employeeId);
  }

  async requestAdvance(dto: AdvanceRequestDTO) {
    return salaryComponentEngineRepository.requestAdvance(dto);
  }

  async approveAdvance(advanceId: number, approverId: number) {
    return salaryComponentEngineRepository.approveAdvance(advanceId, approverId);
  }

  async getAdvances(employeeId?: number) {
    return salaryComponentEngineRepository.getAdvances(employeeId);
  }

  async saveBankDetails(dto: BankDetailsDTO, updaterId: number) {
    return salaryComponentEngineRepository.saveBankDetails(dto, updaterId);
  }

  async getBankDetails(employeeId: number) {
    return salaryComponentEngineRepository.getBankDetails(employeeId);
  }

  async getAllBankDetails() {
    return salaryComponentEngineRepository.getAllBankDetails();
  }

  async assignBenefit(dto: BenefitDTO) {
    return salaryComponentEngineRepository.assignBenefit(dto);
  }

  async getBenefits(employeeId?: number) {
    return salaryComponentEngineRepository.getBenefits(employeeId);
  }
}

export const salaryComponentEngineService = new SalaryComponentEngineService();
