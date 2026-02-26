import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native'
import type { AssignedKid } from '../../hooks/useOutreach'
import { OutreachKidCard } from '../../components/OutreachKidCard'
import { fillTemplate, DEFAULT_MESSAGE_TEMPLATE } from '../../utils/outreachTemplates'

interface OutreachScreenProps {
  assignedKids: AssignedKid[]
  loading: boolean
  refetch: () => void
  onKidPress?: (assignedKid: AssignedKid) => void
}

const SERVANT_NAME = 'George'

export default function OutreachScreen({
  assignedKids,
  loading,
  refetch,
  onKidPress,
}: OutreachScreenProps) {

  const visitedCount = assignedKids.filter(k => k.visits.length > 0).length
  const totalCount = assignedKids.length

  function handleCall(phone: string) {
    if (!phone) {
      Alert.alert('No Phone', 'No phone number on file for this kid.')
      return
    }
    Linking.openURL(`tel:${phone}`)
  }

  function handleMap(address?: string, city?: string) {
    const query = address || city
    if (!query) {
      Alert.alert('No Address', 'No address or city on file for this kid.')
      return
    }
    const encoded = encodeURIComponent(query + (address && city ? `, ${city}` : ''))
    Linking.openURL(`maps://?q=${encoded}`)
  }

  function handleMessage(kidName: string, phone: string) {
    if (!phone) {
      Alert.alert('No Phone', 'No phone number on file for this kid.')
      return
    }
    const body = fillTemplate(DEFAULT_MESSAGE_TEMPLATE, kidName, SERVANT_NAME)
    Linking.openURL(`sms:${phone}&body=${encodeURIComponent(body)}`)
  }

  if (loading && assignedKids.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Outreach</Text>
      </View>

      <FlatList
        data={assignedKids}
        keyExtractor={item => item.assignment.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
        ListHeaderComponent={
          totalCount > 0 ? (
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
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No Kids Assigned</Text>
            <Text style={styles.emptyText}>
              You don't have any outreach assignments yet.
            </Text>
          </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  list: {
    padding: 16,
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  progressCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
})
