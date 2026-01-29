import { createClient } from '@supabase/supabase-js'

// 确保在 .env.local 中配置了这些环境变量
// 为了防止构建失败，这里提供了默认的回退值，但运行时需要真实配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const isSupabaseConfigured = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && 
         process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your-project-url' &&
         !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder.supabase.co')
}

if (!isSupabaseConfigured() && typeof window !== 'undefined') {
  console.warn('⚠️ Supabase is not configured. Using mock mode.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
