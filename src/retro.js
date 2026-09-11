import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { C } from './theme';
import { BouncyPress } from './smooth';

export function DecorBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[S.blob, { width: 340, height: 340, top: -110, right: -110 }]} />
      <View style={[S.blob, { width: 220, height: 220, bottom: -70, left: -70, opacity: 0.08 }]} />
      <View style={[S.blob, { width: 140, height: 140, top: '42%', left: -50, opacity: 0.06 }]} />
    </View>
  );
}

export function TinyIcon({ glyph, light, onPress }) {
  if (!onPress) return <Text style={[S.icon, light && S.iconLight]}>{glyph}</Text>;
  return (
    <TouchableOpacity onPress={onPress} hitSlop={10} activeOpacity={0.6}>
      <Text style={[S.icon, light && S.iconLight]}>{glyph}</Text>
    </TouchableOpacity>
  );
}

export function PillButton({ title, onPress, dark }) {
  return (
    <BouncyPress onPress={onPress} style={[S.pill, dark && S.pillDark]}>
      <Text style={[S.pillText, dark && S.pillTextDark]}>{title}</Text>
    </BouncyPress>
  );
}

export function CircleArrow({ onPress }) {
  return (
    <BouncyPress onPress={onPress} style={S.circle}>
      <Text style={S.circleGlyph}>›</Text>
    </BouncyPress>
  );
}

export function Stars({ value = 4 }) {
  const v = Math.max(0, Math.min(5, Math.round(value)));
  return <Text style={S.stars}>{'★'.repeat(v) + '☆'.repeat(5 - v)}</Text>;
}

export function RetroFace({ variant = 'classic', size = 148, mini }) {
  const s = mini ? 64 : size;
  const v = OLD_TO_NEW[variant] || variant;
  return (
    <View style={{ width: s, height: s * 1.18, alignItems: 'center', justifyContent: 'flex-end' }}>
      <View style={[mini ? M.earL : F.earL, { width: s * 0.12, height: s * 0.16, left: s * 0.12, top: s * 0.38 }]} />
      <View style={[mini ? M.earR : F.earR, { width: s * 0.12, height: s * 0.16, right: s * 0.12, top: s * 0.38 }]} />
      <View style={[mini ? M.face : F.face, { width: s * 0.68, height: s * 0.7, borderRadius: s * 0.24, marginTop: s * 0.2 }]}>
        <View style={[mini ? M.hairBase : F.hairBase, { width: s * 0.74, height: s * 0.3, borderRadius: s * 0.12 }]}>
          {v === 'curly' && (
            <View style={{ flexDirection: 'row', marginTop: -(s * 0.08) }}>
              <View style={{ width: s * 0.18, height: s * 0.18, borderRadius: s * 0.09, backgroundColor: C.ink, marginHorizontal: -s * 0.02 }} />
              <View style={{ width: s * 0.2, height: s * 0.2, borderRadius: s * 0.1, backgroundColor: C.ink, marginHorizontal: -s * 0.02, marginTop: -s * 0.03 }} />
              <View style={{ width: s * 0.18, height: s * 0.18, borderRadius: s * 0.09, backgroundColor: C.ink, marginHorizontal: -s * 0.02 }} />
            </View>
          )}
          {v === 'side' && <View style={{ position: 'absolute', width: 3, height: s * 0.16, backgroundColor: C.cream, transform: [{ rotate: '20deg' }], left: '32%', top: 2, opacity: 0.9 }} />}
          {v === 'crop' && <View style={{ position: 'absolute', bottom: -3, left: 6, right: 6, height: s * 0.08, backgroundColor: C.ink, transform: [{ skewX: '-12deg' }] }} />}
        </View>
        <View style={[mini ? M.brows : F.brows, { width: s * 0.44, marginTop: s * 0.22 }]}>
          <View style={[mini ? M.brow : F.brow, { width: s * 0.14, height: mini ? 3 : 5 }]} />
          <View style={[mini ? M.brow : F.brow, { width: s * 0.14, height: mini ? 3 : 5 }]} />
        </View>
        <View style={[mini ? M.eyes : F.eyes, { width: s * 0.38 }]}>
          <View style={[mini ? M.dot : F.dot, { width: s * 0.075, height: s * 0.075, borderRadius: s * 0.04 }]} />
          <View style={[mini ? M.dot : F.dot, { width: s * 0.075, height: s * 0.075, borderRadius: s * 0.04 }]} />
        </View>
        <View style={mini ? M.nose : F.nose} />
        <View style={[mini ? M.mouth : F.mouth, { width: s * 0.18, height: s * 0.06, borderBottomWidth: mini ? 2 : 3 }]} />
        {v === 'buzz' && <View style={[mini ? M.stubble : F.stubble, { width: s * 0.4, height: s * 0.12, borderRadius: s * 0.05 }]} />}
      </View>
      <View style={[mini ? M.neck : F.neck, { width: s * 0.2, height: s * 0.1 }]} />
      <View style={[mini ? M.body : F.body, { width: s * 0.62, height: s * 0.3 }]}>
        <View style={mini ? M.stripe : F.stripe} />
        <View style={mini ? M.stripe : F.stripe} />
      </View>
    </View>
  );
}

