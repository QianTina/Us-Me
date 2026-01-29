'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { useFamily } from '@/hooks/useFamily'
import { Loader2, Gift } from 'lucide-react'

interface AddWishDialogProps {
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function AddWishDialog({ trigger, onSuccess }: AddWishDialogProps) {
  const { familyId, userId, isDemo } = useFamily()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!content.trim()) {
        alert('请输入愿望内容')
        return
      }

      if (isDemo) {
        alert('演示模式不支持写入数据库')
        setOpen(false)
        setContent('')
        onSuccess?.()
        return
      }

      if (!familyId || !userId) {
        alert('缺少家庭或用户信息')
        return
      }

      const { error } = await supabase
        .from('posts')
        .insert({
          family_id: familyId,
          owner_id: userId,
          type: 'wish',
          content: content.trim(),
          visibility: 'private',
        })

      if (error) throw error

      setOpen(false)
      setContent('')
      onSuccess?.()
    } catch (err) {
      console.error('提交失败:', err)
      alert('提交失败，请检查控制台')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-accent text-accent-foreground border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl font-bold">
            <Gift className="mr-2 h-5 w-5" />
            许个愿
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white rounded-2xl sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">我的心愿单</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="content" className="font-bold">愿望</Label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-32 border-2 border-black rounded-xl p-3"
              placeholder="想要的礼物、想去的地方..."
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-accent text-accent-foreground border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl font-bold mt-2">
            {loading ? <Loader2 className="animate-spin" /> : '保存'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
