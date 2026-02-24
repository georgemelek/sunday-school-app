# Sunday School App - Implementation Plan

**Status**: In Progress
**Current Phase**: Week 2b - Servant Dashboard & Schedule UI
**Last Updated**: February 23, 2026

**Approach**: Build all screens/UI with mock data first, then integrate Supabase for all operations in a dedicated integration phase.

---

## Overview

This document tracks all tasks needed to complete the app. The scope has expanded beyond basic attendance tracking to include **class/schedule management**, **servant availability**, and a **personalized servant dashboard** — replacing the Google Sheets currently used for curriculum schedules and availability tracking.

See `CLAUDE.md` for full project context and `DESIGN.md` for architecture decisions.

---

## ✅ Week 1: Foundation (COMPLETED)

- [x] Project setup (Expo, TypeScript, dependencies)
- [x] Supabase configuration
- [x] Database schema and RLS policies
- [x] Authentication screens (login/register) - *Auth flow disabled; using placeholder navigation for now*
- [x] Navigation structure

---

## ✅ Week 2a: Servant Flow — Core (COMPLETED - UI with mock data)

### ✅ Phase 1: Authentication Screens (DEFERRED)
**Note**: Auth screens (Login/Register) are built. The navigation currently uses a placeholder screen for manual role selection. Full auth integration is deferred to the Supabase Integration phase.

- [x] **Task 2.1**: Auth screens built (LoginScreen, RegisterScreen)
- [ ] **Task 2.2**: Re-enable authentication flow — *Deferred to Supabase Integration*
- [ ] **Task 2.3**: Test authentication edge cases — *Deferred to Supabase Integration*

### ✅ Phase 2: Grade Management (COMPLETED - UI with mock data)

- [x] **Task 2.4**: Enhance MyGradesScreen
  - Grade list display, "Create New Grade" button, navigation to GradeDetailScreen, empty state, pull-to-refresh
- [x] **Task 2.5**: Create GradeDetailScreen
  - Grade name/metadata, student list with Students/Attendance tabs, "Add Student" button, "Take Attendance" button
- [x] **Task 2.6**: Create AddGrade Modal (in MyGradesScreen)
  - Grade name form field, validation, mock create logic

### ✅ Phase 3: Student Management (COMPLETED - UI with mock data)

- [x] **Task 2.7**: Create AddStudentScreen
  - All form fields (name, DOB, parent info, address, city, notes), validation, shared StudentFormScreen component
- [x] **Task 2.8**: Create EditStudentScreen
  - Pre-populated form via StudentFormScreen, update logic with mock data
- [x] **Task 2.9**: Add student list features to GradeDetailScreen
  - Search/filter, tap to edit, delete with confirmation, student count, sort by name

### ✅ Phase 4: Attendance Tracking (COMPLETED - UI with mock data)

- [x] **Task 2.10**: Create TakeAttendanceScreen
  - Today's date, student list with present/absent toggles, notes per student, submit button, loading/success states
- [x] **Task 2.11**: Mock attendance submission logic
  - In-memory mock state, duplicate prevention, optimistic UI
- [x] **Task 2.12**: View past attendance
  - Students/Attendance tabs in GradeDetailScreen, AttendanceHistoryView component, by-date and by-student views, attendance percentage badges

---

## 🚧 Week 2b: Servant Dashboard & Schedule (UP NEXT - UI with mock data)

> This is new scope. Adds the personalized servant dashboard, class/session data model, and availability tracking — replacing the Google Sheets currently used for curriculum schedules and servant availability.

### Phase 1: Data Model & Mock Hooks

- [ ] **Task 2b.1**: Create mock data model for classes and sessions
  - Create `useClasses` hook with mock data
    - Class types: Sunday School, Small Group, FNA, Bible Study
    - Classes: "6th Grade Sunday School", "6th Grade Boys Small Group", "5th & 6th Grade FNA", etc.
    - Each class has: type/tag, default day/time, default location, assigned servants, linked grades
  - Create `useSessions` hook with mock data
    - Sessions populated from the real 6th grade curriculum CSV (Feb-Mar 2026 range for demo)
    - Each session: date, lesson topic, page number, lesson giver, class admin, location, status
  - Create `useAvailability` hook with mock data
    - Mock availability entries for George and co-servants (from real availability tracker)
    - CRUD: mark available/unavailable for a date

### Phase 2: Servant Dashboard Screen

