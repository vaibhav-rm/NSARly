import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KineticText } from '../../components/ui/KineticText';
import { KineticCard } from '../../components/ui/KineticCard';
import { KineticButton } from '../../components/ui/KineticButton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COLORS, BORDERS } from '../../constants/theme';
import { LocalStore } from '../../lib/storage/localStorage';
import { AuthService } from '../../services/authService';
import { SemesterService } from '../../services/semesterService';
import { ReminderService } from '../../services/reminderService';
import { UserProfile, Semester } from '../../types/semester';
import { Subject } from '../../types/timetable';
import { Reminder, NotificationItem, ReminderType } from '../../types/reminder';
import { useRouter } from 'expo-router';
import { User, Layers, LogOut, Trash2, Download, Bell, Plus, Clock, CheckCircle, Edit3 } from 'lucide-react-native';
import { RVCE_PUBLISHED_TIMETABLE } from '../../constants/rvceData';
import { TimetableService } from '../../services/timetableService';
import { calculateSubjectSummary, getActiveMainSubjects } from '../../lib/attendance/calculator';
import { format, addDays } from 'date-fns';

export default function SettingsScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [deviceNotifEnabled, setDeviceNotifEnabled] = useState(true);

  // Modals
  const [showNewSemModal, setShowNewSemModal] = useState(false);
  const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // New Semester Form State
  const [newSemNum, setNewSemNum] = useState('6');
  const [newAcadYear, setNewAcadYear] = useState('2026–27');
  const [newSection, setNewSection] = useState('D');
  const [newTargetPct, setNewTargetPct] = useState('75');

  // Reminder Form State
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDesc, setReminderDesc] = useState('');
  const [reminderSubjectId, setReminderSubjectId] = useState('');
  const [reminderDateStr, setReminderDateStr] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [reminderTimeStr, setReminderTimeStr] = useState('09:00');

  // Initial Attendance Form State
  const [initAttended, setInitAttended] = useState('0');
  const [initConducted, setInitConducted] = useState('0');

  const loadData = useCallback(async () => {
    const prof = await LocalStore.getProfile();
    const sems = await LocalStore.getSemesters();
    const rems = await LocalStore.getReminders();
    const notifs = await LocalStore.getNotifications();

    setProfile(prof);
    setSemesters(sems);
    setReminders(rems);
    setNotifications(notifs);

    if (prof?.currentSemesterId) {
      const subjs = await LocalStore.getSubjects(prof.currentSemesterId);
      setSubjects(subjs);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AuthService.logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'DELETE ACCOUNT',
      'WARNING: This action is permanent and will delete all your attendance data and timetables. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'DELETE PERMANENTLY',
          style: 'destructive',
          onPress: async () => {
            await AuthService.deleteAccount();
            router.replace('/landing');
          },
        },
      ]
    );
  };

  const handleStartNewSemester = async () => {
    if (!profile) return;

    const semNum = parseInt(newSemNum, 10) || 6;
    const target = parseFloat(newTargetPct) || 75;

    const newSem = await SemesterService.startNewSemester(profile.uid, {
      collegeName: profile.collegeName || 'RV College of Engineering',
      academicYear: newAcadYear,
      branchName: profile.branchName || 'Computer Science & Engineering',
      semesterNumber: semNum,
      section: newSection,
      targetPercentage: target,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2027-05-31',
      copySubjects: RVCE_PUBLISHED_TIMETABLE.subjects,
    });

    await TimetableService.importPublishedTimetable(profile.uid, newSem.id, RVCE_PUBLISHED_TIMETABLE);

    setShowNewSemModal(false);
    await loadData();
    Alert.alert('New Semester Active', `Semester ${semNum} has been activated. Previous attendance is safely archived.`);
  };

  // Elective Selection Handler
  const handleToggleElectiveSelection = async (subjectId: string) => {
    if (!profile?.currentSemesterId) return;

    const targetSubj = subjects.find((s) => s.id === subjectId);
    if (!targetSubj) return;

    const updatedSubjects = subjects.map((s) => {
      if (s.id === subjectId) {
        return { ...s, isSelectedElective: true };
      }
      if (s.electiveGroup && s.electiveGroup === targetSubj.electiveGroup) {
        return { ...s, isSelectedElective: false };
      }
      return s;
    });

    await LocalStore.saveSubjects(profile.currentSemesterId, updatedSubjects);
    setSubjects(updatedSubjects);
    Alert.alert('Elective Enrolled', `Enrolled in ${targetSubj.name} (${targetSubj.code}). Alternate options removed from schedule.`);
  };

  // Previous Attendance Backfill Handlers
  const handleOpenEditSubject = (subj: Subject) => {
    setEditingSubject(subj);
    setInitAttended(String(subj.initialAttended || 0));
    setInitConducted(String(subj.initialConducted || 0));
  };

  const handleSaveSubjectInitialAttendance = async () => {
    if (!editingSubject || !profile?.currentSemesterId) return;

    const attended = parseInt(initAttended, 10) || 0;
    const conducted = parseInt(initConducted, 10) || 0;

    if (attended > conducted) {
      Alert.alert('Error', 'Attended classes cannot exceed total conducted classes.');
      return;
    }

    const updatedSubjects = subjects.map((s) =>
      s.id === editingSubject.id
        ? { ...s, initialAttended: attended, initialConducted: conducted }
        : s
    );

    await LocalStore.saveSubjects(profile.currentSemesterId, updatedSubjects);
    setSubjects(updatedSubjects);
    setEditingSubject(null);
    Alert.alert('Updated', `Previous attendance counts updated for ${editingSubject.code}.`);
  };

  // Reminder Handlers
  const handleToggleCompleteReminder = async (id: string) => {
    const updated = await ReminderService.toggleComplete(id);
    setReminders(updated);
  };

  const handleMarkAllNotifsRead = async () => {
    const updated = await ReminderService.markAllNotificationsAsRead();
    setNotifications(updated);
  };

  const handleAddReminder = async () => {
    if (!reminderTitle) {
      Alert.alert('Error', 'Please enter a title for the reminder.');
      return;
    }

    let dateTimeISO = new Date(Date.now() + 86400000).toISOString();
    try {
      dateTimeISO = new Date(`${reminderDateStr}T${reminderTimeStr}:00`).toISOString();
    } catch (e) {
      // Fallback
    }

    const uid = profile?.uid || 'demo_user';
    await ReminderService.addReminder(uid, {
      title: reminderTitle,
      description: reminderDesc,
      dateTime: dateTimeISO,
      type: reminderSubjectId ? 'UPCOMING_CLASS' : 'ASSIGNMENT',
      relatedSubjectId: reminderSubjectId || undefined,
      notificationEnabled: deviceNotifEnabled,
      completed: false,
    });

    setShowAddReminderModal(false);
    setReminderTitle('');
    setReminderDesc('');
    setReminderSubjectId('');
    await loadData();
  };

  const handleToggleDeviceNotif = async (val: boolean) => {
    setDeviceNotifEnabled(val);
    if (val) {
      const granted = await ReminderService.requestPermissions();
      if (!granted) {
        Alert.alert('Permissions Required', 'Device push notification permissions were not granted.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <KineticText variant="h1" bold uppercase color={COLORS.acidYellow}>
          SETTINGS & PREFERENCES
        </KineticText>
        <KineticText variant="caption" color={COLORS.mutedForeground}>
          Previous Data Backfill, Reminders & Academic Config
        </KineticText>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <KineticCard style={styles.card}>
          <View style={styles.cardHeader}>
            <User size={20} color={COLORS.acidYellow} />
            <KineticText variant="h2" bold style={{ marginLeft: 8 }}>
              STUDENT PROFILE
            </KineticText>
          </View>

          <View style={styles.infoRow}>
            <KineticText variant="caption" color={COLORS.mutedForeground}>NAME:</KineticText>
            <KineticText variant="body" bold numberOfLines={1} style={{ flex: 1, textAlign: 'right', flexShrink: 1, marginLeft: 12 }}>{profile?.name || 'Student'}</KineticText>
          </View>
          <View style={styles.infoRow}>
            <KineticText variant="caption" color={COLORS.mutedForeground}>EMAIL:</KineticText>
            <KineticText variant="body" bold numberOfLines={1} style={{ flex: 1, textAlign: 'right', flexShrink: 1, marginLeft: 12 }}>{profile?.email || 'N/A'}</KineticText>
          </View>
          <View style={styles.infoRow}>
            <KineticText variant="caption" color={COLORS.mutedForeground}>COLLEGE:</KineticText>
            <KineticText variant="body" bold numberOfLines={1} style={{ flex: 1, textAlign: 'right', flexShrink: 1, marginLeft: 12 }}>{profile?.collegeName || 'RV College of Engineering'}</KineticText>
          </View>
          <View style={styles.infoRow}>
            <KineticText variant="caption" color={COLORS.mutedForeground}>BRANCH:</KineticText>
            <KineticText variant="body" bold numberOfLines={1} style={{ flex: 1, textAlign: 'right', flexShrink: 1, marginLeft: 12 }}>{profile?.branchName || 'CSE'}</KineticText>
          </View>
          <View style={styles.infoRow}>
            <KineticText variant="caption" color={COLORS.mutedForeground}>CURRENT SEMESTER:</KineticText>
            <KineticText variant="body" bold color={COLORS.acidYellow} numberOfLines={1} style={{ flex: 1, textAlign: 'right', flexShrink: 1, marginLeft: 12 }}>
              Sem {profile?.semesterNumber || 5} ({profile?.section || 'D'})
            </KineticText>
          </View>
        </KineticCard>

        {/* Enrolled Electives Course Selection Section */}
        <View style={styles.sectionHeader}>
          <KineticText variant="h1" bold uppercase>
            ELECTIVE COURSE SELECTION
          </KineticText>
        </View>

        <KineticCard style={styles.card}>
          <KineticText variant="body" color={COLORS.mutedForeground} style={{ marginBottom: 12 }}>
            Select your enrolled elective courses for this semester. Unselected elective options will not pollute your timetable or attendance calculations.
          </KineticText>

          {subjects.filter((s) => s.isElective).map((subj) => (
            <TouchableOpacity
              key={subj.id}
              activeOpacity={0.8}
              onPress={() => handleToggleElectiveSelection(subj.id)}
              style={[
                styles.electiveItem,
                subj.isSelectedElective && styles.electiveItemActive,
              ]}
            >
              <View style={{ flex: 1, marginRight: 8 }}>
                <KineticText variant="caption" bold color={COLORS.acidYellow} uppercase>
                  {subj.code} • {subj.electiveGroup || 'ELECTIVE'}
                </KineticText>
                <KineticText variant="h3" bold color={COLORS.foreground}>
                  {subj.name}
                </KineticText>
              </View>
              {subj.isSelectedElective ? (
                <StatusBadge status="SAFE" label="ENROLLED" size="sm" />
              ) : (
                <StatusBadge status="CANCELLED" label="NOT ENROLLED" size="sm" />
              )}
            </TouchableOpacity>
          ))}
        </KineticCard>

        {/* Previous Attendance Data Backfill Section */}
        <View style={styles.sectionHeader}>
          <KineticText variant="h1" bold uppercase>
            RECORD PREVIOUS UNTRACKED ATTENDANCE
          </KineticText>
        </View>

        <KineticCard style={styles.card}>
          <KineticText variant="body" color={COLORS.mutedForeground} style={{ marginBottom: 12 }}>
            If you started using NSARly mid-semester, set your initial attended and conducted class counts per subject here so calculations stay 100% accurate.
          </KineticText>

          {getActiveMainSubjects(subjects).map((subj) => (
            <TouchableOpacity
              key={subj.id}
              activeOpacity={0.8}
              onPress={() => handleOpenEditSubject(subj)}
              style={styles.backfillSubjectItem}
            >
              <View style={{ flex: 1, marginRight: 8 }}>
                <KineticText variant="caption" bold color={COLORS.acidYellow} uppercase>
                  {subj.code}
                </KineticText>
                <KineticText variant="h3" bold numberOfLines={1}>
                  {subj.name}
                </KineticText>
                <KineticText variant="caption" color={COLORS.mutedForeground}>
                  Previous: {subj.initialAttended || 0}/{subj.initialConducted || 0} Attended
                </KineticText>
              </View>

              <View style={styles.editBtnBox}>
                <Edit3 size={14} color={COLORS.acidYellow} />
                <KineticText variant="caption" bold color={COLORS.acidYellow} style={{ marginLeft: 4 }}>
                  SET COUNTS
                </KineticText>
              </View>
            </TouchableOpacity>
          ))}
        </KineticCard>

        {/* Reminders & Push Notifications Section */}
        <View style={styles.sectionHeader}>
          <KineticText variant="h1" bold uppercase>
            REMINDERS & NOTIFICATIONS
          </KineticText>
        </View>

        <KineticCard style={styles.card}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <KineticText variant="h3" bold>
                Push Notifications
              </KineticText>
              <KineticText variant="caption" color={COLORS.mutedForeground}>
                Receive device alerts before scheduled classes
              </KineticText>
            </View>
            <Switch
              value={deviceNotifEnabled}
              onValueChange={handleToggleDeviceNotif}
              trackColor={{ false: COLORS.mutedSurface, true: COLORS.acidYellow }}
              thumbColor={deviceNotifEnabled ? '#000' : COLORS.mutedForeground}
            />
          </View>

          <View style={styles.subSectionHeader}>
            <KineticText variant="h3" bold uppercase color={COLORS.foreground}>
              ACTIVE REMINDERS ({reminders.length})
            </KineticText>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowAddReminderModal(true)}
              style={styles.inlineAddBtn}
            >
              <Plus size={14} color="#000" />
              <KineticText variant="caption" bold color="#000" style={{ marginLeft: 4 }}>
                ADD
              </KineticText>
            </TouchableOpacity>
          </View>

          {reminders.map((rem) => (
            <TouchableOpacity
              key={rem.id}
              activeOpacity={0.7}
              onPress={() => handleToggleCompleteReminder(rem.id)}
              style={styles.remItem}
            >
              {rem.completed ? (
                <CheckCircle size={18} color={COLORS.status.safe} />
              ) : (
                <Clock size={18} color={COLORS.acidYellow} />
              )}
              <View style={{ flex: 1, marginLeft: 10 }}>
                <KineticText variant="h3" bold style={rem.completed ? styles.completedText : null}>
                  {rem.title}
                </KineticText>
                {rem.description ? (
                  <KineticText variant="caption" color={COLORS.mutedForeground}>
                    {rem.description}
                  </KineticText>
                ) : null}
                <KineticText variant="caption" color={COLORS.acidYellow} style={{ marginTop: 2 }}>
                  Due: {format(new Date(rem.dateTime), 'EEE, dd MMM yyyy • HH:mm')}
                </KineticText>
              </View>
            </TouchableOpacity>
          ))}

          {/* In-App Notifications Sub-list */}
          <View style={[styles.subSectionHeader, { marginTop: 16 }]}>
            <KineticText variant="h3" bold uppercase color={COLORS.foreground}>
              IN-APP ALERTS
            </KineticText>
            {notifications.some((n) => !n.read) && (
              <TouchableOpacity activeOpacity={0.7} onPress={handleMarkAllNotifsRead}>
                <KineticText variant="caption" bold color={COLORS.acidYellow} uppercase>
                  MARK ALL READ
                </KineticText>
              </TouchableOpacity>
            )}
          </View>

          {notifications.map((n) => (
            <View key={n.id} style={[styles.notifItem, !n.read && styles.unreadNotif]}>
              <View style={styles.notifHead}>
                <StatusBadge status={n.type === 'WARNING' ? 'SHORTAGE' : 'SAFE'} label={n.type} size="sm" />
                <KineticText variant="caption" color={COLORS.mutedForeground}>
                  {format(new Date(n.createdAt), 'dd MMM HH:mm')}
                </KineticText>
              </View>
              <KineticText variant="h3" bold style={{ marginTop: 4 }}>
                {n.title}
              </KineticText>
              <KineticText variant="caption" color={COLORS.mutedForeground} style={{ marginTop: 2 }}>
                {n.body}
              </KineticText>
            </View>
          ))}
        </KineticCard>

        {/* Semester Rollover Section */}
        <View style={styles.sectionHeader}>
          <KineticText variant="h1" bold uppercase>
            SEMESTER MANAGEMENT
          </KineticText>
        </View>

        <KineticCard style={styles.card}>
          <View style={styles.cardHeader}>
            <Layers size={20} color={COLORS.acidYellow} />
            <KineticText variant="h2" bold style={{ marginLeft: 8 }}>
              Active Semesters ({semesters.length})
            </KineticText>
          </View>

          <KineticText variant="body" color={COLORS.mutedForeground} style={{ marginVertical: 8 }}>
            Move to a higher semester without losing your historical attendance data.
          </KineticText>

          {semesters.map((sem) => (
            <View key={sem.id} style={styles.semItem}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <KineticText variant="h3" bold numberOfLines={1}>
                  Sem {sem.semesterNumber} ({sem.section}) - {sem.academicYear}
                </KineticText>
                <KineticText variant="caption" color={COLORS.mutedForeground} numberOfLines={1}>
                  Target: {sem.targetPercentage}%
                </KineticText>
              </View>
              {sem.id === profile?.currentSemesterId ? (
                <StatusBadge status="SAFE" label="CURRENT" size="sm" />
              ) : (
                <StatusBadge status="CANCELLED" label="ARCHIVED" size="sm" />
              )}
            </View>
          ))}

          <KineticButton
            title="START NEW SEMESTER ROLLOVER"
            variant="primary"
            size="md"
            onPress={() => setShowNewSemModal(true)}
            style={{ marginTop: 12 }}
          />
        </KineticCard>

        {/* Data Backup */}
        <View style={[styles.sectionHeader, { marginTop: 20 }]}>
          <KineticText variant="h1" bold uppercase>
            DATA & BACKUP
          </KineticText>
        </View>

        <KineticCard style={styles.card}>
          <KineticButton
            title="EXPORT TIMETABLE JSON"
            variant="secondary"
            size="md"
            icon={<Download size={16} color={COLORS.foreground} />}
            onPress={() => Alert.alert('Export', 'Timetable JSON exported to local storage.')}
            style={{ marginBottom: 10 }}
          />
        </KineticCard>

        {/* Account Actions */}
        <View style={[styles.sectionHeader, { marginTop: 20 }]}>
          <KineticText variant="h1" bold uppercase color={COLORS.status.shortage}>
            DANGER ZONE
          </KineticText>
        </View>

        <KineticCard style={styles.card}>
          <KineticButton
            title="LOG OUT"
            variant="outline"
            size="md"
            icon={<LogOut size={16} color={COLORS.foreground} />}
            onPress={handleLogout}
            style={{ marginBottom: 10 }}
          />

          <KineticButton
            title="DELETE ACCOUNT PERMANENTLY"
            variant="danger"
            size="md"
            icon={<Trash2 size={16} color="#FFF" />}
            onPress={handleDeleteAccount}
          />
        </KineticCard>
      </ScrollView>

      {/* Edit Initial Subject Attendance Modal */}
      <Modal visible={!!editingSubject} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <KineticText variant="h1" bold uppercase color={COLORS.acidYellow}>
              PREVIOUS ATTENDANCE COUNTS
            </KineticText>
            <KineticText variant="body" color={COLORS.mutedForeground} style={{ marginTop: 4, marginBottom: 16 }}>
              Set past unrecorded attendance for {editingSubject?.name} ({editingSubject?.code}).
            </KineticText>

            <View style={{ marginBottom: 12 }}>
              <KineticText variant="caption" bold uppercase color={COLORS.foreground} style={{ marginBottom: 4 }}>
                PAST CONDUCTED CLASSES
              </KineticText>
              <TextInput
                style={styles.input}
                value={initConducted}
                onChangeText={setInitConducted}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={COLORS.mutedForeground}
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <KineticText variant="caption" bold uppercase color={COLORS.foreground} style={{ marginBottom: 4 }}>
                PAST ATTENDED CLASSES
              </KineticText>
              <TextInput
                style={styles.input}
                value={initAttended}
                onChangeText={setInitAttended}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={COLORS.mutedForeground}
              />
            </View>

            <KineticButton
              title="SAVE INITIAL COUNTS"
              variant="primary"
              size="lg"
              onPress={handleSaveSubjectInitialAttendance}
              style={{ marginBottom: 8 }}
            />

            <KineticButton
              title="CANCEL"
              variant="outline"
              size="md"
              onPress={() => setEditingSubject(null)}
            />
          </View>
        </View>
      </Modal>

      {/* Add Reminder Modal */}
      <Modal visible={showAddReminderModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <KineticText variant="h1" bold uppercase color={COLORS.acidYellow}>
              ADD NEW REMINDER
            </KineticText>

            {/* Quick Timetable Subject Picker */}
            <View style={{ marginTop: 14 }}>
              <KineticText variant="caption" bold uppercase color={COLORS.foreground} style={{ marginBottom: 6 }}>
                LINK TO TIMETABLE CLASS (OPTIONAL)
              </KineticText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                {subjects.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    activeOpacity={0.7}
                    onPress={() => {
                      setReminderSubjectId(s.id);
                      setReminderTitle(`${s.name} Class`);
                      if (s.room) setReminderDesc(`Room: ${s.room}`);
                    }}
                    style={[
                      styles.subjectChip,
                      reminderSubjectId === s.id && styles.subjectChipActive,
                    ]}
                  >
                    <KineticText
                      variant="caption"
                      bold
                      color={reminderSubjectId === s.id ? '#000' : COLORS.foreground}
                    >
                      {s.code}
                    </KineticText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={{ marginTop: 8 }}>
              <KineticText variant="caption" bold uppercase color={COLORS.foreground} style={{ marginBottom: 4 }}>
                REMINDER TITLE
              </KineticText>
              <TextInput
                style={styles.input}
                value={reminderTitle}
                onChangeText={setReminderTitle}
                placeholder="e.g. DBMS Lab Assignment / Class Test"
                placeholderTextColor={COLORS.mutedForeground}
              />
            </View>

            <View style={{ marginTop: 12 }}>
              <KineticText variant="caption" bold uppercase color={COLORS.foreground} style={{ marginBottom: 4 }}>
                DESCRIPTION (OPTIONAL)
              </KineticText>
              <TextInput
                style={styles.input}
                value={reminderDesc}
                onChangeText={setReminderDesc}
                placeholder="Details or notes..."
                placeholderTextColor={COLORS.mutedForeground}
              />
            </View>

            {/* Date & Time Selectors */}
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 6, marginTop: 12 }}>
                <KineticText variant="caption" bold uppercase color={COLORS.foreground} style={{ marginBottom: 4 }}>
                  DATE (YYYY-MM-DD)
                </KineticText>
                <TextInput
                  style={styles.input}
                  value={reminderDateStr}
                  onChangeText={setReminderDateStr}
                  placeholder="2026-09-20"
                  placeholderTextColor={COLORS.mutedForeground}
                />
              </View>

              <View style={{ flex: 1, marginLeft: 6, marginTop: 12 }}>
                <KineticText variant="caption" bold uppercase color={COLORS.foreground} style={{ marginBottom: 4 }}>
                  TIME (HH:MM)
                </KineticText>
                <TextInput
                  style={styles.input}
                  value={reminderTimeStr}
                  onChangeText={setReminderTimeStr}
                  placeholder="09:00"
                  placeholderTextColor={COLORS.mutedForeground}
                />
              </View>
            </View>

            {/* Quick Date Presets */}
            <View style={{ flexDirection: 'row', marginTop: 10, justifyContent: 'space-between' }}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setReminderDateStr(format(addDays(new Date(), 1), 'yyyy-MM-dd'))}
                style={styles.presetChip}
              >
                <KineticText variant="caption" bold color={COLORS.acidYellow}>TOMORROW</KineticText>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setReminderDateStr(format(addDays(new Date(), 2), 'yyyy-MM-dd'))}
                style={styles.presetChip}
              >
                <KineticText variant="caption" bold color={COLORS.acidYellow}>IN 2 DAYS</KineticText>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setReminderDateStr(format(addDays(new Date(), 7), 'yyyy-MM-dd'))}
                style={styles.presetChip}
              >
                <KineticText variant="caption" bold color={COLORS.acidYellow}>IN 1 WEEK</KineticText>
              </TouchableOpacity>
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
              onPress={() => setShowAddReminderModal(false)}
              style={{ marginTop: 8 }}
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Start New Semester Modal */}
      <Modal visible={showNewSemModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <KineticText variant="h1" bold uppercase color={COLORS.acidYellow}>
              START NEW SEMESTER
            </KineticText>
            <KineticText variant="body" color={COLORS.mutedForeground} style={{ marginTop: 4, marginBottom: 12 }}>
              Previous attendance records will be safely archived and accessible.
            </KineticText>

            <View style={{ marginTop: 8 }}>
              <KineticText variant="caption" bold uppercase color={COLORS.foreground} style={{ marginBottom: 4 }}>
                NEW SEMESTER NUMBER
              </KineticText>
              <TextInput
                style={styles.input}
                value={newSemNum}
                onChangeText={setNewSemNum}
                keyboardType="numeric"
              />
            </View>

            <View style={{ marginTop: 12 }}>
              <KineticText variant="caption" bold uppercase color={COLORS.foreground} style={{ marginBottom: 4 }}>
                ACADEMIC YEAR
              </KineticText>
              <TextInput
                style={styles.input}
                value={newAcadYear}
                onChangeText={setNewAcadYear}
              />
            </View>

            <View style={{ marginTop: 12 }}>
              <KineticText variant="caption" bold uppercase color={COLORS.foreground} style={{ marginBottom: 4 }}>
                SECTION
              </KineticText>
              <TextInput
                style={styles.input}
                value={newSection}
                onChangeText={setNewSection}
              />
            </View>

            <KineticButton
              title="ACTIVATE NEW SEMESTER"
              variant="primary"
              size="lg"
              onPress={handleStartNewSemester}
              style={{ marginTop: 20 }}
            />

            <KineticButton
              title="CANCEL"
              variant="outline"
              size="md"
              onPress={() => setShowNewSemModal(false)}
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: BORDERS.thin,
    borderBottomColor: COLORS.border,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  card: {
    marginBottom: 16,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: BORDERS.thin,
    borderBottomColor: COLORS.border,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  backfillSubjectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: COLORS.mutedSurface,
    borderWidth: BORDERS.thin,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  electiveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: COLORS.mutedSurface,
    borderWidth: BORDERS.thin,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  electiveItemActive: {
    borderColor: COLORS.acidYellow,
    borderWidth: BORDERS.thick,
  },
  editBtnBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: BORDERS.thin,
    borderColor: COLORS.acidYellow,
    backgroundColor: COLORS.cardSurface,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: BORDERS.thin,
    borderBottomColor: COLORS.border,
    marginBottom: 12,
  },
  subSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  inlineAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.acidYellow,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  remItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: BORDERS.thin,
    borderBottomColor: COLORS.border,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: COLORS.mutedForeground,
  },
  notifItem: {
    backgroundColor: COLORS.mutedSurface,
    padding: 10,
    borderWidth: BORDERS.thin,
    borderColor: COLORS.border,
    marginBottom: 6,
  },
  unreadNotif: {
    borderColor: COLORS.acidYellow,
    borderWidth: BORDERS.thick,
  },
  notifHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  semItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: COLORS.mutedSurface,
    borderWidth: BORDERS.thin,
    borderColor: COLORS.border,
    marginBottom: 6,
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
  row: {
    flexDirection: 'row',
  },
  subjectChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: COLORS.mutedSurface,
    borderWidth: BORDERS.thin,
    borderColor: COLORS.border,
    marginRight: 6,
  },
  subjectChipActive: {
    backgroundColor: COLORS.acidYellow,
    borderColor: COLORS.acidYellow,
  },
  presetChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    backgroundColor: COLORS.mutedSurface,
    borderWidth: BORDERS.thin,
    borderColor: COLORS.border,
    marginHorizontal: 2,
  },
});
