import React from 'react'
import { useStudents } from '../../hooks/useStudents'
import StudentFormScreen from './StudentFormScreen'

interface AddStudentScreenProps {
  gradeId: string
  gradeName: string
  onBack: () => void
}

export default function AddStudentScreen({ gradeId, gradeName, onBack }: AddStudentScreenProps) {
  const { addStudent } = useStudents(gradeId)

  return (
    <StudentFormScreen
      mode="add"
      gradeId={gradeId}
      gradeName={gradeName}
      onSave={addStudent}
      onBack={onBack}
    />
  )
}
