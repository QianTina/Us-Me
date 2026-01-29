'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Heart } from 'lucide-react'

export default function AuthPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
            }
          }
        })
        if (error) throw error
        alert('注册成功！请登录 (Registration successful! Please sign in)')
        setMode('signin')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        
        // Login success
        router.push('/bistro')
      }
    } catch (error: unknown) {
      console.error('Auth error:', error)
      alert((error as Error).message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neo-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
        <CardHeader className="text-center">
          <div className="mx-auto bg-neo-green w-12 h-12 rounded-full border-2 border-black flex items-center justify-center mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Heart className="h-6 w-6 text-black fill-black" />
          </div>
          <CardTitle className="text-2xl font-black">Us & Me</CardTitle>
          <CardDescription className="font-bold text-gray-500">
            情侣生活操作系统 (Couple OS)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg border-2 border-black">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                mode === 'signin' 
                  ? 'bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              登录 (Sign In)
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                mode === 'signup' 
                  ? 'bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              注册 (Sign Up)
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="username">昵称 (Nickname)</Label>
                <Input 
                  id="username" 
                  placeholder="怎么称呼你？" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="border-2 border-black focus-visible:ring-0 focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                  required
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">邮箱 (Email)</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="example@email.com" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="border-2 border-black focus-visible:ring-0 focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">密码 (Password)</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="******" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="border-2 border-black focus-visible:ring-0 focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                required
                minLength={6}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-neo-yellow text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none font-bold text-lg h-12 mt-4"
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" /> : (mode === 'signin' ? '开始生活 (Let\'s Go)' : '创建账号 (Create Account)')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
