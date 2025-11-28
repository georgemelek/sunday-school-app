# Sunday School Mobile App

Cross-platform mobile app for Sunday School attendance tracking, built with React Native (Expo) and TypeScript.

## Features

- ✅ Email/password authentication
- ✅ Role-based access (Servant, Coordinator, Priest)
- ✅ Session persistence with AsyncStorage
- ✅ Type-safe Supabase integration
- 🚧 Attendance tracking (coming soon)
- 🚧 Student management (coming soon)
- 🚧 Real-time updates (coming soon)

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Navigation**: React Navigation 6
- **State Management**: React Context
- **Storage**: AsyncStorage (session persistence)

## Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (for testing)
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

## Setup

### 1. Install Dependencies

```bash
cd apps/mobile
npm install
```

### 2. Configure Supabase

First, set up your Supabase project:

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Go to Project Settings → API
4. Copy your project URL and anon key

Then create your `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and fill in your Supabase credentials:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Set Up Database Schema

Go to your Supabase project → SQL Editor and run the schema from `../../SUPABASE_SETUP.md` (we'll create this file).

## Development

### Start Development Server

```bash
npm start
```

This will start the Expo development server. You can then:

- Press `i` to open iOS simulator (macOS only)
- Press `a` to open Android emulator (requires Android Studio)
- Scan QR code with Expo Go app on your phone

### Run on Specific Platforms

```bash
# iOS (macOS only)
npm run ios

# Android
npm run android

# Web (for quick testing)
npm run web
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components
│   ├── auth/          # Login, Register
│   ├── servant/       # Servant role screens
│   └── coordinator/   # Coordinator role screens
├── contexts/          # React contexts (auth, etc.)
├── hooks/             # Custom React hooks
├── lib/               # Libraries (Supabase client)
├── navigation/        # Navigation configuration
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## Available Scripts

- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run in web browser

## Authentication Flow

1. User opens app → sees Login screen
2. User can sign up with email/password + role selection
3. After login, app shows role-specific navigator:
   - **Servant** → MyGrades screen
   - **Coordinator/Priest** → Dashboard screen
4. Session is persisted in AsyncStorage
5. User stays logged in across app restarts

## Adding New Screens

1. Create screen component in `src/screens/[role]/`
2. Add route to navigation types in `src/types/navigation.ts`
3. Add screen to appropriate navigator in `src/navigation/index.tsx`
4. Navigate using: `navigation.navigate('ScreenName', { params })`

## Type Safety

Database types are defined in `src/types/database.ts`. To regenerate from Supabase schema:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

## Troubleshooting

### "Missing Supabase environment variables"

Make sure you've created `.env` file and filled in your credentials.

### "Network request failed" on real device

Make sure your phone and computer are on the same network, and Supabase URL is accessible.

### Expo CLI not found

Install globally: `npm install -g expo-cli`

## Next Steps

- [ ] Implement grade management screens
- [ ] Build student CRUD functionality
- [ ] Create attendance tracking UI
- [ ] Add real-time subscriptions
- [ ] Implement church invitation system
- [ ] Add social login (Google, Apple)

## Deployment

When ready to deploy:

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS and Android
eas build --platform all

# Submit to app stores
eas submit --platform ios
eas submit --platform android
```

## Resources

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Docs](https://docs.expo.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [React Navigation Docs](https://reactnavigation.org/docs/getting-started)
