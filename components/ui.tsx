import React, { ReactNode, useEffect, useRef } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const C = {
  background: '#071328',
  backgroundSoft: '#0B1A33',
  surface: '#10213E',
  surfaceRaised: '#152949',
  border: '#203656',
  text: '#F4F7FC',
  muted: '#9AABC4',
  subtle: '#7186A5',
  mint: '#69E0BE',
  mintDark: '#163E43',
  blue: '#82B6FF',
  blueDark: '#172F52',
  coral: '#FF9C9C',
  coralDark: '#452B3D',
  amber: '#F3C978',
  amberDark: '#453A2C',
  white: '#FFFFFF',
  danger: '#FF8F9C',
};

export function AppScreen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function BrandHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>N</Text>
        </View>
        <Text style={styles.brandName}>NOVA SANTÉ</Text>
        {action ? <View style={styles.headerAction}>{action}</View> : null}
      </View>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.pageTitle}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Surface({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.surface, style]}>{children}</View>;
}

export function SectionTitle({
  title,
  detail,
  action,
}: {
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.sectionHeading}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {detail ? <Text style={styles.sectionDetail}>{detail}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function TextField({
  label,
  hint,
  style,
  ...props
}: TextInputProps & { label?: string; hint?: string }) {
  return (
    <View style={styles.fieldWrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={C.subtle}
        selectionColor={C.mint}
        style={[styles.input, style]}
        {...props}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function ActionButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled = false,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.78}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'quiet' && styles.buttonQuiet,
        variant === 'danger' && styles.buttonDanger,
        disabled && styles.buttonDisabled,
        style,
      ]}
    >
      {icon}
      <Text
        style={[
          styles.buttonText,
          variant === 'secondary' && styles.buttonSecondaryText,
          variant === 'quiet' && styles.buttonQuietText,
          variant === 'danger' && styles.buttonDangerText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function Tag({
  children,
  color = C.mint,
  background = C.mintDark,
}: {
  children: ReactNode;
  color?: string;
  background?: string;
}) {
  return (
    <View style={[styles.tag, { backgroundColor: background }]}>
      <Text style={[styles.tagText, { color }]}>{children}</Text>
    </View>
  );
}

export function MetricTile({
  label,
  value,
  unit,
  caption,
  accent = C.mint,
}: {
  label: string;
  value: string;
  unit?: string;
  caption?: string;
  accent?: string;
}) {
  return (
    <View style={styles.metricTile}>
      <View style={[styles.metricDot, { backgroundColor: accent }]} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>
        {value}
        {unit ? <Text style={styles.metricUnit}> {unit}</Text> : null}
      </Text>
      {caption ? <Text style={styles.metricCaption}>{caption}</Text> : null}
    </View>
  );
}

export function ProgressTrack({
  progress,
  color = C.mint,
}: {
  progress: number;
  color?: string;
}) {
  const safeProgress = Math.min(100, Math.max(0, progress));
  return (
    <View style={styles.track}>
      <View style={[styles.trackFill, { width: `${safeProgress}%`, backgroundColor: color }]} />
    </View>
  );
}

export function AnimatedIn({
  children,
  delay = 0,
  style,
}: {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const offset = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(offset, {
        toValue: 0,
        duration: 420,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, offset, opacity]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY: offset }] }]}>
      {children}
    </Animated.View>
  );
}

export function TrendBars({
  data,
  color = C.mint,
}: {
  data: { label: string; value: number; color?: string }[];
  color?: string;
}) {
  if (!data.length) return null;
  const max = Math.max(...data.map(item => item.value), 1);
  return (
    <View style={styles.chart}>
      {data.map((item, index) => {
        const height = item.value > 0 ? Math.max(8, (item.value / max) * 82) : 0;
        return (
          <View key={`${item.label}-${index}`} style={styles.barColumn}>
            <Text style={styles.barValue}>{item.value}</Text>
            <View style={styles.barTrack}>
              <AnimatedIn delay={index * 45} style={[styles.animatedBar, { height }]}>
                <View style={[styles.barFill, { backgroundColor: item.color || color }]} />
              </AnimatedIn>
            </View>
            <Text numberOfLines={1} style={styles.barLabel}>{item.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function EmptyState({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyGlyph}>
        <Text style={styles.emptyGlyphText}>✦</Text>
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDetail}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  content: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
  },
  header: { marginBottom: 22 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: C.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  brandMarkText: { color: C.background, fontSize: 17, fontWeight: '900' },
  brandName: { color: C.muted, fontSize: 11, fontWeight: '800', letterSpacing: 2.1 },
  headerAction: { marginLeft: 'auto' },
  eyebrow: { color: C.mint, fontSize: 10, fontWeight: '800', letterSpacing: 1.8, marginBottom: 7 },
  pageTitle: { color: C.text, fontSize: 29, lineHeight: 35, fontWeight: '800', letterSpacing: -0.6 },
  subtitle: { color: C.muted, fontSize: 13, lineHeight: 19, marginTop: 5 },
  surface: {
    backgroundColor: C.surface,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
  },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: 13 },
  sectionTitle: { color: C.text, fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  sectionDetail: { color: C.muted, fontSize: 12, marginTop: 4 },
  label: { color: C.muted, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  fieldWrap: { marginBottom: 15 },
  input: {
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: C.backgroundSoft,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    color: C.text,
    fontSize: 16,
  },
  hint: { color: C.subtle, fontSize: 11, lineHeight: 16, marginTop: 7 },
  button: {
    minHeight: 48,
    borderRadius: 15,
    backgroundColor: C.mint,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: { color: C.background, fontSize: 14, fontWeight: '800' },
  buttonSecondary: { backgroundColor: C.surfaceRaised, borderColor: C.border, borderWidth: 1 },
  buttonSecondaryText: { color: C.text },
  buttonQuiet: { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.border },
  buttonQuietText: { color: C.muted },
  buttonDanger: { backgroundColor: C.coralDark },
  buttonDangerText: { color: C.coral },
  buttonDisabled: { opacity: 0.55 },
  tag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99 },
  tagText: { fontSize: 11, fontWeight: '800' },
  metricTile: {
    flex: 1,
    minHeight: 104,
    backgroundColor: C.surface,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: C.border,
    padding: 13,
  },
  metricDot: { width: 7, height: 7, borderRadius: 5, marginBottom: 10 },
  metricLabel: { color: C.muted, fontSize: 11, fontWeight: '600' },
  metricValue: { color: C.text, fontSize: 23, fontWeight: '800', marginTop: 4 },
  metricUnit: { color: C.muted, fontSize: 12, fontWeight: '600' },
  metricCaption: { color: C.subtle, fontSize: 10, marginTop: 4 },
  track: { height: 7, backgroundColor: C.backgroundSoft, borderRadius: 8, overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 8 },
  chart: { height: 138, flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingTop: 7 },
  barColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  barValue: { color: C.muted, fontSize: 9, marginBottom: 5 },
  barTrack: { height: 88, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  animatedBar: { width: 15 },
  barFill: { width: '100%', height: '100%', borderRadius: 8 },
  barLabel: { color: C.subtle, fontSize: 9, marginTop: 7, maxWidth: 42 },
  empty: { alignItems: 'center', paddingVertical: 27, paddingHorizontal: 18 },
  emptyGlyph: {
    height: 38,
    width: 38,
    borderRadius: 14,
    backgroundColor: C.surfaceRaised,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyGlyphText: { color: C.mint, fontSize: 18 },
  emptyTitle: { color: C.text, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  emptyDetail: { color: C.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 5 },
});
