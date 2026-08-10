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
      organization_id: (employee as any).organization_id,
    };

    const tokens = generateTokens(session);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await authRepository.saveRefreshToken(employee.id, tokens.refreshToken, expiresAt);

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

    const tokenRecord = await authRepository.findRefreshToken(refreshTokenStr);
    if (!tokenRecord) {
      throw new Error('Refresh token not registered');
    }

    if (tokenRecord.is_revoked) {
      await authRepository.revokeAllRefreshTokensForUser(decoded.id);
      throw new Error('Revoked refresh token reuse detected. Revoking all sessions for security.');
    }

    if (new Date(tokenRecord.expires_at).getTime() < Date.now()) {
      throw new Error('Refresh token expired');
    }

    await authRepository.revokeRefreshToken(refreshTokenStr);

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
      organization_id: (employee as any).organization_id,
    };

    const tokens = generateTokens(session);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await authRepository.saveRefreshToken(employee.id, tokens.refreshToken, expiresAt);

    return tokens;
  }

  async logout(refreshTokenStr: string) {
    if (refreshTokenStr) {
      await authRepository.revokeRefreshToken(refreshTokenStr);
    }
    return { success: true, message: 'Logged out successfully' };
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

  async forgotPassword(emailOrCode: string) {
    const employee = await authRepository.findByEmail(emailOrCode) || await authRepository.findByCode(emailOrCode);
    if (!employee) {
      return { success: true, message: 'If the account exists, a password reset token has been generated.' };
    }
    
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);
    
    await authRepository.savePasswordResetToken(employee.id, token, expiresAt);
    console.log(`[PASSWORD RESET DEV ONLY] Reset Token for ${employee.email}: ${token}`);
    
    return { 
      success: true, 
      message: 'Password reset token generated.',
      token: process.env.NODE_ENV === 'production' ? undefined : token
    };
  }

  async resetPasswordByToken(token: string, newPassword: string) {
    const record = await authRepository.findPasswordResetToken(token);
    if (!record) {
      throw new Error('Invalid or expired password reset token');
    }
    
    if (new Date(record.expires_at).getTime() < Date.now()) {
      await authRepository.deletePasswordResetToken(token);
      throw new Error('Password reset token has expired');
    }
    
    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    
    const newHash = await bcrypt.hash(newPassword, 10);
    await authRepository.updatePassword(record.employee_id, newHash);
    await authRepository.deletePasswordResetToken(token);
    
    await authRepository.revokeAllRefreshTokensForUser(record.employee_id);
    
    return { success: true, message: 'Password reset completed successfully' };
  }
}

export const authService = new AuthService();
