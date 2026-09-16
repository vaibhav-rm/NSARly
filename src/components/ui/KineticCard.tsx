import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { COLORS, BORDERS } from '../../constants/theme';

export interface KineticCardProps {
  children: React.ReactNode;
  accent?: boolean;
  bordered?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const KineticCard: React.FC<KineticCardProps> = ({
  children,
  accent = false,
  bordered = true,
  style,
}) => {
  return (
    <View
      style={[
        styles.card,
        bordered && styles.border,
        accent && styles.accentBorder,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardSurface,
    padding: 16,
    borderRadius: BORDERS.radius,
  },
  border: {
    borderWidth: BORDERS.thin,
    borderColor: COLORS.border,
  },
  accentBorder: {
    borderWidth: BORDERS.thick,
    borderColor: COLORS.acidYellow,
  },
});
