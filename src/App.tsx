import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import garamMasalaImage from './assets/vyanjana-images/garam-masala.jpeg'
import godaMasalaImage from './assets/vyanjana-images/goda-masala.jpeg'
import kandaLasunMasalaImage from './assets/vyanjana-images/kanda-lasun-masala.jpeg'
import teaMasalaImage from './assets/vyanjana-images/tea-masala.jpeg'
import turmericImage from './assets/vyanjana-images/turmeric.jpeg'
import ambemohorImage from './assets/vyanjana-images/ambe-mohor-pithi.jpeg'
import byadagiImage from './assets/vyanjana-images/byadagi-chilli.jpeg'
import corianderPowderImage from './assets/vyanjana-images/Dhania.jpeg'
import kitchenKingMasalaImage from './assets/vyanjana-images/Kitchen-king.jpeg'
import amlaImage from './assets/vyanjana-images/AmlaSlice.jpeg'

import HomePage from './components/HomePage'
import OwnerPage from './components/OwnerPage'
import SocialLoginButtons from './components/SocialLoginButtons'
import type { Page, Product, Review } from './types'
import { canAddInventoryItem, getAvailableProducts, getDeliveryZone } from './storeRules'
import './App.css'

type CartItem = {
  productId: number
  weight: string
  quantity: number
}

type Order = {
  id: string
  productId: number
  productName: string
  price: number
  deliveryCharge: number
  totalAmount: number
  customerName: string
  customerMobile: string
  customerEmail: string
  deliveryAddress: string
  city: string
  state: string
  paymentMethod: string
  paymentId?: string
  lineItems: Array<{
    productId: number
    productName: string
    weight: string
    price: number
    quantity: number
    total: number
  }>
  status: string
  orderDate: string
  timestamp: number
}

type SocialUser = {
  name: string
  email: string
  handle: string
  avatar: string
  provider: string
  googleId?: string
}

type ReviewFormState = {
  reviewerName: string
  reviewerEmail: string
  reviewComment: string
  rating: number
}

type CheckoutFormState = {
  deliveryName: string
  deliveryMobile: string
  deliveryEmail: string
  deliveryAddress: string
  city: string
  state: string
  paymentMethod: 'razorpay' | 'upi' | 'cod'
}

type DeliverySlab = {
  maxGrams?: number
  label: string
  local: number
  withinState: number
  zoneMetro: number
  otherStates: number
}

type DeliveryConfig = {
  shopCity: string
  shopCityAliases: string[]
  shopState: string
  buffer: number
  zoneCities: string[]
  slabs: DeliverySlab[]
  additionalKg: DeliverySlab
  upiId: string
  orderNotificationEmail: string
}

type AuthSession = {
  email: string
  token: string
  expiresAt: number
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void }
    google?: {
      accounts?: {
        id?: {
          initialize: (config: Record<string, unknown>) => void
          prompt?: () => void
        }
      }
    }
  }
}

const DEFAULT_DELIVERY_CONFIG: DeliveryConfig = {
  shopCity: 'Bangalore',
  shopCityAliases: ['Bengaluru'],
  shopState: 'Karnataka',
  buffer: 15,
  zoneCities: [],
  slabs: [
    { maxGrams: 500, label: 'Upto 500 grams', local: 28, withinState: 76, zoneMetro: 82, otherStates: 90 },
    { maxGrams: 1000, label: '501 - 1000 grams', local: 48, withinState: 101, zoneMetro: 137, otherStates: 143 },
    { maxGrams: 1500, label: '1001 - 1500 grams', local: 60, withinState: 130, zoneMetro: 182, otherStates: 228 },
    { maxGrams: 2000, label: '1501 - 2000 grams', local: 87, withinState: 178, zoneMetro: 254, otherStates: 319 },
    { maxGrams: 3000, label: '2001 - 3000 grams', local: 116, withinState: 243, zoneMetro: 355, otherStates: 450 },
    { maxGrams: 4000, label: '3001 - 4000 grams', local: 145, withinState: 298, zoneMetro: 441, otherStates: 560 },
    { maxGrams: 5000, label: '4001 - 5000 grams', local: 174, withinState: 361, zoneMetro: 539, otherStates: 686 },
  ],
  additionalKg: { label: 'Additional 1 kilogram', local: 35, withinState: 60, zoneMetro: 95, otherStates: 120 },
  upiId: '',
  orderNotificationEmail: '',
}
const ORDER_API_URL = import.meta.env.VITE_ORDER_API_URL as string | undefined
const ORDER_SHEETS_URL = import.meta.env.VITE_ORDER_SHEETS_URL as string | undefined
const REVIEW_SHEETS_URL = import.meta.env.VITE_REVIEW_SHEETS_URL as string | undefined
const ACCOUNT_API_URL = ORDER_SHEETS_URL || REVIEW_SHEETS_URL
const AUTH_COOKIE_KEY = 'vyanjanaAuthSession'
const AUTH_SESSION_TTL = 30 * 60 * 1000
const CAPTIONS = ['', 'Terrible 😞', 'Poor 😕', 'Average 😐', 'Good 😊', 'Excellent 🤩']
const ITEMS: Product[] = [
  {
    id: 1,
    name: 'Goda Masala',
    weight: '100 g', 
    description: 'Maharashtrian Goda Masala, used to make vegetable, dal, Masala Rice.',
    image: godaMasalaImage,
    emoji: '🍛',
    price: 120,
    quantity: 1,
    category: 'masala',
  },
  {
    id: 2,
    name: 'Kanda Lasun Masala',
    weight: '100 g',
    description: 'Kanda Lasun Masala (Onion Garlic with Chilli powder) brings extra spice to dishes like Misal',
    image: kandaLasunMasalaImage,
    emoji: '🌶️',
    price: 80,
    quantity: 1,
    category: 'masala',
  },
  {
    id: 3,
    name: 'Tea Masala',
    weight: '50 g',
    description: 'Tea masala gives immunity boost',
    image: teaMasalaImage,
    emoji: '🍵',
    price: 100,
    quantity: 1,
    category: 'masala',
  },
  {
    id: 4,
    name: 'Garam Masala',
    weight: '50 g',
    description: 'Garam masala to make tasty dishes like Paneer tikka masala',
    image: garamMasalaImage,
    emoji: '🌶️',
    price: 60,
    quantity: 1,
    category: 'masala',
  },
  {
    id: 5,
    name: 'Turmeric',
    weight: '100 g',
    description: 'Turmeric powder from Sangli Maharashtra',
    image: turmericImage,
    emoji: '🌶️',
    price: 50,
    quantity: 1,    
    category: 'masala', 
  },
  {
    id: 6,
    name: 'Coriander Powder',
    weight: '100 g',
    description: 'Coriander powder',
    image:
      corianderPowderImage,
    emoji: '🌶️',
    price: 36,
    quantity: 1,
    category: 'masala',
  },
  {
    id: 7,
    name: 'Amla Slice',
    weight: '200 g',
    description: 'Amla slice/Grated Amla Sweet and Sour',
    image:
      amlaImage,
    emoji: '🍵',
    price: 50,
    quantity: 1,
    category: 'food',
  },
  {
    id: 8,
    name: 'Wheat Vermicelli',
    weight: '200 g',
    description: 'Vermicelli to make your favourite Semia upma, kheer',
    image:
      'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiQwF1eOg7FsxoIKWpVWZ1REYloDHNZmFLkrEcrj3muJc2U_vHEng8j9kjbJ4nVZZKAIYzvVW_LRrSFcu0KfZz2Kc-fbcWk6ejgvN16f_yrpkUGGpnnbNOjlIeP1spsu9gucGuOsYppaBR2GB_mJ3qzQHuTv-VszZijCO04zx6QIMU2h0cU5jfKsvUg8Ak/s320/WheatVermicelli.jpeg',
    emoji: '🍵',
    price: 150,
    quantity: 1,
    category: 'food',
  },
  {
    id: 9,
    name: 'Ambe Mohor Pithi',
    weight: '100 g',
    description: 'Ambe mohohor pithi(Modak Pithi) to make ukdiche modak, Neer Dosa, Ghavan',
    image: ambemohorImage,
    emoji: '🍵',
    price: 80,
    quantity: 1,
    category: 'food',
  },
  {
    id: 10,
    name: 'Kitchen King Masala',
    weight: '100 g',
    description: 'Kitchen King Masala to make tasty dishes like Paneer Butter Masala, Veg Kolhapuri',
    image: kitchenKingMasalaImage,
    emoji: '🌶️',
    price: 80,
    quantity: 1,    
    category: 'masala',
  }
  ,{
    id: 11,
    name: 'Byadagi Chilli Powder',
    weight: '100 g',
    description: 'Byadagi Chilli Powder to make tasty dishes like Kolhapuri Misal, Vegetables',
    image: byadagiImage,
    emoji: '🌶️',
    price: 80,
    quantity: 1,
    category: 'masala',
  },
]