const OLD_TO_NEW = { bob: 'classic', pixie: 'crop', curls: 'curly', long: 'buzz' };

const S = StyleSheet.create({
  blob: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(219,210,205,0.12)' },
  icon: { fontSize: 16, color: C.ink, fontWeight: '700' },
  iconLight: { color: C.creamLight },
  pill: { backgroundColor: C.creamLight, borderRadius: 999, borderCurve: 'continuous', paddingVertical: 13, paddingHorizontal: 22, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  pillDark: { backgroundColor: C.ink, borderWidth: 1, borderColor: C.creamLight },
  pillText: { color: C.ink, fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  pillTextDark: { color: C.creamLight },
  circle: { width: 54, height: 54, borderRadius: 27, borderCurve: 'continuous', backgroundColor: C.creamLight, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  circleGlyph: { fontSize: 30, color: C.ink, fontWeight: '400', marginTop: -4 },
  stars: { color: C.creamLight, fontSize: 15, letterSpacing: 3 },
});

const F = StyleSheet.create({
  face: { backgroundColor: C.cream, borderWidth: 3, borderColor: C.ink, alignItems: 'center', overflow: 'hidden' },
  earL: { position: 'absolute', backgroundColor: C.cream, borderWidth: 3, borderColor: C.ink, borderRadius: 20, zIndex: 0 },
  earR: { position: 'absolute', backgroundColor: C.cream, borderWidth: 3, borderColor: C.ink, borderRadius: 20, zIndex: 0 },
  hairBase: { position: 'absolute', top: -8, backgroundColor: C.ink, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, alignItems: 'center', zIndex: 2 },
  brows: { flexDirection: 'row', justifyContent: 'space-between', zIndex: 3 },
  brow: { backgroundColor: C.ink, borderRadius: 2 },
  eyes: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  dot: { backgroundColor: C.ink },
  nose: { width: 12, height: 12, borderRightWidth: 3, borderBottomWidth: 3, borderColor: C.ink, marginTop: 4, marginLeft: 8 },
  mouth: { borderColor: C.ink, borderRadius: 4, marginTop: 2 },
  stubble: { position: 'absolute', bottom: 8, backgroundColor: 'transparent', borderWidth: 2, borderStyle: 'dotted', borderColor: 'rgba(29,30,34,0.4)' },
  neck: { backgroundColor: C.cream, borderWidth: 3, borderColor: C.ink, marginTop: -4 },
  body: { backgroundColor: C.ink, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 3, borderColor: C.ink, alignItems: 'center', overflow: 'hidden', marginTop: -6, gap: 5, paddingTop: 8 },
  stripe: { width: '120%', height: 5, backgroundColor: C.cream, opacity: 0.9 },
});

const M = StyleSheet.create({
  face: { backgroundColor: C.creamLight, borderWidth: 2.5, borderColor: C.ink, alignItems: 'center', overflow: 'hidden' },
  earL: { position: 'absolute', backgroundColor: C.creamLight, borderWidth: 2.5, borderColor: C.ink, borderRadius: 12, zIndex: 0 },
  earR: { position: 'absolute', backgroundColor: C.creamLight, borderWidth: 2.5, borderColor: C.ink, borderRadius: 12, zIndex: 0 },
  hairBase: { position: 'absolute', top: -6, backgroundColor: C.ink, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, alignItems: 'center', zIndex: 2 },
  brows: { flexDirection: 'row', justifyContent: 'space-between', zIndex: 3 },
  brow: { backgroundColor: C.ink, borderRadius: 2 },
  eyes: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  dot: { backgroundColor: C.ink },
  nose: { width: 7, height: 7, borderRightWidth: 2, borderBottomWidth: 2, borderColor: C.ink, marginTop: 2, marginLeft: 5 },
  mouth: { borderColor: C.ink, borderRadius: 3, marginTop: 1 },
  stubble: { position: 'absolute', bottom: 5, backgroundColor: 'transparent', borderWidth: 1.5, borderStyle: 'dotted', borderColor: 'rgba(29,30,34,0.35)' },
  neck: { backgroundColor: C.creamLight, borderWidth: 2.5, borderColor: C.ink, marginTop: -3 },
  body: { backgroundColor: 'transparent', borderWidth: 2.5, borderColor: C.ink, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomWidth: 0, alignItems: 'center', overflow: 'hidden', marginTop: -4, gap: 3, paddingTop: 5 },
  stripe: { width: '120%', height: 3, backgroundColor: C.ink, opacity: 0.85 },
});
