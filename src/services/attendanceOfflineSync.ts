import apiClient from './apiClient.js';

export interface OfflineAction {
  id: string;
  type: 'PUNCH_IN' | 'PUNCH_OUT' | 'BREAK';
  payload: any;
  timestamp: number;
  synced: boolean;
  error?: string;
}

const STORAGE_KEY = 'theiakshi_attendance_offline_queue';

export class AttendanceOfflineSync {
  private queue: OfflineAction[] = [];
  private isOnline: boolean = navigator.onLine;
  private listeners: Array<(queue: OfflineAction[], isOnline: boolean) => void> = [];

  constructor() {
    this.loadQueue();
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  private loadQueue() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.queue = JSON.parse(raw);
      }
    } catch {
      this.queue = [];
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch { /* storage full fallback */ }
    this.notify();
  }

  public subscribe(cb: (queue: OfflineAction[], isOnline: boolean) => void) {
    this.listeners.push(cb);
    cb(this.queue, this.isOnline);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb([...this.queue], this.isOnline));
  }

  private handleOnline() {
    this.isOnline = true;
    this.syncQueue();
  }

  private handleOffline() {
    this.isOnline = false;
    this.notify();
  }

  public enqueue(type: 'PUNCH_IN' | 'PUNCH_OUT' | 'BREAK', payload: any): OfflineAction {
    const action: OfflineAction = {
      id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      payload,
      timestamp: Date.now(),
      synced: false,
    };
    this.queue.push(action);
    this.saveQueue();

    if (this.isOnline) {
      this.syncQueue();
    }
    return action;
  }

  public async syncQueue() {
    if (!this.isOnline || this.queue.length === 0) return;

    const pending = this.queue.filter(a => !a.synced);
    for (const item of pending) {
      try {
        let endpoint = '/attendance/punch-in';
        if (item.type === 'PUNCH_OUT') endpoint = '/attendance/punch-out';
        if (item.type === 'BREAK') endpoint = '/attendance/break';

        await apiClient.post(endpoint, {
          ...item.payload,
          offline_timestamp: item.timestamp,
        });

        item.synced = true;
      } catch (err: any) {
        // If conflict (e.g. already punched in), mark as resolved/error
        item.error = err.response?.data?.message || err.message || 'Sync failed';
        if (err.response?.status === 400) {
          item.synced = true; // prevent infinite retries for business logic rejection
        }
      }
    }

    // Keep failed or keep last 20 for history, filter fully synced older ones
    this.queue = this.queue.filter(a => !a.synced || Date.now() - a.timestamp < 3600000);
    this.saveQueue();
  }

  public getQueueStatus() {
    const pendingCount = this.queue.filter(a => !a.synced).length;
    return {
      isOnline: this.isOnline,
      pendingCount,
      queue: this.queue,
    };
  }

  public clearQueue() {
    this.queue = [];
    this.saveQueue();
  }
}

export const attendanceOfflineSync = new AttendanceOfflineSync();
