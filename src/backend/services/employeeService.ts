import bcrypt from 'bcryptjs';
import { employeeRepository, EmployeeQueryOptions } from '../repositories/employeeRepository.js';

export class EmployeeService {
  async getAllEmployees(options: EmployeeQueryOptions) {
    return await employeeRepository.findAll(options);
  }

  async getEmployeeById(id: number, organizationId?: number) {
    const employee = await employeeRepository.findById(id, organizationId);
    if (!employee) throw new Error('Employee not found');
    const { password_hash, ...profile } = employee;
    return profile;
  }

  async createEmployee(data: any, organizationId?: number) {
    // 1. Email validation & duplicate check
    if (!data.email) {
      throw new Error('Email is required');
    }
    const existingEmail = await employeeRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new Error(`Employee with email '${data.email}' already exists`);
    }

    // 2. Employee code auto generation / duplicate check
    let employeeCode = data.employee_code;
    if (!employeeCode || employeeCode.trim() === '') {
      const count = await employeeRepository.countTotal();
      employeeCode = `EMP${String(count + 101).padStart(4, '0')}`;
    } else {
      const existingCode = await employeeRepository.findByCode(employeeCode);
      if (existingCode) {
        throw new Error(`Employee with code '${employeeCode}' already exists`);
      }
    }

    // 3. Name validation
    if (!data.first_name || !data.last_name) {
      throw new Error('First name and last name are required');
    }

    // 4. Password hashing
    const defaultPassword = data.password || 'password123';
    const password_hash = await bcrypt.hash(defaultPassword, 10);

    // 5. Create employee record
    const newEmp = await employeeRepository.create({
      ...data,
      employee_code: employeeCode,
      password_hash,
      organization_id: organizationId || 1
    } as any);

    const { password_hash: _, ...created } = newEmp;
    return created;
  }

  async updateEmployee(id: number, data: any, organizationId?: number) {
    // 1. Verify existence
    const existing = await employeeRepository.findById(id, organizationId);
    if (!existing) {
      throw new Error('Employee not found');
    }

    // 2. Check email uniqueness if email is changed
    if (data.email && data.email.toLowerCase() !== existing.email.toLowerCase()) {
      const emailDup = await employeeRepository.findByEmail(data.email, id);
      if (emailDup) {
        throw new Error(`Employee with email '${data.email}' already exists`);
      }
    }

    // 3. Check employee_code uniqueness if code is changed
    if (data.employee_code && data.employee_code.toLowerCase() !== existing.employee_code.toLowerCase()) {
      const codeDup = await employeeRepository.findByCode(data.employee_code, id);
      if (codeDup) {
        throw new Error(`Employee with code '${data.employee_code}' already exists`);
      }
    }

    // 4. Update employee record
    const updated = await employeeRepository.update(id, data);
    if (!updated) throw new Error('Failed to update employee');

    const { password_hash: _, ...profile } = updated;
    return profile;
  }

  async softDeleteEmployee(id: number, organizationId?: number) {
    const existing = await employeeRepository.findById(id, organizationId);
    if (!existing) {
      throw new Error('Employee not found');
    }
    return await employeeRepository.softDelete(id);
  }

  async restoreEmployee(id: number, organizationId?: number) {
    const existing = await employeeRepository.findById(id, organizationId);
    if (!existing) {
      throw new Error('Employee not found');
    }
    return await employeeRepository.restore(id);
  }

  async updateRole(id: number, role: string, organizationId?: number) {
    const existing = await employeeRepository.findById(id, organizationId);
    if (!existing) throw new Error('Employee not found');
    return await employeeRepository.updateRole(id, role);
  }

  async permanentDeleteEmployee(id: number, organizationId?: number) {
    const existing = await employeeRepository.findById(id, organizationId);
    if (!existing) throw new Error('Employee not found');
    return await employeeRepository.permanentDelete(id);
  }

  async addEducation(employeeId: number, data: any) {
    return await employeeRepository.addEducation(employeeId, data);
  }

  async addExperience(employeeId: number, data: any) {
    return await employeeRepository.addExperience(employeeId, data);
  }
}

export const employeeService = new EmployeeService();
