export interface MenuItem {
  id: string
  family_id: string
  name: string
  price: number
  image_url: string | null
  tags: string[] | null
  is_public: boolean
  created_at: string
}

export interface Profile {
  id: string
  username: string | null
  family_id: string | null
  points: number
  avatar_url: string | null
}

export interface Post {
  id: string
  family_id: string
  owner_id: string
  type: 'diary' | 'photo' | 'wish'
  content: string | null
  visibility: 'public' | 'private'
  created_at: string
}
