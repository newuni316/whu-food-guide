export interface Restaurant {
  name: string
  slug: string
  campus: string
  area: string
  location?: string
  category: string[]
  price_range: [number, number]
  avg_price: number
  rating: { taste: number; environment: number; value: number }
  coordinates: { lat: number; lng: number }
  address: string
  hours: string
  phone: string
  images?: string[]
  recommendations: string[]
  tags: string[]
  review: string
  source: string
  last_verified: string
  contributor: string
  admin_added?: boolean
  student_verified?: boolean
}
