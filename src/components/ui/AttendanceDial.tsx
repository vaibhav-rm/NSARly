import React from 'react';
import { View, StyleSheet } from 'react-native';
import { KineticText } from './KineticText';
import { StatusBadge, StatusCategory } from './StatusBadge';
import { COLORS, BORDERS } from '../../constants/theme';

export interface AttendanceDialProps {
  percentage: number;
  targetPercentage: number;
  statusCategory: StatusCategory;
  statusMessage: string;
  hasData: boolean;
}

export const AttendanceDial: React.FC<AttendanceDialProps> = ({
  percentage,
  targetPercentage,
  statusCategory,
  statusMessage,
  hasData,
}) => {
  const getPercentageColor = () => {
    if (!hasData) return COLORS.mutedForeground;
    switch (statusCategory) {
      case 'SAFE':
        return COLORS.acidYellow;
      case 'AT_RISK':
        return COLORS.status.atRisk;
      case 'SHORTAGE':
        return COLORS.status.shortage;
      default:
        return COLORS.foreground;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <StatusBadge status={statusCategory} />
        <View style={styles.targetBadge}>
          <KineticText variant="caption" bold color={COLORS.mutedForeground}>
            TARGET: {targetPercentage}%
          </KineticText>
        </View>
      </View>

      <View style={styles.heroRow}>
        <KineticText
          variant="hero"
          bold
          color={getPercentageColor()}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          style={styles.heroText}
        >
          {hasData ? `${percentage}%` : 'N/A'}
        </KineticText>
      </View>

      <View style={styles.messageBox}>
        <KineticText
          variant="h3"
          bold
          uppercase
          color={statusCategory === 'SHORTAGE' ? COLORS.status.shortage : COLORS.foreground}
        >
          {statusMessage}
        </KineticText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardSurface,
    padding: 20,
    borderWidth: BORDERS.thick,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  targetBadge: {
    backgroundColor: COLORS.mutedSurface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: BORDERS.thin,
    borderColor: COLORS.border,
  },
  heroRow: {
    marginVertical: 4,
  },
  heroText: {
    fontSize: 64,
    lineHeight: 68,
  },
  messageBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: BORDERS.thin,
    borderTopColor: COLORS.border,
  },
});
