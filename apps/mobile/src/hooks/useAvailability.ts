import { useState, useEffect, useCallback } from 'react'
import { useTour } from '../contexts/TourContext'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export interface AvailabilityRecord {
  id: string
  servantId: string
  date: string // YYYY-MM-DD
  available: boolean
  notes: string
}

// --- Mock availability data (from real availability tracker CSV) ---
// Only dates where a servant is UNAVAILABLE are stored (available=false).
// If no record exists for a servant+date, they are assumed available.

function buildMockAvailability(): AvailabilityRecord[] {
  const records: AvailabilityRecord[] = []
  let id = 1

  function addUnavailable(servantId: string, dates: string[], notes = '') {
    for (const date of dates) {
      records.push({
        id: `avail-${id++}`,
        servantId,
        date,
        available: false,
        notes,
      })
    }
  }

  // servant-1 (Alex Martin)
  addUnavailable('servant-1', [
    '2025-08-31', '2025-09-07',
    '2025-10-24', '2025-10-26',
    '2025-11-28', '2025-11-30',
    '2025-12-21', '2025-12-26', '2025-12-28',
    '2026-01-02', '2026-01-04',
    '2026-01-25', '2026-01-30', '2026-02-01',
    '2026-02-27',
    '2026-03-01',
  ])

  // servant-2 (Jordan Taylor)
  addUnavailable('servant-2', [
    '2025-10-12', '2025-10-17',
    '2025-11-09', '2025-11-14',
    '2025-12-19', '2025-12-21',
    '2026-02-08',
    '2026-02-27',
    '2026-03-01', '2026-03-08',
    '2026-03-29',
  ])

  // servant-3 (Riley Morgan)
  addUnavailable('servant-3', [
    '2025-10-19', '2025-10-24', '2025-10-26',
    '2025-11-28', '2025-11-30',
    '2025-12-14', '2025-12-19', '2025-12-21',
    '2025-12-26', '2025-12-28',
    '2026-01-02', '2026-01-04', '2026-01-09', '2026-01-11',
    '2026-01-23', '2026-01-25', '2026-01-30', '2026-02-01',
    '2026-02-06', '2026-02-08',
    '2026-02-27',
    '2026-03-01',
  ])

  // servant-4 (Casey Brooks)
  addUnavailable('servant-4', [
    '2025-09-07', '2025-09-26',
    '2025-10-12',
    '2025-12-12', '2025-12-14', '2025-12-19', '2025-12-21',
    '2026-02-06', '2026-02-08',
    '2026-02-27',
    '2026-03-01',
  ])

  // servant-5 (Sam Rivera)
  addUnavailable('servant-5', [
    '2025-09-19', '2025-09-26',
    '2025-10-03', '2025-10-10',
    '2025-10-17',
    '2025-11-16', '2025-11-21',
  ])

  // servant-6 (Dana Nguyen)
  addUnavailable('servant-6', [
    '2025-11-16', '2025-11-21',
    '2025-12-19', '2025-12-21',
    '2026-03-08',
  ])

  // servant-7 (Morgan Ellis)
  addUnavailable('servant-7', [
    '2025-08-31', '2025-09-07',
    '2025-10-05',
    '2025-11-02',
    '2025-11-23',
    '2025-12-28',
    '2026-01-25',
    '2026-02-08',
    '2026-02-27',
    '2026-03-01',
    '2026-05-01',
    '2026-05-17',
  ])

  // servant-8 (Taylor Reed)
  addUnavailable('servant-8', [
    '2025-08-31', '2025-09-07',
    '2025-09-19',
    '2025-10-10', '2025-10-12',
    '2025-10-31', '2025-11-02',
    '2025-11-23',
  ])

  // servant-9 (Quinn Foster)
  addUnavailable('servant-9', [
    '2025-11-16', '2025-11-21',
    '2025-12-19', '2025-12-21',
    '2026-03-08',
  ])

  return records
}

