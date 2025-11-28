# Sunday School App

Modern cross-platform mobile app for Sunday School attendance tracking and management.

## 🎯 MVP Features

- ✅ **Authentication**: Email/password + social login (Google, Apple)
- ✅ **Role-based Access**: Servants, Coordinators, and Priests
- 🚧 **Attendance Tracking**: Servants record attendance for their classes
- 🚧 **Student Management**: Add, edit, and view students
- 🚧 **Coordinator Dashboard**: View attendance reports across all grades
- 🚧 **Church Linking**: Flexible system for servants to join coordinator's church

## 🏗️ Architecture

### Tech Stack

**Frontend (Mobile App)**:
- React Native with Expo (TypeScript)
- React Navigation for routing
- React Context for state management

**Backend**:
- Supabase (Backend-as-a-Service)
- PostgreSQL database
- Row-Level Security (RLS) for authorization
- Real-time subscriptions

**Why this stack?**
See [DESIGN.md](./DESIGN.md) for detailed architecture decisions and rationale.

## 📁 Project Structure

```
sunday-school-app/
├── apps/
│   └── mobile/              # React Native app (Expo)
│       ├── src/
│       │   ├── screens/     # Screen components
│       │   ├── components/  # Reusable components
│       │   ├── contexts/    # React contexts
│       │   ├── hooks/       # Custom hooks
│       │   ├── lib/         # Supabase client
│       │   ├── navigation/  # Navigation config
│       │   └── types/       # TypeScript types
│       └── package.json
├── DESIGN.md                # Technical design document
├── SUPABASE_SETUP.md       # Backend setup guide
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Supabase account (free tier)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd sunday-school-app
cd apps/mobile
npm install
```

### 2. Set Up Supabase Backend

Follow the complete guide in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md):

1. Create Supabase project
2. Run database migrations
3. Configure authentication
4. Get API credentials

### 3. Configure Environment

```bash
cd apps/mobile
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run the App

```bash
npm start
```

Then:
- Press `i` for iOS simulator (macOS only)
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

## 📱 Mobile App

See [apps/mobile/README.md](./apps/mobile/README.md) for detailed mobile app documentation.

## 📖 Documentation

- [DESIGN.md](./DESIGN.md) - Comprehensive technical design document
  - Architecture decisions (SQL vs NoSQL, Supabase vs Express)
  - Database schema with RLS policies
  - 4-week MVP implementation timeline
  - Cost analysis and deployment strategy

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Backend setup guide
  - Step-by-step Supabase configuration
  - Database migrations (tables, indexes, RLS, functions)
  - Authentication setup
  - Troubleshooting tips

- [apps/mobile/README.md](./apps/mobile/README.md) - Mobile app guide
  - Development workflow
  - Project structure
  - Adding new screens
  - Deployment instructions

## 🎨 User Flows

### Servant Flow
1. Sign up with email + password, select "Servant" role
2. Create or join a church
3. Create a grade (e.g., "6th Grade Boys")
4. Add students to the grade
5. Take attendance by marking students present/absent
6. View past attendance records

### Coordinator Flow
1. Sign up as "Coordinator"
2. Create official church
3. Generate invitation code
4. Share code with servants
5. View attendance dashboard for all grades
6. Generate attendance reports

## 🗓️ Development Timeline

### ✅ Week 1: Foundation (Completed)
- [x] Project setup (Expo, TypeScript, dependencies)
- [x] Supabase configuration
- [x] Database schema and RLS policies
- [x] Authentication (login/register screens)
- [x] Navigation structure

### 🚧 Week 2: Servant Flow (In Progress)
- [ ] Grade management screens
- [ ] Student CRUD functionality
- [ ] Attendance tracking UI
- [ ] View past attendance

### 📅 Week 3: Coordinator Flow
- [ ] Coordinator dashboard
- [ ] Attendance reports by grade
- [ ] Church invitation system
- [ ] Date range filtering

### 📅 Week 4: Testing & Launch
- [ ] End-to-end testing
- [ ] Bug fixes and polish
- [ ] Beta testing with real users
- [ ] App store submission

## 💰 Cost Estimate

**MVP (First 3-6 months)**: **$0/month**
- Supabase free tier: 500MB DB, 50K MAU
- Expo free tier: Unlimited development

**Production (100+ servants, 10+ churches)**: **$54/month**
- Supabase Pro: $25/month
- Expo EAS: $29/month

See [DESIGN.md](./DESIGN.md) for detailed cost analysis.

## 🧪 Testing

### Local Testing

```bash
cd apps/mobile

# iOS
npm run ios

# Android
npm run android

# Web (for quick testing)
npm run web
```

### Beta Testing

```bash
# Build for TestFlight (iOS)
eas build --platform ios --profile preview

# Build for internal testing (Android)
eas build --platform android --profile preview
```

## 🚢 Deployment

```bash
cd apps/mobile

# Configure EAS
eas build:configure

# Build production versions
eas build --platform all

# Submit to app stores
eas submit --platform ios
eas submit --platform android
```

## 🤝 Contributing

This is a private project for Coptic Orthodox Sunday Schools. For questions or contributions, please contact the project maintainer.

## 📄 License

Private - All Rights Reserved

## 🆘 Support

For issues or questions:
1. Check [DESIGN.md](./DESIGN.md) for architecture questions
2. Check [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for backend issues
3. Check [apps/mobile/README.md](./apps/mobile/README.md) for app development
4. Contact project maintainer

## 🗺️ Roadmap

### Phase 2 (Post-MVP)
- [ ] Visit tracking for home visits
- [ ] Birthday notifications with push alerts
- [ ] Parent portal (read-only attendance view)
- [ ] Multi-language support (Arabic, Coptic)

### Phase 3 (Future)
- [ ] Analytics dashboard (trends, dropout alerts)
- [ ] Announcements from coordinators
- [ ] Curriculum sharing (file uploads)
- [ ] Bulk student import (CSV)
- [ ] Calendar integration
- [ ] SMS reminders

### Phase 4 (Scale)
- [ ] Multi-grade servant switching
- [ ] Hierarchical permissions (Country → State → City → Church)
- [ ] Custom report generation (PDF exports)
- [ ] Advanced analytics

## 📚 Resources

- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [React Navigation](https://reactnavigation.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
