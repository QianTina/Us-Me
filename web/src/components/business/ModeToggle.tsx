 'use client'
 
 import { Button } from '@/components/ui/button'
 import { useMode } from '@/hooks/useMode'
 import { Users, User } from 'lucide-react'
 
 export function ModeToggle() {
   const { mode, toggle } = useMode()
   const isWe = mode === 'we'
 
   return (
     <div className="fixed top-4 right-4 z-50">
       <Button
         onClick={toggle}
         variant="outline"
         className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl bg-white"
         title={isWe ? '切换到 Me 模式' : '切换到 We 模式'}
       >
         {isWe ? <Users className="mr-2 h-5 w-5" /> : <User className="mr-2 h-5 w-5" />}
         {isWe ? 'We 模式' : 'Me 模式'}
       </Button>
     </div>
   )
 }
