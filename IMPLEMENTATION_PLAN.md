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
- [x] **S.12**: Outreach — assignments, visit logging, progress queries; tour mode uses mock data
- [ ] **S.13**: Real-time subscriptions — attendance, availability, session changes *(deferred — low priority pre-launch; React Query stale-while-revalidate covers the UX need)*

### React Query migration
- [x] Dashboard — useClassesQuery, useSessionsQuery, useAvailabilityQuery with 5-min staleTime
- [x] AvailabilityScreen — shares same React Query cache as Dashboard (no extra fetches on tab switch)
- [ ] Other screens (MyGrades, Outreach, Attendance) — defer to post-launch; none have the tab-switch refetch problem

### Error handling
- [x] `src/lib/logger.ts` — centralised logger; all Supabase errors logged to console, never shown raw to users
- [x] All servant screens show generic friendly Alerts; full errors in Metro console

---

## Phase 4b: Beta Feedback — Bug Fixes & UX Improvements

> Feedback collected from internal distribution build (April 2026). Items ordered high → medium → low priority within each group.

### HIGH PRIORITY — Bugs & Broken Flows

- [ ] **BF.1**: **Splash screen on load** — App skips splash screen and shows a loading spinner on first load. Show the native splash screen for the duration the spinner would appear instead.
- [ ] **BF.2**: **Dark mode modals** — Modals appear with a light background in dark mode. All modal surfaces must respect the active theme.
- [ ] **BF.3**: **Keyboard dark mode** — Keyboard has a white background in dark mode when editing student details. Fix keyboard appearance to respect the theme (`keyboardAppearance="dark"`).
- [ ] **BF.4**: **Dashboard scroll / greeting position** — "Good morning, George" renders lower than expected when navigating back to the Dashboard; repositions on refresh. Fix layout so greeting is always at the top. Also: entire dashboard should be scrollable (currently only portions scroll).
- [x] **BF.5**: **Student count tag stale after import** — Fixed: `GradeDetailScreen` now uses `useFocusEffect` to refetch students on focus, so the list (and count in the header) updates automatically when returning from import.
- [x] **BF.6**: **Student name stale after edit** — Fixed: same `useFocusEffect` in `GradeDetailScreen` ensures the list refetches after returning from edit.
- [x] **BF.7**: **Session topic stale after edit** — Fixed: `SessionDetailScreen` now tracks session in local state (`localSession`); `handleSaveTopic` updates `localSession.lessonTopic` immediately on success.
- [x] **BF.8**: **Session cancellation stale** — Fixed: `handleCancelSession` updates `localSession.status` to `'canceled'` immediately on success, so the UI reflects the change without requiring navigation.
- [x] **BF.9**: **Student list stale after CSV import** — Fixed: same `useFocusEffect` in `GradeDetailScreen`.
- [x] **BF.10**: **Grades shown after onboarding setup** — Fixed: `MyGradesScreen` now uses `useFocusEffect` to refetch grades on focus; grades appear immediately after returning from onboarding.
- [x] **BF.11**: **Staffing alert threshold** — Changed from flat `<= 3` check to `< 75%` of total servants. Alert text updated to show `count/total` for clarity.
- [x] **BF.12**: **Availability class label duplicated** — Fixed: only appends the class type name if it's not already contained in the class name string.
- [x] **BF.13**: **"Sunday School" branding** — Fixed: LoginScreen title and RegisterScreen subtitle updated to "MinistryHub" / "Join your ministry community". Class type names ("Sunday School", "Small Group", etc.) are intentionally unchanged — they name the type of class, not the app.
- [x] **BF.14**: **Attendance must be tied to a session** — Removed "Attendance" button from GradeDetailScreen. Attendance is now only accessible through SessionDetailScreen, which is always tied to a specific session.
- [x] **BF.15**: **No uncancel option** — Added `uncancelSession` mutation to `useSessions`, `onUncancelSession` prop to `SessionDetailScreen`, and a "Restore Session" button (green border) that appears when status is `'canceled'`. Updates local state immediately on success.
- [ ] **BF.16**: **Missing recent attendance section on real data** — GradeDetailScreen shows a "recent attendance" summary section in mock data but nothing in real data, leaving a visual gap. Wire the real attendance query to populate this section.
- [x] **BF.17**: **Sign up: modal after success** — Removed the `Alert.alert` success dialog. Auth state listener in `AuthContext` automatically routes the user to the dashboard when the session is set by `signUp`.

### HIGH PRIORITY — Auth & Security

