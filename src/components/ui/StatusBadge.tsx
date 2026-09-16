import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, BORDERS } from '../../constants/theme';
import { KineticText } from './KineticText';

export type StatusCategory = 'SAFE' | 'AT_RISK' | 'SHORTAGE' | 'CANCELLED' | 'PENDING' | 'NO_DATA' | 'EXCUSED';

export interface StatusBadgeProps {
  status: StatusCategory;
  label?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
}) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'SAFE':
        return {
          bg: COLORS.status.safe + '22', // 13% opacity tint
          color: COLORS.status.safe,
          border: COLORS.status.safe,
          text: label || 'SAFE',
        };
      case 'AT_RISK':
        return {
          bg: COLORS.status.atRisk + '22',
          color: COLORS.status.atRisk,
          border: COLORS.status.atRisk,
          text: label || 'AT RISK',
        };
      case 'SHORTAGE':
        return {
          bg: COLORS.status.shortage + '22',
          color: COLORS.status.shortage,
          border: COLORS.status.shortage,
          text: label || 'SHORTAGE',
        };
      case 'CANCELLED':
        return {
          bg: COLORS.status.cancelled + '22',
          color: COLORS.status.cancelled,
          border: COLORS.status.cancelled,
          text: label || 'NOT HELD',
        };
      case 'EXCUSED':
        return {
          bg: COLORS.status.excused + '22',
          color: COLORS.status.excused,
          border: COLORS.status.excused,
          text: label || 'EXCUSED',
        };
      case 'PENDING':
        return {
          bg: COLORS.status.pending + '22',
          color: COLORS.status.pending,
          border: COLORS.status.pending,
          text: label || 'NOT MARKED',
        };
      default:
        return {
          bg: COLORS.mutedSurface,
          color: COLORS.mutedForeground,
          border: COLORS.border,
          text: label || 'NO DATA',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg, borderColor: config.border },
        size === 'sm' && styles.sm,
      ]}
    >
      <KineticText
        variant="caption"
        color={config.color}
        bold
        uppercase
        numberOfLines={1}
        style={size === 'sm' ? styles.smText : null}
      >
        {config.text}
      </KineticText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: BORDERS.thin,
    borderRadius: BORDERS.radius,
    alignSelf: 'flex-start',
    flexShrink: 1,
  },
  sm: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  smText: {
    fontSize: 10,
  },
});
