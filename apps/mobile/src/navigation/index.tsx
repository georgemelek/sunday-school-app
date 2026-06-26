import React, { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Linking } from 'react-native'
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

import type {
  AuthStackParamList,
  ServantTabParamList,
  DashboardStackParamList,
  GradesStackParamList,
  AvailabilityStackParamList,
  OutreachStackParamList,
  SettingsStackParamList,
  CoordinatorTabParamList,
  CoordDashboardStackParamList,
  CoordScheduleStackParamList,
  CoordStaffingStackParamList,
  CoordOutreachStackParamList,
  MessagingStackParamList,
} from '../types/navigation'

// Auth
import { useAuth } from '../contexts/AuthContext'
import { useTour } from '../contexts/TourContext'

// Theme
import { useTheme, useThemedStyles, ThemeColors, ThemePreference } from '../theme'

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen'
import RegisterScreen from '../screens/auth/RegisterScreen'

// Servant screens
import DashboardScreen from '../screens/servant/DashboardScreen'
import MyGradesScreen from '../screens/servant/MyGradesScreen'
import OnboardingScreen from '../screens/servant/OnboardingScreen'
import GradeDetailScreen from '../screens/servant/GradeDetailScreen'
import AddStudentScreen from '../screens/servant/AddStudentScreen'
import EditStudentScreen from '../screens/servant/EditStudentScreen'
import ImportStudentsScreen from '../screens/servant/ImportStudentsScreen'
import TakeAttendanceScreen from '../screens/servant/TakeAttendanceScreen'
import SessionDetailScreen from '../screens/servant/SessionDetailScreen'
import AvailabilityScreen from '../screens/servant/AvailabilityScreen'
import OutreachScreen from '../screens/servant/OutreachScreen'
import OutreachDetailScreen from '../screens/servant/OutreachDetailScreen'
import OutreachManageScreen from '../screens/servant/OutreachManageScreen'
import { useOutreach } from '../hooks/useOutreach'
import { useSessions } from '../hooks/useSessions'

// Church screens
import ChurchSelectionScreen from '../screens/church/ChurchSelectionScreen'
import InviteServantsScreen from '../screens/church/InviteServantsScreen'
import JoinChurchModal from '../components/JoinChurchModal'
import { useChurch } from '../hooks/useChurch'
import type { InviteDetails } from '../hooks/useChurch'

// Coordinator screens
import CoordinatorDashboardScreen from '../screens/coordinator/CoordinatorDashboardScreen'
import CoordOutreachScreen from '../screens/coordinator/CoordOutreachScreen'
import CoordOutreachGradeScreen from '../screens/coordinator/CoordOutreachGradeScreen'
import CoordGradeDetailScreen from '../screens/coordinator/CoordGradeDetailScreen'
import AttendanceReportScreen from '../screens/coordinator/AttendanceReportScreen'
import ScheduleScreen from '../screens/coordinator/ScheduleScreen'
import SessionListScreen from '../screens/coordinator/SessionListScreen'
import SessionFormScreen from '../screens/coordinator/SessionFormScreen'
import StaffingScreen from '../screens/coordinator/StaffingScreen'
import ImportSessionsScreen from '../screens/coordinator/ImportSessionsScreen'

import { useClasses } from '../hooks/useClasses'
import { supabase } from '../lib/supabase'

// Messaging screens
import ChannelListScreen from '../screens/messaging/ChannelListScreen'
import ChannelScreen from '../screens/messaging/ChannelScreen'
import { useUnreadCount } from '../hooks/useStreamChat'

// --- Stack / Tab Navigators ---

const AuthStack = createNativeStackNavigator<AuthStackParamList>()
const DashboardStack = createNativeStackNavigator<DashboardStackParamList>()
const GradesStack = createNativeStackNavigator<GradesStackParamList>()
const AvailabilityStack = createNativeStackNavigator<AvailabilityStackParamList>()
const OutreachStack = createNativeStackNavigator<OutreachStackParamList>()
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>()
const Tab = createBottomTabNavigator<ServantTabParamList>()

