import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native'
import type { AssignedKid } from '../../hooks/useOutreach'
import { fillTemplate, DEFAULT_MESSAGE_TEMPLATE } from '../../utils/outreachTemplates'

interface OutreachDetailScreenProps {
  assignedKid: AssignedKid
  onBack: () => void
  onLogVisit: (assignmentId: string, date: string, notes?: string) => void
}

const SERVANT_NAME = 'George'

export default function OutreachDetailScreen({
  assignedKid,
  onBack,
  onLogVisit,
}: OutreachDetailScreenProps) {
  const { student, assignment, visits } = assignedKid

  const [modalVisible, setModalVisible] = useState(false)
  const [visitDate, setVisitDate] = useState(todayString())
  const [visitNotes, setVisitNotes] = useState('')

  const initial = student.name.charAt(0).toUpperCase()

  function handleCall() {
    if (!student.parent_phone) {
      Alert.alert('No Phone', 'No phone number on file.')
      return
    }
    Linking.openURL(`tel:${student.parent_phone}`)
  }

  function handleMap() {
    const query = student.address || student.city
    if (!query) {
      Alert.alert('No Address', 'No address or city on file.')
      return
    }
    const full = student.address && student.city ? `${student.address}, ${student.city}` : query
    Linking.openURL(`maps://?q=${encodeURIComponent(full)}`)
  }

  function handleMessage() {
    if (!student.parent_phone) {
      Alert.alert('No Phone', 'No phone number on file.')
      return
    }
    const body = fillTemplate(DEFAULT_MESSAGE_TEMPLATE, student.name, SERVANT_NAME)
    Linking.openURL(`sms:${student.parent_phone}&body=${encodeURIComponent(body)}`)
  }

  function handleSaveVisit() {
    if (!visitDate.trim()) return
    onLogVisit(assignment.id, visitDate.trim(), visitNotes.trim() || undefined)
    setModalVisible(false)
    setVisitDate(todayString())
    setVisitNotes('')
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>{'\u2039'} Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{student.name}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Info Section */}
        <View style={styles.infoCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.infoName}>{student.name}</Text>
          <Text style={styles.infoGrade}>{assignment.gradeName}</Text>
          {student.parent_name && (
            <Text style={styles.infoParent}>Parent: {student.parent_name}</Text>
          )}
        </View>

        {/* Contact Actions */}
        <View style={styles.contactRow}>
          <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
            <Text style={styles.contactIcon}>{'📞'}</Text>
            <Text style={styles.contactLabel}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactButton} onPress={handleMap}>
            <Text style={styles.contactIcon}>{'📍'}</Text>
            <Text style={styles.contactLabel}>Map</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactButton} onPress={handleMessage}>
            <Text style={styles.contactIcon}>{'💬'}</Text>
            <Text style={styles.contactLabel}>Message</Text>
          </TouchableOpacity>
        </View>

        {/* Visit History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visit History</Text>
          {visits.length === 0 ? (
            <Text style={styles.noVisits}>No visits yet</Text>
          ) : (
            visits.map(visit => (
              <View key={visit.id} style={styles.visitItem}>
                <Text style={styles.visitDate}>{formatDate(visit.visitDate)}</Text>
                {visit.notes ? (
                  <Text style={styles.visitNotes}>{visit.notes}</Text>
                ) : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Log Visit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.logButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.logButtonText}>Log Visit</Text>
        </TouchableOpacity>
      </View>

      {/* Log Visit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Visit</Text>

            <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={visitDate}
              onChangeText={setVisitDate}
              placeholder="2026-02-23"
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={visitNotes}
              onChangeText={setVisitNotes}
              placeholder="Where did you go? How was it?"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false)
                  setVisitDate(todayString())
                  setVisitNotes('')
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveVisit}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

function todayString(): string {
  const d = new Date()
  return d.toISOString().split('T')[0]
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginBottom: 8,
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  infoName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  infoGrade: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  infoParent: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  contactButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  contactIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  contactLabel: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  noVisits: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  visitItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  visitDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  visitNotes: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  logButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  logButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
})
