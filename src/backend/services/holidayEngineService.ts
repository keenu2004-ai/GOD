import { holidayEngineRepository, HolidayDTO, CompanyEventDTO } from '../repositories/holidayEngineRepository.js';

export class HolidayEngineService {
  async seedDefaults() {
    return holidayEngineRepository.seedDefaultHolidays();
  }

  async getAllHolidays(regionCode?: string, branchId?: number, year?: number) {
    return holidayEngineRepository.getAllHolidays(regionCode, branchId, year);
  }

  async createHoliday(dto: HolidayDTO, creatorId: number) {
    return holidayEngineRepository.createHoliday(dto, creatorId);
  }

  async deleteHoliday(id: number, deleterId: number) {
    return holidayEngineRepository.deleteHoliday(id, deleterId);
  }

  async selectOptionalHoliday(employeeId: number, holidayId: number, year: number) {
    return holidayEngineRepository.selectOptionalHoliday(employeeId, holidayId, year);
  }

  async getMyOptionalHolidays(employeeId: number, year: number) {
    return holidayEngineRepository.getMyOptionalHolidays(employeeId, year);
  }

  async getCompanyEvents(year?: number, month?: number) {
    return holidayEngineRepository.getCompanyEvents(year, month);
  }

  async createCompanyEvent(dto: CompanyEventDTO, creatorId: number) {
    return holidayEngineRepository.createCompanyEvent(dto, creatorId);
  }

  async getUnifiedCalendarFeed(employeeId: number, year?: number, month?: number) {
    const yr = year || new Date().getFullYear();
    const mth = month || new Date().getMonth() + 1;
    return holidayEngineRepository.getUnifiedCalendarFeed(employeeId, yr, mth);
  }
}

export const holidayEngineService = new HolidayEngineService();
