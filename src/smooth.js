import { useCallback } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export const screenEntering = FadeInUp.springify().damping(24).stiffness(170).mass(0.9);
export const screenLayout = Layout.springify().damping(22).stiffness(150);
export const itemEntering = (i = 0) =>
  FadeInDown.delay(Math.min(i, 8) * 45)
    .springify()
    .damping(20)
    .stiffness(180);

export function ScreenShell({ tabKey, children, style }) {
  return (
    <Animated.View
      key={tabKey}
      entering={screenEntering}
      layout={screenLayout}
      style={[{ flex: 1 }, style]}
    >
      {children}
    </Animated.View>
  );
}

export function RiseIn({ index = 0, children, style }) {
  return (
    <Animated.View entering={itemEntering(index)} layout={screenLayout} style={style}>
      {children}
    </Animated.View>
  );
}

export function BouncyPress({ onPress, children, style }) {
  const s = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: s.value }],
  }));
  const tap = useCallback(() => {
    try {
      Haptics.selectionAsync();
    } catch {}
    if (onPress) onPress();
  }, [onPress]);
  return (
    <AnimatedPressable
      onPress={tap}
      onPressIn={() => {
        s.value = withSpring(0.93, { damping: 12, stiffness: 320 });
      }}
      onPressOut={() => {
        s.value = withSpring(1, { damping: 12, stiffness: 260 });
      }}
      style={[style, anim]}
    >
      {children}
    </AnimatedPressable>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export async function tapTick() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
}
