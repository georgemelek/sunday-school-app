Plan: Phase 8 — Calendar Views                                               

 Context

 Dashboard shows upcoming sessions as a SectionList (grouped by date, next 14 days). Outreach detail screen shows visit history as a plain list. We want to add calendar month
 views to both screens so users can visualize their schedule and visit patterns at a glance. No calendar library is currently installed.

 Library

 react-native-calendars — Expo-compatible (pure JS, no native modules), supports multi-dot marking, custom theming for dark mode, month swiping.

 New Files (1)

 src/components/CalendarView.tsx

 Shared wrapper around Calendar from react-native-calendars with:
 - App theme applied via buildCalendarTheme(colors) helper
 - markingType="multi-dot" — supports multiple colored dots per date (class types on Dashboard, green dots on Outreach)
 - Props: markedDates, onDayPress(dateString), selectedDate?, minDate?, maxDate?
 - Merges selected: true styling onto the selected date in markedDates
 - Styled container with colors.card background, rounded corners, border

 Modified Files (2)

 src/screens/servant/DashboardScreen.tsx

 Toggle between List / Calendar modes:

 1. Add viewMode state ('list' | 'calendar') and selectedDate state
 2. Add a segmented toggle (two TouchableOpacity buttons) below alerts, above section title
 3. List mode — keep existing SectionList with 14-day range (no changes)
 4. Calendar mode — replace SectionList with a ScrollView containing:
   - CalendarView with colored dots per session date (blue=Sunday School, purple=Small Group, orange=FNA, green=Bible Study)
   - Selected date header + filtered SessionCards below the calendar
   - "No sessions on this date" empty state
 5. Expand getUpcomingSessions call to 90 days for calendar mode (use useMemo to avoid recomputing)
 6. Add buildMarkedDates(sessions) helper that groups sessions by date and creates multi-dot entries using class type colors from theme

 Key implementation detail: Switch from SectionList as root to ScrollView that conditionally renders either the list sections or the calendar. The renderHeader() (greeting +
 alerts + toggle) stays the same in both modes.

 src/screens/servant/OutreachDetailScreen.tsx

 Add visit calendar between contact actions and visit history:

 1. Import CalendarView
 2. Add selectedVisitDate state
 3. Insert a "Visit Calendar" section after the contact row with:
   - CalendarView showing green dots (colors.success) on visit dates
   - maxDate={todayString()} — can't log future visits
   - Tap a visit date → highlight that visit in the history list below (green border)
   - Tap an empty date → open Log Visit modal with that date pre-filled
 4. Add a hint text below calendar: "Tap a date to see visit details or log a new visit"
 5. Add visitItemSelected style for highlighted visit cards

 Styles

 All new styles use createStyles(colors: ThemeColors) pattern. Key additions:
 - Toggle: viewToggle container (row, card bg, rounded, border), toggleButton (flex 1, padded), toggleButtonActive (primary bg), toggleText/toggleTextActive
 - Calendar: calendar (marginBottom), selectedDateHeader, noSessionsForDate/noSessionsText
 - Outreach: calendarHint (muted, italic, centered), visitItemSelected (success border + bg)

 Implementation Order

 1. npm install react-native-calendars in apps/mobile
 2. Create src/components/CalendarView.tsx
 3. Modify DashboardScreen.tsx — add toggle + calendar mode
 4. Modify OutreachDetailScreen.tsx — add visit calendar section
 5. npx tsc --noEmit

 Verification

 1. TypeScript compiles clean
 2. Dashboard: toggle between List/Calendar, dots appear on session dates with correct class type colors
 3. Dashboard: tap calendar date → sessions for that date appear below
 4. Dashboard: tap date with no sessions → "No sessions" message
 5. Outreach detail: green dots on visit dates, tap empty date → Log Visit modal pre-filled
 6. Both calendars render correctly in dark mode