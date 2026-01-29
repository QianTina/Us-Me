import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
export function useFamily() {
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [points, setPoints] = useState<number>(0)
  const [profile, setProfile] = useState<{ username: string, avatar_url: string } | null>(null)
  const [family, setFamily] = useState<{ name: string, invite_code: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)

  const fetchProfile = async () => {
    if (!isSupabaseConfigured()) {
      setIsDemo(true)
      setFamilyId('demo')
      setPoints(999) // Demo points
      setProfile({ username: 'Demo User', avatar_url: '👤' })
      setFamily({ name: 'Demo Family', invite_code: 'DEMO123' })
      setLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoading(false)
        return
      }

      setUserId(user.id)

      const { data: userProfile } = await supabase
        .from('profiles')
        .select(`
          family_id, 
          points, 
          username, 
          avatar_url,
          families ( name, invite_code )
        `)
        .eq('id', user.id)
        .maybeSingle()

      if (userProfile) {
        setFamilyId(userProfile.family_id)
        setPoints(userProfile.points || 0)
        setProfile({
            username: userProfile.username || user.email?.split('@')[0] || 'User',
            avatar_url: userProfile.avatar_url
        })
        
        const familyData = userProfile.families as unknown as { name: string, invite_code: string } | { name: string, invite_code: string }[]
        if (familyData) {
            // Handle both single object and array cases from join
            const data = Array.isArray(familyData) ? familyData[0] : familyData
            if (data) {
                setFamily({
                    name: data.name,
                    invite_code: data.invite_code
                })
            }
        }
      }

    } catch (error) {
      console.error('Error loading family:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  return { familyId, userId, points, profile, family, loading, isDemo, refreshProfile: fetchProfile }
}
