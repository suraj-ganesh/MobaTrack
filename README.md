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

## Build
- Android APK: `npx eas build -p android --profile preview`
- Or: `npx expo run:android`

## Structure
- `App.js` — all screens, B/W minimal UI
- `src/theme.js` — colors + categories
- `src/storage.js` — AsyncStorage persist
- `src/ai.js` — local insights engine
