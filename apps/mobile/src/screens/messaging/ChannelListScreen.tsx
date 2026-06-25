import React, { useMemo, useState } from 'react'
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native'
import { ChannelList, useChatContext } from 'stream-chat-expo'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../theme'
import { useStreamChatClient } from '../../hooks/useStreamChat'
import NewConversationModal from './NewConversationModal'

interface Props {
  onChannelPress: (channelCid: string) => void
}

// Inner component — only rendered when <Chat> is in the tree
function ChannelListInner({ onChannelPress }: Props) {
  const { profile } = useAuth()
  const { colors } = useTheme()
  const { client } = useChatContext()
  const [composing, setComposing] = useState(false)

  const filters = useMemo(
    () => ({ members: { $in: [profile?.id ?? ''] }, type: 'messaging' }),
    [profile?.id],
  )
  const sort = useMemo(() => [{ last_message_at: -1 as const }], [])
  const options = useMemo(() => ({ limit: 20, messages_limit: 30 }), [])

  if (!client || !profile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 20,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
      }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: colors.textPrimary }}>
          Messages
        </Text>
        <TouchableOpacity onPress={() => setComposing(true)} style={{ paddingBottom: 2 }}>
          <Text style={{ fontSize: 28, color: colors.primary }}>✏️</Text>
        </TouchableOpacity>
      </View>

      <ChannelList
        filters={filters}
        sort={sort}
        options={options}
        onSelect={(channel) => onChannelPress(channel.cid)}
      />

      <NewConversationModal
        visible={composing}
        onClose={() => setComposing(false)}
        onCreated={(cid) => {
          setComposing(false)
          onChannelPress(cid)
        }}
      />
    </View>
  )
}

export default function ChannelListScreen({ onChannelPress }: Props) {
  const { colors } = useTheme()
  const client = useStreamChatClient()

  if (!client) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return <ChannelListInner onChannelPress={onChannelPress} />
}
