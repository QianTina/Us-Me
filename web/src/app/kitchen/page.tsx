'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useFamily } from '@/hooks/useFamily'
import { MenuItem } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, ChefHat, Clock, X, RefreshCw, Trash2, User as UserIcon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Define Order type locally
interface Order {
  id: string
  created_at: string
  status: 'pending' | 'cooking' | 'completed' | 'cancelled'
  quantity: number
  total_price: number
  user_id: string
  note?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  menu_items: any
  user?: {
    username: string | null
    avatar_url: string | null
  }
}

export default function KitchenPage() {
  const router = useRouter()
  const { familyId, isDemo, loading: familyLoading } = useFamily()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    if (familyLoading) return
    setLoading(true)
    
    if (isDemo) {
       // Mock data for demo
       setOrders([
         {
           id: '1',
           created_at: new Date().toISOString(),
           status: 'pending',
           quantity: 1,
           total_price: 50,
           user_id: 'demo-user-1',
           user: { username: 'Alice', avatar_url: '👩' },
           menu_items: { 
             id: 'm1', 
             name: '红烧肉 (Demo)', 
             price: 50, 
             family_id: 'demo', 
             image_url: null, 
             tags: [], 
             is_public: true, 
             created_at: '' 
           }
         },
         {
           id: '2',
           created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
           status: 'cooking',
           quantity: 2,
           total_price: 40,
           user_id: 'demo-user-2',
           user: { username: 'Bob', avatar_url: '👨' },
           menu_items: { 
             id: 'm2', 
             name: '番茄炒蛋 (Demo)', 
             price: 20, 
             family_id: 'demo', 
             image_url: null, 
             tags: [], 
             is_public: true, 
             created_at: '' 
           }
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
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching orders:', error)
      } else {
        // Safe cast as we know the join structure
        const ordersData = data as unknown as Order[]
        
        // Fetch user profiles to display who ordered
        // Validate UUIDs to prevent 400 Bad Request errors from invalid IDs
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const userIds = Array.from(new Set(
            ordersData
                .map(o => o.user_id)
                .filter(id => id && uuidRegex.test(id))
        ));
        
        if (userIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, username, avatar_url')
                .in('id', userIds)
            
            const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
            
            ordersData.forEach(o => {
                if (o.user_id && profileMap.has(o.user_id)) {
                    o.user = profileMap.get(o.user_id) as { username: string | null, avatar_url: string | null }
                }
            })
        }

        setOrders(ordersData)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
    } finally {
      setLoading(false)
    }
  }, [familyLoading, isDemo, familyId])

  const updateStatus = async (id: string, status: Order['status']) => {
    // Optimistic update
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))

    if (isDemo) return

    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
    
    if (error) {
      console.error('Error updating status:', error)
      // Revert on error would be better, but simple refresh for now
      fetchOrders()
    }
  }

  const deleteOrder = async (id: string) => {
    if (!confirm('确定要删除这个订单记录吗？')) return
    
    // Optimistic update
    setOrders(prev => prev.filter(o => o.id !== id))

    if (isDemo) return

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)
    
    if (error) {
        console.error('Error deleting order:', error)
        fetchOrders()
    }
  }

  useEffect(() => {
    if (familyLoading) return

    if (!isDemo && !familyId) {
        router.replace('/onboarding')
        return
    }

    fetchOrders()

    if (isDemo) return

    // Realtime Subscription
    const channel = supabase
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          console.log('Realtime update:', payload)
          // Simple strategy: refetch all orders to ensure consistency and correct sorting
          // Optimization: could manually update state based on payload (INSERT/UPDATE/DELETE)
          fetchOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [familyId, isDemo, familyLoading, fetchOrders, router])

  // Helper to filter orders
  const pendingOrders = orders.filter(o => o.status === 'pending')
  const cookingOrders = orders.filter(o => o.status === 'cooking')
  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'cancelled')

  return (
    <div className="min-h-screen bg-neo-bg p-4 sm:p-8">
      {/* Header Removed - Now in Layout */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
           <div>
             <h1 className="text-3xl sm:text-4xl font-black border-b-4 border-neo-green inline-block pb-1">
              Kitchen View
            </h1>
            <p className="text-gray-500 font-bold mt-2 text-sm sm:text-base">后厨 & 愿望清单 · 这里的每个人都是大厨 👨‍🍳👩‍🍳</p>
           </div>
        </div>
        <Button 
          onClick={fetchOrders}
          className="w-full sm:w-auto bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black font-bold"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          刷新 (Refresh)
        </Button>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Mobile Tabs View */}
        <div className="md:hidden">
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 h-auto p-1 bg-black/5 border-2 border-black/10 rounded-xl">
              <TabsTrigger 
                value="pending" 
                className="data-[state=active]:bg-neo-yellow data-[state=active]:text-black font-bold py-2 rounded-lg data-[state=active]:border-2 data-[state=active]:border-black data-[state=active]:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                待处理 ({pendingOrders.length})
              </TabsTrigger>
              <TabsTrigger 
                value="cooking" 
                className="data-[state=active]:bg-orange-400 data-[state=active]:text-black font-bold py-2 rounded-lg data-[state=active]:border-2 data-[state=active]:border-black data-[state=active]:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                进行中 ({cookingOrders.length})
              </TabsTrigger>
              <TabsTrigger 
                value="completed" 
                className="data-[state=active]:bg-neo-green data-[state=active]:text-black font-bold py-2 rounded-lg data-[state=active]:border-2 data-[state=active]:border-black data-[state=active]:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                历史
              </TabsTrigger>
            </TabsList>
            <TabsContent value="pending">
               <OrderColumn 
                  title="待处理" 
                  icon={<Clock className="h-6 w-6 text-neo-yellow fill-neo-yellow text-black" />} 
                  orders={pendingOrders} 
                  type="pending"
                  onUpdateStatus={updateStatus}
                  onDelete={deleteOrder}
               />
            </TabsContent>
            <TabsContent value="cooking">
               <OrderColumn 
                  title="进行中" 
                  icon={<ChefHat className="h-6 w-6 text-orange-500" />} 
                  orders={cookingOrders} 
                  type="cooking"
                  onUpdateStatus={updateStatus}
                  onDelete={deleteOrder}
               />
            </TabsContent>
            <TabsContent value="completed">
               <OrderColumn 
                  title="历史记录" 
                  icon={<Check className="h-6 w-6 text-neo-green" />} 
                  orders={completedOrders.slice(0, 10)} 
                  type="completed"
                  onUpdateStatus={updateStatus}
                  onDelete={deleteOrder}
               />
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop Grid View */}
        <div className="hidden md:grid grid-cols-3 gap-8">
           <OrderColumn 
              title="待处理" 
              icon={<Clock className="h-6 w-6 text-neo-yellow fill-neo-yellow text-black" />} 
              orders={pendingOrders} 
              type="pending"
              onUpdateStatus={updateStatus}
              onDelete={deleteOrder}
           />
           <OrderColumn 
              title="进行中" 
              icon={<ChefHat className="h-6 w-6 text-orange-500" />} 
              orders={cookingOrders} 
              type="cooking"
              onUpdateStatus={updateStatus}
              onDelete={deleteOrder}
           />
           <OrderColumn 
              title="历史记录" 
              icon={<Check className="h-6 w-6 text-neo-green" />} 
              orders={completedOrders.slice(0, 10)} 
              type="completed"
              onUpdateStatus={updateStatus}
              onDelete={deleteOrder}
           />
        </div>
      </div>
    </div>
  )
}