const CoordDashboardStack = createNativeStackNavigator<CoordDashboardStackParamList>()
const CoordScheduleStack = createNativeStackNavigator<CoordScheduleStackParamList>()
const CoordStaffingStack = createNativeStackNavigator<CoordStaffingStackParamList>()
const CoordOutreachStack = createNativeStackNavigator<CoordOutreachStackParamList>()
const MessagingStack = createNativeStackNavigator<MessagingStackParamList>()
const CoordTab = createBottomTabNavigator<CoordinatorTabParamList>()

// --- Dashboard Tab Stack ---

function DashboardStackNavigator() {
  return (
    <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <DashboardStack.Screen name="Dashboard">
        {({ navigation }) => (
          <DashboardScreen
            onNavigateToGrades={() =>
              navigation.getParent()?.navigate('GradesTab')
            }
            onNavigateToAvailability={() =>
              navigation.getParent()?.navigate('AvailabilityTab')
            }
            onSessionPress={(session) =>
              navigation.navigate('SessionDetail', { session })
            }
          />
        )}
      </DashboardStack.Screen>

      <DashboardStack.Screen name="SessionDetail">
        {({ navigation, route }) => {
          const { cancelSession, uncancelSession, updateLessonTopic } = useSessions(route.params.session.classId)
          return (
            <SessionDetailScreen
              session={route.params.session}
              onBack={() => navigation.goBack()}
              onTakeAttendance={(gradeId, gradeName) =>
                navigation.navigate('TakeAttendance', { gradeId, gradeName })
              }
              onCancelSession={cancelSession}
              onUncancelSession={uncancelSession}
              onUpdateLessonTopic={updateLessonTopic}
              onImportCurriculum={(classId, className) =>
                navigation.navigate('ImportSessions', { classId, className })
              }
            />
          )
        }}
      </DashboardStack.Screen>

      <DashboardStack.Screen name="ImportSessions">
        {({ navigation, route }) => (
          <ImportSessionsScreen
            classId={route.params.classId}
            className={route.params.className}
            onBack={() => navigation.goBack()}
            onDone={() => navigation.goBack()}
          />
        )}
      </DashboardStack.Screen>

      <DashboardStack.Screen name="TakeAttendance">
        {({ navigation, route }) => (
          <TakeAttendanceScreen
            gradeId={route.params.gradeId}
            gradeName={route.params.gradeName}
            onBack={() => navigation.goBack()}
          />
        )}
      </DashboardStack.Screen>
    </DashboardStack.Navigator>
  )
}

// --- Grades Tab Stack ---

function GradesStackNavigator() {
  return (
    <GradesStack.Navigator screenOptions={{ headerShown: false }}>
      <GradesStack.Screen name="MyGrades">
        {({ navigation }) => (
          <MyGradesScreen
            onGradePress={(gradeId, gradeName) =>
              navigation.navigate('GradeDetail', { gradeId, gradeName })
            }
            onStartOnboarding={() => navigation.navigate('Onboarding')}
          />
        )}
      </GradesStack.Screen>

      <GradesStack.Screen name="Onboarding">
        {({ navigation }) => (
          <OnboardingScreen
            onComplete={() => navigation.replace('MyGrades')}
            onSkip={() => navigation.goBack()}
            onGoToAvailability={() => {
              navigation.replace('MyGrades')
              navigation.getParent()?.navigate('AvailabilityTab')
            }}
          />
        )}
      </GradesStack.Screen>

      <GradesStack.Screen name="GradeDetail">
        {({ navigation, route }) => (
          <GradeDetailScreen
            gradeId={route.params.gradeId}
            gradeName={route.params.gradeName}
            onBack={() => navigation.goBack()}
            onAddStudent={() =>
              navigation.navigate('AddStudent', {
                gradeId: route.params.gradeId,
                gradeName: route.params.gradeName,
              })
            }
            onEditStudent={(student) =>
              navigation.navigate('EditStudent', {
                gradeId: route.params.gradeId,
                gradeName: route.params.gradeName,
                student,
              })
            }
            onImportStudents={() =>
              navigation.navigate('ImportStudents', {
                gradeId: route.params.gradeId,
                gradeName: route.params.gradeName,
              })
            }
          />
        )}
      </GradesStack.Screen>

      <GradesStack.Screen name="AddStudent">
        {({ navigation, route }) => (
          <AddStudentScreen
            gradeId={route.params.gradeId}
            gradeName={route.params.gradeName}
            onBack={() => navigation.goBack()}
          />
        )}
      </GradesStack.Screen>

      <GradesStack.Screen name="EditStudent">
        {({ navigation, route }) => (
          <EditStudentScreen
            gradeId={route.params.gradeId}
            gradeName={route.params.gradeName}
            student={route.params.student}
            onBack={() => navigation.goBack()}
          />
        )}
      </GradesStack.Screen>

      <GradesStack.Screen name="TakeAttendance">
        {({ navigation, route }) => (
          <TakeAttendanceScreen
            gradeId={route.params.gradeId}
            gradeName={route.params.gradeName}
            onBack={() => navigation.goBack()}
          />
        )}
      </GradesStack.Screen>

      <GradesStack.Screen name="ImportStudents">
        {({ navigation, route }) => (
          <ImportStudentsScreen
            gradeId={route.params.gradeId}
            gradeName={route.params.gradeName}
            onBack={() => navigation.goBack()}
            onImportComplete={() => navigation.goBack()}
          />
        )}
      </GradesStack.Screen>
    </GradesStack.Navigator>
  )
}

