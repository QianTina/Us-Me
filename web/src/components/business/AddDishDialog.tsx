'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { MenuItem } from '@/types'
import { useFamily } from '@/hooks/useFamily'

interface AddDishDialogProps {
  item?: MenuItem
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function AddDishDialog({ item, trigger, onSuccess, defaultIsWish = false }: AddDishDialogProps & { defaultIsWish?: boolean }) {
  const { familyId } = useFamily()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('10')
  const [file, setFile] = useState<File | null>(null)
  const [isWish, setIsWish] = useState(defaultIsWish)

  useEffect(() => {
    if (open && item) {
      setName(item.name)
      setPrice(item.price.toString())
      setFile(null)
      setIsWish(item.tags?.includes('system:wish') || false)
    } else if (open && !item) {
      setName('')
      setPrice('10')
      setFile(null)
      setIsWish(defaultIsWish)
    }
  }, [open, item, defaultIsWish])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Upload image if exists
      let imageUrl = item?.image_url || null
      
      if (!familyId) {
        alert('无法获取家庭信息 (Family ID missing)')
        setLoading(false)
        return
      }

      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${familyId}/${Math.random()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('menu-images')
          .upload(fileName, file)

        if (uploadError) throw uploadError
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('menu-images')
          .getPublicUrl(fileName)
          
        imageUrl = publicUrl
      }

      // Prepare tags
      const currentTags = item?.tags?.filter(t => t !== 'system:wish') || []
      const newTags = isWish ? [...currentTags, 'system:wish'] : currentTags

      // 2. Insert or Update database
      if (item) {
        const { error: dbError } = await supabase
          .from('menu_items')
          .update({
            name,
            price: parseInt(price),
            image_url: imageUrl,
            tags: newTags,
          })
          .eq('id', item.id)

        if (dbError) throw dbError
      } else {
        const { error: dbError } = await supabase
          .from('menu_items')
          .insert({
            name,
            price: parseInt(price),
            image_url: imageUrl,
            family_id: familyId,
            tags: newTags
          })

        if (dbError) throw dbError
      }

      setOpen(false)
      setName('')
      setPrice('10')
      setFile(null)
      setIsWish(false)
      onSuccess?.()
      
    } catch (error) {
      console.error('Error saving dish:', error)
      alert('Failed to save dish. Please check console.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-neo-purple text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all rounded-xl font-bold">
            <Plus className="mr-2 h-5 w-5" />
            新增 (Add)
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white rounded-2xl sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {item ? '编辑项目 (Edit Item)' : '新增项目 (New Item)'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="font-bold">名称 (Name)</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="border-2 border-black rounded-xl focus-visible:ring-0 focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="price" className="font-bold">兑换积分 (Points)</Label>
            <Input 
              id="price" 
              type="number" 
              value={price} 
              onChange={e => setPrice(e.target.value)}
              className="border-2 border-black rounded-xl"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isWish"
              checked={isWish}
              onChange={e => setIsWish(e.target.checked)}
              className="w-5 h-5 border-2 border-black rounded text-neo-purple focus:ring-0"
            />
            <Label htmlFor="isWish" className="font-bold cursor-pointer">
              这是一个愿望券 (This is a Wish Coupon)
            </Label>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="image" className="font-bold">图片 (Image)</Label>
            <Input 
              id="image" 
              type="file" 
              accept="image/*"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="border-2 border-black rounded-xl file:bg-black file:text-white file:border-0 file:rounded-lg file:mr-4 file:px-2"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-neo-green text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl font-bold mt-2">
            {loading ? <Loader2 className="animate-spin" /> : '提交 (Submit)'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
