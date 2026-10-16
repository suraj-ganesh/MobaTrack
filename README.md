# MobaTrack — Simple Finance Tracker (React Native + Expo)

Minimal black & white mobile finance app. Inspired by FinTrack, without eSewa gateway.
Offline only (AsyncStorage). AI suggestions are local rule-based balance tips.

## Features
- Home: balance / income / expense + recent + goals snapshot
- Transactions: add income/expense, search, filter, delete
- Goals: target, progress bar, add funds, delete
- AI: balance suggestions (savings rate, top category, daily avg + runway, goal funding)
- More: currency symbol, name, reset

## Run on your phone
```sh
cd MobaTrack
npm install
npx expo start
```
Scan QR with Expo Go (Android / iOS).

## Download (install on your phone)
1. Go to the **Releases** page on GitHub.
2. Download **MobaTrack.apk** from the latest release.
3. Open it on your Android phone and install (allow "install unknown apps" if asked).

A fresh APK is built automatically every time a `v*` tag is pushed
(see `.github/workflows/android-apk.yml`).

### Publish a new release
```sh
git tag v1.0.1
git push origin v1.0.1
```

First-time setup only: run `npx eas init`, then add an Expo access token
as the `EXPO_TOKEN` secret (repo Settings → Secrets and variables → Actions).

## Build locally
- Android APK: `npx eas build -p android --profile preview`
- Or: `npx expo run:android`

## Structure
- `App.js` — all screens, B/W minimal UI
- `src/theme.js` — colors + categories
- `src/storage.js` — AsyncStorage persist
- `src/ai.js` — local insights engine
