import React from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { COLORS, BORDERS } from '../../constants/theme';
import { KineticText } from './KineticText';

export interface KineticButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const KineticButton: React.FC<KineticButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const getContainerStyle = (): ViewStyle => {
    let base: ViewStyle = { ...styles.button };

    if (size === 'sm') base = { ...base, ...styles.sm };
    if (size === 'lg') base = { ...base, ...styles.lg };

    switch (variant) {
      case 'primary':
        return {
          ...base,
          backgroundColor: COLORS.acidYellow,
          borderColor: COLORS.acidYellow,
        };
      case 'secondary':
        return {
          ...base,
          backgroundColor: COLORS.cardSurface,
          borderColor: COLORS.border,
        };
      case 'outline':
        return {
          ...base,
          backgroundColor: 'transparent',
          borderColor: COLORS.border,
        };
      case 'danger':
        return {
          ...base,
          backgroundColor: COLORS.status.shortage,
          borderColor: COLORS.status.shortage,
        };
      case 'success':
        return {
          ...base,
          backgroundColor: COLORS.status.safe,
          borderColor: COLORS.status.safe,
        };
    }
  };

  const getTextColor = (): string => {
    if (variant === 'primary') return COLORS.accentForeground;
    if (variant === 'danger' || variant === 'success') return '#FFFFFF';
    return COLORS.foreground;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[getContainerStyle(), disabled && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon}
          <KineticText
            variant={size === 'lg' ? 'h2' : size === 'sm' ? 'caption' : 'h3'}
            color={getTextColor()}
            uppercase
            bold
            numberOfLines={1}
            style={[icon ? { marginLeft: 8 } : null, textStyle]}
          >
            {title}
          </KineticText>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: BORDERS.thick,
    borderRadius: BORDERS.radius,
  },
  sm: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  lg: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  disabled: {
    opacity: 0.5,
  },
});