// --- Availability Tab Stack ---

function AvailabilityStackNavigator() {
  return (
    <AvailabilityStack.Navigator screenOptions={{ headerShown: false }}>
      <AvailabilityStack.Screen name="Availability">
        {() => <AvailabilityScreen />}
      </AvailabilityStack.Screen>
    </AvailabilityStack.Navigator>
  )
}

// --- Outreach Tab Stack ---

function OutreachStackNavigator() {
  const { assignedKids, localFriends, gradeOverview, loading, refetch, logVisit, deleteVisit } = useOutreach()
  const { profile } = useAuth()
  const servantName = profile?.full_name ?? 'Servant'

  return (
    <OutreachStack.Navigator screenOptions={{ headerShown: false }}>
      <OutreachStack.Screen name="Outreach">
        {({ navigation }) => (
          <OutreachScreen
            assignedKids={assignedKids}
            localFriends={localFriends}
            gradeOverview={gradeOverview}
            servantName={servantName}
            loading={loading}
            refetch={refetch}
            onKidPress={(assignedKid) =>
              navigation.navigate('OutreachDetail', { assignedKid })
            }
            onManagePress={() => navigation.navigate('OutreachManage')}
          />
        )}
      </OutreachStack.Screen>

      <OutreachStack.Screen name="OutreachDetail">
        {({ navigation, route }) => (
          <OutreachDetailScreen
            assignedKid={route.params.assignedKid}
            assignedKids={assignedKids}
            localFriends={localFriends}
            servantName={servantName}
            onBack={() => navigation.goBack()}
            onLogVisit={async (assignmentId, date, notes) => {
              await logVisit(assignmentId, date, notes)
              navigation.goBack()
            }}
            onDeleteVisit={deleteVisit}
          />
        )}
      </OutreachStack.Screen>

      <OutreachStack.Screen name="OutreachManage">
        {({ navigation }) => (
          <OutreachManageScreen onBack={() => navigation.goBack()} />
        )}
      </OutreachStack.Screen>
    </OutreachStack.Navigator>
  )
}

// --- Settings Screen ---

