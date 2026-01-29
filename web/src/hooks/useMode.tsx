 'use client'
 
 import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
 
 export type AppMode = 'we' | 'me'
 
 interface ModeContextValue {
   mode: AppMode
   setMode: (m: AppMode) => void
   toggle: () => void
 }
 
 const ModeContext = createContext<ModeContextValue | null>(null)
 
 export function ModeProvider({ children }: { children: React.ReactNode }) {
   const [mode, setMode] = useState<AppMode>(() => {
     if (typeof window !== 'undefined') {
       const saved = window.localStorage.getItem('app-mode') as AppMode | null
       if (saved === 'we' || saved === 'me') return saved
     }
     return 'we'
   })
 
   useEffect(() => {
     if (typeof document !== 'undefined') {
       const root = document.documentElement
       root.classList.remove('mode-we', 'mode-me')
       root.classList.add(mode === 'we' ? 'mode-we' : 'mode-me')
       window.localStorage.setItem('app-mode', mode)
     }
   }, [mode])
 
   const value = useMemo<ModeContextValue>(
     () => ({
       mode,
       setMode,
       toggle: () => setMode((prev) => (prev === 'we' ? 'me' : 'we')),
     }),
     [mode]
   )
 
   return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>
 }
 
 export function useMode() {
   const ctx = useContext(ModeContext)
   if (!ctx) {
     throw new Error('useMode 必须在 ModeProvider 中使用')
   }
   return ctx
 }
