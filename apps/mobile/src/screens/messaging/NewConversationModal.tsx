import React, { useEffect, useState, useCallback } from 'react'
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useChatContext } from 'stream-chat-expo'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../theme'

interface Person {
  id: string
  full_name: string
  role: string
}

interface Props {
  visible: boolean
  onClose: () => void
  onCreated: (channelCid: string) => void
}

export default function NewConversationModal({ visible, onClose, onCreated }: Props) {
  const { profile } = useAuth()
  const { colors } = useTheme()
  const { client } = useChatContext()
  const { top, bottom } = useSafeAreaInsets()

  const [search, setSearch] = useState('')
  const [people, setPeople] = useState<Person[]>([])
  const [selected, setSelected] = useState<Person[]>([])
  const [groupName, setGroupName] = useState('')
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!visible) return
    setSearch('')
    setSelected([])
    setGroupName('')
    loadPeople()
  }, [visible])

  async function loadPeople() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('church_id', profile?.church_id ?? '')
      .neq('id', profile?.id ?? '')
      .order('full_name')
    setPeople(data ?? [])
    setLoading(false)
  }

  const filtered = people.filter((p) =>
    p.full_name?.toLowerCase().includes(search.toLowerCase()),
  )

  function toggle(person: Person) {
    setSelected((prev) =>
      prev.find((p) => p.id === person.id)
        ? prev.filter((p) => p.id !== person.id)
        : [...prev, person],
    )
  }

  const isGroup = selected.length > 1

  async function create() {
    if (!profile || selected.length === 0) return
    setCreating(true)
    try {
      const memberIds = [profile.id, ...selected.map((p) => p.id)]

      // Stream channel IDs must be ≤64 chars and alphanumeric/dash/underscore only.
      // Hash the sorted member list to keep it short and stable.
      const sorted = memberIds.slice().sort().join(',')
      let hash = 0
      for (let i = 0; i < sorted.length; i++) {
        hash = (Math.imul(31, hash) + sorted.charCodeAt(i)) | 0
      }
      const channelId = `dm_${Math.abs(hash).toString(36)}`

      const name = isGroup
        ? (groupName.trim() || selected.map((p) => p.full_name).join(', '))
        : selected[0].full_name

      const channel = client.channel('messaging', channelId, {
        name,
        members: memberIds,
      })
      await channel.create()
      onCreated(channel.cid)
    } catch (err) {
      console.error('[NewConv] create failed:', err)
    } finally {
      setCreating(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={{
          paddingTop: top + 12,
          paddingBottom: 12,
          paddingHorizontal: 20,
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ fontSize: 17, color: colors.primary }}>Cancel</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 17, fontWeight: '600', color: colors.textPrimary }}>New Message</Text>
          <TouchableOpacity onPress={create} disabled={selected.length === 0 || creating}>
            {creating
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Text style={{ fontSize: 17, fontWeight: '600', color: selected.length === 0 ? colors.textSecondary : colors.primary }}>
                  {isGroup ? 'Create' : 'Open'}
                </Text>
            }
          </TouchableOpacity>
        </View>

        {/* Group name input (only for 2+ recipients) */}
        {isGroup && (
          <View style={{ paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <TextInput
              style={{ fontSize: 15, color: colors.textPrimary }}
              placeholder="Group name (optional)"
              placeholderTextColor={colors.textSecondary}
              value={groupName}
              onChangeText={setGroupName}
            />
          </View>
        )}

        {/* Selected chips */}
        {selected.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            {selected.map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => toggle(p)}
                style={{ backgroundColor: colors.primary, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                <Text style={{ color: '#fff', fontSize: 14 }}>{p.full_name}</Text>
                <Text style={{ color: '#fff', fontSize: 14 }}>×</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Search */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <TextInput
            style={{
              backgroundColor: colors.border,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 8,
              fontSize: 15,
              color: colors.textPrimary,
            }}
            placeholder="Search people..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
        </View>

        {/* People list */}
        {loading
          ? <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.primary} />
          : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: bottom + 20 }}
              renderItem={({ item }) => {
                const isSelected = !!selected.find((p) => p.id === item.id)
                return (
                  <TouchableOpacity
                    onPress={() => toggle(item)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 20,
                      paddingVertical: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                      gap: 14,
                    }}
                  >
                    {/* Avatar circle */}
                    <View style={{
                      width: 40, height: 40, borderRadius: 20,
                      backgroundColor: isSelected ? colors.primary : colors.border,
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Text style={{ color: isSelected ? '#fff' : colors.textSecondary, fontSize: 16, fontWeight: '600' }}>
                        {item.full_name?.[0]?.toUpperCase() ?? '?'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, color: colors.textPrimary, fontWeight: '500' }}>{item.full_name}</Text>
                      <Text style={{ fontSize: 13, color: colors.textSecondary, textTransform: 'capitalize' }}>{item.role}</Text>
                    </View>
                    {isSelected && (
                      <Text style={{ fontSize: 20, color: colors.primary }}>✓</Text>
                    )}
                  </TouchableOpacity>
                )
              }}
            />
          )
        }
      </KeyboardAvoidingView>
    </Modal>
  )
}