function SettingsScreen({
  isTourMode,
  onSignIn,
  onInviteServants,
}: {
  isTourMode?: boolean
  onSignIn?: () => void
  onInviteServants?: () => void
}) {
  const { colors, preference, setPreference } = useTheme()
  const { session, profile, signOut } = useAuth()
  const { leaveChurch } = useChurch()
  const styles = useThemedStyles(createSettingsStyles)

  const isCoordinator = profile?.role === 'coordinator' || profile?.role === 'priest'

  const themeOptions: { key: ThemePreference; label: string }[] = [
    { key: 'system', label: 'System' },
    { key: 'light', label: 'Light' },
    { key: 'dark', label: 'Dark' },
  ]

  async function handleSignOut() {
    try {
      await signOut()
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign out')
    }
  }

  function handleLeaveChurch() {
    Alert.alert(
      'Leave Church',
      'You will be disconnected from your church. Your grades and classes will remain but will no longer be visible to your coordinator.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            const { error } = await leaveChurch()
            if (error) Alert.alert('Error', error)
          },
        },
      ]
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* User profile section (authenticated) */}
      {session && profile && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.profileCard}>
            <Text style={styles.profileName}>{profile.full_name}</Text>
            <Text style={styles.profileDetail}>{session.user.email}</Text>
            <Text style={styles.profileRole}>
              {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
            </Text>
            {profile.church_id && (
              <Text style={styles.profileDetail}>Church linked</Text>
            )}
          </View>
        </View>
      )}

      {/* Tour mode banner */}
      {isTourMode && (
        <View style={styles.section}>
          <View style={styles.tourBanner}>
            <Text style={styles.tourBannerText}>
              You're exploring the app in demo mode. Sign in to access your real data.
            </Text>
          </View>
        </View>
      )}

      {/* Coordinator: Invite Servants */}
      {session && profile && isCoordinator && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ministry</Text>
          <View style={styles.optionGroup}>
            <TouchableOpacity style={[styles.optionRow, { borderBottomWidth: 0 }]} onPress={onInviteServants}>
              <Text style={styles.optionLabel}>Invite Servants</Text>
              <Text style={styles.chevron}>{'\u203A'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Appearance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.optionGroup}>
          {themeOptions.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.optionRow, preference === opt.key && styles.optionRowSelected]}
              onPress={() => setPreference(opt.key)}
            >
              <Text style={[styles.optionLabel, preference === opt.key && styles.optionLabelSelected]}>
                {opt.label}
              </Text>
              {preference === opt.key && (
                <Text style={styles.checkmark}>{'\u2713'}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Leave Church */}
      {session && profile?.church_id && (
        <View style={styles.section}>
          <View style={styles.optionGroup}>
            <TouchableOpacity style={[styles.optionRow, { borderBottomWidth: 0 }]} onPress={handleLeaveChurch}>
              <Text style={[styles.optionLabel, { color: colors.error }]}>Leave Church</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Sign Out / Sign In */}
      <View style={styles.section}>
        {isTourMode ? (
          <TouchableOpacity style={styles.signInButton} onPress={onSignIn}>
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        ) : session ? (
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ScrollView>
  )
}

const createSettingsStyles = (colors: ThemeColors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  } as const,
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  } as const,
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  section: {
    padding: 16,
  } as const,
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 16,
  } as const,
  profileName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  profileDetail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500' as const,
  },
  tourBanner: {
    backgroundColor: colors.alertInfoBg,
    borderWidth: 1,
    borderColor: colors.alertInfoBorder,
    borderRadius: 12,
    padding: 16,
  } as const,
  tourBannerText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  optionGroup: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden' as const,
  },
  optionRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  optionRowSelected: {
    backgroundColor: colors.primary + '10',
  },
  optionLabel: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  optionLabelSelected: {
    fontWeight: '600' as const,
    color: colors.onPrimaryText,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.onPrimaryText,
  },
  signInButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center' as const,
  },
  signInButtonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  signOutButton: {
    borderWidth: 2,
    borderColor: colors.error,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center' as const,
  },
  signOutButtonText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  chevron: {
    fontSize: 22,
    color: colors.chevron,
  },
})

function SettingsStackNavigator({ isTourMode, onSignIn }: { isTourMode?: boolean; onSignIn?: () => void }) {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name="Settings">
        {({ navigation }) => (
          <SettingsScreen
            isTourMode={isTourMode}
            onSignIn={onSignIn}
            onInviteServants={() => navigation.navigate('InviteServants')}
          />
        )}
      </SettingsStack.Screen>
      <SettingsStack.Screen name="InviteServants">
        {({ navigation }) => (
          <InviteServantsScreen onBack={() => navigation.goBack()} />
        )}
      </SettingsStack.Screen>
    </SettingsStack.Navigator>
  )
}

// --- Servant Tab Navigator ---

