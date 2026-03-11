import React, { useState } from 'react'
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native'
import { useThemedStyles, useTheme, ThemeColors } from '../../theme'
import type { AssignedKid, GradeServantProgress } from '../../hooks/useOutreach'
import { OutreachKidCard } from '../../components/OutreachKidCard'
import { fillTemplate, DEFAULT_MESSAGE_TEMPLATE } from '../../utils/outreachTemplates'

type VisitFilter = 'all' | 'not_visited' | 'visited'
type SortKey = 'first_name' | 'last_name'

interface OutreachScreenProps {
  assignedKids: AssignedKid[]
  localFriends: AssignedKid[]
  gradeOverview: GradeServantProgress[]
  servantName: string
  loading: boolean
  refetch: () => void
  onKidPress?: (assignedKid: AssignedKid) => void
  onManagePress?: () => void
}

export default function OutreachScreen({
  assignedKids,
  localFriends,
  gradeOverview,
  servantName,
  loading,
  refetch,
  onKidPress,
  onManagePress,
}: OutreachScreenProps) {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()
  const [localExpanded, setLocalExpanded] = useState(false)
  const [visitFilter, setVisitFilter] = useState<VisitFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('first_name')

  const visitedCount = assignedKids.filter(k => k.visits.length > 0).length
  const totalCount = assignedKids.length

  function applyFilterAndSort(kids: AssignedKid[]): AssignedKid[] {
    let result = kids
    if (visitFilter === 'visited') result = result.filter(k => k.visits.length > 0)
    else if (visitFilter === 'not_visited') result = result.filter(k => k.visits.length === 0)
    return result.slice().sort((a, b) => {
      const aVal = sortKey === 'first_name' ? (a.student.first_name ?? '') : (a.student.last_name ?? '')
      const bVal = sortKey === 'first_name' ? (b.student.first_name ?? '') : (b.student.last_name ?? '')
      return aVal.localeCompare(bVal)
    })
  }

  const displayedKids = applyFilterAndSort(assignedKids)

  function handleCall(phone: string) {
    if (!phone) { Alert.alert('No Phone', 'No phone number on file for this kid.'); return }
    Linking.openURL(`tel:${phone}`)
  }

  function handleMap(address?: string, city?: string) {
    const query = address || city
    if (!query) { Alert.alert('No Address', 'No address or city on file for this kid.'); return }
    const encoded = encodeURIComponent(query + (address && city ? `, ${city}` : ''))
    Linking.openURL(`maps://?q=${encoded}`)
  }

  function handleMessage(kidName: string, phone: string) {
    if (!phone) { Alert.alert('No Phone', 'No phone number on file for this kid.'); return }
    const body = fillTemplate(DEFAULT_MESSAGE_TEMPLATE, kidName, servantName)
    Linking.openURL(`sms:${phone}?body=${encodeURIComponent(body)}`)
  }

  if (loading && assignedKids.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  const FilterBar = (
    <View style={styles.filterBar}>
      {/* Visit status filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
        {([
          { key: 'all', label: 'All' },
          { key: 'not_visited', label: 'Not visited' },
          { key: 'visited', label: 'Visited' },
        ] as { key: VisitFilter; label: string }[]).map(opt => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.chip, visitFilter === opt.key && styles.chipActive]}
            onPress={() => setVisitFilter(opt.key)}
          >
            <Text style={[styles.chipText, visitFilter === opt.key && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={styles.filterDivider} />

        {([
          { key: 'first_name', label: 'First name' },
          { key: 'last_name', label: 'Last name' },
        ] as { key: SortKey; label: string }[]).map(opt => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.chip, sortKey === opt.key && styles.chipActive]}
            onPress={() => setSortKey(opt.key)}
          >
            <Text style={[styles.chipText, sortKey === opt.key && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )

  const ListHeader = (
    <>
      {/* Personal progress card */}
      {totalCount > 0 && (
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Your Kids</Text>
          <Text style={styles.progressCount}>
            {visitedCount} of {totalCount} kids visited
          </Text>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${(visitedCount / totalCount) * 100}%` },
              ]}
            />
          </View>
        </View>
      )}

      {/* Grade overview card */}
      {gradeOverview.length > 1 && (
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Grade Progress</Text>
          {gradeOverview.map(sv => (
            <View key={sv.servantId} style={styles.overviewRow}>
              <Text style={styles.overviewName}>{sv.servantName}</Text>
              <Text style={styles.overviewCount}>{sv.visitedKids}/{sv.totalKids}</Text>
            </View>
          ))}
        </View>
      )}
    </>
  )

  const ListFooter = localFriends.length > 0 ? (
    <View style={styles.localSection}>
      <TouchableOpacity
        style={styles.localHeader}
        onPress={() => setLocalExpanded(e => !e)}
      >
        <Text style={styles.localHeaderText}>
          Local Friends ({localFriends.length})
        </Text>
        <Text style={styles.localChevron}>{localExpanded ? '\u25B2' : '\u25BC'}</Text>
      </TouchableOpacity>
      {localExpanded && localFriends.map(kid => (
        <OutreachKidCard
          key={kid.assignment.id}
          assignedKid={kid}
          onPress={() => onKidPress?.(kid)}
          onCall={handleCall}
          onMap={handleMap}
          onMessage={handleMessage}
        />
      ))}
    </View>
  ) : null

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Outreach</Text>
        {onManagePress && (
          <TouchableOpacity style={styles.manageButton} onPress={onManagePress}>
            <Text style={styles.manageButtonText}>Manage</Text>
          </TouchableOpacity>
        )}
      </View>

      {FilterBar}

      <FlatList
        data={displayedKids}
        keyExtractor={item => item.assignment.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {assignedKids.length === 0 ? 'No Kids Assigned' : 'No matches'}
              </Text>
              <Text style={styles.emptyText}>
                {assignedKids.length === 0
                  ? "You don't have any outreach assignments yet."
                  : 'Try a different filter.'}
              </Text>
              {assignedKids.length === 0 && onManagePress && (
                <TouchableOpacity style={styles.emptyManageButton} onPress={onManagePress}>
                  <Text style={styles.emptyManageText}>Manage Assignments</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <OutreachKidCard
            assignedKid={item}
            onPress={() => onKidPress?.(item)}
            onCall={handleCall}
            onMap={handleMap}
            onMessage={handleMessage}
          />
        )}
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
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-end' as const,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  manageButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    marginBottom: 2,
  },
  manageButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600' as const,
  },
  filterBar: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterChips: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600' as const,
  },
  filterDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  list: {
    padding: 16,
  },
  progressCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  progressCount: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden' as const,
  },
  progressBarFill: {
    height: 8,
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  overviewCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  overviewRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  overviewName: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  overviewCount: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600' as const,
  },
  localSection: {
    marginTop: 8,
  },
  localHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  localHeaderText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  localChevron: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  empty: {
    alignItems: 'center' as const,
    paddingTop: 60,
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
    marginBottom: 24,
  },
  emptyManageButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyManageText: {
    color: colors.primaryText,
    fontSize: 15,
    fontWeight: '600' as const,
  },
})
