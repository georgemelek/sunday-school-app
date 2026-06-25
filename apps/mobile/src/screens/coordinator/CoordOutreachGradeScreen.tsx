import React from 'react'
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useThemedStyles, useTheme, ThemeColors } from '../../theme'
import { useCoordinatorOutreach, CoordOutreachServant, CoordOutreachKid } from '../../hooks/useOutreach'

interface Props {
  gradeId: string
  gradeName: string
  onBack: () => void
}

export default function CoordOutreachGradeScreen({ gradeId, gradeName, onBack }: Props) {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()
  const { grades, loading, refetch } = useCoordinatorOutreach()

  const grade = grades.find(g => g.gradeId === gradeId)

  const sections = (grade?.servants ?? []).map(sv => ({
    servant: sv,
    data: sv.kids,
  }))

  function renderSectionHeader({ section }: { section: { servant: CoordOutreachServant } }) {
    const { servant } = section
    const pct = servant.totalKids > 0 ? Math.round((servant.visitedKids / servant.totalKids) * 100) : null
    const pctColor = pct == null ? colors.textMuted : pct >= 80 ? colors.success : pct >= 50 ? colors.warning : colors.error

    return (
      <View style={styles.servantHeader}>
        <View style={styles.servantHeaderTop}>
          <Text style={styles.servantName}>{servant.servantName}</Text>
          {pct != null && (
            <Text style={[styles.servantPct, { color: pctColor }]}>{pct}%</Text>
          )}
        </View>
        {pct != null && (
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${pct}%` as any, backgroundColor: pctColor }]} />
          </View>
        )}
        <Text style={styles.servantSummary}>
          {servant.visitedKids} of {servant.totalKids} kid{servant.totalKids !== 1 ? 's' : ''} visited
        </Text>
      </View>
    )
  }

  function renderKid({ item }: { item: CoordOutreachKid }) {
    return (
      <View style={styles.kidRow}>
        <View style={[styles.kidDot, { backgroundColor: item.visited ? colors.success : colors.border }]} />
        <Text style={styles.kidName}>{item.firstName} {item.lastName}</Text>
        <Text style={[styles.kidStatus, { color: item.visited ? colors.success : colors.textMuted }]}>
          {item.visited ? 'Visited' : 'Not visited'}
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>{'‹ Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{gradeName}</Text>
        {grade && (
          <Text style={styles.headerSub}>
            {grade.visitedKids} of {grade.totalKids} kids visited
          </Text>
        )}
      </View>

      {loading && !grade ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No outreach assignments</Text>
          <Text style={styles.emptyText}>Servants haven't set up outreach for this grade yet.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.studentId}
          renderSectionHeader={renderSectionHeader}
          renderItem={renderKid}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
          SectionSeparatorComponent={() => <View style={styles.sectionSeparator} />}
        />
      )}
    </View>
  )
}

const createStyles = (colors: ThemeColors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginBottom: 4,
  },
  backText: {
    fontSize: 17,
    color: colors.primary,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  headerSub: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  servantHeader: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  servantHeaderTop: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  servantName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  servantPct: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  progressBarBg: {
    height: 5,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden' as const,
    marginBottom: 6,
  },
  progressBarFill: {
    height: 5,
    borderRadius: 3,
  },
  servantSummary: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  kidRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.borderLight,
  },
  kidDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  kidName: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  kidStatus: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  sectionSeparator: {
    height: 16,
  },
  empty: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
})
