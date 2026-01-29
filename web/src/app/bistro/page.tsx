'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MenuCard } from '@/components/business/MenuCard'
import { AddDishDialog } from '@/components/business/AddDishDialog'
import { MenuItem } from '@/types'
import { supabase } from '@/lib/supabase'
import { useFamily } from '@/hooks/useFamily'
import { AlertCircle, ChefHat, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function BistroPage() {
  const router = useRouter()
  const { familyId, isDemo, loading: familyLoading, points, refreshProfile } = useFamily()
  const [items, setItems] = useState<MenuItem[]>([])
  const [menuLoading, setMenuLoading] = useState(true)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const fetchMenu = useCallback(async () => {
    if (familyLoading) return
    setMenuLoading(true)
    
    // Check configuration first
    if (isDemo) {
      console.log('Supabase not configured, using mock data')
      setItems([
        { id: '1', family_id: 'demo', name: '红烧肉 (Demo)', price: 50, image_url: null, tags: ['肉', '硬菜'], is_public: true, created_at: new Date().toISOString() },
        { id: '2', family_id: 'demo', name: '番茄炒蛋 (Demo)', price: 20, image_url: null, tags: ['家常'], is_public: true, created_at: new Date().toISOString() },
        { id: '3', family_id: 'demo', name: '清蒸鲈鱼 (Demo)', price: 45, image_url: null, tags: ['健康', '海鲜'], is_public: true, created_at: new Date().toISOString() },
      ])
      setMenuLoading(false)
      return
    }

    if (!familyId) {
      // Should redirect in useEffect, but safe return here
      setMenuLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
      
      if (error) throw error

      // Filter out wish items and store items
      setItems(data?.filter(i => 
        !i.tags?.includes('system:wish') && 
        !i.tags?.includes('store')
      ) || [])
    } catch (err) {
      console.error('Error fetching menu:', err)
      // Fallback to empty if real fetch fails
      setItems([])
    } finally {
      setMenuLoading(false)
    }
  }, [familyLoading, isDemo, familyId])

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      // Refresh menu
      fetchMenu()
    } catch (error) {
      console.error('Error deleting dish:', error)
      alert('删除失败 (Failed to delete)')
    }
  }

  const handleOrder = async (id: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return

    if (isDemo) {
      setToastMessage(`已点餐 (演示): ${item.name}`)
      setTimeout(() => setToastMessage(null), 3000)
      return
    }

    if (!familyId) return

    if (item.price > points) {
      alert(`积分不足 (Insufficient points)\nNeed: ${item.price}\nHave: ${points}`)
      return
    }

    try {
      const { error } = await supabase.rpc('place_order', {
        item_id: id,
        qty: 1
      })

      if (error) throw error

      setToastMessage(`下单成功！坐等开吃: ${item.name}`)
      setTimeout(() => setToastMessage(null), 3000)
      
      // Refresh points
      refreshProfile()

    } catch (error) {
      console.error('Error ordering:', error)
      const message = error instanceof Error ? error.message : '点餐失败，请稍后重试'
      alert(message)
    }
  }

  useEffect(() => {
    if (familyLoading) return

    if (!isDemo && !familyId) {
      // Not demo and no family -> check if logged in handled by useFamily/Auth, 
      // but here we specifically need family. 
      // We'll redirect to Onboarding.
      // Note: useFamily might return null familyId if just logged in but no family.
      router.replace('/onboarding')
      return
    }

    fetchMenu()
  }, [familyId, isDemo, familyLoading, fetchMenu, router])

  if (familyLoading) {
    return (
        <div className="min-h-screen bg-neo-bg flex items-center justify-center">
            <div className="animate-spin text-4xl">🍳</div>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-neo-bg p-4 sm:p-8 pb-24" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)' }}>
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Config Warning Banner */}
        {isDemo && (
          <div className="bg-neo-yellow border-2 border-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-start gap-3 animate-in slide-in-from-top-4">
            <AlertCircle className="h-6 w-6 shrink-0" />
            <div>
              <h3 className="font-bold text-lg">数据库未连接 (Database Not Connected)</h3>
              <p className="text-sm mt-1">
                当前显示为演示数据。请在 <code>.env.local</code> 中配置 Supabase 环境变量以启用完整功能。
                <br/>
                Currently showing demo data. Please configure Supabase env vars to enable full functionality.
              </p>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-8 right-8 z-50 bg-accent text-accent-foreground border-2 border-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-in slide-in-from-bottom-4 font-bold flex items-center gap-2">
            <span className="text-xl">✅</span>
            {toastMessage}
          </div>
        )}

        {/* Header Removed - Now in Layout */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black border-b-4 border-accent inline-block pb-1">
              Bistro Us & Me
            </h1>
            <p className="text-gray-500 font-bold mt-2 text-sm sm:text-base">家庭小餐馆 · 今天吃什么？</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <Link href="/profile">
              <div className="bg-neo-yellow px-4 py-2 rounded-xl border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center leading-none hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none cursor-pointer transition-all">
                 <span className="text-xs text-black/60">Balance</span>
                 <span className="text-lg">{points} pts</span>
              </div>
            </Link>
            <Link href="/chores">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none bg-accent text-accent-foreground hover:bg-accent/90"
                title="赚取积分 (Earn Points)"
              >
                <Sparkles className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/kitchen">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none bg-white"
                title="后厨管理 (Kitchen)"
              >
                <ChefHat className="h-5 w-5" />
              </Button>
            </Link>
            <AddDishDialog 
              onSuccess={fetchMenu} 
              defaultIsWish={false} 
              trigger={
                <Button className="basis-full sm:basis-auto h-10 w-full sm:w-auto bg-accent text-accent-foreground border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all rounded-xl font-bold">
                  <Sparkles className="mr-2 h-5 w-5" />
                  新增菜品 (Add Dish)
                </Button>
              }
            />
          </div>
        </div>

        {/* Menu Grid */}
        {menuLoading ? (
          <div className="text-center py-12 font-bold text-xl animate-pulse">
            加载菜单中... (Loading Menu)
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {items.map(item => (
              <MenuCard 
                key={item.id} 
                item={item} 
                onDelete={isDemo ? undefined : handleDelete}
                onEdit={isDemo ? undefined : fetchMenu}
                onOrder={handleOrder}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