function ServantTabNavigator({ isTourMode, onSignIn }: { isTourMode?: boolean; onSignIn?: () => void }) {
  const { colors } = useTheme()
  const unreadCount = useUnreadCount()

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabBarActiveTint,
        tabBarInactiveTintColor: colors.tabBarInactiveTint,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder,
        },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStackNavigator}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>{'\uD83C\uDFE0'}</Text>
          ),
        }}
      />
      <Tab.Screen
        name="GradesTab"
        component={GradesStackNavigator}
        options={{
          tabBarLabel: 'My Grades',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>{'\uD83D\uDCDA'}</Text>
          ),
        }}
      />
      <Tab.Screen
        name="AvailabilityTab"
        component={AvailabilityStackNavigator}
        options={{
          tabBarLabel: 'Availability',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>{'\uD83D\uDCC5'}</Text>
          ),
        }}
      />
      <Tab.Screen
        name="OutreachTab"
        component={OutreachStackNavigator}
        options={{
          tabBarLabel: 'Outreach',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>{'\uD83E\uDD1D'}</Text>
          ),
        }}
      />
      <Tab.Screen
        name="MessagingTab"
        component={MessagingStackNavigator}
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>{'\uD83D\uDCAC'}</Text>
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>{'\u2699\uFE0F'}</Text>
          ),
        }}
      >
        {() => <SettingsStackNavigator isTourMode={isTourMode} onSignIn={onSignIn} />}
      </Tab.Screen>
    </Tab.Navigator>
  )
}

// --- Coordinator Dashboard Stack ---

function CoordDashboardStackNavigator() {
  const { getClassById, getServantsByClassId } = useClasses()

  return (
    <CoordDashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <CoordDashboardStack.Screen name="Dashboard">
        {({ navigation }) => (
          <CoordinatorDashboardScreen
            onGradePress={(gradeId, gradeName) =>
              navigation.navigate('GradeDetail', { gradeId, gradeName })
            }
            onViewReport={() => navigation.navigate('AttendanceReport')}
            onViewStaffing={() => {
              navigation.getParent()?.navigate('StaffingTab')
            }}
          />
        )}
      </CoordDashboardStack.Screen>

      <CoordDashboardStack.Screen name="GradeDetail">
        {({ navigation, route }) => (
          <CoordGradeDetailScreen
            gradeId={route.params.gradeId}
            gradeName={route.params.gradeName}
            onBack={() => navigation.goBack()}
            onClassPress={(classId, className) => {
              navigation.getParent()?.navigate('ScheduleTab', {
                screen: 'SessionList',
                params: { classId, className },
              })
            }}
          />
        )}
      </CoordDashboardStack.Screen>

      <CoordDashboardStack.Screen name="AttendanceReport">
        {({ navigation }) => (
          <AttendanceReportScreen onBack={() => navigation.goBack()} />
        )}
      </CoordDashboardStack.Screen>
    </CoordDashboardStack.Navigator>
  )
}

// --- Coordinator Schedule Stack ---

function CoordScheduleStackNavigator() {
  const { getClassById, getServantsByClassId } = useClasses()

  return (
    <CoordScheduleStack.Navigator screenOptions={{ headerShown: false }}>
      <CoordScheduleStack.Screen name="Schedule">
        {({ navigation }) => (
          <ScheduleScreen
            onClassPress={(classId, className) =>
              navigation.navigate('SessionList', { classId, className })
            }
          />
        )}
      </CoordScheduleStack.Screen>

      <CoordScheduleStack.Screen name="SessionList">
        {({ navigation, route }) => (
          <SessionListScreen
            classId={route.params.classId}
            className={route.params.className}
            onBack={() => navigation.goBack()}
            onSessionPress={(session) =>
              navigation.navigate('SessionForm', {
                classId: route.params.classId,
                session,
              })
            }
            onAddSession={(classId) =>
              navigation.navigate('SessionForm', { classId })
            }
            onImport={() =>
              navigation.navigate('ImportSessions', {
                classId: route.params.classId,
                className: route.params.className,
              })
            }
          />
        )}
      </CoordScheduleStack.Screen>

      <CoordScheduleStack.Screen name="ImportSessions">
        {({ navigation, route }) => (
          <ImportSessionsScreen
            classId={route.params.classId}
            className={route.params.className}
            onBack={() => navigation.goBack()}
            onDone={() => navigation.goBack()}
          />
        )}
      </CoordScheduleStack.Screen>

      <CoordScheduleStack.Screen name="SessionForm">
        {({ navigation, route }) => {
          const cls = getClassById(route.params.classId)
          const servants = cls ? getServantsByClassId(cls.id) : []

          return (
            <SessionFormScreen
              classId={route.params.classId}
              session={route.params.session}
              servants={servants}
              defaultLocation={cls?.defaultLocation}
              defaultLocationAddress={cls?.defaultLocationAddress}
              onBack={() => navigation.goBack()}
              onSave={() => navigation.goBack()}
              onDelete={() => navigation.goBack()}
            />
          )
        }}
      </CoordScheduleStack.Screen>
    </CoordScheduleStack.Navigator>
  )
}

