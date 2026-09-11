import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  ZoomIn,
  useAnimatedProps,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { BouncyPress } from './smooth';

const BAR_H = 78;
const R = 30;
const SCOOP_W = 84;
const SCOOP_D = 28;
const BAR_BG = '#0C0D10';
const CIRCLE_BG = '#F5F3EF';
const ICON_INK = '#1D1E22';
const ICON_IDLE = '#8B8784';
const LABEL_IDLE = '#A7A3A0';

const IDX = { Home: 0, Tx: 1, AI: 3, More: 4 };

const SLOTS = [
  { key: 'Home', glyph: '⌂', label: 'HOME' },
  { key: 'Tx', glyph: '▤', label: 'TXNS' },
  { key: '__plus', glyph: '+', label: '' },
  { key: 'AI', glyph: '✦', label: 'AI' },
  { key: 'More', glyph: '⋯', label: 'MORE' },
];

function buildPath(cx, W, H) {
  'worklet';
  const l = cx - SCOOP_W / 2;
  const r = cx + SCOOP_W / 2;
  return (
    `M0,${R} Q0,0 ${R},0 ` +
    `H${l - 32} C${l - 10},0 ${l - 4},${SCOOP_D} ${l + 18},${SCOOP_D} ` +
    `L${r - 18},${SCOOP_D} C${r + 4},${SCOOP_D} ${r + 10},0 ${r + 32},0 ` +
    `H${W - R} Q${W},0 ${W},${R} V${H - R} Q${W},${H} ${W - R},${H} ` +
    `H${R} Q0,${H} 0,${H - R} Z`
  );
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

export function SmoothBar({ tab, setTab, onPlus }) {
  const [W, setW] = useState(0);
  const cx = useSharedValue(0);
  const wSV = useSharedValue(340);
  const width = W > 0 ? W : 340;
  const slotW = width / 5;
  const target = slotW * (IDX[tab] + 0.5);

  useEffect(() => {
    wSV.value = width;
    cx.value = withSpring(target, { damping: 21, stiffness: 170 });
  }, [tab, W]);

  const ap = useAnimatedProps(() => ({ d: buildPath(cx.value, wSV.value, BAR_H) }));

  return (
    <View style={N.wrap}>
      <View style={N.stage} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        <Svg width={width} height={BAR_H} style={N.svg}>
          <AnimatedPath animatedProps={ap} fill={BAR_BG} />
        </Svg>
        <View style={N.row}>
          {SLOTS.map((s, i) => {
            if (s.key === '__plus') {
              return (
                <View key="plus" style={[N.slot, { width: slotW }]}>
                  <BouncyPress onPress={onPlus} style={N.plusCircle}>
                    <Text style={N.plusGlyph}>+</Text>
                  </BouncyPress>
                </View>
              );
            }
            const active = tab === s.key;
            return (
              <View key={s.key} style={[N.slot, { width: slotW }]}>
                <BouncyPress
                  onPress={() => setTab(s.key)}
                  style={N.slotTouch}
                >
                  {active ? (
                    <Animated.View
                      key={tab}
                      entering={ZoomIn.springify().damping(14).stiffness(280)}
                      style={N.activeCircle}
                    >
                      <Text style={N.activeGlyph}>{s.glyph}</Text>
                    </Animated.View>
                  ) : (
                    <View style={N.idleBox}>
                      <Text style={N.idleGlyph}>{s.glyph}</Text>
                      <Text style={N.idleLabel}>{s.label}</Text>
                    </View>
                  )}
                </BouncyPress>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const N = StyleSheet.create({
  wrap: { paddingHorizontal: 14, paddingTop: 20, paddingBottom: 16, backgroundColor: 'transparent' },
  stage: { height: BAR_H },
  svg: { position: 'absolute', top: 0, left: 0 },
  row: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row' },
  slot: { alignItems: 'center', justifyContent: 'center' },
  slotTouch: { alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' },
  activeCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderCurve: 'continuous',
    backgroundColor: CIRCLE_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -34,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  activeGlyph: { fontSize: 22, color: ICON_INK, fontWeight: '800' },
  idleBox: { alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  idleGlyph: { fontSize: 22, color: ICON_IDLE, fontWeight: '700' },
  idleLabel: { color: LABEL_IDLE, fontSize: 7, fontWeight: '800', letterSpacing: 1, marginTop: 3 },
  plusCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderCurve: 'continuous',
    backgroundColor: CIRCLE_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  plusGlyph: { fontSize: 30, color: ICON_INK, fontWeight: '400', marginTop: -3 },
});
