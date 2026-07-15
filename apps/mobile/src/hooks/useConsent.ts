import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const CONSENT_KEY = '@consent_accepted_v1'

export function useConsent() {
  const [consentAccepted, setConsentAccepted] = useState<boolean | null>(null)

  useEffect(() => {
    AsyncStorage.getItem(CONSENT_KEY).then(value => {
      setConsentAccepted(value === 'true')
    })
  }, [])

  async function acceptConsent() {
    await AsyncStorage.setItem(CONSENT_KEY, 'true')
    setConsentAccepted(true)
  }

  return { consentAccepted, acceptConsent }
}