// --- Messaging Stack (shared by servant + coordinator) ---

function MessagingStackNavigator() {
  return (
    <MessagingStack.Navigator screenOptions={{ headerShown: false }}>
      <MessagingStack.Screen name="ChannelList">
        {({ navigation }) => (
          <ChannelListScreen
            onChannelPress={(channelCid) =>
              navigation.navigate('Channel', { channelCid })
            }
          />
        )}
      </MessagingStack.Screen>
      <MessagingStack.Screen name="Channel">
        {({ navigation, route }) => (
          <ChannelScreen
            channelCid={route.params.channelCid}
            onBack={() => navigation.goBack()}
          />
        )}
      </MessagingStack.Screen>
    </MessagingStack.Navigator>
  )
}

// --- Coordinator Staffing Stack ---

function CoordStaffingStackNavigator() {
  return (
    <CoordStaffingStack.Navigator screenOptions={{ headerShown: false }}>
      <CoordStaffingStack.Screen name="Staffing" component={StaffingScreen} />
    </CoordStaffingStack.Navigator>
  )
}

// --- Coordinator Outreach Stack ---

function CoordOutreachStackNavigator() {
  return (
    <CoordOutreachStack.Navigator screenOptions={{ headerShown: false }}>
      <CoordOutreachStack.Screen name="CoordOutreach">
        {({ navigation }) => (
          <CoordOutreachScreen
            onGradePress={(gradeId, gradeName) =>
              navigation.navigate('CoordOutreachGrade', { gradeId, gradeName })
            }
          />
        )}
      </CoordOutreachStack.Screen>
      <CoordOutreachStack.Screen name="CoordOutreachGrade">
        {({ navigation, route }) => (
          <CoordOutreachGradeScreen
            gradeId={route.params.gradeId}
            gradeName={route.params.gradeName}
            onBack={() => navigation.goBack()}
          />
        )}
      </CoordOutreachStack.Screen>
    </CoordOutreachStack.Navigator>
  )
}

// --- Coordinator Tab Navigator ---

function CoordinatorTabNavigator() {
  const { colors } = useTheme()
  const unreadCount = useUnreadCount()

  return (
    <CoordTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabBarActiveTint,
        tabBarInactiveTintColor: colors.tabBarInactiveTint,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder,
        },
      }}
    >
      <CoordTab.Screen
        name="DashboardTab"
        component={CoordDashboardStackNavigator}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>{'\uD83D\uDCCA'}</Text>
          ),
        }}
      />
      <CoordTab.Screen
        name="ScheduleTab"
        component={CoordScheduleStackNavigator}
        options={{
          tabBarLabel: 'Schedule',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>{'\uD83D\uDCC5'}</Text>
          ),
        }}
      />
      <CoordTab.Screen
        name="StaffingTab"
        component={CoordStaffingStackNavigator}
        options={{
          tabBarLabel: 'Staffing',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>{'\uD83D\uDC65'}</Text>
          ),
        }}
      />
      <CoordTab.Screen
        name="OutreachTab"
        component={CoordOutreachStackNavigator}
        options={{
          tabBarLabel: 'Outreach',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>{'\uD83D\uDC9A'}</Text>
          ),
        }}
      />
      <CoordTab.Screen
        name="MessagingTab"
        component={MessagingStackNavigator}
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>{'\uD83D\uDCAC'}</Text>
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <CoordTab.Screen
        name="SettingsTab"
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>{'\u2699\uFE0F'}</Text>
          ),
        }}
      >
        {() => <SettingsStackNavigator />}
      </CoordTab.Screen>
    </CoordTab.Navigator>
  )
}

