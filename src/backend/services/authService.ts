import bcrypt from 'bcryptjs';
import { authRepository } from '../repositories/authRepository.js';
import { generateTokens, verifyRefreshToken } from '../utils/jwt.js';

export class AuthService {
  async login(identifier: string, password: string, ipAddress = '127.0.0.1', userAgent = 'Browser') {
    const employee = await authRepository.findByIdentifier(identifier);
    if (!employee) {
      throw new Error('Invalid email, employee code or password');
    }

    const isMatch = await bcrypt.compare(password, employee.password_hash);
    if (!isMatch) {
      await authRepository.logLoginHistory(employee.id, ipAddress, userAgent, 'FAILED', 'Incorrect password');
      throw new Error('Invalid email, employee code or password');
    }

    if (employee.status !== 'ACTIVE') {
      await authRepository.logLoginHistory(employee.id, ipAddress, userAgent, 'FAILED', 'Inactive account');
      throw new Error('Account is inactive or terminated. Contact HR administrator.');
    }

    await authRepository.logLoginHistory(employee.id, ipAddress, userAgent, 'SUCCESS');

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

  async changePassword(employeeId: number, oldPassword: string, newPassword: string) {
    const employee = await authRepository.findById(employeeId);
    if (!employee) throw new Error('Employee profile not found');

    const isMatch = await bcrypt.compare(oldPassword, employee.password_hash);
    if (!isMatch) throw new Error('Current password does not match');

    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await authRepository.updatePassword(employeeId, newHash);
    return { success: true, message: 'Password updated successfully' };
  }

  async resetPassword(employeeId: number, newPassword: string) {
    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    const newHash = await bcrypt.hash(newPassword, 10);
    await authRepository.updatePassword(employeeId, newHash);
    return { success: true, message: 'Password reset successfully' };
  }

  async getProfile(employeeId: number) {
    const employee = await authRepository.findById(employeeId);
    if (!employee) throw new Error('Employee profile not found');
    const { password_hash, ...profile } = employee;
    return profile;
  }

  async getLoginHistory(employeeId: number) {
    return await authRepository.getLoginHistory(employeeId);
  }

  async getRolesAndPermissions() {
    return await authRepository.getAllRolesAndPermissions();
  }

  async updateRolePermissions(role: string, permissions: string[]) {
    return await authRepository.updateRolePermissions(role, permissions);
  }
}

export const authService = new AuthService();
