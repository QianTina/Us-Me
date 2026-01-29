'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/business/ModeToggle'
import { Home, Menu, ShoppingBag, ChefHat, Sparkles, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Header() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // 隐藏 Header 的页面
  if (pathname === '/' || pathname === '/auth' || pathname === '/onboarding') {
    return null
  }

  const navItems = [
    { href: '/bistro', label: 'Bistro', icon: Menu },
    { href: '/chores', label: 'Earn', icon: Sparkles },
    { href: '/store', label: 'Store', icon: ShoppingBag },
    { href: '/kitchen', label: 'Kitchen', icon: ChefHat },
    { href: '/me', label: 'Me', icon: User },
  ]

  return (
    <>
      {/* Top Bar for Desktop/Mobile */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-neo-bg/95 backdrop-blur-sm border-b-2 border-black h-16 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="icon" className="hover:bg-transparent">
              <Home className="h-6 w-6" />
            </Button>
          </Link>
          <span className="font-black text-xl hidden sm:inline-block">Us & Me</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Toggle Always Visible */}
          <ModeToggle />
          
          {/* Mobile Menu Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="sm:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </header>

      {/* Mobile Navigation Menu (Overlay) */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-30 bg-neo-bg pt-20 px-4 sm:hidden animate-in slide-in-from-top-10">
          <nav className="flex flex-col gap-4">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
              >
                <Button 
                  className={cn(
                    "w-full justify-start text-lg h-12 font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                    pathname === item.href ? "bg-accent text-accent-foreground" : "bg-white text-black"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Desktop Navigation (Optional sidebar or top nav, for now kept minimal) */}
    </>
  )
}