- [ ] **Task 2b.2**: Create ServantDashboardScreen
  - Time-aware greeting ("Good morning/afternoon/evening, {name}")
  - Replace MyGradesScreen as the servant home screen
  - Navigation to existing grades/attendance flow still accessible
  - *Use mock data for logged-in user (George Melek)*

- [ ] **Task 2b.3**: Upcoming sessions feed
  - Show next 7 days of sessions across all the servant's classes
  - Each session card shows:
    - Class name + type tag (e.g., "6th Grade Boys — Small Group")
    - Date and time
    - Location (tappable — opens Maps if address is available)
    - Lesson topic (if applicable, e.g., not for FNA)
    - Who's giving the lesson
    - Who's class admin
  - If the servant is teaching: highlighted indicator ("You're teaching!")
  - If the session is canceled: visual treatment + notes (e.g., "Canceled - Snow Storm")
  - Empty state when no upcoming sessions

- [ ] **Task 2b.4**: Servant availability awareness on dashboard
  - Show which co-servants are unavailable for each upcoming session
  - e.g., "Revana and Steven will be out this week"
  - If the servant themselves is marked out: "You've marked yourself unavailable for this session"
  - Staffing alert if only 1-2 servants available: "Heads up: only 2 servants available"

- [ ] **Task 2b.5**: Session detail view
  - Tapping a session card expands or navigates to detail
  - Full lesson info: topic, page number, reference material/link
  - Full servant roster with availability status for that date
  - Location with tappable address
  - Link to "Take Attendance" if it's a session for a grade the servant manages

### Phase 3: Availability Management

- [ ] **Task 2b.6**: Create AvailabilityScreen
  - Calendar or list view of upcoming dates
  - For each date, servant can toggle available/unavailable
  - Show which sessions fall on that date so servant knows what they'd miss
  - Optional notes field (e.g., "traveling")
  - Save confirmation
  - *Mock data — no Supabase*

- [ ] **Task 2b.7**: Quick availability toggle from dashboard
  - On each session card, a quick action to mark yourself out for that date
  - Confirmation dialog: "Mark yourself unavailable for March 1st? This affects all your classes on that date."

### Phase 4: Navigation Update

- [ ] **Task 2b.8**: Update navigation structure
  - Servant home screen becomes ServantDashboardScreen (not MyGradesScreen)
  - Add bottom tab or drawer: Dashboard | My Grades | Availability | Settings
  - My Grades retains existing flow (grade list → detail → students/attendance)
  - Wire up all new screens into PlaceholderScreen navigation

---

## 📅 Week 3: Coordinator Flow (UI with mock data)

### Phase 1: Dashboard

- [ ] **Task 3.1**: Create CoordinatorDashboardScreen
  - Overview cards:
    - Total students across all grades
    - Total classes in scope
    - Overall attendance rate (last 30 days)
    - Upcoming staffing gaps (dates with thin coverage)
  - List of all classes with quick stats
  - Navigation to class detail, reports, schedule management
  - *Use mock data*

- [ ] **Task 3.2**: Create AttendanceReportScreen
  - Select grade/class dropdown
  - Date range picker (start/end date)
  - Display attendance data:
    - List of students with attendance %
    - Trend graph (optional for MVP)
    - Export to CSV button (optional for MVP)
  - Filter options
  - *Use mock data*

- [ ] **Task 3.3**: Real-time updates — *Deferred to Supabase Integration*

### Phase 2: Schedule Management (Coordinator)

- [ ] **Task 3.4**: Create ScheduleManagementScreen
  - List of all classes the coordinator oversees
  - Tap a class to see/edit its session schedule
  - "Add Class" button to create a new class (type, name, default day/time/location, assigned grades and servants)
  - *Use mock data*

- [ ] **Task 3.5**: Create SessionListScreen (per class)
  - Chronological list of sessions for a class
  - Each row: date, lesson topic, lesson giver, status
  - Tap to edit a session (topic, servant assignment, location, notes)
  - "Add Session" to create individual sessions
  - *Use mock data*

- [ ] **Task 3.6**: Create CSV Import flow
  - Button: "Import Schedule from CSV"
  - File picker to select CSV
  - Preview parsed sessions before confirming
  - Map servant names from CSV to existing servant profiles
  - Bulk-create sessions for the class
  - Show success/error summary
  - *Mock the import logic — parse CSV locally, create mock sessions*

- [ ] **Task 3.7**: Staffing coverage view
  - Calendar or list view showing upcoming dates
  - For each date: how many servants are available vs. total assigned per class
  - Color-coded: green (fully staffed), yellow (thin), red (critically understaffed)
  - Tap a date to see who's in and who's out
  - *Use mock data from availability tracker*

