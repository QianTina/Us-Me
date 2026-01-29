'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamily } from '@/hooks/useFamily'
import { Post } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { AddWishDialog } from '@/components/business/AddWishDialog'
import { Lock, Gift } from 'lucide-react'

export default function MePage() {
  const { userId, isDemo } = useFamily()
  const [wishes, setWishes] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  const loadWishes = useCallback(async () => {
    setLoading(true)
    try {
      if (isDemo) {
        setWishes([
          {
            id: 'demo-1',
            family_id: 'demo',
            owner_id: 'demo-user',
            type: 'wish',
            content: '想要一台 Switch 玩马里奥赛车！',
            visibility: 'private',
            created_at: new Date().toISOString(),
          },
        ])
        return
      }

      if (!userId) {
        setWishes([])
        return
      }

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('owner_id', userId)
        .eq('type', 'wish')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      setWishes((data || []) as Post[])
    } catch (err) {
      console.error('加载心愿单失败:', err)
    } finally {
      setLoading(false)
    }
  }, [isDemo, userId])

  useEffect(() => {
    loadWishes()
  }, [loadWishes])

  return (
    <div className="min-h-screen bg-neo-bg p-4 sm:p-8 pb-24" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)' }}>
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black border-b-4 border-accent inline-block pb-1">
              My Wishlist (Me)
            </h1>
          </div>
          <AddWishDialog onSuccess={loadWishes} />
        </header>

        <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl">
          <div className="flex items-center gap-2 text-sm font-bold text-accent">
            <Lock className="h-4 w-4" />
            仅自己可见 (Owner-only)
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : wishes.length === 0 ? (
          <div className="text-center py-12 text-gray-500 font-bold bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl">
            还没有心愿，点击右上角按钮许个愿吧！
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {wishes.map((p) => (
              <Card key={p.id} className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white h-full">
                <CardContent className="p-4 flex flex-col h-full justify-between gap-4">
                  <div className="text-lg font-bold leading-relaxed whitespace-pre-wrap flex items-start gap-2">
                    <Gift className="h-5 w-5 text-neo-purple flex-shrink-0 mt-1" />
                    {p.content}
                  </div>
                  <div className="text-xs text-gray-500 font-bold text-right border-t-2 border-dashed border-gray-200 pt-2">
                    {new Date(p.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
