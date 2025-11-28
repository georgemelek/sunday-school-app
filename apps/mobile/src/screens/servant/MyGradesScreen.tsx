import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useAuth } from '../../contexts/AuthContext'

export default function MyGradesScreen() {
  const { profile, signOut } = useAuth()

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Grades</Text>
      <Text style={styles.subtitle}>Welcome, {profile?.full_name}!</Text>
      <Text style={styles.role}>Role: {profile?.role}</Text>

      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          Grade management coming soon...
        </Text>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 4,
  },
  role: {
    fontSize: 14,
    color: '#999',
    marginBottom: 32,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  signOutButton: {
    backgroundColor: '#f44336',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