function OrderColumn({ 
  title, 
  icon, 
  orders, 
  type, 
  onUpdateStatus, 
  onDelete 
}: { 
  title: string, 
  icon: React.ReactNode, 
  orders: Order[], 
  type: 'pending' | 'cooking' | 'completed',
  onUpdateStatus: (id: string, status: Order['status']) => void,
  onDelete: (id: string) => void
}) {
  const bgColor = type === 'pending' ? 'bg-neo-yellow/20' : type === 'cooking' ? 'bg-orange-100' : 'bg-gray-100'
  const emptyText = type === 'pending' ? '暂无新订单' : type === 'cooking' ? '空闲中...' : '还没有完成的记录'

  return (
    <div className="space-y-4">
      <h2 className={`text-2xl font-black flex items-center gap-2 ${bgColor} p-2 rounded-lg border-2 border-black/10`}>
        {icon}
        {title} <span className="text-base opacity-60 ml-auto md:ml-0">({orders.length})</span>
      </h2>
      {orders.map(order => {
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         const item = Array.isArray(order.menu_items) && order.menu_items.length > 0 ? order.menu_items[0] : (order.menu_items || {})
         const isWish = item.tags?.includes('system:wish')
         let actions = null
         
         if (type === 'pending') {
           actions = (
              <>
                <Button 
                  size="sm"
                  onClick={() => onUpdateStatus(order.id, 'cooking')}
                  className="bg-neo-yellow text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none font-bold flex-1"
                >
                  <ChefHat className="mr-2 h-4 w-4" /> {isWish ? '接受愿望' : '接单'}
                </Button>
                <Button 
                  size="sm"
                  variant="destructive"
                  onClick={() => onUpdateStatus(order.id, 'cancelled')}
                  className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none font-bold"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
           )
         } else if (type === 'cooking') {
           actions = (
              <Button 
                size="sm"
                onClick={() => onUpdateStatus(order.id, 'completed')}
                className="w-full bg-neo-green text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none font-bold"
              >
                <Check className="mr-2 h-4 w-4" /> {isWish ? '愿望达成' : '上菜 / 完成'}
              </Button>
           )
         } else {
           actions = (
             <Button 
                size="icon"
                variant="ghost"
                onClick={() => onDelete(order.id)}
                className="h-6 w-6 text-gray-400 hover:text-red-500"
             >
               <Trash2 className="h-4 w-4" />
             </Button>
           )
         }

         return (
           <OrderCard 
             key={order.id} 
             order={order} 
             actions={actions}
             isCompleted={type === 'completed'} 
           />
         )
      })}
      {orders.length === 0 && <EmptyState text={emptyText} />}
    </div>
  )
}

