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
> **Tour mode**: Every hook must preserve mock data for tour mode (check `isTourMode` from `useTour()` before Supabase calls — see `useStudents.ts` for the pattern).

### Authentication
- [x] **S.1**: Re-enable auth flow — remove placeholder role selector, wire real login/register
- [ ] **S.2**: Test auth edge cases — email validation, password strength, session persistence *(nice-to-have, skip for now)*

### Database Migration
- [x] **S.3**: Run expanded schema migration — new tables for classes, sessions, availability, outreach assignments, outreach visits
- [ ] **S.4**: Apply RLS policies for all tables (see DESIGN.md) *(defer until all tables exist)*

### Known Gaps / Deferred
- **`church_id` on profiles**: No onboarding flow yet links a servant/coordinator to a church. Coordinator-scoped grade queries in `useGrades` are guarded with a TODO. Will be resolved when C.7 (Church Invitation System) is built. Until then, all users operate as servants via `servant_grades`.
- **`database.ts` types**: Auto-generated from Supabase. Re-run after any schema change: `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > apps/mobile/src/types/database.ts`. The `Grade` interface in `useGrades.ts` manually mirrors the DB type — once types are regenerated post-migration (includes `gender` on `profiles`/`students`, all new tables), import from `../types` directly and remove the local interface.

### Data Operations
- [x] **S.5**: Grade CRUD — replace mock hooks with real Supabase queries
- [x] **S.6**: Servant onboarding flow — first-login multi-step setup:
  - Step 1: What grade do you serve? (create or join a grade → `grades` + `servant_grades`)
  - Step 2: What classes does that grade have? (create classes → `classes` + `class_grades`)
  - Step 3: Which classes do YOU personally serve? (assign self → `class_servants`)
  - Step 4: Upload students via CSV or add manually
  - Shown automatically when a logged-in servant has no grades yet; skippable at each step
- [x] **S.7**: Student CSV import
  - Downloadable template (one-click) with columns: first name, last name, DOB, student phone, mother email, mother phone, father email, father phone, street, city, state, zip, country, notes, gender
  - App parses uploaded CSV/Excel and bulk-inserts into `students` table
  - Servant can alternatively add students one-by-one via existing AddStudentScreen
  - Address stored split across fields (street, city, state, zip, country) — cleaner for Maps linking and future filtering
- [x] **S.8**: Student CRUD — insert/update/delete in `students` table (wire AddStudentScreen/EditStudentScreen to Supabase)
- [x] **S.9**: Attendance — batch insert (upsert on student_id+date), history queries; tour mode uses mock data like useStudents pattern
- [x] **S.10**: Classes & sessions — CRUD for servant-created classes, session list read; tour mode uses mock data
- [x] **S.11**: Availability — upsert, date range queries, coverage calculations; tour mode uses mock data
- [ ] **S.12**: Outreach — assignments, visit logging, progress queries; tour mode uses mock data
- [ ] **S.13**: Real-time subscriptions — attendance, availability, session changes

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

## Phase 7: UI Component System

> Replace per-screen `createStyles` boilerplate with shared primitive components that consume theme tokens internally. Goal: reduce style code per screen by ~60–70%, make dark mode changes require zero per-screen edits, and reduce Claude Code token usage on future edits.

- [ ] **UI.1**: Build primitive components in `src/components/ui/`
  - `Screen` — wraps SafeArea + background color
  - `Card` — rounded card with border and shadow, consumes `colors.card`
  - `Button` — primary/secondary/ghost variants, loading state, consumes theme
  - `Label` — heading variants (h1/h2/h3), consumes `colors.textPrimary`
  - `BodyText` — body/secondary/caption variants, `secondary` prop for `colors.textSecondary`
  - `Row` — horizontal flex with gap and alignment props
  - `Divider` — themed horizontal rule
  - `Badge` — colored pill (for class type tags, attendance %, etc.)
  - `EmptyState` — icon + title + body + optional CTA button
  - `ErrorState` — icon + title + body + retry button
- [ ] **UI.2**: Refactor 2–3 existing screens as proof of concept (OnboardingScreen, MyGradesScreen, GradeDetailScreen)
- [ ] **UI.3**: Apply primitives to all new screens going forward; refactor remaining screens opportunistically

---

## Phase 8: Coordinator Flow (UI → then wire to Supabase)

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
- [ ] Session cancellation: restrict to coordinators only (currently any servant can cancel)
- [ ] Notify co-servants when a session is cancelled (push notification or in-app alert)
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
| 4. Supabase Integration | In Progress |
| 5. Privacy & Legal | Not Started |
| 6. Dark Mode | Not Started |
| 7. UI Component System | Not Started |
| 8. Coordinator Flow | Not Started |
| 9. Calendar Views | Not Started |
| 10. Local Testing | Blocked on Phase 4 |
| 11. Beta & Production | Blocked on Phase 10 |

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
