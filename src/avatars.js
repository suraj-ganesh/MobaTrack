import { Image, StyleSheet, View } from 'react-native';
import { C } from './theme';

export const AVATAR_IDS = ['m1', 'm2', 'm3', 'm4'];

export const AVATAR_LABELS = { m1: 'CURLY', m2: 'SIDE CAP', m3: 'FRONT CAP', m4: 'BACK CAP' };

const SOURCES = {
  m1: require('../assets/avatars/m1.png'),
  m2: require('../assets/avatars/m2.png'),
  m3: require('../assets/avatars/m3.png'),
  m4: require('../assets/avatars/m4.png'),
};

const LEGACY = {
  classic: 'm1',
  crop: 'm2',
  buzz: 'm3',
  curly: 'm1',
  side: 'm4',
  bob: 'm1',
  pixie: 'm2',
  long: 'm3',
};

export function normAvatar(v) {
  if (AVATAR_IDS.includes(v)) return v;
  return LEGACY[String(v || '')] || 'm1';
}

export function avatarLabel(id) {
  return AVATAR_LABELS[normAvatar(id)] || 'PARZAVEL';
}

export function AvatarPhoto({ id, size = 168, mini }) {
  const s = mini ? 64 : size;
  return (
    <Image
      source={SOURCES[normAvatar(id)]}
      style={[A.photo, { width: s, height: s, borderRadius: mini ? 20 : 30 }]}
      resizeMode="cover"
    />
  );
}

const A = StyleSheet.create({
  photo: {
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: C.ink,
    borderCurve: 'continuous',
  },
  bustBody: {
    backgroundColor: '#F5F3EF',
    borderWidth: 3,
    borderColor: '#1D1E22',
    borderCurve: 'continuous',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  bustCollar: {
    backgroundColor: '#1D1E22',
    borderWidth: 2,
    borderColor: '#1D1E22',
  },
  bustStripe: {
    backgroundColor: '#1D1E22',
    opacity: 0.85,
  },
});

export function AvatarBust({ id, size = 168 }) {
  const s = size;
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ zIndex: 2 }}>
        <AvatarPhoto id={id} size={s} />
      </View>
      <View
        style={[
          A.bustBody,
          {
            width: s * 0.98,
            height: s * 0.44,
            borderTopLeftRadius: s * 0.3,
            borderTopRightRadius: s * 0.3,
            borderBottomLeftRadius: 22,
            borderBottomRightRadius: 22,
            marginTop: -s * 0.14,
            paddingTop: s * 0.1,
            gap: s * 0.035,
          },
        ]}
      >
        <View
          style={[
            A.bustCollar,
            { width: s * 0.24, height: s * 0.09, borderRadius: s * 0.045, marginTop: s * 0.04 },
          ]}
        />
        <View style={[A.bustStripe, { width: '130%', height: s * 0.035 }]} />
        <View style={[A.bustStripe, { width: '130%', height: s * 0.035, opacity: 0.5 }]} />
      </View>
    </View>
  );
}