### Phase 3: Church Invitation System (UI only)

- [ ] **Task 3.8**: Create ChurchInvitationScreen
  - Display current invitation codes
  - "Generate New Code" button
  - Set expiration date (optional)
  - Set max uses (optional)
  - Copy code to clipboard
  - Share code via OS share sheet
  - *Use mock data*

- [ ] **Task 3.9**: Implement invitation code generation — *Deferred to Supabase Integration*

- [ ] **Task 3.10**: Create JoinChurchScreen (Servant side UI)
  - "Join Church" option in servant settings
  - Input field for invitation code
  - Success/error messages
  - *Validation logic deferred to Supabase Integration*

- [ ] **Task 3.11**: Church migration logic — *Deferred to Supabase Integration*

### Phase 4: Polish

- [ ] **Task 3.12**: Error handling UI
  - Network error handling with retry
  - Form validation errors
  - Permission errors (RLS failures)
  - User-friendly error messages

- [ ] **Task 3.13**: Loading states
  - Skeleton screens
  - Loading spinners
  - Pull-to-refresh indicators
  - Button loading states

- [ ] **Task 3.14**: Offline support (Optional for MVP) — *Deferred to Supabase Integration*

- [ ] **Task 3.15**: Form validation
  - Email format validation
  - Phone number validation
  - Required field indicators
  - Real-time validation feedback

---

## 📅 Supabase Integration Phase

**Note**: This phase replaces mock data with real Supabase calls across the entire app. Tackle all at once after all UI screens are built.

### Authentication
- [ ] **Task S.1**: Re-enable authentication flow
  - Remove placeholder screen from `src/navigation/index.tsx`
  - Uncomment NavigationContainer and navigator components
  - Debug/fix boolean prop type error if it resurfaces
  - Test full auth flow: register → login → role-based navigation

- [ ] **Task S.2**: Test authentication edge cases
  - Email validation, password strength, error handling
  - Session persistence across app restarts

### Database Migration
- [ ] **Task S.3**: Run expanded schema migration
  - Create new tables: `class_types`, `classes`, `class_grades`, `class_servants`, `sessions`, `servant_availability`
  - Create indexes
  - Apply RLS policies for new tables (see DESIGN.md section 4b)

### Data Operations
- [ ] **Task S.4**: Grade CRUD integration
  - Replace mock grade hooks with real Supabase queries
  - Insert into `grades` table
  - Auto-link servant to grade via `servant_grades` table
  - Read, update, delete operations

- [ ] **Task S.5**: Student CRUD integration
  - Replace mock student hooks with real Supabase queries
  - Insert/update/delete in `students` table
  - Link students to grades

- [ ] **Task S.6**: Attendance integration
  - Batch insert into `attendance` table
  - Duplicate prevention (one record per student per day)
  - Read attendance history with date filtering
  - Error handling with rollback

- [ ] **Task S.7**: Class & session integration
  - Replace mock class/session hooks with real Supabase queries
  - CRUD for classes (coordinator only)
  - CRUD for sessions (coordinator only)
  - Read-only session queries for servants
  - CSV import creates real session rows

- [ ] **Task S.8**: Availability integration
  - Replace mock availability hook with real Supabase queries
  - Upsert into `servant_availability` table
  - Query availability for a date range
  - Cross-reference with class_servants for coverage calculations

- [ ] **Task S.9**: Coordinator dashboard integration
  - Real queries for dashboard stats (student count, class count, attendance rates)
  - Attendance report queries with date range filtering
  - Staffing coverage queries

- [ ] **Task S.10**: Church invitation system integration
  - Supabase Edge Function or RPC for code generation
  - Insert into `church_invitations` table
  - Validate invitation codes
  - `migrate_user_to_church` RPC function

- [ ] **Task S.11**: Real-time subscriptions
  - Subscribe to attendance changes
  - Subscribe to availability changes
  - Update dashboard stats automatically

- [ ] **Task S.12**: Offline support (Optional for MVP)
  - Cache recent data with AsyncStorage
  - Queue attendance submissions when offline
  - Sync when back online
  - Show offline indicator

---

## 📅 Testing & Deployment

### Phase 1: Testing

- [ ] **Task T.1**: Local testing
  - Test on iOS simulator
  - Test on Android emulator
  - Test on real iOS device
  - Test on real Android device

- [ ] **Task T.2**: User role testing
  - Create test accounts for each role (servant, coordinator, priest)
  - Test all flows with each role
  - Verify RLS policies work correctly
  - Test permissions and data isolation

