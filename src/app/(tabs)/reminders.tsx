import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KineticText } from '../../components/ui/KineticText';
import { KineticCard } from '../../components/ui/KineticCard';
import { KineticButton } from '../../components/ui/KineticButton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COLORS, BORDERS } from '../../constants/theme';
import { LocalStore } from '../../lib/storage/localStorage';
import { ReminderService } from '../../services/reminderService';
import { Reminder, NotificationItem, ReminderType } from '../../types/reminder';
import { Bell, Plus, CheckCircle, Clock, ShieldAlert, Check } from 'lucide-react-native';
import { format } from 'date-fns';

export default function RemindersScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deviceNotifEnabled, setDeviceNotifEnabled] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reminderType, setReminderType] = useState<ReminderType>('UPCOMING_CLASS');

  const loadData = async () => {
    const rems = await LocalStore.getReminders();
    const notifs = await LocalStore.getNotifications();
    setReminders(rems);
    setNotifications(notifs);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleComplete = async (reminderId: string) => {
    const updated = await ReminderService.toggleComplete(reminderId);
    setReminders(updated);
  };

  const handleMarkAllRead = async () => {
    const updated = await ReminderService.markAllNotificationsAsRead();
    setNotifications(updated);
  };

  const handleAddReminder = async () => {
    if (!title) {
      Alert.alert('Error', 'Please enter a reminder title.');
      return;
    }

    const profile = await LocalStore.getProfile();
    const uid = profile?.uid || 'demo_user';

    await ReminderService.addReminder(uid, {
      title,
      description,
      dateTime: new Date(Date.now() + 86400000).toISOString(),
      type: reminderType,
      notificationEnabled: deviceNotifEnabled,
      completed: false,
    });

    setShowAddModal(false);
    setTitle('');
    setDescription('');
    await loadData();
  };

  const handleToggleDevicePermissions = async (value: boolean) => {
    setDeviceNotifEnabled(value);
    if (value) {
      const granted = await ReminderService.requestPermissions();
      if (!granted) {
        Alert.alert('Permissions', 'Device notification permissions were not granted.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <KineticText variant="h1" bold uppercase color={COLORS.acidYellow}>
            REMINDERS & NOTIFICATIONS
          </KineticText>
          <KineticText variant="caption" color={COLORS.mutedForeground}>
            Smart Alerts & Local Push Notifications
          </KineticText>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowAddModal(true)}
          style={styles.addBtn}
        >
          <Plus size={20} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Device Notifications Switch */}
        <KineticCard style={styles.switchCard}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <KineticText variant="h3" bold>
                Device Notifications
              </KineticText>
              <KineticText variant="caption" color={COLORS.mutedForeground}>
                Receive push reminders before upcoming classes
              </KineticText>
            </View>
            <Switch
              value={deviceNotifEnabled}
              onValueChange={handleToggleDevicePermissions}
              trackColor={{ false: COLORS.mutedSurface, true: COLORS.acidYellow }}
              thumbColor={deviceNotifEnabled ? '#000' : COLORS.mutedForeground}
            />
          </View>
        </KineticCard>

        {/* Notifications Center */}
        <View style={styles.sectionHeader}>
          <KineticText variant="h1" bold uppercase>
            IN-APP NOTIFICATIONS
          </KineticText>
          {notifications.some((n) => !n.read) && (
            <TouchableOpacity activeOpacity={0.7} onPress={handleMarkAllRead}>
              <KineticText variant="caption" bold color={COLORS.acidYellow} uppercase>
                MARK ALL READ
              </KineticText>
            </TouchableOpacity>
          )}
        </View>

        {notifications.map((n) => (
          <KineticCard key={n.id} style={[styles.notifCard, !n.read && styles.unreadNotif]}>
            <View style={styles.notifHeader}>
              <StatusBadge status={n.type === 'WARNING' ? 'SHORTAGE' : 'SAFE'} label={n.type} size="sm" />
              <KineticText variant="caption" color={COLORS.mutedForeground}>
                {format(new Date(n.createdAt), 'dd MMM HH:mm')}
              </KineticText>
            </View>
            <KineticText variant="h3" bold style={{ marginTop: 6 }}>
              {n.title}
            </KineticText>
            <KineticText variant="body" color={COLORS.mutedForeground} style={{ marginTop: 2 }}>
              {n.body}
            </KineticText>
          </KineticCard>
        ))}

        {/* Reminders List */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <KineticText variant="h1" bold uppercase>
            UPCOMING REMINDERS ({reminders.length})
          </KineticText>
        </View>

        {reminders.map((rem) => (
          <KineticCard key={rem.id} style={styles.reminderCard}>
            <View style={styles.remTop}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleToggleComplete(rem.id)}
                style={styles.checkBtn}
              >
                {rem.completed ? (
                  <CheckCircle size={22} color={COLORS.status.safe} />
                ) : (
                  <Clock size={22} color={COLORS.acidYellow} />
                )}
              </TouchableOpacity>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <KineticText
                  variant="h3"
                  bold
                  style={[rem.completed && styles.completedText]}
                >
                  {rem.title}
                </KineticText>
                {rem.description ? (
                  <KineticText variant="caption" color={COLORS.mutedForeground} style={{ marginTop: 2 }}>
                    {rem.description}
                  </KineticText>
                ) : null}
                <KineticText variant="caption" color={COLORS.acidYellow} style={{ marginTop: 4 }}>
                  Due: {format(new Date(rem.dateTime), 'EEEE, dd MMM • HH:mm')}
                </KineticText>
              </View>
            </View>
          </KineticCard>
        ))}
      </ScrollView>

      {/* Add Reminder Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <KineticText variant="h1" bold uppercase color={COLORS.acidYellow}>
              ADD REMINDER
            </KineticText>

            <View style={{ marginTop: 16 }}>
              <KineticText variant="caption" bold uppercase color={COLORS.foreground} style={{ marginBottom: 4 }}>
                REMINDER TITLE
              </KineticText>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Prepare DBMS Lab Report"
                placeholderTextColor={COLORS.mutedForeground}
              />
            </View>

            <View style={{ marginTop: 12 }}>
              <KineticText variant="caption" bold uppercase color={COLORS.foreground} style={{ marginBottom: 4 }}>
                DESCRIPTION (OPTIONAL)
              </KineticText>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="Details or notes..."
                placeholderTextColor={COLORS.mutedForeground}
              />
            </View>

            <KineticButton
              title="CREATE REMINDER"
              variant="primary"
              size="lg"
              onPress={handleAddReminder}
              style={{ marginTop: 20 }}
            />

            <KineticButton
              title="CANCEL"
              variant="outline"
              size="md"
              onPress={() => setShowAddModal(false)}
              style={{ marginTop: 8 }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: BORDERS.thin,
    borderBottomColor: COLORS.border,
  },
  addBtn: {
    width: 38,
    height: 38,
    backgroundColor: COLORS.acidYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  switchCard: {
    marginBottom: 20,
    padding: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  notifCard: {
    marginBottom: 10,
    padding: 14,
  },
  unreadNotif: {
    borderColor: COLORS.acidYellow,
    borderWidth: BORDERS.thick,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderCard: {
    marginBottom: 10,
    padding: 14,
  },
  remTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkBtn: {
    padding: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: COLORS.mutedForeground,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.cardSurface,
    margin: 20,
    padding: 20,
    borderWidth: BORDERS.thick,
    borderColor: COLORS.acidYellow,
  },
  input: {
    backgroundColor: COLORS.background,
    color: COLORS.foreground,
    borderWidth: BORDERS.thick,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
  },
});
