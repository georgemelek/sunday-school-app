import { useCallback, useEffect, useState } from 'react'
import { useCreateChatClient } from 'stream-chat-expo'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const STREAM_API_KEY = '3sfz9pb7ep69'

// Token provider — called by useCreateChatClient on connect and token expiry
function useStreamTokenProvider(userId: string | undefined) {
  return useCallback(async () => {
    if (!userId) throw new Error('No user')
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token
    if (!accessToken) throw new Error('No access token')

    const res = await fetch(
      `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/get-stream-token`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    )
    if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`)
    const { token } = await res.json()
    return token as string
  }, [userId])
}

export function useStreamChatClient() {
  const { profile } = useAuth()
  const tokenProvider = useStreamTokenProvider(profile?.id)
  const client = useCreateChatClient(
    profile
      ? {
          apiKey: STREAM_API_KEY,
          tokenOrProvider: tokenProvider,
          userData: { id: profile.id, name: profile.full_name ?? undefined },
        }
      : // Pass dummy values when not logged in — useCreateChatClient won't connect
        // when apiKey is empty, so this safely stays idle until profile loads.
        { apiKey: '', tokenOrProvider: '', userData: { id: '' } },
  )

  return client
}

export function useUnreadCount() {
  const client = useStreamChatClient()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!client) return

    // Seed from current connection state — total_unread_count is on OwnUserResponse
    const ownUser = client.user as (typeof client.user & { total_unread_count?: number }) | undefined
    setUnreadCount(ownUser?.total_unread_count ?? 0)

    const handleEvent = (event: { total_unread_count?: number }) => {
      setUnreadCount(event.total_unread_count ?? 0)
    }

    client.on('notification.message_new', handleEvent)
    client.on('notification.mark_read', handleEvent)
    client.on('notification.mark_unread', handleEvent)

    return () => {
      client.off('notification.message_new', handleEvent)
      client.off('notification.mark_read', handleEvent)
      client.off('notification.mark_unread', handleEvent)
    }
  }, [client])

  return unreadCount
}