// --- Auth Stack Navigator ---

function AuthStackNavigator({ onTakeTour }: { onTakeTour: () => void }) {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login">
        {(props) => <LoginScreen {...props} onTakeTour={onTakeTour} />}
      </AuthStack.Screen>
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  )
}

// --- Root Navigator ---

export default function RootNavigator() {
  const { session, profile, loading, refreshProfile } = useAuth()
  const { colors, isDark } = useTheme()
  const { isTourMode, startTour, endTour } = useTour()
  const { validateInvite } = useChurch()

  // Deep link invite handling
  const [pendingInvite, setPendingInvite] = useState<InviteDetails | null>(null)
  const [gradeCount, setGradeCount] = useState(0)
  const [classCount, setClassCount] = useState(0)
  const handledUrls = useRef(new Set<string>())

  async function handleInviteUrl(url: string) {
    const match = url.match(/ministryhub:\/\/invite\/([A-Z0-9]+)/i)
    if (!match) return
    const code = match[1].toUpperCase()
    if (handledUrls.current.has(code)) return
    handledUrls.current.add(code)

    const { details, error } = await validateInvite(code)
    if (!details) {
      Alert.alert('Invalid Invite', error ?? 'This invite link is no longer valid')
      return
    }

    // Count servant's existing grades + classes to decide whether to show transfer prompt
    const userId = session?.user?.id
    if (userId) {
      const [{ count: gc }, { count: cc }] = await Promise.all([
        supabase.from('grades').select('id', { count: 'exact', head: true }).eq('created_by', userId),
        supabase.from('classes').select('id', { count: 'exact', head: true }).eq('created_by', userId),
      ])
      setGradeCount(gc ?? 0)
      setClassCount(cc ?? 0)
    }

    setPendingInvite(details)
  }

  useEffect(() => {
    Linking.getInitialURL().then(url => { if (url) handleInviteUrl(url) })
    const sub = Linking.addEventListener('url', ({ url }) => handleInviteUrl(url))
    return () => sub.remove()
  }, [session?.user?.id])

  const navTheme = isDark
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.background, card: colors.card } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.background, card: colors.card } }

  // Auth loading state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  // Tour mode — show servant tab navigator with mock data (bypasses church_id gate)
  if (!session && isTourMode) {
    return (
      <NavigationContainer theme={navTheme}>
        <ServantTabNavigator isTourMode onSignIn={endTour} />
      </NavigationContainer>
    )
  }

  // Not authenticated — show auth stack
  if (!session) {
    return (
      <NavigationContainer theme={navTheme}>
        <AuthStackNavigator onTakeTour={startTour} />
      </NavigationContainer>
    )
  }

  // Authenticated but no profile — error state
  if (!profile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 8, textAlign: 'center' }}>
          Profile Not Found
        </Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 24 }}>
          We couldn't load your profile. This may happen if your account was just created.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12 }}
          onPress={() => refreshProfile()}
        >
          <Text style={{ color: colors.primaryText, fontSize: 16, fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // No church linked yet — show church selection full-screen
  if (!profile.church_id) {
    return (
      <ChurchSelectionScreen onComplete={refreshProfile} />
    )
  }

  // Invite modal (shown on top of whatever tab nav is active)
  const inviteModal = pendingInvite ? (
    <JoinChurchModal
      visible
      details={pendingInvite}
      gradeCount={gradeCount}
      classCount={classCount}
      onDismiss={() => setPendingInvite(null)}
      onJoined={() => {
        setPendingInvite(null)
        refreshProfile()
      }}
    />
  ) : null

  // Authenticated with profile — route by role
  if (profile.role === 'coordinator' || profile.role === 'priest') {
    return (
      <>
        <NavigationContainer theme={navTheme}>
          <CoordinatorTabNavigator />
        </NavigationContainer>
        {inviteModal}
      </>
    )
  }

  return (
    <>
      <NavigationContainer theme={navTheme}>
        <ServantTabNavigator />
      </NavigationContainer>
      {inviteModal}
    </>
  )
}