- [ ] **Task T.3**: Edge case testing
  - Empty states (no grades, no students, no sessions)
  - Large datasets (100+ students, full year of sessions)
  - Network failures
  - Concurrent updates (two servants editing same data)
  - Invalid inputs
  - CSV import with malformed data

- [ ] **Task T.4**: Bug fixes
  - Create bug tracker (GitHub Issues or similar)
  - Prioritize critical bugs
  - Fix P0/P1 bugs before launch
  - Document known issues for P2/P3

### Phase 2: Beta Testing

- [ ] **Task T.5**: Prepare beta builds
  - Set up EAS Build profiles
  - Build iOS preview version
  - Build Android preview version
  - Upload to TestFlight (iOS)
  - Upload to Google Play Internal Testing (Android)

- [ ] **Task T.6**: Recruit beta testers
  - 6th grade servant team (George, Fady, Revana, Monica, Steven, Koki, Sarah, John)
  - Junior High coordinator
  - Provide testing instructions

- [ ] **Task T.7**: Gather feedback
  - Create feedback form
  - Track issues reported by testers
  - Conduct user interviews
  - Prioritize feedback for fixes

### Phase 3: Production Deployment

- [ ] **Task T.8**: Pre-launch checklist
  - [ ] App icon finalized
  - [ ] Splash screen created
  - [ ] Privacy policy published
  - [ ] Terms of service published
  - [ ] App store screenshots prepared
  - [ ] App descriptions written
  - [ ] Metadata (keywords, category) finalized

- [ ] **Task T.9**: Build production versions
  - Configure production environment variables
  - Build iOS production version
  - Build Android production version
  - Test production builds

- [ ] **Task T.10**: Submit to app stores
  - Apple App Store submission
  - Google Play Store submission
  - Respond to review feedback if needed
  - Monitor submission status

- [ ] **Task T.11**: Launch preparation
  - Prepare announcement
  - Create user onboarding guide
  - Set up support channels (email, etc.)
  - Monitor Supabase for issues

---

## 🔮 Post-MVP Backlog

### Near-Term Enhancements
- [ ] Visit tracking system (home visits)
- [ ] Birthday notifications with push alerts
- [ ] Parent portal (read-only access)
- [ ] Multi-language support (Arabic, Coptic)
- [ ] Student photos upload
- [ ] Announcements from coordinators
- [ ] Calendar integration (Google Calendar sync)
- [ ] SMS/push reminders for upcoming sessions

### Longer-Term
- [ ] Analytics dashboard (attendance trends, dropout alerts)
- [ ] Bulk student import (CSV)
- [ ] Multi-grade servant switching
- [ ] Hierarchical permissions (Country → State → City → Church)
- [ ] Custom PDF reports
- [ ] Advanced analytics and data export

---

## 📊 Progress Tracking

### Current Status
- **Completed**: Week 1 Foundation, Week 2a Servant Flow Core (all UI with mock data)
- **Up Next**: Week 2b Servant Dashboard & Schedule (UI with mock data)
- **Deferred**: Auth flow re-enablement, all Supabase integration
- **After That**: Week 3 Coordinator Flow → Supabase Integration → Testing & Deployment

### Risks
1. **Expanded scope**: The app is now significantly bigger than the original attendance-only MVP
   - **Mitigation**: Still UI-first with mock data. Can ship a partial version if needed.
2. **Mock-to-real migration complexity**: Replacing all mock data at once could surface many issues
   - **Mitigation**: Keep hooks/services cleanly separated so swapping is straightforward
3. **RLS complexity**: More tables means more policies to get right
   - **Mitigation**: Thorough testing with multiple accounts during integration phase
4. **CSV import edge cases**: Servant name matching, date parsing, malformed data
   - **Mitigation**: Preview step before import, graceful error handling

---

## 🆘 Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **Expo Docs**: https://docs.expo.dev
- **React Navigation**: https://reactnavigation.org
- **Project Design Doc**: `DESIGN.md`
- **Database Setup**: `SUPABASE_SETUP.md`
- **Session Context**: `CLAUDE.md`

---

## Notes

- This plan assumes 1 developer working part-time with Claude Code assistance
- Each task includes implementation + testing time
- Mark tasks as completed using `[x]` checkbox syntax
- All UI screens use mock data/hooks until the Supabase Integration Phase
- Reference spreadsheets for mock data: `~/Downloads/25-26 JH Master.xlsx - 06 Grade.csv` and `~/Downloads/25-26 Servants Availability Tracker - 6th .csv`
