'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useFamily } from '@/hooks/useFamily'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AddChoreDialog } from '@/components/business/AddChoreDialog'
import { Trash2, ThumbsUp, XCircle, Pencil } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Chore {
  id: string
  title: string
  points: number
  emoji: string
  family_id: string
}

interface ChoreLog {
  id: string
  title: string
  points: number
  status: 'pending' | 'approved' | 'rejected'
  applicant_id: string
  created_at: string
}

export default function ChoresPage() {
  const router = useRouter()
  const { familyId, userId, isDemo, loading: familyLoading, refreshProfile } = useFamily()
  const [chores, setChores] = useState<Chore[]>([])
  const [logs, setLogs] = useState<ChoreLog[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (familyLoading) return
    setLoading(true)

    if (isDemo) {
        setChores([
            { id: '1', title: '洗碗 (Demo)', points: 50, emoji: '🍽️', family_id: 'demo' },
            { id: '2', title: '倒垃圾 (Demo)', points: 30, emoji: '🗑️', family_id: 'demo' },
        ])
        setLogs([
            { id: 'l1', title: '洗碗', points: 50, status: 'pending', applicant_id: 'me', created_at: new Date().toISOString() },
            { id: 'l2', title: '按摩', points: 100, status: 'approved', applicant_id: 'partner', created_at: new Date().toISOString() },
        ])
        setLoading(false)
        return
    }

    if (!familyId) {
        setLoading(false)
        return
    }

    try {
      // Fetch Chores
      const { data: choresData } = await supabase
        .from('chores')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
      
      setChores(choresData || [])

      // Fetch Logs (Approval Queue)
      const { data: logsData } = await supabase
        .from('chore_logs')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .limit(20)

      setLogs(logsData as unknown as ChoreLog[] || [])

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [familyLoading, isDemo, familyId])

  const handleSubmit = async (chore: Chore) => {
    setProcessingId(chore.id)

    if (isDemo) {
        alert('演示模式：已提交申请！')
        setProcessingId(null)
        return
    }

    try {
        const { error } = await supabase.rpc('submit_chore', {
            chore_id: chore.id,
            title: chore.title,
            points: chore.points,
            emoji: chore.emoji
        })

        if (error) throw error

        alert('已提交申请，等待对方审批！(Submitted for approval)')
        fetchData() // Refresh logs

    } catch (error) {
        console.error('Error submitting chore:', error)
        const message = error instanceof Error ? error.message : '操作失败'
        alert(message)
    } finally {
        setProcessingId(null)
    }
  }

  const handleApprove = async (log: ChoreLog) => {
    if (!confirm(`确认批准 "${log.title}" (+${log.points} pts) 吗？`)) return
    
    try {
        const { error } = await supabase.rpc('approve_chore', {
            log_id: log.id
        })
        if (error) throw error
        fetchData()
        refreshProfile()
    } catch (error) {
        console.error('Error approving chore:', error)
        const message = error instanceof Error ? error.message : '审批失败'
        alert(message)
    }
  }

  const handleReject = async (log: ChoreLog) => {
    if (!confirm(`确认拒绝这个申请吗？`)) return
    
    try {
        const { error } = await supabase.rpc('reject_chore', {
            log_id: log.id
        })
        if (error) throw error
        fetchData()
    } catch (error) {
        console.error('Error rejecting chore:', error)
        const message = error instanceof Error ? error.message : '操作失败'
        alert(message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个任务吗？')) return

    try {
        const { error } = await supabase
            .from('chores')
            .delete()
            .eq('id', id)
        
        if (error) throw error
        fetchData()
    } catch (error) {
        console.error('Error deleting chore:', error)
        alert('删除失败')
    }
  }

  useEffect(() => {
    if (familyLoading) return
    if (!isDemo && !familyId) {
        router.replace('/onboarding')
        return
    }
    fetchData()

    if (isDemo) return

    // Realtime Subscription for Chore Logs
    const channel = supabase
      .channel('chores-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chore_logs',
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
            console.log('Chore log update:', payload)
            // Refetch data to update the UI
            fetchData()
        }
      )
      .subscribe()

    return () => {
        supabase.removeChannel(channel)
    }
  }, [familyId, isDemo, familyLoading, fetchData, router])

  if (familyLoading) {
    return (
        <div className="min-h-screen bg-neo-bg flex items-center justify-center">
            <div className="animate-spin text-4xl">🧹</div>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-neo-bg p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Removed - Now in Layout */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl sm:text-4xl font-black border-b-4 border-accent inline-block pb-1">
                赚取积分 (Earn)
                </h1>
            </div>
            <p className="text-gray-500 font-bold text-sm sm:text-base">做家务，换积分，吃大餐！</p>
          </div>
          <AddChoreDialog 
            onSuccess={fetchData} 
            trigger={
              <Button className="w-full sm:w-auto bg-accent text-accent-foreground border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all rounded-xl font-bold">
                + 发布任务 (New Chore)
              </Button>
            }
          />
        </div>

        {/* Mobile Tabs View (< md) */}
        <div className="md:hidden">
            <Tabs defaultValue="tasks" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 h-auto p-1 bg-black/5 border-2 border-black/10 rounded-xl">
                    <TabsTrigger value="tasks" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground font-bold py-3 rounded-lg data-[state=active]:border-2 data-[state=active]:border-black data-[state=active]:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                        📋 任务 ({chores.length})
                    </TabsTrigger>
                    <TabsTrigger value="approval" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground font-bold py-3 rounded-lg data-[state=active]:border-2 data-[state=active]:border-black data-[state=active]:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                        👀 审批 ({logs.filter(l => l.status === 'pending').length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="tasks">
                    <TasksGrid 
                        chores={chores} 
                        loading={loading} 
                        processingId={processingId} 
                        onSubmit={handleSubmit} 
                        onDelete={handleDelete}
                        fetchData={fetchData}
                    />
                </TabsContent>

                <TabsContent value="approval">
                    <ApprovalList 
                        logs={logs} 
                        userId={userId} 
                        onApprove={handleApprove} 
                        onReject={handleReject} 
                    />
                </TabsContent>
            </Tabs>
        </div>

        {/* Desktop Split View (>= md) */}
        <div className="hidden md:grid md:grid-cols-12 gap-8">
            <div className="col-span-8">
                <div className="flex items-center gap-2 mb-4">
                    <div className="bg-accent text-accent-foreground p-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <span className="text-xl">📋</span>
                    </div>
                    <h2 className="text-2xl font-black">任务列表 (Tasks)</h2>
                    <span className="bg-black text-white px-2 py-1 rounded-full text-sm font-bold ml-auto">
                        {chores.length}
                    </span>
                </div>
                <TasksGrid 
                    chores={chores} 
                    loading={loading} 
                    processingId={processingId} 
                    onSubmit={handleSubmit} 
                    onDelete={handleDelete}
                    fetchData={fetchData}
                />
            </div>
            
            <div className="col-span-4">
                <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 sticky top-8">
                    <div className="flex items-center gap-2 mb-4 border-b-2 border-black/10 pb-2">
                        <div className="bg-accent text-accent-foreground p-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <span className="text-xl">👀</span>
                        </div>
                        <h2 className="text-xl font-black">审批记录 (Approval)</h2>
                    </div>
                    <ApprovalList 
                        logs={logs} 
                        userId={userId} 
                        onApprove={handleApprove} 
                        onReject={handleReject} 
                    />
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}

// Sub-components to avoid duplication
function TasksGrid({ chores, loading, processingId, onSubmit, onDelete, fetchData }: { 
    chores: Chore[], 
    loading: boolean, 
    processingId: string | null,
    onSubmit: (chore: Chore) => void,
    onDelete: (id: string) => void,
    fetchData: () => void
}) {
    if (loading) {
        return (
            <div className="text-center py-12 font-bold text-xl animate-pulse">
                加载任务中... (Loading Tasks)
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {chores.map(chore => (
            <Card key={chore.id} className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white hover:-translate-y-1 transition-transform duration-300 relative group">
                <div className="absolute top-2 right-2 flex gap-1 z-10">
                        <AddChoreDialog 
                        choreToEdit={chore}
                        onSuccess={fetchData}
                        trigger={
                            <button 
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 border-2 border-transparent hover:border-black transition-all"
                                title="编辑任务"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </button>
                        }
                        />
                    <button 
                        onClick={(e) => {
                            e.stopPropagation()
                            onDelete(chore.id)
                        }}
                        className="p-1.5 hover:bg-red-100 rounded-full text-red-500 border-2 border-transparent hover:border-black transition-all"
                        title="删除任务"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>

                <CardHeader className="text-center pb-2 pt-8">
                    <div className="text-5xl mb-2">{chore.emoji}</div>
                    <CardTitle className="text-lg font-black leading-tight">{chore.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-3 pb-4">
                    <div className="text-accent font-black text-2xl">
                        +{chore.points} pts
                    </div>
                    <Button 
                        onClick={() => onSubmit(chore)}
                        disabled={!!processingId}
                        size="sm"
                        className="w-full bg-accent text-accent-foreground border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none font-bold"
                    >
                        {processingId === chore.id ? '...' : '申请 (Apply)'}
                    </Button>
                </CardContent>
            </Card>
            ))}
            
            {chores.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500 font-bold border-2 border-dashed border-gray-300 rounded-xl">
                    还没有任务哦，快去发布一个吧！
                </div>
            )}
        </div>
    )
}

function ApprovalList({ logs, userId, onApprove, onReject }: {
    logs: ChoreLog[],
    userId: string | null,
    onApprove: (log: ChoreLog) => void,
    onReject: (log: ChoreLog) => void
}) {
    return (
        <div className="space-y-3">
            {logs.map(log => (
                <div key={log.id} className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <div className="font-bold text-sm truncate pr-2">
                            {log.title}
                        </div>
                        <div className="flex items-center gap-1">
                            {userId && log.applicant_id === userId && (
                                <span className="text-[10px] bg-black text-white px-1 rounded">ME</span>
                            )}
                            <span className="font-black text-accent shrink-0">+{log.points}</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border border-black ${
                                log.status === 'pending' ? 'bg-yellow-200' :
                                log.status === 'approved' ? 'bg-green-200' : 'bg-red-200'
                            }`}>
                                {log.status.toUpperCase()}
                            </span>
                            <span className="text-[10px] text-gray-400">
                                {new Date(log.created_at).toLocaleDateString()}
                            </span>
                        </div>

                        {log.status === 'pending' && (
                            <div className="flex items-center gap-1">
                                <Button size="icon" variant="ghost" onClick={() => onApprove(log)} className="h-7 w-7 bg-accent text-accent-foreground border border-black hover:bg-accent/80" title="批准">
                                    <ThumbsUp className="h-3 w-3" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => onReject(log)} className="h-7 w-7 bg-red-200 border border-black hover:bg-red-300" title="拒绝">
                                    <XCircle className="h-3 w-3" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {logs.length === 0 && (
                <div className="text-center py-8 text-gray-400 font-bold text-sm">
                    暂无审批记录
                </div>
            )}
        </div>
    )
}
