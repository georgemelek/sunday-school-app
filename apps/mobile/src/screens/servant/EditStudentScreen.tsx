import React from 'react'
import { useStudents, Student } from '../../hooks/useStudents'
import StudentFormScreen from './StudentFormScreen'

interface EditStudentScreenProps {
  gradeId: string
  gradeName: string
  student: Student
  onBack: () => void
}

export default function EditStudentScreen({
  gradeId,
  gradeName,
  student,
  onBack,
}: EditStudentScreenProps) {
  const { updateStudent } = useStudents(gradeId)

  const handleSave = async (studentData: Partial<Student>) => {
    return await updateStudent(student.id, studentData)
  }

  return (
    <StudentFormScreen
      mode="edit"
      gradeId={gradeId}
      gradeName={gradeName}
      student={student}
      onSave={handleSave}
      onBack={onBack}
    />
  )
}
