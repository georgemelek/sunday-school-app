# Sunday School App — Claude Code Context

> This file is automatically loaded at the start of every Claude Code session.
> Last updated: March 3, 2026

---

## What Is This Project?

A cross-platform mobile app (iOS + Android) for managing **Coptic Orthodox youth ministry**. Built with React Native (Expo) + Supabase (PostgreSQL).

The app serves **servants** (volunteer teachers), **coordinators** (ministry leaders who oversee multiple grades), and eventually **priests**. It replaces a patchwork of Google Sheets that currently manage curriculum schedules, servant availability, student rosters, and attendance tracking.

## The Problem We're Solving

Servants in a Coptic Orthodox church juggle **multiple weekly commitments** across different class types:

- **Sunday School** — the main service (e.g., 6th grade boys & girls, Sundays 11:30-12:30 at Church)
- **Small Group** — smaller, intimate setting with separate curriculum (e.g., 6th grade boys only, Tuesdays 7-8:30, rotating parent homes)
- **FNA (Friday Night Activities)** — non-spiritual hangouts at fun venues (e.g., 5th & 6th grade combined, Fridays, at places like bowling alleys)
- **Bible Study** — deeper scripture study (e.g., 5th & 6th combined, Wednesdays at Church)

Currently managed through **disconnected Google Sheets**:
1. **Master Schedule / Curriculum** (one per grade) — lesson topics, page numbers, which servant is teaching, class admin. Maintained by coordinator.
2. **Servant Availability Tracker** (one per coordinator scope) — grid where servants mark X for dates they can't serve. Used by coordinator to spot staffing gaps and by servants to see who else will be there.

**Pain points:**
- No single dashboard — servants cross-reference multiple sheets + group chats to know what's happening this week
- Location info for rotating venues lives only in group chats
- Coordinator manually scans availability sheets across multiple grades to catch coverage gaps
- No structured way to see "who's out this week" at a glance

## How We're Solving It

### Key Data Model Concepts

- **Grade** — a group of students (e.g., "6th Grade Boys & Girls"). Has a student roster. Already implemented.
- **Class** — a recurring meeting type tied to one or more grades. Has a tag (Sunday School, Small Group, FNA, Bible Study), recurrence pattern, default location, and assigned servants. **NEW — not yet implemented.**
- **Session** — a single occurrence of a class on a specific date. Has: lesson topic, page number, location (can override class default), assigned lesson-giver, class admin, notes. Coordinator creates these (or bulk imports from CSV). Servants see them read-only. **NEW.**
- **Servant Availability** — per servant, per date. Replaces the X-grid spreadsheet. Scoped to the whole day. **NEW.**

### Servant Dashboard (not yet built)
When a servant logs in, they see a personalized feed of upcoming sessions across all their classes:
- Time-aware greeting ("Good evening, George")
- Upcoming sessions (next 7 days) with: class name + tag, date/time/location (tappable for Maps), lesson topic, who's teaching, which servants are out
- Staffing alerts ("Only 2 servants available this Sunday")

### Coordinator Dashboard (not yet built)
- All classes across their scope (e.g., all Junior High: 5th-8th grade)
- Staffing coverage view — which dates have thin coverage
- Create/edit schedule (lesson topics, servant assignments)
- CSV import for bulk-loading a year's curriculum
- Access to all student info across all grades they oversee

## Current Project Status

### What's Built (UI with mock data)
- **Foundation**: Project setup, Supabase config, DB schema, auth screens (disabled — using placeholder nav), navigation structure
- **Servant Core**: MyGradesScreen, GradeDetailScreen (Students/Attendance tabs), AddStudent/EditStudent, TakeAttendanceScreen, AttendanceHistoryView
- **Dashboard & Schedule**: DashboardScreen (greeting, upcoming sessions, staffing alerts), SessionCard, SessionDetailScreen, class/session mock data
- **Availability**: AvailabilityScreen (toggle available/unavailable per date)
- **Outreach**: OutreachScreen (kid list + progress), OutreachDetailScreen (contact actions, visit log), message templates
- **Navigation**: 5 bottom tabs (Dashboard, My Grades, Availability, Outreach, Settings)

### What's NOT Built Yet
- Supabase integration (all screens use mock data)
- Real authentication flow (using placeholder role selector)
- Privacy policy, terms of service, COPPA compliance review
- Dark mode
- Coordinator flow (dashboard, reports, schedule management, CSV import)
- Calendar views (dashboard + outreach)
- On-device testing, beta, app store submission

### Approach
**UI-first with mock data**, then a dedicated **Supabase Integration Phase** to wire everything up at once.

## Key Files to Read

| File | What It Contains |
|---|---|
| `DESIGN.md` | Architecture decisions, tech stack rationale, DB schema (original + expanded), RLS policies |
| `IMPLEMENTATION_PLAN.md` | Task-level tracking with checkboxes. Current status of every task. |
| `SUPABASE_SETUP.md` | Backend setup guide, migrations, auth config |
| `apps/mobile/src/navigation/index.tsx` | Navigation hub — bottom tabs + stack navigators, role selector |
| `apps/mobile/src/hooks/` | `useGrades`, `useStudents`, `useAttendance`, `useClasses`, `useSessions`, `useAvailability`, `useOutreach` — all mock data hooks |
| `apps/mobile/src/screens/servant/` | All servant screens built so far |
| `apps/mobile/src/components/` | Shared components (GradeCard, StudentListItem, AttendanceHistoryView) |

## Conventions

- **Styling**: Primary `#007AFF`, secondary text `#666`, borders `#e0e0e0`, background `#f8f9fa`, error `#f44336`, present green `#4CAF50`, absent red `#f44336`
- **Screen pattern**: Props interface with callbacks (`onBack`, `onSave`, etc.), header with paddingTop 60, back button "‹ Back" or "‹ Cancel"
- **Hook pattern**: `useState` + `useEffect` fetch on mount, mock data with 500ms delay, commented-out Supabase queries with TODO markers
- **Navigation**: Bottom tab navigator (`@react-navigation/bottom-tabs`) with 5 tabs (Dashboard, My Grades, Availability, Outreach, Settings), each wrapping a native stack. Role selector is React state above `NavigationContainer`.
- **Forms**: Shared via mode prop (`'add' | 'edit'`), inline validation errors, footer save button with ActivityIndicator

## Real-World Context

- The app is for **St. Mary Coptic Orthodox Church, Naperville, IL** (and eventually other churches)
- George Melek is the developer and a 6th grade servant
- The coordinator for Junior High (5th-8th grade) oversees all class types across those grades
- Reference spreadsheets (for understanding the data, NOT to be used at runtime):
  - Curriculum: `~/Downloads/25-26 JH Master.xlsx - 06 Grade.csv`
  - Availability: `~/Downloads/25-26 Servants Availability Tracker - 6th .csv`
