import React, { useEffect, useMemo, useState } from 'react'
import { Platform, TouchableOpacity, Text, View, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Channel, MessageComposer, MessageList, useChatContext } from 'stream-chat-expo'
import { useTheme } from '../../theme'
import { useStreamChatClient } from '../../hooks/useStreamChat'

interface Props {
  channelCid: string
  onBack: () => void
}

function ChannelScreenInner({ channelCid, onBack }: Props) {
  const { client } = useChatContext()
  const { colors } = useTheme()
  const { top, bottom } = useSafeAreaInsets()
  const [ready, setReady] = useState(false)

  const channel = useMemo(() => {
    const [type, id] = channelCid.split(':')
    return client.channel(type, id)
  }, [channelCid, client])

  useEffect(() => {
    setReady(false)
    channel.watch().then(() => setReady(true)).catch(console.error)
  }, [channel])

  const headerHeight = (Platform.OS === 'ios' ? 44 : 56) + top
  const channelName = channel.data?.name

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{
          paddingTop: top + 12, paddingBottom: 12, paddingHorizontal: 20,
          backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
          flexDirection: 'row', alignItems: 'center', gap: 12,
        }}>
          <TouchableOpacity onPress={onBack}>
            <Text style={{ fontSize: 17, color: colors.primary }}>{'‹ Back'}</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    )
  }

  return (
    <Channel
      channel={channel}
      keyboardVerticalOffset={0}
      topInset={headerHeight}
      bottomInset={bottom}
    >
      {/* Header inside Channel so it's part of Channel's layout tree */}
      <View style={{
        paddingTop: top + 12,
        paddingBottom: 12,
        paddingHorizontal: 20,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}>
        <TouchableOpacity onPress={onBack}>
          <Text style={{ fontSize: 17, color: colors.primary }}>{'‹ Back'}</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: '600', color: colors.textPrimary, flex: 1 }} numberOfLines={1}>
          {channelName ?? 'Chat'}
        </Text>
      </View>
      <MessageList />
      <MessageComposer />
    </Channel>
  )
}

export default function ChannelScreen({ channelCid, onBack }: Props) {
  const { colors } = useTheme()
  const client = useStreamChatClient()

  if (!client) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return <ChannelScreenInner channelCid={channelCid} onBack={onBack} />
}
