# Sunday School App - Implementation Plan

**Status**: In Progress
**Current Phase**: Phase 4 — Supabase Integration
**Last Updated**: March 3, 2026

**Approach**: Built all servant UI with mock data first. Now preparing for Supabase integration, coordinator flow, and app store launch.

---

## Overview

This document tracks all tasks needed to complete the app. The scope includes **class/schedule management**, **servant availability**, a **personalized servant dashboard**, **1:1 outreach tracking**, and **coordinator tools** — replacing the Google Sheets currently used for curriculum schedules and availability tracking.

See `CLAUDE.md` for full project context and `DESIGN.md` for architecture decisions.

---

## Phase 1: Foundation (DONE)

- [x] Project setup (Expo, TypeScript, dependencies)
- [x] Supabase configuration
- [x] Database schema and RLS policies
- [x] Authentication screens (login/register) — *Auth flow disabled; using placeholder role selector*
- [x] Navigation structure (bottom tabs + native stacks)

---

## Phase 2: Servant Flow — Core UI (DONE — mock data)

### Grade Management
- [x] MyGradesScreen — grade list, create grade, navigation to detail, empty state, pull-to-refresh
- [x] GradeDetailScreen — Students/Attendance tabs, add student, take attendance

### Student Management
- [x] AddStudentScreen / EditStudentScreen — shared StudentFormScreen, validation, all fields
- [x] Student list in GradeDetailScreen — search, tap to edit, delete, sort

### Attendance Tracking
- [x] TakeAttendanceScreen — date, student list with toggles, notes, submit
- [x] AttendanceHistoryView — by-date and by-student views, percentage badges

---

## Phase 3: Servant Dashboard & Features (DONE — mock data)

### Data Model & Mock Hooks
- [x] `useClasses` hook — class types (Sunday School, Small Group, FNA, Bible Study), classes with servants/grades/schedules
- [x] `useSessions` hook — sessions from real 6th grade curriculum CSV, lesson topics, assignments
- [x] `useAvailability` hook — availability entries for George and co-servants, toggle available/unavailable

### Servant Dashboard
- [x] DashboardScreen — time-aware greeting, upcoming sessions (14 days), staffing alerts
- [x] SessionCard — class type tag, time, location (tappable for Maps), lesson info, who's teaching, who's out
- [x] SessionDetailScreen — full lesson info, servant roster with availability, take attendance link

### Availability Management
- [x] AvailabilityScreen — list of upcoming dates with sessions, toggle available/unavailable per date

### Outreach (1:1 Visitations)
- [x] OutreachScreen — "Your Kids" list with progress card, visit badges
- [x] OutreachDetailScreen — kid info, Call/Map/Message via Linking, visit history, log visit modal
- [x] OutreachKidCard component — avatar, visit status badge, quick action buttons
- [x] `useOutreach` hook — assignments, visits, logVisit
- [x] Message templates utility — pre-filled SMS to parents

### Navigation
- [x] Bottom tabs: Dashboard | My Grades | Availability | Outreach | Settings (each with native stack)

---

## Phase 4: Supabase Integration (UP NEXT)

> Replace all mock data with real Supabase calls. This is the critical phase before any real testing.

### Authentication
- [ ] **S.1**: Re-enable auth flow — remove placeholder role selector, wire real login/register
- [ ] **S.2**: Test auth edge cases — email validation, password strength, session persistence

### Database Migration
- [ ] **S.3**: Run expanded schema migration — new tables for classes, sessions, availability, outreach assignments, outreach visits
- [ ] **S.4**: Apply RLS policies for all tables (see DESIGN.md)

### Data Operations
- [ ] **S.5**: Grade CRUD — replace mock hooks with real Supabase queries
- [ ] **S.6**: Student CRUD — insert/update/delete in `students` table
- [ ] **S.7**: Attendance — batch insert, duplicate prevention, history queries
- [ ] **S.8**: Classes & sessions — CRUD (coordinator), read-only (servant), CSV import
- [ ] **S.9**: Availability — upsert, date range queries, coverage calculations
- [ ] **S.10**: Outreach — assignments, visit logging, progress queries
- [ ] **S.11**: Real-time subscriptions — attendance, availability, session changes

