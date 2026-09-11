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
const SCOOP_A = 70;
const SCOOP_D = 32;
const BAR_BG = '#0B0C0E';
const CREAM = '#F5F3EF';
const DIM = 'rgba(245,243,239,0.5)';

const IDX = { Home: 0, Tx: 1, AI: 3, More: 4 };

function HomeIcon({ color }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ReceiptIcon({ color }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 3h8l4 4v14H6V3z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Path
        d="M14 3v4h4M9 12h6M9 15.5h6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function SparkIcon({ color }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3c.7 4.6 2.5 6.4 7 7-4.5.6-6.3 2.4-7 7-.7-4.6-2.5-6.4-7-7 4.5-.6 6.3-2.4 7-7z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MenuIcon({ color }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7h16M4 12h16M4 17h16"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

const SLOTS = [
  { key: 'Home', Icon: HomeIcon },
  { key: 'Tx', Icon: ReceiptIcon },
  { key: '__plus', Icon: null },
  { key: 'AI', Icon: SparkIcon },
  { key: 'More', Icon: MenuIcon },
];

function buildPath(cx, W, H) {
  'worklet';
  const l = cx - SCOOP_A;
  const r = cx + SCOOP_A;
  return (
    `M0,${R} Q0,0 ${R},0 ` +
    `H${l} C${l + 42},0 ${cx - 34},${SCOOP_D} ${cx},${SCOOP_D} ` +
    `C${cx + 34},${SCOOP_D} ${r - 42},0 ${r},0 ` +
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
  const target = (width / 5) * (IDX[tab] + 0.5);

  useEffect(() => {
    wSV.value = width;
    cx.value = withSpring(target, { damping: 23, stiffness: 150, mass: 0.9 });
  }, [tab, W]);

  const ap = useAnimatedProps(() => ({ d: buildPath(cx.value, wSV.value, BAR_H) }));

  return (
    <View style={N.wrap}>
      <View style={N.stage} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        <Svg width={width} height={BAR_H} style={N.svg}>
          <AnimatedPath animatedProps={ap} fill={BAR_BG} />
        </Svg>
        <View style={N.row}>
          {SLOTS.map((s) => {
            if (s.key === '__plus') {
              return (
                <View key="plus" style={N.slot}>
                  <BouncyPress onPress={onPlus} style={N.plusCircle}>
                    <Text style={N.plusGlyph}>+</Text>
                  </BouncyPress>
                </View>
              );
            }
            const active = tab === s.key;
            return (
              <View key={s.key} style={N.slot}>
                <BouncyPress onPress={() => setTab(s.key)} style={N.iconTouch}>
                  {active ? (
                    <Animated.View
                      key={`a-${tab}`}
                      entering={ZoomIn.springify().damping(13).stiffness(260)}
                      style={N.activeCircle}
                    >
                      <s.Icon color={CREAM} />
                    </Animated.View>
                  ) : (
                    <View key={`i-${s.key}`} style={N.idleBox}>
                      <s.Icon color={DIM} />
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
  wrap: {
    paddingHorizontal: 14,
    paddingTop: 40,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  stage: { height: BAR_H },
  svg: { position: 'absolute', top: 0, left: 0 },
  row: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  slot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconTouch: { alignItems: 'center', justifyContent: 'center', padding: 12 },
  activeCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderCurve: 'continuous',
    backgroundColor: BAR_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -33,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  idleBox: { alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  plusCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderCurve: 'continuous',
    backgroundColor: '#E9E9EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -44,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  plusGlyph: { fontSize: 32, color: '#1D1E22', fontWeight: '300', marginTop: -3 },
});
