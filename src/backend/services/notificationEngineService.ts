import {
  notificationEngineRepository, DispatchNotificationDTO
} from '../repositories/notificationEngineRepository.js';

export class NotificationEngineService {
  async dispatchNotification(dto: DispatchNotificationDTO) {
    return notificationEngineRepository.dispatchNotification(dto);
  }

  async getNotifications(employeeId: number) {
    return notificationEngineRepository.getNotifications(employeeId);
  }

  async getUnreadCount(employeeId: number) {
    return notificationEngineRepository.getUnreadCount(employeeId);
  }

  async markAsRead(notificationId: number, employeeId: number) {
    return notificationEngineRepository.markAsRead(notificationId, employeeId);
  }

  async markAllAsRead(employeeId: number) {
    return notificationEngineRepository.markAllAsRead(employeeId);
  }

  async registerDevice(employeeId: number, deviceToken: string, platform?: string) {
    return notificationEngineRepository.registerDevice(employeeId, deviceToken, platform);
  }
}

export const notificationEngineService = new NotificationEngineService();
