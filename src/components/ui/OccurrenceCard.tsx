import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { ClassOccurrence, AttendanceStatus, NotHeldReason } from '../../types/attendance';
import { KineticText } from './KineticText';
import { StatusBadge } from './StatusBadge';
import { COLORS, BORDERS } from '../../constants/theme';
import { Check, X, Ban, MapPin, User, RotateCcw } from 'lucide-react-native';

export interface OccurrenceCardProps {
  occurrence: ClassOccurrence;
  subjectPercentage?: number;
  onUpdateStatus: (occurrenceId: string, status: AttendanceStatus, reason?: NotHeldReason) => void;
}

const REASONS: { key: NotHeldReason; label: string }[] = [
  { key: 'LECTURER_ABSENT', label: 'Lecturer Absent' },
  { key: 'COLLEGE_EVENT', label: 'College Event / Fest' },
  { key: 'HOLIDAY', label: 'Official Holiday' },
  { key: 'ROOM_UNAVAILABLE', label: 'Room Unavailable' },
  { key: 'CLASS_SHIFTED', label: 'Class Rescheduled' },
  { key: 'OTHER', label: 'Other Reason' },
];

export const OccurrenceCard: React.FC<OccurrenceCardProps> = ({
  occurrence,
  subjectPercentage,
  onUpdateStatus,
}) => {
  const [showReasonModal, setShowReasonModal] = useState(false);

  const handleNotHeldSelect = (reason: NotHeldReason) => {
    setShowReasonModal(false);
    onUpdateStatus(occurrence.id, 'CANCELLED', reason);
  };

  return (
    <View
      style={[
        styles.card,
        occurrence.status === 'PRESENT' && styles.borderPresent,
        occurrence.status === 'ABSENT' && styles.borderAbsent,
        occurrence.status === 'CANCELLED' && styles.borderCancelled,
      ]}
    >
      {/* Top Header: Course Code & Time */}
      <View style={styles.header}>
        <View style={styles.codeContainer}>
          <KineticText variant="caption" bold uppercase color={COLORS.acidYellow}>
            {occurrence.courseCode}
          </KineticText>
          <KineticText variant="caption" color={COLORS.mutedForeground} numberOfLines={1} style={{ marginLeft: 8, flexShrink: 1 }}>
            {occurrence.startTime} - {occurrence.endTime}
          </KineticText>
        </View>

        {subjectPercentage !== undefined && (
          <View style={styles.pctBadge}>
            <KineticText variant="caption" bold color={COLORS.foreground}>
              {subjectPercentage}%
            </KineticText>
          </View>
        )}
      </View>

      {/* Subject Title */}
      <KineticText variant="h2" bold style={styles.title}>
        {occurrence.subjectName}
      </KineticText>

      {/* Metadata Row: Room & Faculty */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <MapPin size={13} color={COLORS.mutedForeground} />
          <KineticText variant="caption" color={COLORS.mutedForeground} numberOfLines={1} style={{ marginLeft: 4, flexShrink: 1 }}>
            {occurrence.room}
          </KineticText>
        </View>

        {occurrence.facultyName ? (
          <View style={styles.metaItem}>
            <User size={13} color={COLORS.mutedForeground} />
            <KineticText variant="caption" color={COLORS.mutedForeground} numberOfLines={1} style={{ marginLeft: 4, flexShrink: 1 }}>
              {occurrence.facultyName}
            </KineticText>
          </View>
        ) : null}
      </View>

      {/* Status Bar / Marking Actions */}
      <View style={styles.actionSection}>
        {occurrence.status !== 'PENDING' ? (
          <View style={styles.statusRow}>
            <StatusBadge
              status={
                occurrence.status === 'CANCELLED'
                  ? 'CANCELLED'
                  : occurrence.status === 'PRESENT'
                  ? 'SAFE'
                  : 'SHORTAGE'
              }
              label={
                occurrence.status === 'CANCELLED'
                  ? `NOT HELD (${occurrence.notHeldReason || 'CANCELLED'})`
                  : occurrence.status
              }
            />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onUpdateStatus(occurrence.id, 'PENDING')}
              style={styles.undoBtn}
            >
              <RotateCcw size={14} color={COLORS.mutedForeground} />
              <KineticText variant="caption" color={COLORS.mutedForeground} style={{ marginLeft: 4 }}>
                UNDO
              </KineticText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.btnGroup}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onUpdateStatus(occurrence.id, 'PRESENT')}
              style={[styles.btn, styles.presentBtn]}
            >
              <Check size={14} color="#000000" />
              <KineticText variant="caption" bold color="#000000" numberOfLines={1} style={{ marginLeft: 4 }}>
                PRESENT
              </KineticText>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onUpdateStatus(occurrence.id, 'ABSENT')}
              style={[styles.btn, styles.absentBtn]}
            >
              <X size={14} color="#FFFFFF" />
              <KineticText variant="caption" bold color="#FFFFFF" numberOfLines={1} style={{ marginLeft: 4 }}>
                ABSENT
              </KineticText>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowReasonModal(true)}
              style={[styles.btn, styles.notHeldBtn]}
            >
              <Ban size={14} color={COLORS.foreground} />
              <KineticText variant="caption" bold color={COLORS.foreground} numberOfLines={1} style={{ marginLeft: 4 }}>
                NOT HELD
              </KineticText>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Reason Picker Modal */}
      <Modal
        visible={showReasonModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReasonModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <KineticText variant="h2" bold uppercase color={COLORS.acidYellow}>
              LECTURER SKIPPED / NOT HELD
            </KineticText>
            <KineticText variant="body" color={COLORS.mutedForeground} style={{ marginTop: 4, marginBottom: 16 }}>
              Select a reason for excluding {occurrence.subjectName} on {occurrence.date} from attendance calculations.
            </KineticText>

            {REASONS.map((r) => (
              <TouchableOpacity
                key={r.key}
                activeOpacity={0.7}
                onPress={() => handleNotHeldSelect(r.key)}
                style={styles.reasonOption}
              >
                <KineticText variant="h3" color={COLORS.foreground}>
                  {r.label}
                </KineticText>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowReasonModal(false)}
              style={styles.cancelModalBtn}
            >
              <KineticText variant="caption" bold color={COLORS.mutedForeground} uppercase>
                CANCEL
              </KineticText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardSurface,
    padding: 14,
    borderWidth: BORDERS.thin,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  borderPresent: {
    borderLeftWidth: BORDERS.heavy,
    borderLeftColor: COLORS.status.safe,
  },
  borderAbsent: {
    borderLeftWidth: BORDERS.heavy,
    borderLeftColor: COLORS.status.shortage,
  },
  borderCancelled: {
    borderLeftWidth: BORDERS.heavy,
    borderLeftColor: COLORS.status.cancelled,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: 8,
  },
  pctBadge: {
    backgroundColor: COLORS.mutedSurface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: BORDERS.thin,
    borderColor: COLORS.border,
    alignSelf: 'flex-start',
  },
  title: {
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 1,
  },
  actionSection: {
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  undoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    marginLeft: 8,
  },
  btnGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 2,
    marginHorizontal: 2,
    borderWidth: BORDERS.thin,
  },
  presentBtn: {
    backgroundColor: COLORS.status.safe,
    borderColor: COLORS.status.safe,
  },
  absentBtn: {
    backgroundColor: COLORS.status.shortage,
    borderColor: COLORS.status.shortage,
  },
  notHeldBtn: {
    backgroundColor: COLORS.mutedSurface,
    borderColor: COLORS.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: COLORS.cardSurface,
    borderWidth: BORDERS.thick,
    borderColor: COLORS.acidYellow,
    padding: 20,
  },
  reasonOption: {
    backgroundColor: COLORS.mutedSurface,
    padding: 14,
    borderWidth: BORDERS.thin,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  cancelModalBtn: {
    marginTop: 8,
    padding: 12,
    alignItems: 'center',
  },
});
