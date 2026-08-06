import bcrypt from 'bcryptjs';
import { authRepository } from '../repositories/authRepository.js';
import { generateTokens, verifyRefreshToken } from '../utils/jwt.js';

export class AuthService {
  async login(email: string, password: string) {
    const employee = await authRepository.findByEmail(email);
    if (!employee) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, employee.password_hash);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    if (employee.status !== 'ACTIVE') {
      throw new Error('Account is inactive or terminated. Contact HR administrator.');
    }

    const session = {
      id: employee.id,
      employee_code: employee.employee_code,
      email: employee.email,
      role: employee.role,
      first_name: employee.first_name,
      last_name: employee.last_name,
      branch_id: employee.branch_id,
      department_id: employee.department_id,
    };

    const tokens = generateTokens(session);
    const { password_hash, ...userProfile } = employee;

    return {
      user: userProfile,
      tokens,
    };
  }

  async refreshToken(refreshTokenStr: string) {
    const decoded = verifyRefreshToken(refreshTokenStr);
    if (!decoded) {
      throw new Error('Invalid or expired refresh token');
    }

    const employee = await authRepository.findById(decoded.id);
    if (!employee || employee.status !== 'ACTIVE') {
      throw new Error('Employee account no longer active');
    }

    const session = {
      id: employee.id,
      employee_code: employee.employee_code,
      email: employee.email,
      role: employee.role,
      first_name: employee.first_name,
      last_name: employee.last_name,
      branch_id: employee.branch_id,
      department_id: employee.department_id,
    };

    return generateTokens(session);
  }

  async getProfile(employeeId: number) {
    const employee = await authRepository.findById(employeeId);
    if (!employee) throw new Error('Employee profile not found');
    const { password_hash, ...profile } = employee;
    return profile;
  }
}

export const authService = new AuthService();
