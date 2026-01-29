'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useFamily } from '@/hooks/useFamily'
import { Button } from '@/components/ui/button'
import { MenuCard } from '@/components/business/MenuCard'
import { AddStoreItemDialog } from '@/components/business/AddStoreItemDialog'
import { MenuItem } from '@/types'
import { AlertCircle, Gift, Ticket, WalletCards } from 'lucide-react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface StoreOrder {
  id: string
  menu_items: Array<{
    id: string
    name: string
    price: number
    image_url?: string
    tags?: string[]
  }>
  status: string
  created_at: string
}

export default function StorePage() {
  const router = useRouter()
  const { familyId, isDemo, loading: familyLoading, points, refreshProfile } = useFamily()
  const [items, setItems] = useState<MenuItem[]>([])
  const [myCoupons, setMyCoupons] = useState<StoreOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (familyLoading) return
    setLoading(true)
    
    if (isDemo) {
      setItems([
        { id: '1', family_id: 'demo', name: '按摩券 (Demo)', price: 100, image_url: null, tags: ['store'], is_public: true, created_at: new Date().toISOString() },
        { id: '2', family_id: 'demo', name: '免做家务卡 (Demo)', price: 200, image_url: null, tags: ['store'], is_public: true, created_at: new Date().toISOString() },
      ])
      setMyCoupons([
        { 
          id: 'o1', 
          menu_items: [{ id: '1', name: '按摩券 (Demo)', price: 100, tags: ['store'] }], 
          status: 'pending', 
          created_at: new Date().toISOString() 
        }
      ])
      setLoading(false)
      return
    }

    if (!familyId) {
      setLoading(false)
      return
    }

    try {
      // 1. Fetch Store Items
      const { data: itemsData } = await supabase
        .from('menu_items')
        .select('*')
        .eq('family_id', familyId)
        .contains('tags', ['store']) // Only items with 'store' tag
        .order('created_at', { ascending: false })
      
      setItems(itemsData || [])

      // 2. Fetch My Coupons (Pending Orders)
      // Note: We can't filter by tag in JSONB easily on client without loading all orders or changing DB.
      // We will load pending orders and filter on client side for now.
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('family_id', familyId)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id) // My orders
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      
      // Filter orders that look like coupons (either have 'store' tag in snapshot, or match existing store items)
      // Since place_order logic might not be updated on DB, we rely on matching name/id with store items if tag is missing.
      const storeItemIds = new Set(itemsData?.map(i => i.id))
      const couponOrders = (ordersData || []).filter((order: any) => {
        const item = order.menu_items[0]
        if (!item) return false
        // Check if tag exists in snapshot (if DB updated)
        if (item.tags?.includes('store')) return true
        // Fallback: check if item ID exists in store items list
        if (storeItemIds.has(item.id)) return true
        return false
      })

      setMyCoupons(couponOrders as unknown as StoreOrder[])

    } catch (err) {
      console.error('Error fetching store data:', err)
    } finally {
      setLoading(false)
    }
  }, [familyLoading, isDemo, familyId])

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('删除失败')
    }
  }

  const handleBuy = async (id: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return

    if (!confirm(`确定要花费 ${item.price} 积分兑换 "${item.name}" 吗？`)) return

    if (isDemo) {
      setToastMessage(`兑换成功 (演示): ${item.name}`)
      setTimeout(() => setToastMessage(null), 3000)
      return
    }

    if (item.price > points) {
      alert(`积分不足！\n需要: ${item.price}\n拥有: ${points}`)
      return
    }

    try {
      const { error } = await supabase.rpc('place_order', {
        item_id: id,
        qty: 1
      })

      if (error) throw error

      setToastMessage(`兑换成功！已放入卡包`)
      setTimeout(() => setToastMessage(null), 3000)
      refreshProfile()
      fetchData()

    } catch (error) {
      console.error('Error buying item:', error)
      const message = error instanceof Error ? error.message : '兑换失败'
      alert(message)
    }
  }

  const handleUseCoupon = async (order: StoreOrder) => {
    if (!confirm(`确定要使用 "${order.menu_items[0].name}" 吗？\n这将把状态标记为已完成。`)) return

    try {
      // We use 'completed' status to mean 'Used/Redeemed'
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', order.id)

      if (error) throw error

      setToastMessage(`使用成功！享受你的权益吧！`)
      setTimeout(() => setToastMessage(null), 3000)
      fetchData()
    } catch (error) {
      console.error('Error using coupon:', error)
      alert('操作失败')
    }
  }

  useEffect(() => {
    if (familyLoading) return
    if (!isDemo && !familyId) {
      router.replace('/onboarding')
      return
    }
    fetchData()
  }, [familyId, isDemo, familyLoading, fetchData, router])

  if (familyLoading) {
    return (
        <div className="min-h-screen bg-neo-bg flex items-center justify-center">
            <div className="animate-spin text-4xl">🎁</div>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-neo-bg p-4 sm:p-8 pb-24" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)' }}>
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Config Warning */}
        {isDemo && (
          <div className="bg-neo-yellow border-2 border-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-start gap-3">
            <AlertCircle className="h-6 w-6 shrink-0" />
            <div>
              <h3 className="font-bold text-lg">演示模式 (Demo Mode)</h3>
              <p className="text-sm">当前仅展示演示数据。</p>
            </div>
          </div>
        )}

        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-8 right-8 z-50 bg-neo-pink text-black border-2 border-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-in slide-in-from-bottom-4 font-bold flex items-center gap-2">
            <span className="text-xl">🎉</span>
            {toastMessage}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black border-b-4 border-neo-pink inline-block pb-1">
              Store & Coupons
            </h1>
            <p className="text-gray-500 font-bold mt-2 text-sm sm:text-base">积分兑换商城 · 犒劳一下自己</p>
          </div>
          <div className="flex items-center gap-3">
             <Link href="/profile">
              <div className="bg-neo-yellow px-4 py-2 rounded-xl border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center leading-none hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none cursor-pointer transition-all">
                 <span className="text-xs text-black/60">Balance</span>
                 <span className="text-lg">{points} pts</span>
              </div>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="shop" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 h-auto p-1 bg-black/5 border-2 border-black/10 rounded-xl">
                <TabsTrigger value="shop" className="data-[state=active]:bg-neo-pink data-[state=active]:text-black font-bold py-3 rounded-lg data-[state=active]:border-2 data-[state=active]:border-black data-[state=active]:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                    🛍️ 商城 (Shop)
                </TabsTrigger>
                <TabsTrigger value="wallet" className="data-[state=active]:bg-neo-yellow data-[state=active]:text-black font-bold py-3 rounded-lg data-[state=active]:border-2 data-[state=active]:border-black data-[state=active]:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                    🎫 卡包 ({myCoupons.length})
                </TabsTrigger>
            </TabsList>

            <TabsContent value="shop" className="space-y-6">
                <div className="flex justify-end">
                    <AddStoreItemDialog onSuccess={fetchData} />
                </div>

                {loading ? (
                    <div className="text-center py-12 font-bold text-xl animate-pulse">
                        加载商品中...
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 font-bold bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl">
                        商城空空如也，快去上架一些好东西吧！
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {items.map(item => (
                            <MenuCard 
                                key={item.id} 
                                item={item} 
                                onDelete={isDemo ? undefined : handleDelete}
                                onEdit={isDemo ? undefined : fetchData}
                                onOrder={handleBuy}
                                actionLabel="兑换"
                                themeColor="neo-pink"
                                EditComponent={AddStoreItemDialog}
                            />
                        ))}
                    </div>
                )}
            </TabsContent>

            <TabsContent value="wallet">
                {myCoupons.length === 0 ? (
                    <div className="text-center py-12 flex flex-col items-center gap-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl">
                        <WalletCards className="h-12 w-12 text-gray-300" />
                        <div className="text-gray-500 font-bold">
                            卡包里还没有券哦，快去商城兑换吧！
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {myCoupons.map(order => (
                            <div key={order.id} className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl p-4 flex flex-col justify-between min-h-[160px] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 bg-neo-yellow px-3 py-1 font-bold text-xs border-l-2 border-b-2 border-black rounded-bl-xl z-10">
                                    UNUSED
                                </div>
                                <div className="flex items-start gap-4 z-0">
                                    <div className="h-16 w-16 bg-gray-100 rounded-xl border-2 border-black flex items-center justify-center text-3xl shrink-0 overflow-hidden">
                                        {order.menu_items[0].image_url ? (
                                            <img src={order.menu_items[0].image_url} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            '🎫'
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-xl leading-tight mb-1">{order.menu_items[0].name}</h3>
                                        <p className="text-sm text-gray-500 font-bold">
                                            {new Date(order.created_at).toLocaleDateString()} 兑换
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="border-t-2 border-dashed border-gray-200 my-4 relative">
                                    <div className="absolute -left-6 -top-3 h-6 w-6 bg-neo-bg rounded-full border-r-2 border-black"></div>
                                    <div className="absolute -right-6 -top-3 h-6 w-6 bg-neo-bg rounded-full border-l-2 border-black"></div>
                                </div>

                                <Button 
                                    onClick={() => handleUseCoupon(order)}
                                    className="w-full bg-black text-white hover:bg-gray-800 border-2 border-black rounded-xl font-bold"
                                >
                                    立即使用 (Use Now)
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
