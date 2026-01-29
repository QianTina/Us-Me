'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useFamily } from '@/hooks/useFamily'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Pencil, Check, X, LogOut, Copy, History, Wallet, BarChart3, Home } from 'lucide-react'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface OrderHistory {
  id: string
  created_at: string
  total_price: number
  status: string
  menu_items: {
    name: string
    image_url: string | null
  }
}

interface EarningHistory {
  id: string
  created_at: string
  points: number
  title: string
  emoji: string
}

interface StatsData {
  totalIncome: number
  totalExpense: number
  topChores: { title: string; count: number; points: number }[]
  topDishes: { name: string; count: number; cost: number }[]
}

export default function ProfilePage() {
  const router = useRouter()
  const { familyId, userId, points, profile, family, isDemo, loading: familyLoading, refreshProfile } = useFamily()
  const [orders, setOrders] = useState<OrderHistory[]>([])
  const [earnings, setEarnings] = useState<EarningHistory[]>([])
  const [stats, setStats] = useState<StatsData>({ totalIncome: 0, totalExpense: 0, topChores: [], topDishes: [] })
  const [members, setMembers] = useState<{ id: string; username: string; avatar_url: string; points: number }[]>([])
  const [loading, setLoading] = useState(true)
  
  // Family Name Edit State
  const [isEditingName, setIsEditingName] = useState(false)
  const [newFamilyName, setNewFamilyName] = useState('')

  useEffect(() => {
    if (family?.name) {
        setNewFamilyName(family.name)
    }
  }, [family])

  const handleUpdateFamilyName = async () => {
    if (!newFamilyName.trim()) return
    
    try {
        const { error } = await supabase.rpc('update_family_name', {
            new_name: newFamilyName.trim()
        })
        
        if (error) throw error
        
        await refreshProfile()
        setIsEditingName(false)
        alert('家庭名称已更新 (Family name updated)')
    } catch (error: unknown) {
        console.error('Error updating family name:', error)
        const message = error instanceof Error ? error.message : 'Unknown error'
        alert('更新失败: ' + message)
    }
  }

  const handleSignOut = async () => {
    if (isDemo) {
        alert('演示模式无法退出 (Demo mode cannot sign out)')
        return
    }
    await supabase.auth.signOut()
    router.replace('/auth')
  }

  const copyFamilyId = () => {
    if (familyId) {
        navigator.clipboard.writeText(familyId)
        alert('家庭ID已复制 (Family ID copied)')
    }
  }

  const fetchData = useCallback(async () => {
    if (familyLoading) return
    setLoading(true)

    if (isDemo) {
        setOrders([
            { id: '1', created_at: new Date().toISOString(), total_price: 50, status: 'completed', menu_items: { name: '红烧肉', image_url: null } },
            { id: '2', created_at: new Date(Date.now() - 86400000).toISOString(), total_price: 30, status: 'completed', menu_items: { name: '蛋炒饭', image_url: null } },
        ])
        setEarnings([
            { id: '1', created_at: new Date().toISOString(), points: 50, title: '洗碗', emoji: '🍽️' },
        ])
        setLoading(false)
        return
    }

    try {
        // Fetch Orders (History)
        const { data: ordersData, error: ordersError } = await supabase
            .from('orders')
            .select(`
                id, created_at, total_price, status,
                menu_items ( name, image_url )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20)
        
        if (ordersError) throw ordersError

        // Fetch Earnings (History)
        const { data: earningsData, error: earningsError } = await supabase
            .from('chore_logs')
            .select('*')
            .eq('applicant_id', userId)
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .limit(20)

        if (earningsError) throw earningsError

        // Transform data safely
        const formattedOrders = (ordersData || []).map((o) => {
            const items = o.menu_items as unknown as { name: string, image_url: string } | { name: string, image_url: string }[]
            return {
                ...o,
                menu_items: Array.isArray(items) ? items[0] : items
            }
        })

        setOrders(formattedOrders as OrderHistory[])
        setEarnings(earningsData || [])

        // --- Calculate Stats (Fetch more data for accurate stats) ---
        const { data: allOrders } = await supabase
            .from('orders')
            .select('total_price, menu_items (name)')
            .eq('user_id', userId)
            .limit(1000)
        
        const { data: allEarnings } = await supabase
            .from('chore_logs')
            .select('points, title')
            .eq('applicant_id', userId)
            .eq('status', 'approved')
            .limit(1000)

        const totalIncome = allEarnings?.reduce((sum, item) => sum + (item.points || 0), 0) || 0
        const totalExpense = allOrders?.reduce((sum, item) => sum + (item.total_price || 0), 0) || 0

        const choreCounts: Record<string, { count: number, points: number }> = {}
        allEarnings?.forEach(item => {
            if (!choreCounts[item.title]) choreCounts[item.title] = { count: 0, points: 0 }
            choreCounts[item.title].count += 1
            choreCounts[item.title].points += item.points || 0
        })
        const topChores = Object.entries(choreCounts)
            .map(([title, data]) => ({ title, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)

        const dishCounts: Record<string, { count: number, cost: number }> = {}
        allOrders?.forEach(item => {
            const menuItems = item.menu_items as unknown as { name: string } | { name: string }[] | null
            const name = Array.isArray(menuItems) ? menuItems[0]?.name : menuItems?.name
            const finalName = name || 'Unknown'

            if (!dishCounts[finalName]) dishCounts[finalName] = { count: 0, cost: 0 }
            dishCounts[finalName].count += 1
            dishCounts[finalName].cost += item.total_price || 0
        })
        const topDishes = Object.entries(dishCounts)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
            
        setStats({ totalIncome, totalExpense, topChores, topDishes })

        // Fetch Family Members
        if (familyId) {
            const { data: membersData } = await supabase
                .from('profiles')
                .select('id, username, avatar_url, points')
                .eq('family_id', familyId)
            
            if (membersData) {
                setMembers(membersData)
            }
        }

    } catch (error) {
        console.error('Error fetching history:', error)
    } finally {
        setLoading(false)
    }
  }, [familyLoading, isDemo, userId, familyId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (familyLoading) {
    return (
        <div className="min-h-screen bg-neo-bg flex items-center justify-center">
            <div className="animate-spin text-4xl">👤</div>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-neo-bg p-4 sm:p-8 pb-24" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)' }}>
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/">
                <Button variant="ghost" size="icon" className="hover:bg-transparent" title="返回首页 (Home)">
                    <Home className="h-6 w-6" />
                </Button>
            </Link>
            <h1 className="text-4xl font-black border-b-4 border-neo-purple inline-block pb-1">
              个人中心 (Me)
            </h1>
          </div>
          <Button 
            onClick={handleSignOut}
            variant="outline" 
            className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-neo-pink text-black font-bold"
          >
            <LogOut className="h-4 w-4 mr-2" />
            退出 (Exit)
          </Button>
        </header>

        {/* Profile Card */}
        <Card className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
            <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-12">
                <div className="h-24 w-24 rounded-full bg-neo-yellow border-2 border-black flex items-center justify-center text-4xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    {profile?.avatar_url || '👤'}
                </div>
                
                <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        {isEditingName ? (
                            <div className="flex items-center gap-2">
                                <Input 
                                    value={newFamilyName}
                                    onChange={(e) => setNewFamilyName(e.target.value)}
                                    className="border-2 border-black h-8 w-40"
                                />
                                <Button size="icon" onClick={handleUpdateFamilyName} className="h-8 w-8 bg-neo-green border-2 border-black">
                                    <Check className="h-4 w-4" />
                                </Button>
                                <Button size="icon" onClick={() => setIsEditingName(false)} className="h-8 w-8 bg-neo-pink border-2 border-black">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-xl font-black">{family?.name || 'My Family'}</h2>
                                <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-6 w-6"
                                    onClick={() => setIsEditingName(true)}
                                >
                                    <Pencil className="h-3 w-3" />
                                </Button>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded border-2 border-black/10 w-fit cursor-pointer active:scale-95 transition-transform" onClick={copyFamilyId}>
                        <span>ID: {familyId}</span>
                        <Copy className="h-3 w-3" />
                    </div>
                    {family?.invite_code && (
                         <div className="flex items-center gap-2 text-sm text-neo-purple font-bold bg-neo-purple/10 px-2 py-1 rounded border-2 border-neo-purple/20 w-fit">
                            <span>Invite Code: {family.invite_code}</span>
                         </div>
                    )}
                </div>

                <div className="text-center">
                    <div className="text-sm text-gray-500 font-bold mb-1">Current Balance</div>
                    <div className="text-4xl font-black text-neo-green">{points || 0} pts</div>
                </div>
            </CardContent>
        </Card>

        {/* Family Members Section */}
        {members.length > 0 && (
            <div className="space-y-4">
                <h3 className="font-black text-xl flex items-center gap-2">
                    <span className="bg-neo-yellow text-black px-2 py-1 border-2 border-black text-sm">FAMILY</span>
                    家庭成员 (Members)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {members.map(member => (
                        <div key={member.id} className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-neo-green border-2 border-black flex items-center justify-center text-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    {member.avatar_url || '👤'}
                                </div>
                                <div>
                                    <div className="font-bold flex items-center gap-2">
                                        {member.username}
                                        {member.id === userId && <span className="text-xs bg-black text-white px-1 rounded">ME</span>}
                                    </div>
                                    <div className="text-xs text-gray-500 font-bold">ID: {member.id.slice(0, 8)}...</div>
                                </div>
                            </div>
                            <div className="font-black text-neo-purple text-xl">
                                {member.points} pts
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* History Tabs */}
        <Tabs defaultValue="spending" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 h-auto p-1 bg-black/5 border-2 border-black/10 rounded-xl">
                <TabsTrigger value="spending" className="data-[state=active]:bg-neo-pink data-[state=active]:text-black font-bold py-2 sm:py-3 rounded-lg data-[state=active]:border-2 data-[state=active]:border-black data-[state=active]:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2">
                    <Wallet className="w-4 h-4" />
                    <span className="text-sm sm:text-base">消费</span>
                </TabsTrigger>
                <TabsTrigger value="earnings" className="data-[state=active]:bg-neo-green data-[state=active]:text-black font-bold py-2 sm:py-3 rounded-lg data-[state=active]:border-2 data-[state=active]:border-black data-[state=active]:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2">
                    <History className="w-4 h-4" />
                    <span className="text-sm sm:text-base">赚取</span>
                </TabsTrigger>
                <TabsTrigger value="stats" className="data-[state=active]:bg-neo-yellow data-[state=active]:text-black font-bold py-2 sm:py-3 rounded-lg data-[state=active]:border-2 data-[state=active]:border-black data-[state=active]:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-sm sm:text-base">统计</span>
                </TabsTrigger>
            </TabsList>

            <TabsContent value="spending">
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-12">Loading...</div>
                    ) : orders.length > 0 ? (
                        orders.map(order => (
                            <div key={order.id} className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="text-2xl">{'🍽️'}</div>
                                    <div>
                                        <div className="font-bold">{order.menu_items?.name || 'Unknown Item'}</div>
                                        <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString()}</div>
                                    </div>
                                </div>
                                <div className="font-black text-neo-pink text-xl">
                                    -{order.total_price} pts
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-gray-500 font-bold bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            还没有消费记录哦，快去点餐吧！
                        </div>
                    )}
                </div>
            </TabsContent>

            <TabsContent value="earnings">
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-12">Loading...</div>
                    ) : earnings.length > 0 ? (
                        earnings.map(earn => (
                            <div key={earn.id} className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="text-2xl">{earn.emoji || '🧹'}</div>
                                    <div>
                                        <div className="font-bold">{earn.title}</div>
                                        <div className="text-xs text-gray-500">{new Date(earn.created_at).toLocaleString()}</div>
                                    </div>
                                </div>
                                <div className="font-black text-neo-green text-xl">
                                    +{earn.points} pts
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-gray-500 font-bold bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            还没有赚取记录哦，快去接任务吧！
                        </div>
                    )}
                </div>
            </TabsContent>

            <TabsContent value="stats">
                <div className="space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-neo-green/20">
                            <CardContent className="p-4 text-center">
                                <div className="text-sm font-bold text-gray-600 mb-1">总收入 (Income)</div>
                                <div className="text-2xl sm:text-3xl font-black text-neo-green">+{stats.totalIncome}</div>
                            </CardContent>
                        </Card>
                        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-neo-pink/20">
                            <CardContent className="p-4 text-center">
                                <div className="text-sm font-bold text-gray-600 mb-1">总支出 (Expense)</div>
                                <div className="text-2xl sm:text-3xl font-black text-neo-pink">-{stats.totalExpense}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Top Lists */}
                    <div className="grid sm:grid-cols-2 gap-8">
                        {/* Top Chores */}
                        <div className="space-y-4">
                            <h3 className="font-black text-xl flex items-center gap-2">
                                <span className="bg-neo-green text-black px-2 py-1 border-2 border-black text-sm">TOP</span>
                                勤劳榜 (Chores)
                            </h3>
                            {stats.topChores.length > 0 ? (
                                <div className="space-y-3">
                                    {stats.topChores.map((chore, index) => (
                                        <div key={index} className="border-2 border-black p-3 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className={`font-black w-6 h-6 flex items-center justify-center border-2 border-black rounded-full text-xs ${index === 0 ? 'bg-neo-yellow' : 'bg-gray-100'}`}>
                                                        #{index + 1}
                                                    </div>
                                                    <div className="font-bold truncate max-w-[120px]">{chore.title}</div>
                                                </div>
                                                <div className="text-sm font-bold">
                                                    <span className="text-neo-green text-lg">{chore.count}</span> 次
                                                </div>
                                            </div>
                                            {/* Visual Bar */}
                                            <div className="h-3 w-full bg-gray-100 border-2 border-black rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-neo-green border-r-2 border-black" 
                                                    style={{ width: `${(chore.count / Math.max(...stats.topChores.map(c => c.count), 1)) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-gray-500 italic border-2 border-dashed border-gray-300 p-4 text-center rounded">
                                    暂无任务数据 (No chore data)
                                </div>
                            )}
                        </div>

                        {/* Top Dishes */}
                        <div className="space-y-4">
                            <h3 className="font-black text-xl flex items-center gap-2">
                                <span className="bg-neo-pink text-black px-2 py-1 border-2 border-black text-sm">TOP</span>
                                吃货榜 (Dishes)
                            </h3>
                            {stats.topDishes.length > 0 ? (
                                <div className="space-y-3">
                                    {stats.topDishes.map((dish, index) => (
                                        <div key={index} className="border-2 border-black p-3 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className={`font-black w-6 h-6 flex items-center justify-center border-2 border-black rounded-full text-xs ${index === 0 ? 'bg-neo-yellow' : 'bg-gray-100'}`}>
                                                        #{index + 1}
                                                    </div>
                                                    <div className="font-bold truncate max-w-[120px]">{dish.name}</div>
                                                </div>
                                                <div className="text-sm font-bold">
                                                    <span className="text-neo-pink text-lg">{dish.count}</span> 次
                                                </div>
                                            </div>
                                            {/* Visual Bar */}
                                            <div className="h-3 w-full bg-gray-100 border-2 border-black rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-neo-pink border-r-2 border-black" 
                                                    style={{ width: `${(dish.count / Math.max(...stats.topDishes.map(d => d.count), 1)) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-gray-500 italic border-2 border-dashed border-gray-300 p-4 text-center rounded">
                                    暂无点餐数据 (No order data)
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </TabsContent>
        </Tabs>

      </div>
    </div>
  )
}