const ALL_MOCK_AVAILABILITY = buildMockAvailability()
export { ALL_MOCK_AVAILABILITY as ALL_MOCK_AVAILABILITY_EXPORT }

function rowToRecord(row: any): AvailabilityRecord {
  return {
    id: row.id,
    servantId: row.servant_id,
    date: row.date,
    available: row.available,
    notes: row.notes ?? '',
  }
}

export function useAvailability(servantId?: string) {
  const { isTourMode } = useTour()
  const { profile } = useAuth()
  const [availability, setAvailability] = useState<AvailabilityRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Real user ID for Supabase operations (undefined in tour mode)
  const realUserId = isTourMode ? undefined : profile?.id

  useEffect(() => {
    fetchAvailability()
  }, [servantId, isTourMode, profile?.id])

  async function fetchAvailability() {
    setLoading(true)
    setError(null)

    try {
      if (isTourMode) {
        await new Promise(resolve => setTimeout(resolve, 500))
        const filtered = servantId
          ? ALL_MOCK_AVAILABILITY.filter(r => r.servantId === servantId)
          : ALL_MOCK_AVAILABILITY
        setAvailability(filtered)
      } else {
        let query = supabase
          .from('servant_availability')
          .select('*')
          .order('date', { ascending: true })
        if (realUserId) query = query.eq('servant_id', realUserId)
        const { data, error: fetchError } = await query
        if (fetchError) throw fetchError
        setAvailability((data ?? []).map(rowToRecord))
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch availability')
      setAvailability([])
    } finally {
      setLoading(false)
    }
  }

  const toggleAvailability = useCallback(
    async (targetServantId: string, date: string) => {
      const existing = availability.find(
        r => r.servantId === targetServantId && r.date === date
      )

      // Optimistic update
      if (existing) {
        setAvailability(prev => prev.filter(r => r.id !== existing.id))
      } else {
        const optimistic: AvailabilityRecord = {
          id: `avail-${Date.now()}`,
          servantId: targetServantId,
          date,
          available: false,
          notes: '',
        }
        setAvailability(prev => [...prev, optimistic])
      }

      if (isTourMode) {
        return { error: null }
      }

      // Use real auth user ID for Supabase (RLS requires servant_id = auth.uid())
      const supabaseServantId = realUserId
      if (!supabaseServantId) {
        return { error: 'Not authenticated' }
      }

      try {
        if (existing) {
          // Remove unavailable record → servant is now available
          const { error: deleteError } = await supabase
            .from('servant_availability')
            .delete()
            .eq('servant_id', supabaseServantId)
            .eq('date', date)
          if (deleteError) throw deleteError
        } else {
          // Insert unavailable record
          const { error: insertError } = await supabase
            .from('servant_availability')
            .insert({ servant_id: supabaseServantId, date, available: false })
          if (insertError) throw insertError
        }
        return { error: null }
      } catch (err: any) {
        // Revert optimistic update on error
        if (existing) {
          setAvailability(prev => [...prev, existing])
        } else {
          setAvailability(prev =>
            prev.filter(r => !(r.servantId === targetServantId && r.date === date))
          )
        }
        return { error: err.message }
      }
    },
    [availability, isTourMode, realUserId]
  )

  const isServantAvailable = useCallback(
    (targetServantId: string, date: string): boolean => {
      return !availability.some(
        r => r.servantId === targetServantId && r.date === date && !r.available
      )
    },
    [availability]
  )

  const getUnavailableServantsForDate = useCallback(
    (date: string, servantIds: string[]): string[] => {
      return servantIds.filter(sid =>
        availability.some(
          r => r.servantId === sid && r.date === date && !r.available
        )
      )
    },
    [availability]
  )

  return {
    availability,
    loading,
    error,
    refetch: fetchAvailability,
    toggleAvailability,
    isServantAvailable,
    getUnavailableServantsForDate,
  }
}