function OrderCard({ order, actions, isCompleted = false }: { order: Order, actions?: React.ReactNode, isCompleted?: boolean }) {
  // Safe check for menu_items in case of data integrity issues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const item = Array.isArray(order.menu_items) && order.menu_items.length > 0 ? order.menu_items[0] : (order.menu_items || {})
  
  const dishName = item.name || '未知项目 (Unknown)'
  const dishPrice = item.price || order.total_price || 0
  const isWish = item.tags?.includes('system:wish')

  return (
    <Card className={`border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${isCompleted ? 'bg-gray-50 opacity-75 hover:opacity-100' : 'bg-white hover:-translate-y-1'}`}>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-lg font-bold flex justify-between items-start gap-2">
          <span className="truncate leading-tight flex items-center gap-2">
            {isWish && <span title="愿望券">🎁</span>}
            {dishName}
          </span>
          <span className="text-sm bg-black text-white px-2 py-1 rounded shrink-0">x{order.quantity}</span>
        </CardTitle>
        <div className="text-xs text-gray-500 font-bold flex justify-between items-center mt-1">
          <div className="flex items-center gap-2">
            <span>{new Date(order.created_at).toLocaleTimeString()}</span>
            {order.user && (
                <div className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded border border-black/10" title={order.user.username || 'Unknown User'}>
                    <span className="text-xs">{order.user.avatar_url || <UserIcon className="h-3 w-3" />}</span>
                    <span className="truncate max-w-[60px]">{order.user.username || 'User'}</span>
                </div>
            )}
          </div>
          {isCompleted && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] border border-black ${order.status === 'completed' ? 'bg-neo-green' : 'bg-red-200'}`}>
              {order.status === 'completed' ? '已完成' : '已取消'}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="flex justify-between items-center mb-4">
           <span className="font-bold text-lg">{dishPrice * order.quantity} pts</span>
        </div>
        {(actions || !isCompleted) && (
            <div className={`flex gap-2 items-center ${isCompleted ? 'justify-end' : ''}`}>
                {actions}
            </div>
        )}
      </CardContent>
    </Card>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="border-2 border-dashed border-gray-400 rounded-xl p-8 text-center text-gray-400 font-bold bg-white/50">
      {text}
    </div>
  )
}