---

## Phase 5: Privacy, Legal & Compliance

> The app stores kids' names, parent contact info, and addresses. This needs to be handled carefully before any real data enters the system.

- [ ] **L.1**: Research compliance requirements
  - COPPA (Children's Online Privacy Protection Act) — applies if kids under 13 can interact with the app
  - State privacy laws (Illinois BIPA if biometric data, but likely N/A)
  - Determine if COPPA applies (servants/parents are the users, not kids directly — likely exempt, but verify)
- [ ] **L.2**: Draft and publish Privacy Policy
  - What data is collected (student names, DOB, parent contact info, addresses, attendance)
  - Who can access it (servants for their grades, coordinators for their scope)
  - How it's stored (Supabase/PostgreSQL, encrypted at rest)
  - Data retention and deletion policy
  - Host on a simple web page (GitHub Pages or similar)
- [ ] **L.3**: Draft and publish Terms of Service
  - Acceptable use (church ministry purposes only)
  - Data ownership (church owns the data, not the app)
  - Liability limitations
- [ ] **L.4**: Implement in-app consent
  - First-login consent screen — user must agree to Privacy Policy + ToS before proceeding
  - Link to full policies from Settings screen
- [ ] **L.5**: Get church approval
  - Present the app and privacy approach to Fr. Abouna / church board
  - Get written permission to store student/family data digitally
  - Determine if parents need to opt in (consent forms)
- [ ] **L.6**: Data security review
  - Verify Supabase RLS policies prevent cross-church/cross-grade data leaks
  - Ensure no PII in logs or error messages
  - Confirm HTTPS everywhere, encryption at rest

---

## Phase 6: Dark Mode

- [ ] **D.1**: Create theme system
  - Define light/dark color tokens (background, surface, text, borders, primary, status colors)
  - Create a ThemeContext provider with `useTheme` hook
  - Respect system preference via `useColorScheme()`, with manual override in Settings
- [ ] **D.2**: Apply theme to all screens
  - Update all StyleSheet definitions to use theme tokens
  - Test every screen in both modes
- [ ] **D.3**: Persist preference
  - Save theme choice to AsyncStorage
  - Load on app start

---

## Phase 7: Coordinator Flow (UI → then wire to Supabase)

### Dashboard
- [ ] **C.1**: CoordinatorDashboardScreen — total students, classes, attendance rate, staffing gaps
- [ ] **C.2**: AttendanceReportScreen — grade/class picker, date range, student attendance %, export to CSV

### Schedule Management
- [ ] **C.3**: ScheduleManagementScreen — list of classes, create/edit classes
- [ ] **C.4**: SessionListScreen — sessions per class, edit session, add session
- [ ] **C.5**: CSV import flow — file picker, preview, servant name matching, bulk create
- [ ] **C.6**: Staffing coverage view — calendar with color-coded coverage per date

### Church Invitation System
- [ ] **C.7**: ChurchInvitationScreen (coordinator) — generate codes, set expiry, share
- [ ] **C.8**: JoinChurchScreen (servant) — enter invitation code, join church

### Coordinator-specific Supabase integration
- [ ] **C.9**: Wire coordinator dashboard, reports, schedule management, invitations to real queries

---

## Phase 8: Calendar Views

- [ ] **Cal.1**: Dashboard calendar view — toggle between list and calendar for upcoming sessions
- [ ] **Cal.2**: Outreach calendar view — see visit history and planned visits on a calendar
- [ ] **Cal.3**: Consider a shared calendar component (react-native-calendars or similar)

---

## Phase 9: Local Testing (On-Device, 1-2 Weeks)

> Build a dev version via EAS, install on George's and girlfriend's phones, and dogfood for 1-2 weeks with real data before beta.

### Pre-requisites
- [ ] **Test.1**: Configure `app.json` — bundle ID, app name, version, icons, splash screen
- [ ] **Test.2**: Configure `eas.json` — development build profile
- [ ] **Test.3**: Set up Apple Developer account ($99/year) for iOS dev builds
- [ ] **Test.4**: Seed Supabase with real data — actual 6th grade students, curriculum, servant roster

### Testing
- [ ] **Test.5**: Build dev client via `eas build --profile development` (iOS + Android)
- [ ] **Test.6**: Install on George's phone + girlfriend's phone
- [ ] **Test.7**: Dogfood for 1-2 weeks — use the app for real Sunday School sessions
  - Track real attendance
  - Log real outreach visits
  - Mark real availability
  - Note bugs, UX issues, missing features
- [ ] **Test.8**: Get coordinator feedback
  - Demo the app to Junior High coordinator
  - Ask: "What would make this useful for you?"
  - Prioritize coordinator features based on real feedback

---

## Phase 10: Beta & Production

### Beta Testing
- [ ] **B.1**: Build preview versions (TestFlight for iOS, Google Play Internal Testing for Android)
- [ ] **B.2**: Recruit beta testers — 6th grade servant team + coordinator
- [ ] **B.3**: Gather feedback — feedback form, bug tracking, user interviews

### App Store Prep
- [ ] **B.4**: Pre-launch checklist
  - [ ] App icon finalized
  - [ ] Splash screen created
  - [ ] Privacy policy URL live
  - [ ] Terms of service URL live
  - [ ] App store screenshots prepared
  - [ ] App descriptions written
  - [ ] Metadata (keywords, category) finalized
- [ ] **B.5**: Production builds + submission (App Store + Google Play)
- [ ] **B.6**: Launch — announcement, onboarding guide, support channels

---

## Post-Launch Backlog

### Near-Term
- [ ] Birthday notifications with push alerts
- [ ] Parent portal (read-only access to attendance, schedule)
- [ ] SMS/push reminders for upcoming sessions
- [ ] Student photos
- [ ] Announcements from coordinators
- [ ] Google Calendar sync

### Longer-Term
- [ ] Multi-language support (Arabic, Coptic)
- [ ] Analytics dashboard (attendance trends, dropout alerts)
- [ ] Bulk student import (CSV)
- [ ] Multi-church support / hierarchical permissions
- [ ] Custom PDF reports
- [ ] Offline support (cache + queue + sync)

---

## Progress Summary

| Phase | Status |
|-------|--------|
| 1. Foundation | Done |
| 2. Servant Core UI | Done |
| 3. Servant Dashboard & Features | Done |
| 4. Supabase Integration | Up Next |
| 5. Privacy & Legal | Not Started |
| 6. Dark Mode | Not Started |
| 7. Coordinator Flow | Not Started |
| 8. Calendar Views | Not Started |
| 9. Local Testing | Blocked on Phase 4 |
| 10. Beta & Production | Blocked on Phase 9 |

---

## Risks

1. **COPPA / legal uncertainty** — Need to confirm whether the app qualifies as "directed to children." Likely exempt since servants/parents are the users, but should verify before storing real kid data.
2. **Mock-to-real migration** — Replacing all mock data at once could surface many issues. Mitigated by clean hook/service separation.
3. **Coordinator buy-in** — Building coordinator features without direct input risks building the wrong thing. Phase 9 (Test.8) addresses this.
4. **Apple Developer cost** — $99/year required for any iOS testing beyond Expo Go.

---

## Resources

- **Supabase Docs**: https://supabase.com/docs
- **Expo Docs**: https://docs.expo.dev
- **React Navigation**: https://reactnavigation.org
- **EAS Build**: https://docs.expo.dev/build/introduction/
- **Project Design Doc**: `DESIGN.md`
- **Database Setup**: `SUPABASE_SETUP.md`
- **Session Context**: `CLAUDE.md`
