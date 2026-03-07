import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { TABLES } from '../lib/tables'
import { useAuth } from '../contexts/AuthContext'
import { useTour } from '../contexts/TourContext'
import {
  MOCK_CLASSES,
  MOCK_CLASS_TYPES,
  MOCK_SERVANTS,
  type ClassInfo,
  type ClassType,
  type Servant,
} from '../data/mockData'

export type { ClassInfo, ClassType, Servant }

export function useClasses() {
  const { profile } = useAuth()
  const { isTourMode } = useTour()
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [classTypes, setClassTypes] = useState<ClassType[]>([])
  const [servants, setServants] = useState<Servant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchClasses()
  }, [profile?.id, isTourMode])

  async function fetchClasses() {
    setLoading(true)
    setError(null)

    try {
      if (isTourMode) {
        await new Promise(resolve => setTimeout(resolve, 300))
        setClasses(MOCK_CLASSES)
        setClassTypes(MOCK_CLASS_TYPES)
        setServants(MOCK_SERVANTS)
        return
      }

      if (!profile) return

      // Fetch class_types
      const { data: ctData, error: ctError } = await supabase
        .from(TABLES.CLASS_TYPES)
        .select('id, name')
      if (ctError) throw ctError
      setClassTypes((ctData ?? []) as ClassType[])

      // Fetch classes the current servant is assigned to
      const { data: csData, error: csError } = await supabase
        .from(TABLES.CLASS_SERVANTS)
        .select('class_id')
        .eq('servant_id', profile.id)
      if (csError) throw csError

      const myClassIds = (csData ?? []).map((r: any) => r.class_id as string)
      if (myClassIds.length === 0) {
        setClasses([])
        setServants([])
        return
      }

      // Fetch class details + related grades + all servants per class
      const { data: classData, error: classError } = await supabase
        .from(TABLES.CLASSES)
        .select(`
          id, name, class_type_id, day_of_week, start_time, end_time, default_location,
          class_grades(grade_id),
          class_servants(servant_id)
        `)
        .in('id', myClassIds)
      if (classError) throw classError

      const mappedClasses: ClassInfo[] = (classData ?? []).map((c: any) => ({
        id: c.id,
        classTypeId: c.class_type_id ?? '',
        name: c.name,
        description: '',
        defaultLocation: c.default_location ?? '',
        defaultLocationAddress: '',
        defaultDayOfWeek: c.day_of_week ?? 0,
        defaultStartTime: c.start_time ?? '',
        defaultEndTime: c.end_time ?? '',
        servantIds: (c.class_servants ?? []).map((cs: any) => cs.servant_id as string),
        gradeIds: (c.class_grades ?? []).map((cg: any) => cg.grade_id as string),
      }))
      setClasses(mappedClasses)

      // Fetch profile names for all servant IDs across all classes
      const allServantIds = [...new Set(mappedClasses.flatMap(c => c.servantIds))]
      if (allServantIds.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', allServantIds)
        if (profileError) throw profileError
        setServants((profileData ?? []).map((p: any) => ({
          id: p.id,
          fullName: p.full_name ?? p.id,
        })))
      } else {
        setServants([])
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch classes')
      setClasses([])
      setClassTypes([])
      setServants([])
    } finally {
      setLoading(false)
    }
  }

  function getClassById(classId: string): ClassInfo | undefined {
    return classes.find(c => c.id === classId)
  }

  function getServantById(servantId: string): Servant | undefined {
    return servants.find(s => s.id === servantId)
  }

  function getServantsByClassId(classId: string): Servant[] {
    const cls = classes.find(c => c.id === classId)
    if (!cls) return []
    return servants.filter(s => cls.servantIds.includes(s.id))
  }

  return {
    classes,
    classTypes,
    servants,
    loading,
    error,
    refetch: fetchClasses,
    getClassById,
    getServantById,
    getServantsByClassId,
  }
}
