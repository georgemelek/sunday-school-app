import { useState, useEffect, useCallback } from 'react'
import { useTour } from '../contexts/TourContext'
// import { supabase } from '../lib/supabase'

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

  // George Melek (servant-1)
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

  // Fady Roufail (servant-2)
  addUnavailable('servant-2', [
    '2025-10-12', '2025-10-17',
    '2025-11-09', '2025-11-14',
    '2025-12-19', '2025-12-21',
    '2026-02-08',
    '2026-02-27',
    '2026-03-01', '2026-03-08',
    '2026-03-29',
  ])

  // Revana Awadallah (servant-3)
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

  // Monica Zaky (servant-4)
  addUnavailable('servant-4', [
    '2025-09-07', '2025-09-26',
    '2025-10-12',
    '2025-12-12', '2025-12-14', '2025-12-19', '2025-12-21',
    '2026-02-06', '2026-02-08',
    '2026-02-27',
    '2026-03-01',
  ])

  // Steven Yousef (servant-5)
  addUnavailable('servant-5', [
    '2025-09-19', '2025-09-26',
    '2025-10-03', '2025-10-10',
    '2025-10-17',
    '2025-11-16', '2025-11-21',
  ])

  // Koki Ishak (servant-6) — no unavailability from CSV in the Feb-Mar window
  // (Only had Nov 16/21 and Dec 19/21)
  addUnavailable('servant-6', [
    '2025-11-16', '2025-11-21',
    '2025-12-19', '2025-12-21',
    '2026-03-08',
  ])

  // Sarah Bekhet (servant-7)
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

  // John Khillah (servant-8)
  addUnavailable('servant-8', [
    '2025-08-31', '2025-09-07',
    '2025-09-19',
    '2025-10-10', '2025-10-12',
    '2025-10-31', '2025-11-02',
    '2025-11-23',
  ])

  // Christina Ishak (servant-9)
  addUnavailable('servant-9', [
    '2025-11-16', '2025-11-21',
    '2025-12-19', '2025-12-21',
    '2026-03-08',
  ])

  return records
}

const ALL_MOCK_AVAILABILITY = buildMockAvailability()

export function useAvailability(servantId?: string) {
  const { isTourMode } = useTour()
  const [availability, setAvailability] = useState<AvailabilityRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAvailability()
  }, [servantId, isTourMode])

  async function fetchAvailability() {
    setLoading(true)
    setError(null)

    try {
      // TODO: Replace with actual Supabase query
      // const query = supabase
      //   .from('servant_availability')
      //   .select('*')
      //   .order('date', { ascending: true })
      //
      // if (servantId) {
      //   query.eq('servant_id', servantId)
      // }
      //
      // const { data, error: fetchError } = await query
      // if (fetchError) throw fetchError

      if (!isTourMode) {
        // TODO: S.11 — replace with real Supabase query
        setAvailability([])
        return
      }

      await new Promise(resolve => setTimeout(resolve, 500))
      const filtered = servantId
        ? ALL_MOCK_AVAILABILITY.filter(r => r.servantId === servantId)
        : ALL_MOCK_AVAILABILITY
      setAvailability(filtered)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch availability')
      setAvailability([])
    } finally {
      setLoading(false)
    }
  }

  const toggleAvailability = useCallback(
    async (targetServantId: string, date: string) => {
      try {
        // TODO: Replace with actual Supabase upsert
        // const { error: upsertError } = await supabase
        //   .from('servant_availability')
        //   .upsert({
        //     servant_id: targetServantId,
        //     date,
        //     available: !isCurrentlyUnavailable,
        //   }, { onConflict: 'servant_id,date' })
        //
        // if (upsertError) throw upsertError

        setAvailability(prev => {
          const existing = prev.find(
            r => r.servantId === targetServantId && r.date === date
          )

          if (existing) {
            // Record exists (unavailable) — remove it to mark available
            return prev.filter(r => r.id !== existing.id)
          } else {
            // No record (available) — add one to mark unavailable
            const newRecord: AvailabilityRecord = {
              id: `avail-${Date.now()}`,
              servantId: targetServantId,
              date,
              available: false,
              notes: '',
            }
            return [...prev, newRecord]
          }
        })

        return { error: null }
      } catch (err: any) {
        return { error: err.message }
      }
    },
    []
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
