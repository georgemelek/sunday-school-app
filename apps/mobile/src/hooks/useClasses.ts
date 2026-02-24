import { useState, useEffect } from 'react'
// import { supabase } from '../lib/supabase'
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
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [classTypes, setClassTypes] = useState<ClassType[]>([])
  const [servants, setServants] = useState<Servant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchClasses()
  }, [])

  async function fetchClasses() {
    setLoading(true)
    setError(null)

    try {
      // TODO: Replace with actual Supabase query
      // const { data: classData, error: classError } = await supabase
      //   .from('classes')
      //   .select(`
      //     *,
      //     class_type:class_types(*),
      //     servant_classes(servant_id),
      //     class_grades(grade_id)
      //   `)
      //   .order('name')

      // if (classError) throw classError

      // Mock data for development
      await new Promise(resolve => setTimeout(resolve, 500))

      setClasses(MOCK_CLASSES)
      setClassTypes(MOCK_CLASS_TYPES)
      setServants(MOCK_SERVANTS)
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
