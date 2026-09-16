import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { KineticText } from './KineticText';
import { COLORS, BORDERS } from '../../constants/theme';
import { Bell, ChevronDown } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export interface SemesterHeaderProps {
  collegeName?: string;
  branchName?: string;
  semesterNumber?: number;
  section?: string;
  unreadNotificationsCount?: number;
  onOpenSemesterModal?: () => void;
}

export const SemesterHeader: React.FC<SemesterHeaderProps> = ({
  collegeName = 'RVCE',
  branchName = 'CSE',
  semesterNumber = 5,
  section = 'D',
  unreadNotificationsCount = 0,
  onOpenSemesterModal,
}) => {
  const router = useRouter();

  const shortCollege = collegeName.includes('(')
    ? collegeName.split('(')[1].replace(')', '')
    : collegeName;

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        <KineticText variant="h1" bold uppercase color={COLORS.acidYellow}>
          NSAR<KineticText variant="h1" color={COLORS.foreground}>ly</KineticText>
        </KineticText>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onOpenSemesterModal}
          style={styles.pill}
        >
          <KineticText
            variant="caption"
            bold
            color={COLORS.foreground}
            uppercase
            numberOfLines={1}
            style={{ flexShrink: 1 }}
          >
            {shortCollege} • {branchName.split(' ')[0]} SEM {semesterNumber} ({section})
          </KineticText>
          <ChevronDown size={14} color={COLORS.acidYellow} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push('/(tabs)/settings')}
        style={styles.bellButton}
      >
        <Bell size={20} color={COLORS.foreground} />
        {unreadNotificationsCount > 0 && (
          <View style={styles.unreadBadge}>
            <KineticText variant="caption" color="#000" bold style={{ fontSize: 9 }}>
              {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
            </KineticText>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: COLORS.background,
    borderBottomWidth: BORDERS.thin,
    borderBottomColor: COLORS.border,
  },
  left: {
    flex: 1,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardSurface,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: BORDERS.thin,
    borderColor: COLORS.border,
    marginTop: 4,
    alignSelf: 'flex-start',
    maxWidth: '90%',
    flexShrink: 1,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderWidth: BORDERS.thin,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.acidYellow,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