const readStoredReviews = (): Review[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem('feedbackReviews')
    return raw ? (JSON.parse(raw) as Review[]) : []
  } catch {
    return []
  }
}

const readStoredOrders = (): Order[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem('orders')
    return raw ? (JSON.parse(raw) as Order[]) : []
  } catch {
    return []
  }
}

const getStats = (itemId: number, reviewList: Review[]) => {
  const itemReviews = reviewList.filter((review) => review.itemId === itemId)
  if (!itemReviews.length) return null

  const avg = itemReviews.reduce((sum, review) => sum + review.rating, 0) / itemReviews.length
  const dist = [0, 0, 0, 0, 0]
  itemReviews.forEach((review) => {
    dist[review.rating - 1] += 1
  })

  return { avg, count: itemReviews.length, dist }
}

const formatPrice = (value: number) => `₹${value}`

const fetchReviewsFromSheets = async (): Promise<Review[]> => {
  const localReviews = readStoredReviews()
  if (!REVIEW_SHEETS_URL || REVIEW_SHEETS_URL.includes('your-script-id')) {
    return localReviews
  }

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 100000)

  try {
    const response = await fetch(REVIEW_SHEETS_URL, {
      signal: controller.signal,
      cache: 'no-cache',
    })

    if (!response.ok) {
      console.warn('Apps Script returned status:', response.status)
      return localReviews
    }

    const payload = (await response.json()) as { reviews?: Array<Record<string, unknown>> }
    const remoteReviews = Array.isArray(payload.reviews) ? payload.reviews : []

    return remoteReviews.map((review, index) => {
      const timestamp = String(review.timestamp || '')
      const parsedDate = timestamp ? new Date(timestamp) : null

      return {
        id: Number(review.id) || Date.now() + index,
        itemId: Number(review.itemId) || 0,
        item: String(review.item || ''),
        name: String(review.name || 'Anonymous'),
        email: String(review.email || ''),
        comment: String(review.comment || ''),
        rating: Number(review.rating) || 0,
        provider: String(review.provider || ''),
        avatar: String(review.avatar || ''),
        googleId: String(review.googleId || ''),
        date: parsedDate && !Number.isNaN(parsedDate.getTime())
          ? parsedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
          : String(review.date || ''),
      }
    })
  } catch (error) {
    console.warn('Could not fetch remote reviews:', error)
    return localReviews
  } finally {
    window.clearTimeout(timeout)
  }
}

const fetchCatalogFromSheets = async (): Promise<{ products: Product[]; deliveryConfig: DeliveryConfig }> => {
  if (!REVIEW_SHEETS_URL || REVIEW_SHEETS_URL.includes('your-script-id')) {
    return { products: ITEMS, deliveryConfig: DEFAULT_DELIVERY_CONFIG }
  }

  try {
    const response = await fetch(REVIEW_SHEETS_URL, { cache: 'no-cache' })
    if (!response.ok) return { products: ITEMS, deliveryConfig: DEFAULT_DELIVERY_CONFIG }

    const payload = (await response.json()) as { products?: Array<Record<string, unknown>>; deliveryConfig?: Partial<DeliveryConfig> }
    if (!Array.isArray(payload.products) || !payload.products.length) return { products: ITEMS, deliveryConfig: DEFAULT_DELIVERY_CONFIG }

    type RemoteProduct = { id: number; name: string; weight: string; price: number; inventory: number | undefined }
    const remoteProducts = payload.products
      .map((product): RemoteProduct | null => {
        const id = Number(product.itemId ?? product.id)
        const fallback = ITEMS.find((item) => item.id === id)
        const price = Number(product.price)
        if (!id || !fallback || !Number.isFinite(price)) return null

        const rawInventory = Number(product.inventory)
        return {
          id,
          name: String(product.item ?? product.name ?? fallback.name),
          weight: String(product.weight ?? fallback.weight),
          price,
          inventory: Number.isFinite(rawInventory) ? Math.max(0, rawInventory) : undefined,
        }
      })
      .filter((product): product is RemoteProduct => product !== null)

    const groupedProducts = new Map<number, typeof remoteProducts>()
    remoteProducts.forEach((product) => {
      const variants = groupedProducts.get(product.id) ?? []
      variants.push(product)
      groupedProducts.set(product.id, variants)
    })

    const products = Array.from(groupedProducts, ([id, variants]) => {
      const fallback = ITEMS.find((item) => item.id === id) ?? ITEMS[0]
      const firstVariant = variants[0]
      return {
        ...fallback,
        name: firstVariant.name,
        weight: firstVariant.weight,
        price: firstVariant.price,
        inventory: undefined,
        variants: variants.map(({ weight, price, inventory }) => ({ weight, price, inventory })),
      }
    })
    return { products, deliveryConfig: { ...DEFAULT_DELIVERY_CONFIG, ...payload.deliveryConfig } }
  } catch (error) {
    console.warn('Could not fetch products from Google Sheets:', error)
    return { products: ITEMS, deliveryConfig: DEFAULT_DELIVERY_CONFIG }
  }
}

