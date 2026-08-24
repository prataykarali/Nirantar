/**
 * NIRANTAR — Task Stack & Interrupted Journey Engine
 * ===================================================
 * Manages interrupted tasks so a user can jump to tracking / check past ticket
 * and resume their booking with 0 data loss.
 */

export interface TaskStackItem {
  taskId: string;
  taskType: 'BOOKING' | 'TRACKING' | 'VIEW_TICKET' | 'PAYMENT';
  page: string;
  title: string;
  subtitle: string;
  createdAt: number;
  expiresAt: number; // TTL (e.g. 30 mins)
  stateSnapshot: {
    origin?: string;
    destination?: string;
    travelDate?: string;
    selectedTrain?: any;
    selectedClassCode?: string;
    passengers?: any[];
    bookingStep?: string;
    fare?: number;
  };
}

export class TaskStackManager {
  private static readonly TTL_MS = 30 * 60 * 1000; // 30 minutes

  public static createTaskItem(
    taskType: TaskStackItem['taskType'],
    page: string,
    title: string,
    subtitle: string,
    stateSnapshot: TaskStackItem['stateSnapshot']
  ): TaskStackItem {
    const now = Date.now();
    return {
      taskId: `task_${now}_${Math.random().toString(36).substring(2, 6)}`,
      taskType,
      page,
      title,
      subtitle,
      createdAt: now,
      expiresAt: now + this.TTL_MS,
      stateSnapshot,
    };
  }

  public static isExpired(item: TaskStackItem): boolean {
    return Date.now() > item.expiresAt;
  }

  public static filterValidTasks(items: TaskStackItem[]): TaskStackItem[] {
    return items.filter((item) => !this.isExpired(item));
  }
}
