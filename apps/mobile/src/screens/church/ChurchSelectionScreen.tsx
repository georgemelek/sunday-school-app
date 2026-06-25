import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { useThemedStyles, useTheme, ThemeColors } from '../../theme'
import { useChurch, ChurchRow } from '../../hooks/useChurch'

interface ChurchSelectionScreenProps {
  onComplete: () => void
}

type ScreenView = 'list' | 'create'

export default function ChurchSelectionScreen({ onComplete }: ChurchSelectionScreenProps) {
  const styles = useThemedStyles(createStyles)
  const { colors } = useTheme()
  const { churches, loading, fetchChurches, joinChurch, createChurch } = useChurch()

  const [view, setView] = useState<ScreenView>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [saving, setSaving] = useState(false)

  // Create form
  const [churchName, setChurchName] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')

  useEffect(() => {
    fetchChurches()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => fetchChurches(searchQuery), 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  async function handleJoin(church: ChurchRow) {
    Alert.alert(
      `Join ${church.name}?`,
      [church.city, church.state].filter(Boolean).join(', ') || undefined,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: async () => {
            setSaving(true)
            const { error } = await joinChurch(church.id)
            setSaving(false)
            if (error) {
              Alert.alert('Error', error)
            } else {
              onComplete()
            }
          },
        },
      ]
    )
  }

  async function handleCreate() {
    if (!churchName.trim()) {
      Alert.alert('Required', 'Please enter a church name')
      return
    }
    setSaving(true)
    const { error } = await createChurch(churchName, city, state)
    setSaving(false)
    if (error) {
      Alert.alert('Error', error)
    } else {
      onComplete()
    }
  }

  function renderChurch({ item }: { item: ChurchRow }) {
    const location = [item.city, item.state].filter(Boolean).join(', ')
    return (
      <TouchableOpacity style={styles.churchRow} onPress={() => handleJoin(item)} activeOpacity={0.7}>
        <View style={styles.churchInfo}>
          <Text style={styles.churchName}>{item.name}</Text>
          {location ? <Text style={styles.churchLocation}>{location}</Text> : null}
        </View>
        <Text style={styles.chevron}>{'\u203A'}</Text>
      </TouchableOpacity>
    )
  }

  if (view === 'create') {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.createContent}>
          <Text style={styles.title}>Add Your Church</Text>
          <Text style={styles.subtitle}>Your church will be visible to others joining the app</Text>

          <TextInput
            style={styles.input}
            placeholder="Church name *"
            placeholderTextColor={colors.textMuted}
            value={churchName}
            onChangeText={setChurchName}
            autoFocus
            editable={!saving}
          />
          <TextInput
            style={styles.input}
            placeholder="City"
            placeholderTextColor={colors.textMuted}
            value={city}
            onChangeText={setCity}
            editable={!saving}
          />
          <TextInput
            style={styles.input}
            placeholder="State (e.g. IL)"
            placeholderTextColor={colors.textMuted}
            value={state}
            onChangeText={setState}
            autoCapitalize="characters"
            maxLength={2}
            editable={!saving}
          />

          <TouchableOpacity
            style={[styles.primaryButton, saving && styles.buttonDisabled]}
            onPress={handleCreate}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Create & Join</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => setView('list')} disabled={saving}>
            <Text style={styles.secondaryButtonText}>Back to list</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Where do you serve?</Text>
        <Text style={styles.subtitle}>Select your church to connect with your team</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search churches..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
        />
      </View>

      {loading && churches.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={churches}
          keyExtractor={item => item.id}
          renderItem={renderChurch}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {searchQuery ? `No churches matching "${searchQuery}"` : 'No churches yet'}
            </Text>
          }
          ListFooterComponent={
            <TouchableOpacity style={styles.notListedButton} onPress={() => setView('create')}>
              <Text style={styles.notListedText}>My church isn't listed — add it</Text>
            </TouchableOpacity>
          }
        />
      )}

      {saving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  )
}

const createStyles = (colors: ThemeColors) => ({
  container: {
    flex: 1 as const,
    backgroundColor: colors.background,
  },
  header: {
    padding: 24,
    paddingTop: 72,
    paddingBottom: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  searchRow: {
    padding: 12,
    paddingBottom: 8,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 40,
  },
  churchRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.card,
  },
  churchInfo: {
    flex: 1 as const,
  },
  churchName: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.textPrimary,
  },
  churchLocation: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: colors.chevron,
    marginLeft: 8,
  },
  separator: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: 20,
  },
  notListedButton: {
    margin: 20,
    marginTop: 24,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center' as const,
  },
  notListedText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '500' as const,
  },
  emptyText: {
    textAlign: 'center' as const,
    color: colors.textMuted,
    fontSize: 15,
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1 as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  savingOverlay: {
    ...{ position: 'absolute' as const, inset: 0 },
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },

  // Create form
  createContent: {
    padding: 24,
    paddingTop: 72,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center' as const,
    marginTop: 8,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  secondaryButton: {
    padding: 14,
    alignItems: 'center' as const,
  },
  secondaryButtonText: {
    fontSize: 15,
    color: colors.primary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
})
