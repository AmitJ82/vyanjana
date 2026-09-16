export type Page = 'home' | 'feedback' | 'order' | 'owner'

export type ProductVariant = {
  weight: string
  price: number
  inventory?: number
}

export type Product = {
  id: number
  name: string
  weight: string
  description: string
  image: string
  emoji: string
  price: number
  quantity: number
  inventory?: number
  variants?: ProductVariant[],
  category: string
}

export type Review = {
  id: number
  itemId: number
  item: string
  name: string
  email: string
  comment: string
  rating: number
  provider?: string
  avatar?: string
  googleId?: string
  date: string
}
