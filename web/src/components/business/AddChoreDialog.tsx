'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useFamily } from '@/hooks/useFamily'

interface AddChoreDialogProps {
  onSuccess?: () => void
  choreToEdit?: {
    id: string
    title: string
    points: number
    emoji: string
  }
  trigger?: React.ReactNode
}

export function AddChoreDialog({ onSuccess, choreToEdit, trigger }: AddChoreDialogProps) {
  const { familyId } = useFamily()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState(choreToEdit?.title || '')
  const [points, setPoints] = useState(choreToEdit?.points.toString() || '50')
  const [emoji, setEmoji] = useState(choreToEdit?.emoji || '🧹')

  useEffect(() => {
    if (open && choreToEdit) {
      setTitle(choreToEdit.title)
      setPoints(choreToEdit.points.toString())
      setEmoji(choreToEdit.emoji)
    } else if (open && !choreToEdit) {
      // Reset only if not editing
      if (!title) setTitle('')
      if (!points) setPoints('50')
      if (!emoji) setEmoji('🧹')
    }
  }, [open, choreToEdit, title, points, emoji])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!familyId) {
        alert('无法获取家庭信息 (Family ID missing)')
        setLoading(false)
        return
      }

      if (choreToEdit) {
        // Update existing chore
        const { error } = await supabase
          .from('chores')
          .update({
            title,
            points: parseInt(points),
            emoji
          })
          .eq('id', choreToEdit.id)
        
        if (error) throw error
      } else {
        // Insert new chore
        const { error } = await supabase
          .from('chores')
          .insert({
            family_id: familyId,
            title,
            points: parseInt(points),
            emoji
          })
        
        if (error) throw error
      }

      setOpen(false)
      if (!choreToEdit) {
          setTitle('')
          setPoints('50')
          setEmoji('🧹')
      }
      if (onSuccess) onSuccess()

            } catch (error: unknown) {
              console.error('Error saving chore:', error)
              alert((error as Error).message || '保存失败 (Failed to save)')
            } finally {
              setLoading(false)
            }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
            <Button className="bg-neo-purple text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none font-bold">
            <Plus className="mr-2 h-4 w-4" /> 发布任务 (New Chore)
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">{choreToEdit ? '编辑任务 (Edit Chore)' : '发布赚积分任务'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="font-bold">任务名称 (Task Name)</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g. 洗碗"
              className="border-2 border-black focus-visible:ring-0"
              required 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="points" className="font-bold">奖励积分 (Points)</Label>
              <Input 
                id="points" 
                type="number" 
                value={points} 
                onChange={e => setPoints(e.target.value)} 
                className="border-2 border-black focus-visible:ring-0"
                required 
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emoji" className="font-bold">图标 (Emoji)</Label>
              <Input 
                id="emoji" 
                value={emoji} 
                onChange={e => setEmoji(e.target.value)} 
                className="border-2 border-black focus-visible:ring-0 text-center text-2xl"
                required 
                maxLength={2}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-neo-purple text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none font-bold"
          >
            {loading ? <Loader2 className="animate-spin" /> : (choreToEdit ? '保存修改 (Save)' : '发布任务 (Post)')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
