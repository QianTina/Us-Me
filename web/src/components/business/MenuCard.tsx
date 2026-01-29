import React from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MenuItem } from '@/types'
import { Utensils, Trash2, Pencil } from 'lucide-react'
import Image from 'next/image'
import { AddDishDialog } from './AddDishDialog'
import { cn } from '@/lib/utils'

interface MenuCardProps {
  item: MenuItem
  onOrder?: (id: string) => void
  onDelete?: (id: string) => void
  onEdit?: () => void
  actionLabel?: string
  themeColor?: 'neo-yellow' | 'neo-green' | 'neo-pink' | 'neo-purple'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  EditComponent?: React.ComponentType<any>
}

const colorVariants = {
  'neo-yellow': 'bg-neo-yellow hover:bg-neo-yellow/90',
  'neo-green': 'bg-neo-green hover:bg-neo-green/90',
  'neo-pink': 'bg-neo-pink hover:bg-neo-pink/90',
  'neo-purple': 'bg-neo-purple hover:bg-neo-purple/90',
}

/**
 * 菜单卡片组件
 * 采用新粗野主义风格 (Neo-Brutalism):
 * - 粗黑边框 (border-2 border-black)
 * - 硬阴影 (shadow-[4px_4px_0px_0px_rgba(0,0,0,1)])
 * - 大圆角 (rounded-xl)
 */
export function MenuCard({ 
  item, 
  onOrder, 
  onDelete, 
  onEdit, 
  actionLabel = '点餐 (Order)',
  themeColor = 'neo-yellow',
  EditComponent = AddDishDialog
}: MenuCardProps) {
  const Dialog = EditComponent

  return (
    <Card className="group overflow-hidden border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-2xl bg-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200">
      <div className="relative aspect-[4/3] sm:aspect-square w-full border-b-2 border-black bg-gray-100">
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          {onEdit && (
             <Dialog 
               item={item} 
               onSuccess={onEdit}
               trigger={
                <Button
                  variant="secondary"
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none text-black",
                    colorVariants[themeColor]
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
               }
             />
          )}
          {onDelete && (
            <Button
              variant="destructive"
              size="icon"
              className="h-8 w-8 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
              onClick={(e) => {
                e.stopPropagation()
                if (confirm('确定要删除这个菜品吗？(Delete this item?)')) {
                  onDelete(item.id)
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        {item.image_url ? (
          <Image 
            src={item.image_url} 
            alt={item.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            <Utensils className="h-12 w-12" />
          </div>
        )}
      </div>
      
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-bold flex justify-between items-start">
          <span className="truncate">{item.name}</span>
          <span className={cn(
            "px-2 py-1 text-sm border-2 border-black rounded-lg shrink-0 ml-2",
            colorVariants[themeColor]
          )}>
            {item.price} pts
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        {item.tags && item.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {item.tags.map(tag => (
              <span key={tag} className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-black">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Button 
          className={cn(
            "w-full text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none font-bold rounded-xl",
            colorVariants[themeColor]
          )}
          onClick={() => onOrder?.(item.id)}
        >
          {actionLabel}
        </Button>
      </CardFooter>
    </Card>
  )
}
