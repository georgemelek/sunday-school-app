import React from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useThemedStyles, useTheme, ThemeColors } from '../../theme'
import { useCoordinatorOutreach, CoordOutreachGrade } from '../../hooks/useOutreach'

interface Props {
  onGradePress: (gradeId: string, gradeName: string) => void
}

export default function CoordOutreachScreen({ onGradePress }: Props) {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()
  const { grades, loading, error, refetch } = useCoordinatorOutreach()

  if (loading && grades.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    )
  }

  function renderGrade({ item }: { item: CoordOutreachGrade }) {
    const pct = item.totalKids > 0 ? Math.round((item.visitedKids / item.totalKids) * 100) : null
    const pctColor = pct == null ? colors.textMuted : pct >= 80 ? colors.success : pct >= 50 ? colors.warning : colors.error

    return (
      <TouchableOpacity
        style={styles.gradeCard}
        activeOpacity={0.7}
        onPress={() => onGradePress(item.gradeId, item.gradeName)}
      >
        <View style={styles.gradeCardTop}>
          <Text style={styles.gradeName}>{item.gradeName}</Text>
          {pct != null && (
            <Text style={[styles.gradePercent, { color: pctColor }]}>{pct}%</Text>
          )}
        </View>

        {pct != null && (
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${pct}%` as any, backgroundColor: pctColor }]} />
          </View>
        )}

        <View style={styles.gradeCardBottom}>
          <Text style={styles.gradeSummary}>
            {item.totalKids > 0
              ? `${item.visitedKids} of ${item.totalKids} kids visited · ${item.servants.length} servant${item.servants.length !== 1 ? 's' : ''}`
              : 'No outreach assignments yet'}
          </Text>
          <Text style={styles.chevron}>{'›'}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Outreach</Text>
      </View>

      <FlatList
        data={grades}
        keyExtractor={item => item.gradeId}
        renderItem={renderGrade}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No grades found</Text>
              <Text style={styles.emptyText}>Grades will appear here once servants set them up.</Text>
            </View>
          ) : null
        }
      />
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
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  gradeCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  gradeCardTop: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 10,
  },
  gradeName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  gradePercent: {
    fontSize: 17,
    fontWeight: '700' as const,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden' as const,
    marginBottom: 10,
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  gradeCardBottom: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  gradeSummary: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  chevron: {
    fontSize: 22,
    color: colors.chevron,
    marginLeft: 8,
  },
  empty: {
    alignItems: 'center' as const,
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
  errorText: {
    color: colors.error,
    fontSize: 15,
    textAlign: 'center' as const,
    paddingHorizontal: 32,
  },
})
