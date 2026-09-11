import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { BouncyPress } from './smooth';

const BAR_H = 78;
const BAR_BG = '#0B0C0E';
const CREAM = '#F5F3EF';
const DIM = 'rgba(245,243,239,0.5)';

function HomeIcon({ color }) {
  return (
    <Svg width={27} height={27} viewBox="0 0 24 24" fill="none">
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
    <Svg width={27} height={27} viewBox="0 0 24 24" fill="none">
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
    <Svg width={27} height={27} viewBox="0 0 24 24" fill="none">
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
    <Svg width={27} height={27} viewBox="0 0 24 24" fill="none">
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

export function SmoothBar({ tab, setTab, onPlus }) {
  return (
    <View style={N.wrap}>
      <View style={N.bar}>
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
                <Animated.View
                  key={active ? `a-${tab}` : `i-${s.key}`}
                  entering={ZoomIn.springify().damping(15).stiffness(300)}
                >
                  <s.Icon color={active ? CREAM : DIM} />
                </Animated.View>
              </BouncyPress>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const N = StyleSheet.create({
  wrap: {
    paddingHorizontal: 14,
    paddingTop: 36,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: BAR_BG,
    borderRadius: 30,
    borderCurve: 'continuous',
    height: BAR_H,
    alignItems: 'center',
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  slot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconTouch: { alignItems: 'center', justifyContent: 'center', padding: 10 },
  plusCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderCurve: 'continuous',
    backgroundColor: '#E9E9EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -48,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  plusGlyph: { fontSize: 32, color: '#1D1E22', fontWeight: '300', marginTop: -3 },
});
