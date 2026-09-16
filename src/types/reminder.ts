export type ReminderType =
  | 'UPCOMING_CLASS'
  | 'MARK_ATTENDANCE'
  | 'SHORTAGE_WARNING'
  | 'ASSIGNMENT'
  | 'EXAM'
  | 'CUSTOM';

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dateTime: string; // ISO String
  type: ReminderType;
  relatedSubjectId?: string;
  relatedOccurrenceId?: string;
  notificationEnabled: boolean;
  completed: boolean;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'WARNING' | 'INFO' | 'REMINDER' | 'SUCCESS';
  read: boolean;
  createdAt: string;
  deepLink?: string;
}
