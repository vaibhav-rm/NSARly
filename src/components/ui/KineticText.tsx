import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

export interface KineticTextProps extends RNTextProps {
  variant?: 'hero' | 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'mono';
  color?: string;
  uppercase?: boolean;
  bold?: boolean;
}

export const KineticText: React.FC<KineticTextProps> = ({
  children,
  variant = 'body',
  color = COLORS.foreground,
  uppercase = false,
  bold = false,
  style,
  ...props
}) => {
  const getStyle = () => {
    switch (variant) {
      case 'hero':
        return styles.hero;
      case 'display':
        return styles.display;
      case 'h1':
        return styles.h1;
      case 'h2':
        return styles.h2;
      case 'h3':
        return styles.h3;
      case 'caption':
        return styles.caption;
      case 'mono':
        return styles.mono;
      default:
        return styles.body;
    }
  };

  return (
    <RNText
      style={[
        getStyle(),
        { color },
        bold && styles.boldText,
        uppercase && styles.uppercaseText,
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  hero: {
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: -2,
    lineHeight: 60,
  },
  display: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1.5,
    lineHeight: 44,
  },
  h1: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  mono: {
    fontSize: 13,
    fontFamily: 'PlatformMono',
    letterSpacing: 0,
  },
  boldText: {
    fontWeight: '700',
  },
  uppercaseText: {
    textTransform: 'uppercase',
  },
});