- [x] **BF.18**: **Sign up: first/last name fields** — Split into First Name + Last Name side-by-side fields; combined as `firstName + lastName` before writing to DB.
- [x] **BF.19**: **Sign up: phone number field** — Auto-formats to `(XXX) XXX-XXXX` as user types; stored as `+1XXXXXXXXXX` in DB. Added `autoComplete` and `textContentType` on all fields.
- [x] **BF.20**: **Sign up: email verification** — Switched to magic link auth (`signInWithOtp`). Login screen: email only, no password. Register screen: collects name/phone/role then sends magic link. Dev bypass for test accounts (password fallback). Deep link handler in AuthContext extracts tokens from hash fragment and calls `setSession`. Priest role removed from register screen.
- [ ] **BF.21**: **Multi-method login & duplicate account prevention** — Support login via phone number (and optionally Google, Apple, Facebook). To prevent duplicate accounts: before creating an account, check if the identifier (email/phone) is already registered and surface a "looks like you already have an account — sign in instead?" prompt. Note: exposing whether an identifier exists is a standard, accepted trade-off; the risk (account enumeration) is low for a ministry app and far outweighed by the UX benefit of preventing duplicate accounts. Document this decision.
- [ ] **BF.22**: **Security scan** — Run a security audit of the application (dependencies, Supabase RLS, auth flows, PII handling). See Phase 5 (L.6) for overlap.

### MEDIUM PRIORITY — UX Polish

- [x] **BF.23**: **Student detail screen: view vs edit mode** — Student detail screen should open in read-only view mode. Edits should only be possible after tapping an explicit "Edit" button, to prevent accidental edits.
- [ ] **BF.24**: **Cancel edit confirmation** — If a user has unsaved edits on a student form and taps "Cancel", show a confirmation dialog ("Discard changes?") before navigating away.
- [ ] **BF.25**: **Grade detail: full-screen scroll** — On the grade detail screen, scrolling is limited to the bottom section. The entire screen (including the header area) should scroll so students fill the full viewport.
- [ ] **BF.26**: **Onboarding step 1 copy** — Remove the "at a larger/smaller church" language. Replace with accurate framing: "Does your church divide Sunday School by grade, or is it all one class?"
- [ ] **BF.27**: **Onboarding step 2: class selection simplification** — Remove the distinction between "classes your grade attends" vs "classes you personally serve" if a servant has no purpose selecting classes they don't serve. Simplify to only: "What classes do you personally serve?"
- [ ] **BF.28**: **Onboarding step 2: Yes/No → checkboxes** — Replace Yes/No chips with checkboxes for class type selection.
- [ ] **BF.29**: **Onboarding: time picker in 30-minute increments** — Class start/end times should snap to 30-minute intervals (e.g., 7:00, 7:30, 8:00) — not arbitrary values like 7:47.
- [ ] **BF.30**: **Onboarding: Coptic year end-date preset** — Add a preset for the Coptic school year end date (varies yearly — George to provide date each year). Date range picker should also constrain to valid weekdays for the class type (e.g., only Sundays for Sunday School).
- [ ] **BF.31**: **Onboarding success screen: fix action buttons** — After setup, success screen shows "Assign Kids", "Add Students", and "Go to Dashboard". Since there are no kids yet, "Assign Kids" makes no sense. Replace with just "Add Students" and "Go to Dashboard".
- [ ] **BF.32**: **Session location: free-text address input** — Session location is currently a hardcoded string ("Church", "Rotating home"). Allow servants to enter a real address. Evaluate Google Maps Places Autocomplete cost (note: Places API charges ~$0.017/request after free tier — for a small ministry app this is negligible, but consider a one-time address entry + save pattern to minimize API calls).
- [ ] **BF.33**: **Availability: load more sessions** — Availability screen only shows the next ~30 days of sessions. Add a "Load More" button (or infinite scroll) to see sessions further in advance.
- [ ] **BF.34**: **Dashboard / empty states: contextual CTAs** — When the dashboard shows "No upcoming sessions", point users to "Set Up Your Ministry". On the Availability screen with no sessions, do the same. On the Outreach screen with no kids assigned, point to ministry setup rather than manage assignments.
- [ ] **BF.35**: **"Set Up My Ministry" prominent after onboarding** — After setup wizard, the button should no longer dominate the UI (it currently persists in the header). Once a grade/class exists, the button should disappear or move to a less prominent location.
- [ ] **BF.36**: **Who's teaching: make it more prominent** — On session cards and session detail screens, highlight when the logged-in servant is the one teaching (e.g., a distinct border, highlight, or badge).
- [x] **BF.37**: **Students screen action bar layout** — The three action buttons (Attendance, Import, Add) look inconsistent: left button is blue, others are black in dark mode, and "Attendance" text wraps onto a second line. Fix: uniform color + ensure all labels fit on one line.
- [ ] **BF.38**: **"Local friend" categorization on grade detail** — Extend the "local friend" concept to the grade detail screen: students marked as local friends should appear at the bottom, and servants should be able to toggle local friend status directly from the grade list (not just the outreach screen).
- [ ] **BF.39**: **Manage Assignments UX** — Current UX: tapping a student circle opens a single-student modal. Investigate industry standard. Proposal: tapping selects the student into a selection set, then a single action button handles the operation. Remove the "Girls" tab if the current servant has no girl students.
- [ ] **BF.40**: **Gender visibility / assignment rules** — Think through whether servants should see and import only students of their assigned gender. Male servants should only see male students in assignments. Other churches may not have this restriction — make it a church-level setting. Needs design.
- [ ] **BF.41**: **"Take a Tour" clarity** — Make it clearer on the welcome screen that "Take a Tour" is an alternative to signing up, it's a preview-only mode, and it only shows the servant view (not coordinator/priest).
- [ ] **BF.42**: **Sign up: auto-suggest for name and email fields** — Enable `autoComplete="name"` / `autoComplete="email"` and `textContentType` on the relevant inputs so iOS/Android can suggest values from the keyboard.
- [ ] **BF.43**: **Sign up: required field indicators** — Replace the ` *` pattern (space + asterisk) with a cleaner UX convention. Options: inline "(required)" label, a small red dot, or simply mark optional fields as "(optional)" and leave required fields unmarked.
- [ ] **BF.44**: **Message templates: first contact vs follow-up** — Create separate message templates depending on whether this is the first outreach attempt to a parent or a follow-up.
- [ ] **BF.45**: **Settings tab: what makes sense?** — Audit and define a meaningful settings screen. Minimum: Change Password, Delete Account, Theme toggle, Notification preferences, About/version. Add "Change Password" and "Delete Account" actions.
- [ ] **BF.46**: **Bulk session/curriculum import (IMPORTANT)** — Add a CSV import flow for sessions/curriculum (lesson topics, dates, assigned teacher). Use the existing `~/Downloads/25-26 JH Master.xlsx - 06 Grade.csv` format as the base schema. This is the highest-leverage coordinator tool.

