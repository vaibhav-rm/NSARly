import { Reminder, NotificationItem } from '../types/reminder';
import { LocalStore } from '../lib/storage/localStorage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Safely configure Notifications without throwing in Expo Go
let Notifications: typeof import('expo-notifications') | null = null;
const isExpoGo = Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo';

if (Platform.OS !== 'web' && !isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    Notifications?.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {
    Notifications = null;
  }
}

export const ReminderService = {
  async getReminders(): Promise<Reminder[]> {
    return await LocalStore.getReminders();
  },

  async addReminder(userId: string, reminder: Omit<Reminder, 'id' | 'userId' | 'createdAt'>): Promise<Reminder> {
    const reminders = await LocalStore.getReminders();
    const newRem: Reminder = {
      ...reminder,
      id: `rem_${Date.now()}`,
      userId,
      createdAt: new Date().toISOString(),
    };

    reminders.push(newRem);
    await LocalStore.saveReminders(reminders);

    if (newRem.notificationEnabled) {
      await this.scheduleLocalNotification(newRem);
    }

    return newRem;
  },

  async toggleComplete(reminderId: string): Promise<Reminder[]> {
    const reminders = await LocalStore.getReminders();
    const updated = reminders.map((r) =>
      r.id === reminderId ? { ...r, completed: !r.completed } : r
    );
    await LocalStore.saveReminders(updated);
    return updated;
  },

  async deleteReminder(reminderId: string): Promise<Reminder[]> {
    const reminders = await LocalStore.getReminders();
    const updated = reminders.filter((r) => r.id !== reminderId);
    await LocalStore.saveReminders(updated);
    return updated;
  },

  async getNotifications(): Promise<NotificationItem[]> {
    return await LocalStore.getNotifications();
  },

  async markNotificationAsRead(notificationId: string): Promise<NotificationItem[]> {
    const notifications = await LocalStore.getNotifications();
    const updated = notifications.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    await LocalStore.saveNotifications(updated);
    return updated;
  },

  async markAllNotificationsAsRead(): Promise<NotificationItem[]> {
    const notifications = await LocalStore.getNotifications();
    const updated = notifications.map((n) => ({ ...n, read: true }));
    await LocalStore.saveNotifications(updated);
    return updated;
  },

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web' || !Notifications) return false;
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      return finalStatus === 'granted';
    } catch (e) {
      return false;
    }
  },

  async scheduleLocalNotification(reminder: Reminder): Promise<string | null> {
    if (Platform.OS === 'web' || !Notifications) return null;

    try {
      const targetDate = new Date(reminder.dateTime);
      if (targetDate.getTime() <= Date.now()) return null;

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: `NSARly: ${reminder.title}`,
          body: reminder.description || 'Upcoming class reminder',
          data: { reminderId: reminder.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: targetDate,
        },
      });

      return identifier;
    } catch (err) {
      return null;
    }
  },
};