const parseWeightInGrams = (weight: string) => {
  const value = Number.parseFloat(weight)
  if (!Number.isFinite(value)) return 0
  return /kg/i.test(weight) ? value * 1000 : value
}

const readStoredAuthSession = (): AuthSession | null => {
  try {
    const cookie = document.cookie
      .split('; ')
      .find((entry) => entry.startsWith(`${AUTH_COOKIE_KEY}=`))
    const raw = cookie ? decodeURIComponent(cookie.slice(AUTH_COOKIE_KEY.length + 1)) : ''
    if (!raw) return null
    const session = JSON.parse(raw) as AuthSession
    if (!session.email || !session.token || session.expiresAt <= Date.now()) {
      clearAuthCookie()
      return null
    }
    return session
  } catch {
    clearAuthCookie()
    return null
  }
}

const setAuthCookie = (session: AuthSession) => {
  document.cookie = `${AUTH_COOKIE_KEY}=${encodeURIComponent(JSON.stringify(session))}; Max-Age=${AUTH_SESSION_TTL / 1000}; Path=/; SameSite=Lax`
}

const clearAuthCookie = () => {
  document.cookie = `${AUTH_COOKIE_KEY}=; Max-Age=0; Path=/; SameSite=Lax`
}

function App() {
  const [page, setPage] = useState<Page>('home')
  const [selectedItemId, setSelectedItemId] = useState<number>(1)
  const [products, setProducts] = useState<Product[]>(ITEMS)
  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig>(DEFAULT_DELIVERY_CONFIG)
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedWeights, setSelectedWeights] = useState<Record<number, string>>({})
  const [reviews, setReviews] = useState<Review[]>(readStoredReviews)
  const [orders, setOrders] = useState<Order[]>(readStoredOrders)
  const [socialUser, setSocialUser] = useState<SocialUser | null>(null)
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [reviewSaving, setReviewSaving] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null)
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => readStoredAuthSession())
  const [accountEmail, setAccountEmail] = useState('')
  const [accountOtp, setAccountOtp] = useState('')
  const [accountStep, setAccountStep] = useState<'email' | 'otp'>('email')
  const [accountBusy, setAccountBusy] = useState(false)
  const [orderHistory, setOrderHistory] = useState<Order[]>([])
  const [orderHistoryLoading, setOrderHistoryLoading] = useState(false)
  const [apiStatus, setApiStatus] = useState('✓ Ready')
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);

  const [reviewForm, setReviewForm] = useState<ReviewFormState>({
    reviewerName: '',
    reviewerEmail: '',
    reviewComment: '',
    rating: 0,
  })
  const [checkoutForm, setCheckoutForm] = useState<CheckoutFormState>({
    deliveryName: '',
    deliveryMobile: '',
    deliveryEmail: '',
    deliveryAddress: '',
    city: '',
    state: '',
    paymentMethod: 'razorpay',
  })

  const selectedItem = useMemo(
    () => products.find((item) => item.id === selectedItemId) ?? products[0],
    [products, selectedItemId],
  )

  const cartProducts = useMemo(
    () => cart.flatMap((cartItem) => {
      const catalogProduct = products.find((item) => item.id === cartItem.productId)
      if (!catalogProduct) return []

      const variant = catalogProduct.variants?.find((entry) => entry.weight === cartItem.weight)
      return [{
        ...cartItem,
        product: variant
          ? { ...catalogProduct, weight: variant.weight, price: variant.price }
          : catalogProduct,
      }]
    }),
    [cart, products],
  )
  const cartSubtotal = cartProducts.reduce(
    (total, cartItem) => total + cartItem.product.price * cartItem.quantity,
    0,
  )
  const totalCartWeight = cartProducts.reduce(
    (total, cartItem) => total + parseWeightInGrams(cartItem.product.weight) * cartItem.quantity,
    0,
  )
  const deliveryZone = useMemo(() => {
    return getDeliveryZone(checkoutForm.city, checkoutForm.state, deliveryConfig)
  }, [checkoutForm.city, checkoutForm.state, deliveryConfig])
  const deliveryChargeBase = useMemo(() => {
    const slab = deliveryConfig.slabs.find((entry) => totalCartWeight <= (entry.maxGrams ?? 0))
    if (slab) return slab[deliveryZone]
    const lastSlab = deliveryConfig.slabs[deliveryConfig.slabs.length - 1]
    const extraKg = Math.ceil((totalCartWeight - (lastSlab.maxGrams ?? 5000)) / 1000)
    return lastSlab[deliveryZone] + extraKg * deliveryConfig.additionalKg[deliveryZone]
  }, [deliveryConfig, deliveryZone, totalCartWeight])
  const deliveryCharge = deliveryChargeBase + deliveryConfig.buffer
  const invoiceTotal = cartSubtotal + deliveryCharge
  const getUpiPaymentUri = (amount: number) => deliveryConfig.upiId
    ? `upi://pay?pa=${encodeURIComponent(deliveryConfig.upiId)}&pn=${encodeURIComponent('Vyanjana Dravyani')}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Invoice payment')}`
    : ''

  const accountPost = async (payload: Record<string, string>) => {
    if (!ACCOUNT_API_URL) throw new Error('Account service is not configured')
    const response = await fetch(ACCOUNT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    })
    return response.json() as Promise<{ status: string; message?: string; email?: string; token?: string }>
  }

  const requestLoginOtp = async (event: FormEvent) => {
    event.preventDefault()
    setAccountBusy(true)
    try {
      const response = await accountPost({ action: 'requestOtp', email: accountEmail })
      if (response.status !== 'success') throw new Error(response.message || 'Could not send OTP')
      setAccountStep('otp')
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not send OTP')
    } finally {
      setAccountBusy(false)
    }
  }

  const verifyLoginOtp = async (event: FormEvent) => {
    event.preventDefault()
    setAccountBusy(true)
    try {
      const response = await accountPost({ action: 'verifyOtp', email: accountEmail, otp: accountOtp })
      if (response.status !== 'success' || !response.email || !response.token) {
        throw new Error(response.message || 'Invalid OTP')
      }
      const session = {
        email: response.email,
        token: response.token,
        expiresAt: Date.now() + AUTH_SESSION_TTL,
      }
      setAuthCookie(session)
      setAuthSession(session)
      setCheckoutForm((current) => ({ ...current, deliveryEmail: response.email || current.deliveryEmail }))
      setAccountOtp('')
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not verify OTP')
    } finally {
      setAccountBusy(false)
    }
  }

  const loadOrderHistory = async (session: AuthSession) => {
    if (!ACCOUNT_API_URL) return
    setOrderHistoryLoading(true)
    try {
      const response = await fetch(`${ACCOUNT_API_URL}?action=orders&email=${encodeURIComponent(session.email)}&token=${encodeURIComponent(session.token)}`, { cache: 'no-cache' })
      const data = await response.json() as { status: string; orders?: Order[] }
      if (data.status === 'success') setOrderHistory(data.orders ?? [])
    } finally {
      setOrderHistoryLoading(false)
    }
  }

  useEffect(() => {
    window.localStorage.setItem('feedbackReviews', JSON.stringify(reviews))
  }, [reviews])

  useEffect(() => {
    window.localStorage.setItem('orders', JSON.stringify(orders))
  }, [orders])

  useEffect(() => {
    let active = true

    fetchReviewsFromSheets().then((remoteReviews) => {
      if (!active || !remoteReviews.length) return
      setReviews(remoteReviews)
      setApiStatus('✓')
    })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    fetchCatalogFromSheets().then((catalog) => {
      if (active) {
        setProducts(catalog.products)
        setDeliveryConfig(catalog.deliveryConfig)
      }
    })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!authSession) return
    const remaining = authSession.expiresAt - Date.now()
    if (remaining <= 0) {
      clearAuthCookie()
      setAuthSession(null)
      setOrderHistory([])
      return
    }

    const expiryTimer = window.setTimeout(() => {
      clearAuthCookie()
      setAuthSession(null)
      setOrderHistory([])
    }, remaining)

    loadOrderHistory(authSession).catch((error) => {
      console.warn('Could not load order history:', error)
    })

    return () => window.clearTimeout(expiryTimer)
  }, [authSession])

  useEffect(() => {
    if (page !== 'feedback') return
    if (!socialUser) return

    setReviewForm((current) => ({
      ...current,
      reviewerName: current.reviewerName || socialUser.name,
      reviewerEmail: current.reviewerEmail || socialUser.email,
    }))
  }, [page, socialUser])

  useEffect(() => {
    if (page === 'home') setApiStatus('✓')
  }, [page, reviews.length])

  useEffect(() => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id:
          '382545828398-qlrjg8pqubj7a576l19ggin17djqh8e8.apps.googleusercontent.com',
        callback: (response: { credential: string }) => {
          const payload = JSON.parse(
            atob(response.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')),
          )
          setSocialUser({
            name: payload.name,
            email: payload.email,
            handle: payload.email,
            avatar: payload.picture,
            provider: 'Google',
            googleId: payload.sub,
          })
        },
      })
    }
  }, [])

  const goToPage = (nextPage: Page, itemId = selectedItemId) => {
    setSelectedItemId(itemId)
    if (nextPage === 'order') {
      if (!addProductToCart(itemId, selectedWeights[itemId] ?? selectedItem.weight)) return
    }
    setPage(nextPage)
    if (nextPage !== 'feedback') setReviewSubmitted(false)
  }

  const toggleCartProduct = (productId: number, isSelected: boolean) => {
    setCart((current) => {
      if (isSelected) {
        const product = products.find((item) => item.id === productId)
        if (!product) return current
        const weight = selectedWeights[productId] ?? product.weight
        const currentQuantity = current.find((item) => item.productId === productId && item.weight === weight)?.quantity ?? 0
        if (!canAddInventoryItem(product, currentQuantity, 1, weight)) return current
        return addCartLine(current, productId, weight)
      }
      return current.filter((item) => item.productId !== productId)
    })
  }

  const selectProductWeight = (productId: number, weight: string) => {
    setSelectedWeights((current) => ({ ...current, [productId]: weight }))
  }

  const addSelectedWeightToCart = (productId: number) => {
    addProductToCart(productId, selectedWeights[productId])
  }

  const addCartLine = (current: CartItem[], productId: number, weight: string) => {
    const existingLine = current.find((item) => item.productId === productId && item.weight === weight)
    if (existingLine) {
      return current.map((item) => item === existingLine ? { ...item, quantity: item.quantity + 1 } : item)
    }
    return [...current, { productId, weight, quantity: 1 }]
  }

  const addProductToCart = (productId: number, selectedWeight?: string) => {
    const product = products.find((item) => item.id === productId)
    if (!product) return false

    const weight = selectedWeight ?? product.weight
    const currentQuantity = cart.find((item) => item.productId === productId && item.weight === weight)?.quantity ?? 0
    if (!canAddInventoryItem(product, currentQuantity, 1, weight)) {
      const inventory = product.variants?.find((variant) => variant.weight === weight)?.inventory ?? product.inventory
      alert(`Only ${inventory} ${product.name} item${inventory === 1 ? '' : 's'} available.`)
      return false
    }

    setCart((current) => addCartLine(current, productId, weight))
    return true
  }

  const changeCartQuantity = (productId: number, weight: string, quantity: number) => {
    if (quantity < 1) return
    const product = products.find((item) => item.id === productId)
    if (product && !canAddInventoryItem(product, 0, quantity, weight)) {
      const inventory = product.variants?.find((variant) => variant.weight === weight)?.inventory ?? product.inventory
      alert(`Only ${inventory} ${product.name} item${inventory === 1 ? '' : 's'} available.`)
      return
    }
    setCart((current) => current.map((item) => (
      item.productId === productId && item.weight === weight ? { ...item, quantity } : item
    )))
  }

  const loginWith = (provider: 'google' | 'facebook' | 'twitter') => {
    if (provider === 'google' && window.google?.accounts?.id?.prompt) {
      window.google.accounts.id.prompt()
      return
    }

    const loginUrls = {
      google: 'https://accounts.google.com/AccountChooser',
      facebook: 'https://www.facebook.com/login.php',
      twitter: 'https://x.com/i/flow/login',
    }
    window.open(loginUrls[provider], '_blank', 'noopener,noreferrer')
  }

  const disconnectSocial = () => {
    setSocialUser(null)
  }

  const handleReviewChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target
    setReviewForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleCheckoutChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target
    setCheckoutForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const submitReview = async (event: FormEvent) => {
    event.preventDefault()

    if (!selectedItem) return
    if (!reviewForm.rating) {
      alert('Please choose a star rating.')
      return
    }
    if (!reviewForm.reviewComment.trim()) {
      alert('Please write a comment.')
      return
    }

    setReviewSaving(true)
    setApiStatus('Saving your review…')

    const newReview: Review = {
      id: Date.now(),
      itemId: selectedItem.id,
      item: selectedItem.name,
      name: reviewForm.reviewerName.trim() || 'Anonymous',
      email: reviewForm.reviewerEmail.trim(),
      comment: reviewForm.reviewComment.trim(),
      rating: reviewForm.rating,
      provider: socialUser?.provider || '',
      avatar: socialUser?.avatar || '',
      googleId: socialUser?.googleId || '',
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    }

    setReviews((current) => [newReview, ...current])
    let savedToSheets = false

    if (REVIEW_SHEETS_URL) {
      try {
        await fetch(REVIEW_SHEETS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(newReview),
          mode: 'no-cors',
        })
        savedToSheets = true
      } catch {
        savedToSheets = false
      }
    }

    setApiStatus(savedToSheets ? '✓ Saved to Google Sheets' : '✓ Saved locally')
    setReviewSubmitted(true)
    setReviewForm({
      reviewerName: '',
      reviewerEmail: '',
      reviewComment: '',
      rating: 0,
    })
    setHoverRating(0)
    setReviewSaving(false)
  }

  const saveOrder = async (paymentMethod: string, paymentId = '') => {
    const firstCartProduct = cartProducts[0]
    if (!firstCartProduct) return

    const overInventory = cartProducts.find(({ product, quantity, weight }) => (
      !canAddInventoryItem(product, 0, quantity, weight)
    ))
    if (overInventory) {
      const inventory = overInventory.product.variants?.find((variant) => variant.weight === overInventory.weight)?.inventory ?? overInventory.product.inventory
      alert(`Only ${inventory} ${overInventory.product.name} item${inventory === 1 ? '' : 's'} available.`)
      return
    }

    const lineItems = cartProducts.map(({ product, quantity }) => ({
      productId: product.id,
      productName: product.name,
      weight: product.weight,
      price: product.price,
      quantity,
      total: product.price * quantity,
    }))
    const orderData: Order = {
      id: `ORD-${Date.now()}`,
      productId: firstCartProduct.product.id,
      productName: firstCartProduct.product.name,
      price: cartSubtotal,
      deliveryCharge,
      totalAmount: invoiceTotal,
      customerName: checkoutForm.deliveryName,
      customerMobile: checkoutForm.deliveryMobile,
      customerEmail: checkoutForm.deliveryEmail,
      deliveryAddress: checkoutForm.deliveryAddress,
      city: checkoutForm.city,
      state: checkoutForm.state,
      paymentMethod,
      paymentId,
      lineItems,
      status: paymentMethod === 'Razorpay' ? 'Paid' : 'Pending',
      orderDate: new Date().toISOString(),
      timestamp: Date.now(),
    }

    setOrders((current) => [orderData, ...current])
    setProducts((current) => current.map((product) => {
      const orderedItems = lineItems.filter((item) => item.productId === product.id)
      if (!orderedItems.length) return product
      if (product.variants?.length) {
        return {
          ...product,
          variants: product.variants.map((variant) => {
            const orderedQuantity = orderedItems
              .filter((item) => item.weight === variant.weight)
              .reduce((total, item) => total + item.quantity, 0)
            return orderedQuantity && variant.inventory !== undefined
              ? { ...variant, inventory: Math.max(0, variant.inventory - orderedQuantity) }
              : variant
          }),
        }
      }
      const orderedQuantity = orderedItems.reduce((total, item) => total + item.quantity, 0)
      return product.inventory === undefined
        ? product
        : { ...product, inventory: Math.max(0, product.inventory - orderedQuantity) }
    }))
    if (ORDER_API_URL && !ORDER_API_URL.includes('your-api-id')) {
      try {
        await fetch(ORDER_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
        })
      } catch {
        // The local invoice remains available if notification delivery is unavailable.
      }
    }
    if (ORDER_SHEETS_URL) {
      try {
        await fetch(ORDER_SHEETS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ type: 'order', ...orderData }),
          mode: 'no-cors',
        })
      } catch {
        // The local invoice and primary order API remain available if Sheets is unavailable.
      }
    }
    setOrderSuccess(orderData)
  }

  const initiatePayment = async (event: FormEvent) => {
    event.preventDefault()

    if (!cartProducts.length) {
      alert('Please add at least one product to your cart.')
      return
    }

    const name = checkoutForm.deliveryName.trim()
    const mobile = checkoutForm.deliveryMobile.trim()
    const email = checkoutForm.deliveryEmail.trim()
    const address = checkoutForm.deliveryAddress.trim()
    const city = checkoutForm.city.trim()
    const paymentMethod = checkoutForm.paymentMethod

    if (!name || !mobile || !email || !address || !city) {
      alert('Please fill all required fields.')
      return
    }

    if (mobile.length !== 10 || !/^\d+$/.test(mobile)) {
      alert('Please enter a valid 10-digit mobile number.')
      return
    }

    if (paymentMethod === 'cod') {
      await saveOrder('Cash on Delivery')
      return
    }

    if (paymentMethod === 'upi') {
      if (!deliveryConfig.upiId) {
        alert('UPI payment is not configured yet.')
        return
      }
      await saveOrder('UPI QR', `UPI:${deliveryConfig.upiId}:${invoiceTotal.toFixed(2)}`)
      return
    }

    if (!window.Razorpay) {
      alert(
        'Payment gateway not configured. Please contact the administrator.\n\nYou can use "Cash on Delivery"/UPI option.',
      )
      return
    }

    const total = cartSubtotal + deliveryCharge
    const razorpayOptions = {
      key: 'rzp_live_xxxxx',
      amount: total * 100,
      currency: 'INR',
      name: 'Maharashtrian Masalas',
      description: `Order for ${cartProducts.length} product${cartProducts.length !== 1 ? 's' : ''}`,
      image: cartProducts[0]!.product.image,
      prefill: {
        name,
        email,
        contact: `+91${mobile}`,
      },
      notes: {
        product_id: selectedItem.id,
        delivery_address: address,
      },
      handler: async (response: { razorpay_payment_id: string }) => {
        await saveOrder('Razorpay', response.razorpay_payment_id)
      },
      modal: {
        ondismiss: () => {
          // Payment dismissed by user; no action needed here.
        },
      },
      theme: {
        color: '#c4622d',
      },
    }

    const razorpay = new window.Razorpay(razorpayOptions)
    razorpay.open()
  }

  const filteredReviews = useMemo(() => {
    if (activeFilter === 'all') return reviews
    return reviews.filter((review) => review.itemId === Number(activeFilter))
  }, [activeFilter, reviews])

  const renderReviewStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span key={index} className={index < rating ? 'star filled' : 'star'}>
        ★
      </span>
    ))
  }

  const renderAccountPanel = () => (
    <section className="account-panel">
      {authSession ? (
        <>
          <div className="account-heading">
            <div>
              <h3>Order History</h3>
              <p>{authSession.email}</p>
            </div>
            <div className="account-actions">
              <button
                type="button"
                className="account-action"
                onClick={() => loadOrderHistory(authSession)}
                disabled={orderHistoryLoading}
              >
                {orderHistoryLoading ? 'Loading…' : 'Refresh'}
              </button>
              <button type="button" className="account-action" onClick={() => {
                clearAuthCookie()
                setAuthSession(null)
                setOrderHistory([])
              }}>
                Log out
              </button>
            </div>
          </div>
          {orderHistoryLoading && !orderHistory.length ? (
            <div className="history-loader" role="status">
              <span className="loader-spinner" aria-hidden="true"></span>
              Loading order history…
            </div>
          ) : orderHistory.length ? (
  <div className="history-list">
    {[...orderHistory]
      .sort((first, second) => (
        new Date(second.orderDate).getTime() - new Date(first.orderDate).getTime()
      ))
      .map((order) => {
        const needsPayment =
          (order.paymentMethod === 'UPI QR' || order.paymentMethod === 'Cash on Delivery') &&
          order.status !== 'Paid';
        const isShowingQr = payingOrderId === order.id;

        return (
          <div key={order.id} className="history-item">
            <div>
              <strong>{order.id}</strong>
              <span>
                {order.lineItems
                  .map((item) => `${item.productName} (${item.weight}) × ${item.quantity}`)
                  .join(', ')}
              </span>
            </div>
            <div className={`history-status ${order.status.toLowerCase()}`}>
              {order.status} · {formatPrice(order.totalAmount)}
            </div>

            {needsPayment && (
              <button
                type="button"
                className="pay-now-button"
                onClick={() => setPayingOrderId(isShowingQr ? null : order.id)}
              >
                {isShowingQr ? 'Hide QR' : 'Pay Now'}
              </button>
            )}

            {needsPayment && isShowingQr && (
              <div className="upi-payment-box">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                    getUpiPaymentUri(order.totalAmount)
                  )}`}
                  alt={`UPI payment QR for ${formatPrice(order.totalAmount)}`}
                />
                <p>
                  Scan to pay {formatPrice(order.totalAmount)} to {deliveryConfig.upiId}
                </p>
              </div>
            )}
          </div>
        );
      })}
  </div>
) : (
  <p className="empty-history">No orders found for this email.</p>
)}
        </>
      ) : (
        <>
          <div className="account-heading">
            <div>
              <h3>Check Your Orders</h3>
              <p>Sign in with an email OTP to view pending and completed invoices.</p>
            </div>
          </div>
          {accountStep === 'email' ? (
            <form className="account-form" onSubmit={requestLoginOtp}>
              <input type="email" placeholder="you@example.com" value={accountEmail} onChange={(event) => setAccountEmail(event.target.value)} required />
              <button type="submit" className="account-action" disabled={accountBusy}>{accountBusy ? 'Sending…' : 'Send OTP'}</button>
            </form>
          ) : (
            <form className="account-form" onSubmit={verifyLoginOtp}>
              <input type="text" inputMode="numeric" pattern="[0-9]{6}" placeholder="6-digit OTP" value={accountOtp} onChange={(event) => setAccountOtp(event.target.value)} required />
              <button type="submit" className="account-action" disabled={accountBusy}>{accountBusy ? 'Checking…' : 'Verify OTP'}</button>
              <button type="button" className="account-link" onClick={() => setAccountStep('email')}>Change email</button>
            </form>
          )}
        </>
      )}
    </section>
  )

  const renderFeedback = () => (
    <div className="page-shell">
      <header>
        <a href="#" onClick={() => goToPage('home')} className="brand-link">
          <h1>Vyanjana Dravyani</h1>
          <p>Explore our range of authentic Maharashtrian masalas.</p>
        </a>
      </header>

      <div className="container">
        {renderAccountPanel()}
        <button type="button" className="back-link" onClick={() => goToPage('home')}>
          Back to Products
        </button>

        <div className="api-status ok">
          <span className="dot dot-ok"></span>
          {apiStatus}
        </div>

        {!reviewSubmitted ? (
          <div className="feedback-section">
            <div id="formTitle">
              <h2>Share Your Feedback</h2>
              <p className="subtitle">Help other customers learn why they should try this product.</p>
            </div>

            <div className="selected-banner">
              {selectedItem.image ? (
                <img src={selectedItem.image} alt={selectedItem.name} />
              ) : (
                <div className="prev-ph">{selectedItem.emoji || '📦'}</div>
              )}
              <div className="prev-text">
                <strong>{selectedItem.name}</strong>
                <span>
                  {getStats(selectedItem.id, reviews)
                    ? `${getStats(selectedItem.id, reviews)?.avg.toFixed(1)} · ${getStats(selectedItem.id, reviews)?.count} review${
                        (getStats(selectedItem.id, reviews)?.count ?? 0) !== 1 ? 's' : ''
                      }`
                    : 'No reviews yet'}
                </span>
              </div>
            </div>

            <form onSubmit={submitReview}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="reviewerName">
                    Name <span className="opt">(optional)</span>
                  </label>
                  <input
                    id="reviewerName"
                    name="reviewerName"
                    type="text"
                    placeholder="Your name"
                    value={reviewForm.reviewerName}
                    onChange={handleReviewChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="reviewerEmail">
                    Email <span className="opt">(optional)</span>
                  </label>
                  <input
                    id="reviewerEmail"
                    name="reviewerEmail"
                    type="email"
                    placeholder="Your email"
                    value={reviewForm.reviewerEmail}
                    onChange={handleReviewChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="star-picker-head">
                  <label>Rating</label>
                  <span className="picker-hint">{hoverRating ? CAPTIONS[hoverRating] : 'Hover to rate →'}</span>
                </div>
                <div className="star-picker">
                  {[5, 4, 3, 2, 1].map((value) => (
                    <label key={value} className="star-label">
                      <input
                        type="radio"
                        name="rating"
                        value={value}
                        checked={reviewForm.rating === value}
                        onChange={() => {
                          setReviewForm((current) => ({ ...current, rating: value }))
                          setHoverRating(value)
                        }}
                      />
                      <span
                        className={reviewForm.rating >= value || hoverRating >= value ? 'star filled' : 'star'}
                        onMouseEnter={() => setHoverRating(value)}
                        onMouseLeave={() => setHoverRating(reviewForm.rating || 0)}
                      >
                        ★
                      </span>
                    </label>
                  ))}
                </div>
                <div className="rating-caption">{CAPTIONS[reviewForm.rating] || ''}</div>
              </div>

              <div className="form-group">
                <label htmlFor="reviewComment">Comment</label>
                <textarea
                  id="reviewComment"
                  name="reviewComment"
                  placeholder="Tell us what you think about this product…"
                  required
                  value={reviewForm.reviewComment}
                  onChange={handleReviewChange}
                />
              </div>

              <SocialLoginButtons onLogin={loginWith} />

              {socialUser && (
                <div className="social-connected">
                  <img className="s-avatar" src={socialUser.avatar} alt={socialUser.name} />
                  <div className="s-info">
                    <strong>{socialUser.name} · via {socialUser.provider}</strong>
                    <span>{socialUser.handle}</span>
                  </div>
                  <button type="button" className="disconnect-btn" onClick={disconnectSocial}>
                    Disconnect
                  </button>
                </div>
              )}

              <button type="submit" className="btn-submit" disabled={reviewSaving}>
                {reviewSaving ? 'Saving Review…' : 'Submit Review →'}
              </button>
            </form>
          </div>
        ) : (
          <div className="success-msg">
            <div className="chk">✓</div>
            <h3>Thank You!</h3>
            <p>Your review has been submitted successfully.</p>
            <button type="button" className="btn-another" onClick={() => setReviewSubmitted(false)}>
              Write Another Review
            </button>
            <button
              type="button"
              className="btn-another accent"
              onClick={() => {
                setOrderSuccess(null)
                setCart([])
                setSelectedWeights({})
                goToPage('home')
              }}
            >
              Back to Products
            </button>
          </div>
        )}

        <div className="reviews-section" style={{ display: reviews.length ? 'block' : 'none' }}>
          <div className="section-title">Customer Reviews</div>
          <div className="reviews-tabs">
            <button
              type="button"
              className={`tab-btn ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All Reviews
            </button>
            {products.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`tab-btn ${activeFilter === String(item.id) ? 'active' : ''}`}
                onClick={() => setActiveFilter(String(item.id))}
              >
                {item.name}
              </button>
            ))}
          </div>
          <div className="reviews-grid">
            {filteredReviews.slice(0, 50).map((review) => (
              <div key={review.id} className="review-card">
                <div className="r-stars">{renderReviewStars(review.rating)}</div>
                <div className="r-comment">"{review.comment}"</div>
                <div className="r-meta">
                  <div className="r-avatar-sm">{review.avatar ? <img src={review.avatar} alt="" /> : review.name.charAt(0)}</div>
                  <div className="r-reviewer">
                    <strong>{review.name}</strong>
                    <span>{review.date}</span>
                  </div>
                  <div className="r-item-tag">{review.item}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderOrder = () => (
    <div className="page-shell">
      <header>
        <a href="#" onClick={() => goToPage('home')} className="brand-link">
          <h1>Vyanjana Dravyani</h1>
          <p>Explore our range of authentic Maharashtrian masalas.</p>
        </a>
      </header>

      <div className="container">
        <button type="button" className="back-link" onClick={() => goToPage('home')}>
          Back to Products
        </button>

        <div className="api-status ok">
          <span className="dot dot-ok"></span>
          Ready to checkout
        </div>

        {!orderSuccess ? (
          <div className="order-section active">
            <h2>Complete Your Order</h2>
            <div className="product-picker">
              <div className="picker-heading">
                <div>
                  <h3>Choose Products</h3>
                  <p>Select everything you want on one invoice.</p>
                </div>
                <span>{cartProducts.length} selected</span>
              </div>
              <div className="picker-grid">
                {getAvailableProducts(products).map((item) => {
                  const cartItem = cart.find((entry) => entry.productId === item.id)
                  const variants = item.variants ?? [{ weight: item.weight, price: item.price }]
                  const selectedWeight = selectedWeights[item.id] ?? variants[0].weight
                  const selectedVariant = variants.find((variant) => variant.weight === selectedWeight) ?? variants[0]
                  return (
                    <div key={item.id} className={`picker-item ${cartItem ? 'selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={Boolean(cartItem)}
                        onChange={(event) => toggleCartProduct(item.id, event.target.checked)}
                      />
                      <span className="picker-item-name">{item.name}</span>
                      <span className="picker-item-price">ID {item.id} · {formatPrice(selectedVariant.price)}{selectedVariant.inventory !== undefined ? ` · ${selectedVariant.inventory} left` : item.inventory !== undefined ? ` · ${item.inventory} left` : ''}</span>
                      <select
                        className="picker-weight"
                        aria-label={`Choose weight for ${item.name}`}
                        value={selectedWeight}
                        onChange={(event) => selectProductWeight(item.id, event.target.value)}
                      >
                        {variants.map((variant) => (
                          <option key={variant.weight} value={variant.weight}>
                            {variant.weight} · {formatPrice(variant.price)}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="picker-add"
                        onClick={() => addSelectedWeightToCart(item.id)}
                      >
                        Add {selectedWeight}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="checkout-grid">
              <div>
                <div className="cart-items">
                  <h3>Your Items</h3>
                  {cartProducts.length ? cartProducts.map(({ product, weight, quantity }) => (
                    <div key={`${product.id}-${weight}`} className="cart-item">
                      <div className="item-detail">
                        <strong>{product.name}</strong>
                        <span>{product.weight} · {formatPrice(product.price)} each</span>
                      </div>
                      <div className="cart-quantity">
                        <button
                          type="button"
                          aria-label={`Decrease ${product.name} quantity`}
                          onClick={() => changeCartQuantity(product.id, weight, quantity - 1)}
                          disabled={quantity === 1}
                        >
                          −
                        </button>
                        <span>{quantity}</span>
                        <button
                          type="button"
                          aria-label={`Increase ${product.name} quantity`}
                          onClick={() => changeCartQuantity(product.id, weight, quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <div className="item-price">{formatPrice(product.price * quantity)}</div>
                    </div>
                  )) : <p className="empty-cart">Choose a product above to start your order.</p>}
                </div>
                <div className="order-summary">
                  <h3>Order Summary</h3>
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>{formatPrice(cartSubtotal)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Delivery Charge ({deliveryZone}, {totalCartWeight} g)</span>
                    <span>{formatPrice(deliveryCharge)}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-total">Total Amount</span>
                    <span className="summary-total">{formatPrice(cartSubtotal + deliveryCharge)}</span>
                  </div>
                </div>
              </div>

              <div className="delivery-form">
                <h3>Delivery Details</h3>
                <form onSubmit={initiatePayment}>
                  <div className="form-row">
                    <div className="form-group-full">
                      <label htmlFor="deliveryName">Full Name *</label>
                      <input
                        id="deliveryName"
                        name="deliveryName"
                        type="text"
                        placeholder="Your full name"
                        required
                        value={checkoutForm.deliveryName}
                        onChange={handleCheckoutChange}
                      />
                    </div>
                    <div className="form-group-full">
                      <label htmlFor="deliveryMobile">Mobile Number *</label>
                      <input
                        id="deliveryMobile"
                        name="deliveryMobile"
                        type="tel"
                        placeholder="10-digit mobile number"
                        pattern="[0-9]{10}"
                        required
                        value={checkoutForm.deliveryMobile}
                        onChange={handleCheckoutChange}
                      />
                    </div>
                  </div>

                  <div className="form-group-full">
                    <label htmlFor="deliveryEmail">Email Address *</label>
                    <input
                      id="deliveryEmail"
                      name="deliveryEmail"
                      type="email"
                      placeholder="your@email.com"
                      required
                      value={checkoutForm.deliveryEmail}
                      onChange={handleCheckoutChange}
                    />
                  </div>

                  <div className="form-group-full">
                    <label htmlFor="deliveryAddress">Delivery Address *</label>
                    <textarea
                      id="deliveryAddress"
                      name="deliveryAddress"
                      placeholder="House No., Street, Locality, City, State, Pincode"
                      required
                      value={checkoutForm.deliveryAddress}
                      onChange={handleCheckoutChange}
                    />
                  </div>

                  <div className="form-group-full">
                    <label htmlFor="city">City *</label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      placeholder="Your city"
                      required
                      value={checkoutForm.city}
                      onChange={handleCheckoutChange}
                    />
                  </div>

                  <div className="form-group-full">
                    <label htmlFor="state">State *</label>
                    <input
                      id="state"
                      name="state"
                      type="text"
                      placeholder="Your state"
                      required
                      value={checkoutForm.state}
                      onChange={handleCheckoutChange}
                    />
                  </div>

                  <div className="form-group-full">
                    <label className="payment-label">Payment Method</label>
                    <div className="payment-methods">
                      <label>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="razorpay"
                          checked={checkoutForm.paymentMethod === 'razorpay'}
                          onChange={handleCheckoutChange}
                        />
                        <span>Razorpay (Card, UPI, Netbanking)</span>
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="upi"
                          checked={checkoutForm.paymentMethod === 'upi'}
                          onChange={handleCheckoutChange}
                        />
                        <span>Pay by UPI QR ({formatPrice(invoiceTotal)})</span>
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cod"
                          checked={checkoutForm.paymentMethod === 'cod'}
                          onChange={handleCheckoutChange}
                        />
                        <span>Cash on Delivery</span>
                      </label>
                    </div>
                  </div>

                  <div className="security-badge">All your information is secure and encrypted</div>

                  <button type="submit" className="btn-pay">
                    Pay {formatPrice(cartSubtotal + deliveryCharge)} & Create Invoice →
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div className="success-msg">
            <div className="chk">✓</div>
            <h3>Invoice Created!</h3>
            <p>
              Invoice ID: <strong>{orderSuccess.id}</strong>
              <br />{orderSuccess.lineItems.length} product{orderSuccess.lineItems.length !== 1 ? 's' : ''} · <strong>{formatPrice(orderSuccess.totalAmount)}</strong>
              <br />A confirmation email has been sent to <strong>{orderSuccess.customerEmail}</strong>
            </p>
            {orderSuccess.paymentMethod === 'UPI QR' && getUpiPaymentUri(orderSuccess.totalAmount) && (
              <div className="upi-payment-box">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(getUpiPaymentUri(orderSuccess.totalAmount))}`}
                  alt={`UPI payment QR for ${formatPrice(orderSuccess.totalAmount)}`}
                />
                <p>Scan to pay {formatPrice(orderSuccess.totalAmount)} to {deliveryConfig.upiId}</p>
                <small>Order remains pending until payment is confirmed.</small>
              </div>
            )}
            <button
              type="button"
              className="btn-another"
              onClick={() => goToPage('feedback', orderSuccess.productId)}
            >
              Write a Review (Optional)
            </button>
            <button type="button" className="btn-another accent" onClick={() => {
                        setOrderSuccess(null)
                        setCart([])
                        setSelectedWeights({})
                        goToPage('home')
                      }}>
              Back to Products
            </button>
          </div>
        )}
      </div>
    </div>
  )

  if (page === 'feedback') return renderFeedback()
  if (page === 'order') return renderOrder()
  if (page === 'owner') return <OwnerPage apiUrl={ORDER_SHEETS_URL || REVIEW_SHEETS_URL} onBack={() => setPage('home')} />
  return (
    <HomePage
      products={products}
      reviews={reviews}
      apiStatus={apiStatus}
      accountPanel={renderAccountPanel()}
      onNavigate={goToPage}
    />
  )
}

export default App
