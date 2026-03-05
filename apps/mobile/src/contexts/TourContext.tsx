import React, { createContext, useContext, useState } from 'react'

interface TourContextType {
  isTourMode: boolean
  startTour: () => void
  endTour: () => void
}

const TourContext = createContext<TourContextType | undefined>(undefined)

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [isTourMode, setIsTourMode] = useState(false)

  return (
    <TourContext.Provider
      value={{
        isTourMode,
        startTour: () => setIsTourMode(true),
        endTour: () => setIsTourMode(false),
      }}
    >
      {children}
    </TourContext.Provider>
  )
}

export function useTour() {
  const context = useContext(TourContext)
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider')
  }
  return context
}
