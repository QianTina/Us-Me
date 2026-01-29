'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Loader2, Gift } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { MenuItem } from '@/types'
import { useFamily } from '@/hooks/useFamily'

interface AddStoreItemDialogProps {
  item?: MenuItem
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function AddStoreItemDialog({ item, trigger, onSuccess }: AddStoreItemDialogProps) {
  const { familyId } = useFamily()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('100')
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    if (open && item) {
      setName(item.name)
      setPrice(item.price.toString())
      setFile(null)
    } else if (open && !item) {
      setName('')
      setPrice('100')
      setFile(null)
    }
  }, [open, item])

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

      // Prepare tags - Ensure 'store' tag is present
      const currentTags = item?.tags?.filter(t => t !== 'store') || []
      const newTags = [...currentTags, 'store']

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
      setPrice('100')
      setFile(null)
      onSuccess?.()
      
    } catch (error) {
      console.error('Error saving item:', error)
      alert('Failed to save item. Please check console.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-neo-pink text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all rounded-xl font-bold">
            <Plus className="mr-2 h-5 w-5" />
            上架商品 (Add Item)
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white rounded-2xl sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Gift className="h-6 w-6 text-neo-pink" />
            {item ? '编辑商品 (Edit Item)' : '上架商品 (New Item)'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="font-bold">商品名称 (Name)</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={e => setName(e.target.value)}
              placeholder="例如：按摩券、免做家务卡"
              className="border-2 border-black rounded-xl focus-visible:ring-0 focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="price" className="font-bold">兑换所需积分 (Points)</Label>
            <Input 
              id="price" 
              type="number" 
              value={price} 
              onChange={e => setPrice(e.target.value)}
              className="border-2 border-black rounded-xl"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="image" className="font-bold">封面图片 (Image)</Label>
            <Input 
              id="image" 
              type="file" 
              accept="image/*"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="border-2 border-black rounded-xl file:bg-black file:text-white file:border-0 file:rounded-lg file:mr-4 file:px-2"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-neo-pink text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl font-bold mt-2 hover:bg-neo-pink/90">
            {loading ? <Loader2 className="animate-spin" /> : '保存 (Save)'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
