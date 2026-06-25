import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export interface ChurchRow {
  id: string
  name: string
  city: string | null
  state: string | null
  country: string | null
  status: string | null
}

export interface InviteRow {
  id: string
  code: string
  church_id: string | null
  created_at: string | null
  expires_at: string | null
  use_count: number | null
  max_uses: number | null
}

export interface InviteDetails {
  code: string
  church: ChurchRow
  coordinatorName: string
}

export function useChurch() {
  const { profile, refreshProfile } = useAuth()
  const [churches, setChurches] = useState<ChurchRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchChurches(query?: string): Promise<ChurchRow[]> {
    setLoading(true)
    setError(null)
    try {
      let req = supabase
        .from('churches')
        .select('id, name, city, state, country, status')
        .order('name')
      if (query && query.trim().length > 0) {
        req = req.ilike('name', `%${query.trim()}%`)
      }
      const { data, error: err } = await req
      if (err) throw err
      const rows = (data ?? []) as ChurchRow[]
      setChurches(rows)
      return rows
    } catch (e: any) {
      setError(e.message || 'Failed to fetch churches')
      return []
    } finally {
      setLoading(false)
    }
  }

  // Join an existing church and migrate any standalone grades/classes
  async function joinChurch(churchId: string): Promise<{ error: string | null }> {
    if (!profile) return { error: 'Not logged in' }
    try {
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ church_id: churchId })
        .eq('id', profile.id)
      if (profileErr) throw profileErr

      // Migrate grades + classes that have no church yet
      await supabase
        .from('grades')
        .update({ church_id: churchId })
        .eq('created_by', profile.id)
        .is('church_id', null)

      await supabase
        .from('classes')
        .update({ church_id: churchId })
        .eq('created_by', profile.id)
        .is('church_id', null)

      await refreshProfile()
      return { error: null }
    } catch (e: any) {
      return { error: e.message || 'Failed to join church' }
    }
  }

  // Create a new church and join it
  async function createChurch(name: string, city: string, state: string): Promise<{ error: string | null }> {
    if (!profile) return { error: 'Not logged in' }
    try {
      const { data: churchData, error: churchErr } = await supabase
        .from('churches')
        .insert({ name: name.trim(), city: city.trim(), state: state.trim(), country: 'US', status: 'pending', created_by: profile.id })
        .select('id')
        .single()
      if (churchErr) throw churchErr

      return joinChurch(churchData.id)
    } catch (e: any) {
      return { error: e.message || 'Failed to create church' }
    }
  }

  // Leave current church (clears church_id — grades/classes stay, but become unscoped)
  async function leaveChurch(): Promise<{ error: string | null }> {
    if (!profile) return { error: 'Not logged in' }
    try {
      const { error: err } = await supabase
        .from('profiles')
        .update({ church_id: null })
        .eq('id', profile.id)
      if (err) throw err
      await refreshProfile()
      return { error: null }
    } catch (e: any) {
      return { error: e.message || 'Failed to leave church' }
    }
  }

  // Generate an invite code (coordinator/priest only)
  async function generateInvite(): Promise<{ code: string | null; error: string | null }> {
    if (!profile?.church_id) return { code: null, error: 'You must be linked to a church first' }
    try {
      const code = generateCode()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const { error: err } = await supabase
        .from('church_invitations')
        .insert({
          code,
          church_id: profile.church_id,
          created_by: profile.id,
          expires_at: expiresAt.toISOString(),
          use_count: 0,
        })
      if (err) throw err
      return { code, error: null }
    } catch (e: any) {
      return { code: null, error: e.message || 'Failed to generate invite' }
    }
  }

  // Fetch invite codes created by this coordinator
  async function fetchMyInvites(): Promise<InviteRow[]> {
    if (!profile) return []
    try {
      const { data, error: err } = await supabase
        .from('church_invitations')
        .select('*')
        .eq('created_by', profile.id)
        .order('created_at', { ascending: false })
      if (err) throw err
      return (data ?? []) as InviteRow[]
    } catch {
      return []
    }
  }

  // Validate an invite code and return context (church + coordinator name)
  async function validateInvite(code: string): Promise<{ details: InviteDetails | null; error: string | null }> {
    try {
      const now = new Date().toISOString()
      const { data, error: err } = await supabase
        .from('church_invitations')
        .select('code, church_id, created_by, expires_at, use_count, max_uses')
        .eq('code', code)
        .gt('expires_at', now)
        .single()

      if (err || !data) return { details: null, error: 'Invite code is invalid or has expired' }

      if (data.max_uses != null && (data.use_count ?? 0) >= data.max_uses) {
        return { details: null, error: 'This invite link has reached its maximum uses' }
      }

      // Fetch church
      const { data: churchData, error: churchErr } = await supabase
        .from('churches')
        .select('id, name, city, state, country, status')
        .eq('id', data.church_id!)
        .single()
      if (churchErr || !churchData) return { details: null, error: 'Church not found' }

      // Fetch coordinator name
      const { data: coordData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', data.created_by!)
        .single()

      return {
        details: {
          code,
          church: churchData as ChurchRow,
          coordinatorName: coordData?.full_name ?? 'your coordinator',
        },
        error: null,
      }
    } catch (e: any) {
      return { details: null, error: e.message || 'Failed to validate invite' }
    }
  }

  // Accept an invite — join the church, optionally transferring grades/classes
  async function acceptInvite(code: string, churchId: string, transferData: boolean): Promise<{ error: string | null }> {
    if (!profile) return { error: 'Not logged in' }
    try {
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ church_id: churchId })
        .eq('id', profile.id)
      if (profileErr) throw profileErr

      if (transferData) {
        await supabase
          .from('grades')
          .update({ church_id: churchId })
          .eq('created_by', profile.id)
        await supabase
          .from('classes')
          .update({ church_id: churchId })
          .eq('created_by', profile.id)
      }

      // Increment use_count — fire and forget, not critical if it fails
      const { data: inv } = await supabase
        .from('church_invitations')
        .select('use_count')
        .eq('code', code)
        .single()
      if (inv != null) {
        await supabase
          .from('church_invitations')
          .update({ use_count: (inv.use_count ?? 0) + 1 })
          .eq('code', code)
      }

      await refreshProfile()
      return { error: null }
    } catch (e: any) {
      return { error: e.message || 'Failed to accept invite' }
    }
  }

  return {
    churches,
    loading,
    error,
    fetchChurches,
    joinChurch,
    createChurch,
    leaveChurch,
    generateInvite,
    fetchMyInvites,
    validateInvite,
    acceptInvite,
  }
}

function generateCode(): string {
  // 8-character alphanumeric code, uppercase, easy to type
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
