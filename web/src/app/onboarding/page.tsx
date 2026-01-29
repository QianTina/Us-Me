'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Home, Users } from 'lucide-react'

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [familyName, setFamilyName] = useState('')
  const [inviteCode, setInviteCode] = useState('')

  // Check if user already has a family
  useEffect(() => {
    const checkFamily = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/auth')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('id', user.id)
        .maybeSingle()

      if (profile?.family_id) {
        router.replace('/bistro')
      } else {
        setLoading(false)
      }
    }
    checkFamily()
  }, [router])

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)

    try {
      const { error } = await supabase.rpc('create_family', {
        family_name: familyName
      })

      if (error) throw error

      router.push('/bistro')
    } catch (error: unknown) {
      console.error('Error creating family:', error)
      const message = error instanceof Error ? error.message : 'Failed to create family'
      alert(message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleQuickStart = async () => {
    setActionLoading(true)
    try {
      const { error } = await supabase.rpc('create_family', {
        family_name: '温馨小家'
      })
      if (error) throw error
      router.push('/bistro')
    } catch (error: unknown) {
      console.error('Error creating family:', error)
      const message = error instanceof Error ? error.message : 'Failed to enter'
      alert(message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleJoinFamily = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)

    try {
      const { data, error } = await supabase.rpc('join_family', {
        invite_code_input: inviteCode
      })

      if (error) throw error
      
      if (data === false) {
        alert('邀请码无效 (Invalid invite code)')
        return
      }

      router.push('/bistro')
    } catch (error: unknown) {
      console.error('Error joining family:', error)
      const message = error instanceof Error ? error.message : 'Failed to join family'
      alert(message)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neo-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neo-bg flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        
        {/* Create Family */}
        <Card className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white hover:-translate-y-1 transition-transform duration-300">
          <CardHeader>
            <div className="bg-neo-green w-12 h-12 rounded-full border-2 border-black flex items-center justify-center mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Home className="h-6 w-6 text-black" />
            </div>
            <CardTitle className="text-2xl font-black">创建新家庭 (Create Family)</CardTitle>
            <CardDescription className="font-bold text-gray-500">
              我是第一个成员，建立我们的专属小窝
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateFamily} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="familyName">家庭名称 (Family Name)</Label>
                <Input 
                  id="familyName" 
                  placeholder="e.g. 爱的小屋" 
                  value={familyName}
                  onChange={e => setFamilyName(e.target.value)}
                  className="border-2 border-black focus-visible:ring-0 focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                  required
                />
              </div>
              <Button 
                type="submit" 
                disabled={actionLoading}
                className="w-full bg-neo-green text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none font-bold"
              >
                {actionLoading ? <Loader2 className="animate-spin" /> : '创建家庭 (Create)'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Join Family */}
        <Card className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white hover:-translate-y-1 transition-transform duration-300">
          <CardHeader>
            <div className="bg-neo-yellow w-12 h-12 rounded-full border-2 border-black flex items-center justify-center mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Users className="h-6 w-6 text-black" />
            </div>
            <CardTitle className="text-2xl font-black">加入家庭 (Join Family)</CardTitle>
            <CardDescription className="font-bold text-gray-500">
              我已经有邀请码了，这就回家
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinFamily} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviteCode">邀请码 (Invite Code)</Label>
                <Input 
                  id="inviteCode" 
                  placeholder="输入对方发给你的代码" 
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value)}
                  className="border-2 border-black focus-visible:ring-0 focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                  required
                />
              </div>
              <Button 
                type="submit" 
                disabled={actionLoading}
                className="w-full bg-neo-yellow text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none font-bold"
              >
                {actionLoading ? <Loader2 className="animate-spin" /> : '加入家庭 (Join)'}
              </Button>
            </form>
          </CardContent>
        </Card>

      </div>

      <div className="text-center">
        <button 
          onClick={handleQuickStart}
          disabled={actionLoading}
          className="text-gray-500 hover:text-black font-bold underline underline-offset-4 decoration-2 decoration-gray-300 hover:decoration-black transition-all"
        >
          {actionLoading ? '处理中...' : '暂不创建，直接进入 (Skip & Enter)'}
        </button>
      </div>
    </div>
  )
}
