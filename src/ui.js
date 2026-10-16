// Monochrome Financial Atelier UI kit — EXACT per Stitch 1126451746754138922.
// Cards r12 / panels r8 / pills; chips h26; search h36; toggle 36x20;
// dock h56 + raised FAB; header h56. MaterialIcons (same family as Stitch).
import { Alert, Animated, Easing, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { DS, C, font, T } from './theme';
import React from 'react';

export function notify(msg) {
  if (Platform.OS === 'web') {
    try { window.alert(msg); } catch {}
    return;
  }
  Alert.alert(msg);
}

export function confirmAct(title, msg, okLabel, fn) {
  if (Platform.OS === 'web') {
    try {
      if (window.confirm(`${title}\n\n${msg}`)) fn();
    } catch {}
    return;
  }
  Alert.alert(title, msg, [
    { text: 'Cancel', style: 'cancel' },
    { text: okLabel, style: 'destructive', onPress: fn },
  ]);
}

export function I({ name, size = 18, color = DS.on, style }) {
  return <MaterialIcons name={name} size={size} color={color} style={style} />;
}

function PressScale({ children, onPress, style, scaleTo = 0.97, hitSlop }) {
  const scale = React.useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      onPressIn={() => Animated.spring(scale, { toValue: scaleTo, friction: 5, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start()}
      style={style}
    >
      <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>
    </Pressable>
  );
}

// Primary: black pill (editor/sheets). Ghost: bordered glass pill. Danger: error pill.
export function Btn({ title, onPress, kind = 'primary', style }) {
  if (kind === 'ghost') {
    return (
      <PressScale onPress={onPress} style={[U.btnGhost, style]}>
        <Text style={U.btnGhostText}>{title}</Text>
      </PressScale>
    );
  }
  if (kind === 'danger') {
    return (
      <PressScale onPress={onPress} style={[U.btnDanger, style]}>
        <Text style={U.btnDangerText}>{title}</Text>
      </PressScale>
    );
  }
  return (
    <PressScale onPress={onPress} style={[U.btn, style]}>
      <Text style={U.btnText}>{title}</Text>
    </PressScale>
  );
}

// Tier-1 glass card: white/80 + strong blur + hairline, top sheen edge,
// crisp ambient shadow. r12, p20.
export function GlassCard({ children, style, intensity = 85 }) {
  return (
    <BlurView intensity={intensity} tint="light" style={[U.glass, style]}>
      {children}
    </BlurView>
  );
}

export function Card({ children, style }) {
  return <GlassCard style={style}>{children}</GlassCard>;
}

export function Section({ title, right, children, style }) {
  return (
    <View style={[U.section, style]}>
      <View style={U.sectionHead}>
        <Text style={U.sectionTitle}>{title}</Text>
        {right}
      </View>
      {children}
    </View>
  );
}

// Uppercase micro label: 10px/600/+0.6 muted.
export function Label({ children, style }) {
  return <Text style={[U.microLabel, style]}>{String(children).toUpperCase()}</Text>;
}

export function Field({ label, ...props }) {
  return (
    <View style={U.fieldWrap}>
      {!!label && <Text style={U.label}>{label}</Text>}
      <TextInput
        style={U.input}
        placeholderTextColor={DS.outline}
        {...props}
      />
    </View>
  );
}

// Exact Stitch search: h36, r8, white/90, hairline, icon 16 at left 12.
export function SearchBar({ value, onChange, placeholder = 'Search payees, categories...' }) {
  return (
    <View style={U.searchWrap}>
      <I name="search" size={16} color={DS.onVariant} />
      <TextInput
        style={U.searchInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={DS.outline}
      />
      {!!value && (
        <Pressable onPress={() => onChange('')} hitSlop={10} style={U.searchClearBtn}>
          <I name="close" size={11} color={DS.onVariant} />
        </Pressable>
      )}
    </View>
  );
}

export function Row({ children, style }) {
  return <View style={[U.row, style]}>{children}</View>;
}

// Exact filter chips: h26, r-full, 11px. Active: black/white. Inactive: white/muted.
export function Chip({ label, active, onPress, icon }) {
  return (
    <Pressable onPress={onPress} style={[U.chip, active && U.chipActive]}>
      {!!icon && <I name={icon} size={13} color={active ? '#fff' : DS.onVariant} style={{ marginRight: 4 }} />}
      <Text style={[U.chipText, active && U.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

// Exact progress: h configurable (6 home / 8 burn / 4 goal rows), track per context, fill black.
export function Prog({ pct, color, h = 6, track = DS.highest }) {
  const p = Math.max(0, Math.min(100, Number(pct) || 0));
  return (
    <View style={[U.track, { height: h, backgroundColor: track }]}>
      <View style={[U.fill, { width: `${p}%`, backgroundColor: color || DS.primary }]} />
    </View>
  );
}

export function Empty({ msg }) {
  return <Text style={U.empty}>{msg}</Text>;
}

// Exact iOS-style switch from Goals: 36x20, knob 16, off #e2e7ff, on black.
export function Toggle({ value, onChange }) {
  const anim = React.useRef(new Animated.Value(value ? 1 : 0)).current;
  React.useEffect(() => {
    Animated.timing(anim, { toValue: value ? 1 : 0, duration: 180, useNativeDriver: false }).start();
  }, [value, anim]);
  const bg = anim.interpolate({ inputRange: [0, 1], outputRange: [DS.high, DS.primary] });
  const tx = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 18] });
  return (
    <Pressable onPress={() => onChange(!value)} hitSlop={8}>
      <Animated.View style={[U.toggle, { backgroundColor: bg }]}>
        <Animated.View style={[U.knob, { transform: [{ translateX: tx }] }]} />
      </Animated.View>
    </Pressable>
  );
}

export function Sheet({ visible, onClose, title, children, wide }) {
  const translateY = React.useRef(new Animated.Value(300)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 250, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 250, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }
  }, [visible, translateY, opacity]);

  if (!visible) return null;
  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <View style={U.backdrop}>
        <Pressable style={U.backdropTap} onPress={onClose} />
        <Animated.View style={[U.sheet, wide && U.sheetWide, { transform: [{ translateY }], opacity }]}>
          <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill} />
          <View style={U.sheetHead}>
            <Text style={U.sheetTitle}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={U.sheetClose}>Done</Text>
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {children}
            <View style={{ height: 24 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Budgets-style month pill: calendar + full month label + chevron.
export function MonthPill({ label, onPrev, onNext, onPress }) {
  return (
    <Pressable onPress={onPress || onNext} style={U.monthPill}>
      <I name="calendar-today" size={16} color={DS.onVariant} />
      <Text style={U.monthLabel}>{label}</Text>
      <Pressable onPress={onPrev} hitSlop={10} style={{ paddingLeft: 2 }}>
        <Text style={{ fontSize: 0 }} />
      </Pressable>
      <I name="expand-more" size={16} color={DS.onVariant} />
    </Pressable>
  );
}

// Generic month stepper (More screen) in the same pill language.
export function MonthNav({ label, onPrev, onNext }) {
  return (
    <View style={U.monthPillRow}>
      <Pressable onPress={onPrev} hitSlop={12} style={U.monthArrow}>
        <Text style={U.monthArrowText}>‹</Text>
      </Pressable>
      <Text style={U.monthLabel}>{label}</Text>
      <Pressable onPress={onNext} hitSlop={12} style={U.monthArrow}>
        <Text style={U.monthArrowText}>›</Text>
      </Pressable>
    </View>
  );
}

// Slim greeting header: personal hello, no page name.
// Uses the profile name; falls back to Suraj.
export function SlimHeader({ name, onBell, onSettings }) {
  const hello = `Hi ${String(name || '').trim() || 'Suraj'}`;
  return (
    <View style={U.appHeader}>
      <View style={U.brandRow}>
        <View style={U.logo}>
          <Text style={U.logoText}>M</Text>
        </View>
        <Text style={U.headerTitle}>{hello}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Pressable onPress={onSettings} hitSlop={8} style={U.iconBtn} accessibilityLabel="Settings">
          <I name="settings" size={18} color={DS.onVariant} />
        </Pressable>
        <Pressable onPress={onBell} hitSlop={8} style={U.iconBtn} accessibilityLabel="Notifications">
          <I name="notifications" size={18} color={DS.onVariant} />
        </Pressable>
      </View>
    </View>
  );
}

// Back-compat alias (ignores the old per-page title).
export function AppHeader({ name, onBell, onSettings }) {
  return <SlimHeader name={name} onBell={onBell} onSettings={onSettings} />;
}

// Bento grid: systematic mixed-size tiles on a 2-column rhythm.
// Default child = half-width cell; <X span={2}> = full-width feature tile.
// The span prop is stripped before render so it never reaches native views.
export function Bento({ children, style }) {
  const kids = React.Children.toArray(children).filter((k) => k);
  if (!kids.length) return null;
  return (
    <View style={[U.bento, style]}>
      {kids.map((k, i) => {
        const wide = !!(k.props && k.props.span === 2);
        const clean = k.props && k.props.span ? React.cloneElement(k, { span: undefined }) : k;
        return (
          <View key={i} style={[U.bentoCell, wide && U.bentoCellWide]}>
            {clean}
          </View>
        );
      })}
    </View>
  );
}

// Smooth tab/page transition: gentle fade + rise, transform/opacity only.
export function FadeSlide({ id, children, style }) {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const dy = React.useRef(new Animated.Value(10)).current;
  React.useEffect(() => {
    opacity.setValue(0);
    dy.setValue(10);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(dy, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [id, opacity, dy]);
  return (
    <Animated.View style={[{ opacity, transform: [{ translateY: dy }] }, style]}>
      {children}
    </Animated.View>
  );
}

const DOCK = [
  { id: 'Home', icon: 'space-dashboard', label: 'Home' },
  { id: 'Activity', icon: 'receipt-long', label: 'Activity' },
  { id: 'Budgets', icon: 'donut-small', label: 'Budgets' },
  { id: 'Goals', icon: 'flag', label: 'Goals' },
];

// Exact floating dock: h56 pill, white/90 blur, raised 56px FAB on every tab.
const FABSIZE = 56;
const FABLIFT = 20;

export function FloatingDock({ tab, onGo, onAdd }) {
  const left = DOCK.slice(0, 2);
  const right = DOCK.slice(2);
  const item = (d) => {
    const active = tab === d.id;
    return (
      <Pressable key={d.id} onPress={() => onGo(d.id)} style={[U.dockTab, active && U.dockTabActive]}>
        <I name={d.icon} size={18} color={active ? DS.primary : DS.onVariant} />
        <Text style={[U.dockLabel, active && U.dockLabelActive]}>{d.label}</Text>
      </Pressable>
    );
  };
  return (
    <View style={U.dockWrap} pointerEvents="box-none">
      <BlurView intensity={100} tint="light" style={U.dock}>
        {left.map(item)}
        <View style={U.fabSlot}>
          <Pressable onPress={onAdd} style={[U.fab, { width: FABSIZE, height: FABSIZE, marginTop: -FABLIFT }]} accessibilityLabel="Add transaction">
            <I name="add" size={24} color="#fff" />
          </Pressable>
        </View>
        {right.map(item)}
      </BlurView>
    </View>
  );
}

export function Bars({ rows, format }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <View>
      {rows.map((r, i) => (
        <View key={`${r.label}-${i}`} style={U.barRow}>
          <Text style={U.barLabel} numberOfLines={1}>{r.label}</Text>
          <View style={U.barTrack}>
            <View style={[U.barFill, { width: `${(r.value / max) * 100}%`, backgroundColor: r.color || DS.primary }]} />
          </View>
          <Text style={U.barVal} numberOfLines={1}>{format ? format(r.value) : String(r.value)}</Text>
        </View>
      ))}
    </View>
  );
}

export const U = StyleSheet.create({
  btn: {
    backgroundColor: DS.primary,
    borderRadius: DS.radius.pill,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginVertical: 6,
  },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '600', fontFamily: font.bold },
  btnGhost: {
    backgroundColor: DS.glassCard,
    borderWidth: 1,
    borderColor: DS.hairline,
    borderRadius: DS.radius.pill,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginVertical: 6,
  },
  btnGhostText: { color: DS.on, fontSize: 14, fontWeight: '600', fontFamily: font.bold },
  btnDanger: { backgroundColor: DS.error, borderRadius: DS.radius.pill, height: 48, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 18, marginVertical: 6 },
  btnDangerText: { color: '#fff', fontSize: 14, fontWeight: '600', fontFamily: font.bold },

  glass: {
    borderRadius: DS.radius.card,
    borderWidth: 1,
    borderColor: DS.hairline,
    borderTopColor: 'rgba(255,255,255,0.95)',
    padding: 20,
    marginVertical: 6,
    overflow: 'hidden',
    backgroundColor: DS.glassCard,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
  },
  card: {
    borderRadius: DS.radius.card,
    borderWidth: 1,
    borderColor: DS.hairline,
    borderTopColor: 'rgba(255,255,255,0.95)',
    padding: 20,
    marginVertical: 6,
    overflow: 'hidden',
    backgroundColor: DS.glassCard,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
  },

  section: { marginTop: 20 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, paddingHorizontal: 4 },
  sectionTitle: { ...T.labelSm, color: DS.onVariant, textTransform: 'uppercase' },
  microLabel: { ...T.labelSm, color: DS.onVariant, textTransform: 'uppercase' },

  fieldWrap: { marginVertical: 6 },
  label: { fontSize: 12, fontWeight: '600', color: DS.onVariant, marginBottom: 5, fontFamily: font.medium },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: DS.hairline,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 14,
    color: DS.on,
    fontFamily: font.regular,
  },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1, borderColor: DS.hairline,
    borderTopColor: 'rgba(255,255,255,0.95)',
    borderRadius: DS.radius.sm, height: 36,
    paddingHorizontal: 12, marginVertical: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 13, color: DS.primary, fontFamily: font.regular, height: '100%', marginLeft: 8 },
  searchClearBtn: { width: 16, height: 16, borderRadius: 999, backgroundColor: DS.high, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },

  row: { flexDirection: 'row', alignItems: 'center' },

  chip: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: DS.hairline,
    borderTopColor: 'rgba(255,255,255,0.95)',
    borderRadius: DS.radius.pill,
    paddingHorizontal: 12, height: 26, justifyContent: 'center', alignItems: 'center',
    flexDirection: 'row',
    marginRight: 6, marginBottom: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  chipActive: { backgroundColor: DS.primary },
  chipText: { ...T.labelMd, color: DS.on },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  track: { borderRadius: 999, overflow: 'hidden', backgroundColor: DS.highest },
  fill: { height: '100%', borderRadius: 999 },
  empty: { ...T.bodySm, color: DS.outline, textAlign: 'center', marginVertical: 12 },

  toggle: { width: 36, height: 20, borderRadius: 999, justifyContent: 'center' },
  knob: { width: 16, height: 16, borderRadius: 999, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 3, elevation: 2 },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  backdropTap: { flex: 1 },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, paddingBottom: 34, maxHeight: '88%', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.94)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
  sheetWide: {},
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sheetTitle: { ...T.hSm, color: DS.on },
  sheetClose: { fontSize: 14, fontWeight: '600', color: DS.primary, fontFamily: font.bold },

  monthPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: DS.glassCard, borderWidth: 1, borderColor: DS.hairline,
    borderRadius: DS.radius.pill, paddingHorizontal: 12, paddingVertical: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03, shadowRadius: 2, elevation: 1,
  },
  monthPillRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: DS.glassCard, borderWidth: 1, borderColor: DS.hairline,
    borderRadius: DS.radius.pill, paddingHorizontal: 6, paddingVertical: 2, marginVertical: 4,
    alignSelf: 'flex-start',
  },
  monthArrow: { paddingHorizontal: 14, paddingVertical: 6 },
  monthArrowText: { fontSize: 22, color: DS.on, fontWeight: '500' },
  monthLabel: { ...T.hSm, color: DS.on, marginHorizontal: 6 },

  appHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 56 },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 24, height: 24, borderRadius: DS.radius.xs, backgroundColor: DS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  logoText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: -0.3 },
  headerTitle: { ...T.hSm, color: DS.on },
  bell: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },

  dockWrap: { position: 'absolute', left: 16, right: 16, bottom: 26, alignItems: 'center' },
  dock: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', maxWidth: 384,
    borderRadius: DS.radius.pill, paddingHorizontal: 4, height: 56,
    borderWidth: 1, borderColor: DS.hairline,
    borderTopColor: 'rgba(255,255,255,0.9)',
    backgroundColor: DS.glassDock,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 32, elevation: 10,
    overflow: 'visible',
  },
  dockTab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, borderRadius: 999 },
  dockTabActive: { backgroundColor: DS.low },
  dockLabel: { ...T.labelSm, color: DS.onVariant, marginTop: 1 },
  dockLabelActive: { color: DS.primary },
  bento: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginVertical: 2 },
  bentoCell: { width: '50%', paddingHorizontal: 4, paddingVertical: 4 },
  bentoCellWide: { width: '100%' },
  fabSlot: { paddingHorizontal: 6, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  fab: {
    borderRadius: 999, backgroundColor: DS.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 16, elevation: 6,
  },

  barRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  barLabel: { width: 96, fontSize: 12, color: DS.onVariant, fontWeight: '500', fontFamily: font.regular },
  barTrack: { flex: 1, height: 8, backgroundColor: DS.highest, borderRadius: 999, overflow: 'hidden', marginHorizontal: 8 },
  barFill: { height: '100%', borderRadius: 999 },
  barVal: { width: 92, fontSize: 12, fontWeight: '500', color: DS.on, textAlign: 'right', fontFamily: font.mono },

  bigNum: { ...T.display, color: DS.on },
  sub: { ...T.bodySm, color: DS.onVariant, marginTop: 2 },
  hRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  divider: { height: 1, backgroundColor: DS.rowLine, marginVertical: 12 },
  badge: { fontSize: 11, fontWeight: '600', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden', fontFamily: font.bold },
});