### LOW PRIORITY — Architecture & Tech Debt

- [ ] **BF.47**: **White corners on app open (EAS-specific?)** — On launch, the app briefly shows white corners around the icon. May be specific to the internal distribution build's splash/icon config. Investigate whether the icon has transparency or the launch screen background color is mismatched; may resolve with a production build.
- [ ] **BF.48**: **Replace emoji icons with icon library** — App uses emojis as icons throughout (buttons, empty states, status indicators). Replace with a proper icon library (e.g., `@expo/vector-icons` / Lucide / Heroicons) for consistency and professionalism.
- [ ] **BF.49**: **Shared component library / style tokens** — See Phase 7 (UI.1–UI.3). Reduce per-screen style boilerplate; shared CSS/component system will reduce codebase size and Claude token usage on future edits.
- [ ] **BF.50**: **Student import friction — AI-assisted normalization** — Adding students is high-friction. Proposal: provide a deep link or in-app prompt that opens ChatGPT with a prefilled prompt to normalize the servant's existing spreadsheet into the app's CSV template. This keeps AI costs out of the app while still reducing friction significantly. Native AI integration would be expensive and harder to maintain.
- [ ] **BF.51**: **Availability: calendar integration** — Show Apple Calendar / Google Calendar events on the same dates as sessions, so servants can see conflicts at a glance. Requires `expo-calendar` and user permission. Nice-to-have for a future release.

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
- [ ] Parent portal (read-only access to attendance, schedule)

### Notifications (analysed 2026-03-21, not yet started)

**Recommended approach: local notifications via `expo-notifications`**

When the app opens, schedule on-device notifications for upcoming sessions. No backend required. Limitation: canceled/rescheduled sessions only update notifications the next time the app is opened (acceptable for this use case).

A server-push approach (Supabase Edge Function + cron → Expo Push API) handles cancellations in real-time but is significantly more complex and overkill at this scale.

**Do after S.13** — notification content (lesson topic, location, who's teaching) needs real Supabase data to be meaningful.

**What to build:**
- [ ] **N.1**: Install `expo-notifications`, request permissions with an explanation screen before the system prompt
- [ ] **N.2**: `useNotifications` hook — on app open, cancel stale scheduled notifications, re-schedule for upcoming sessions based on user preferences. Conditions: skip `status === 'canceled'` sessions; skip dates servant marked unavailable
- [ ] **N.3**: Notification settings UI in Settings tab — toggles per class type (Sunday School, Small Group, FNA, Bible Study) + lead time selector (1 week / 1 day / 1 hour before). Persist to AsyncStorage.
- [ ] **N.4**: Rich notification content — e.g. "You're teaching 6th Grade Small Group tomorrow at 7pm · Lesson 12 · Rotating host TBD"
- [ ] **N.5**: New EAS build required (`expo-notifications` is a native module)

**Effort:** ~1–2 focused sessions. **Cost:** free (`expo-notifications` + Expo Push API are both free at this scale).

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
| 4b. Beta Feedback | In Progress |
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
