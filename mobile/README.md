# News Aggregator Mobile (Expo + TypeScript)

Production-ready React Native app for the Flask News Aggregator + AI Content Engine. The UI mirrors the existing Next.js dashboard (layout, spacing, colors, typography).

## Requirements

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)

## Setup

```bash
cd mobile
cp ../.env.example .env
npm install
```

Set `EXPO_PUBLIC_API_URL` in `.env` to your Flask backend (e.g. `http://localhost:5000`).

## Run

```bash
npm run start
```

Then press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with the Expo Go app.

## Build

```bash
npx expo prebuild
npx expo run:ios
npx expo run:android
```

## Notes

- Auth uses JWT tokens stored in `expo-secure-store`.
- React Navigation includes an Auth stack, bottom tabs, and a Story detail stack.
- React Query powers caching and optimistic UI refresh.
- Theme supports light (default) and dark with a persisted toggle.
