import { createContext, useContext, useState, useEffect } from 'react'
import { sampleHikes } from '../data/sampleData'

const HikesContext = createContext(null)

const STORAGE_KEY = 'trail-journal-v1'

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export function HikesProvider({ children }) {
  const [hikes, setHikes] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw)
      // Seed with sample data on first visit
      return sampleHikes
    } catch {
      return sampleHikes
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(hikes))
    } catch (e) {
      console.warn('localStorage write failed:', e)
    }
  }, [hikes])

  const addHike = (data) => {
    const hike = { ...data, id: genId(), createdAt: new Date().toISOString() }
    setHikes(prev => [hike, ...prev])
    return hike.id
  }

  const updateHike = (id, data) => {
    setHikes(prev =>
      prev.map(h => h.id === id ? { ...h, ...data, updatedAt: new Date().toISOString() } : h)
    )
  }

  const deleteHike = (id) => {
    setHikes(prev => prev.filter(h => h.id !== id))
  }

  const getHike = (id) => hikes.find(h => h.id === id)

  return (
    <HikesContext.Provider value={{ hikes, addHike, updateHike, deleteHike, getHike }}>
      {children}
    </HikesContext.Provider>
  )
}

export const useHikes = () => {
  const ctx = useContext(HikesContext)
  if (!ctx) throw new Error('useHikes must be used inside HikesProvider')
  return ctx
}
