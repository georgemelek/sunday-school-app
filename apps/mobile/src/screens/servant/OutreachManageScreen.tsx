import React, { useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native'
import { useThemedStyles, useTheme, ThemeColors } from '../../theme'
import { useOutreachClaim } from '../../hooks/useOutreach'
import { studentDisplayName } from '../../hooks/useStudents'
import type { ClaimableKid } from '../../hooks/useOutreach'

interface Props {
  onBack: () => void
}

export default function OutreachManageScreen({ onBack }: Props) {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()
  const { kids, loading, error, refetch, claimKid, unclaimKid } = useOutreachClaim()
  const [search, setSearch] = useState('')

  const filtered = kids.filter(k =>
    studentDisplayName(k.student).toLowerCase().includes(search.toLowerCase())
  )
  const claimed = filtered.filter(k => k.claimedByMe)
  const unclaimed = filtered.filter(k => !k.claimedByMe)

  type ListItem =
    | { kind: 'header'; label: string }
    | { kind: 'kid'; data: ClaimableKid }

  const listData: ListItem[] = []
  if (claimed.length > 0) {
    listData.push({ kind: 'header', label: `Your kids (${claimed.length})` })
    claimed.forEach(k => listData.push({ kind: 'kid', data: k }))
  }
  if (unclaimed.length > 0) {
    listData.push({ kind: 'header', label: `Not claimed (${unclaimed.length})` })
    unclaimed.forEach(k => listData.push({ kind: 'kid', data: k }))
  }

  async function toggle(kid: ClaimableKid) {
    if (kid.claimedByMe && kid.assignmentId) {
      await unclaimKid(kid.assignmentId, kid.student.id)
    } else {
      await claimKid(kid.student.id)
    }
  }

  function renderKid({ item }: { item: ClaimableKid }) {
    return (
      <TouchableOpacity
        style={[styles.row, item.claimedByMe && styles.rowClaimed]}
        onPress={() => toggle(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.check, item.claimedByMe && styles.checkActive]}>
          {item.claimedByMe && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={[styles.name, item.claimedByMe && styles.nameClaimed]}>
          {studentDisplayName(item.student)}
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Kids</Text>
        <Text style={styles.subtitle}>Tap to claim or remove kids you're responsible for</Text>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Search..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.primary} />
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item, index) => item.kind === 'header' ? `h-${index}` : item.data.student.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            if (item.kind === 'header') {
              return <Text style={styles.sectionLabel}>{item.label}</Text>
            }
            return renderKid({ item: item.data })
          }}
          ItemSeparatorComponent={({ leadingItem }) =>
            leadingItem?.kind === 'header' ? null : <View style={styles.separator} />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>No kids found</Text>
          }
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
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: {
    fontSize: 16,
    color: colors.primary,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  search: {
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: colors.textPrimary,
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  rowClaimed: {
    borderColor: colors.primary,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  checkActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700' as const,
    lineHeight: 16,
  },
  name: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  nameClaimed: {
    color: colors.primary,
    fontWeight: '500' as const,
  },
  separator: {
    height: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    color: colors.error,
    textAlign: 'center' as const,
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: colors.primaryText,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  empty: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    marginTop: 40,
  },
})
