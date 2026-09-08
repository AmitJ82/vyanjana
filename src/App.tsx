import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import './App.css'

type Page = 'home' | 'feedback' | 'order'

type Product = {
  id: number
  name: string
  description: string
  image: string
  emoji: string
  price: number
  quantity: number
}

type Review = {
  id: number
  itemId: number
  item: string
  name: string
  email: string
  comment: string
  rating: number
  provider?: string
  avatar?: string
  date: string
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
  paymentMethod: string
  paymentId?: string
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
  paymentMethod: 'razorpay' | 'cod'
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void }
    google?: {
      accounts?: {
        id?: {
          initialize: (config: Record<string, unknown>) => void
        }
      }
    }
  }
}

const DELIVERY_CHARGE = 50
const CAPTIONS = ['', 'Terrible 😞', 'Poor 😕', 'Average 😐', 'Good 😊', 'Excellent 🤩']
const ITEMS: Product[] = [
  {
    id: 1,
    name: 'Goda Masala',
    description: 'Maharashtrian Goda Masala, used to make vegetable, dal, Masala Rice.',
    image:
      'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjdCzXlD6FL_k2L3VhzOOeHAkbM_xNoUbXsEv5oA08F_8GbbDivvhg7_SsvBNyHERZSkgvx9r2l58bxEcjh2wmuMCnYiGDAeRqL-HwN-LVNwxFtSIA3-lxQ70rT3gMptktAQB1P9sSSmNBYuBcrxykre0S3kqcPDkImHv1AeXt1HGbM4bzwASFXNggJOVk/s1280/GodaMasala_MyLeki.jpeg',
    emoji: '🍛',
    price: 120,
    quantity: 1,
  },
  {
    id: 2,
    name: 'Kanda Lasun Masala',
    description: 'Kanda Lasun Masala (Onion Garlic with Chilli powder) brings extra spice to dishes like Misal',
    image:
      'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi-MIhBJHbg_355E3-_e7V0fTx6vHAzW1THvdaY22dbqZEVJSdY2Rs_ZF3WK8woGMmqw6PXrxmA_2V1AuyxWXO9yC2JnkmQGYkOHY9a2N8-Rv1FXTV41DdFuDNpMDwCuoyyh4h6nppVTZpisUEnJcI_O4mhiKSV9YJIqJ8zEesweeyr9U3cKfz7zD0GUmc/s1600/WhatsApp%20Image%202026-02-18%20at%205.57.34%20PM.jpeg',
    emoji: '🌶️',
    price: 80,
    quantity: 1,
  },
  {
    id: 3,
    name: 'Tea Masala',
    description: 'Tea masala gives immunity boost',
    image:
      'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj7Z6PI_0-eyKVYYzm2q7PO3srPmsYkdXYub_cqMkKumW11Vyb4xSPBzUisW3HnQ6uQPpGKlICUrenlIXQyQZFOlPYJj7at_8MtIgcdFuVSSHEzbE9JyC8pUDW0_L23K5s49RlBrrrSvHv49TqmbuF1IoyQq1ttnvS24jRLDvqo26SczuCpN48Ua_OHQXw/s1600/WhatsApp%20Image%202026-02-18%20at%205.57.35%20PM.jpeg',
    emoji: '🍵',
    price: 100,
    quantity: 1,
  },
  {
    id: 4,
    name: 'Garam Masala',
    description: 'Garam masala to make tasty dishes like Paneer tikka masala',
    image:
      'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiYs3GypDu4bGzIo_bPGAx_dbDwOoSChKBpppvyo9TyYn_vYN7xI2iGJE7-0f2o8H-FFLvchFwV3V5XBtId9JJ-S0dEfbBJ2lY1XDIfpKe9Z_AO0KtwT6_IjuSLQa2sM5EKM6tvztUWa_9LwWWd1DKXXoaDE4GfJFBOOMdLqrO5YkZQSOKa9s5fxtOprwM/s320/Dhania.jpeg',
    emoji: '🌶️',
    price: 60,
    quantity: 1,
  },
  {
    id: 5,
    name: 'Turmeric',
    description: 'Turmeric powder from Sangli Maharashtra',
    image:
      'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjCqGDLflhSMFW1p7fY4S0sWF3iAyx02sNHLEKOywhtqtbV79ww3zKQVr6kFQJRAVfA4U4p4TUoc5HJCesYAM98O3_9MDaMABl1KtW_Ef0ck3bO4IcIoKGkNrxFm4O2ZDhnJiKcX7-ZXuiBU0DRZZjOkEor9wGYTE3Omrl0lboosH0ZDgB14UXgI93iBgA/s320/Turmeric.jpeg',
    emoji: '🌶️',
    price: 50,
    quantity: 1,
  },
  {
    id: 6,
    name: 'Coriander Powder',
    description: 'Coriander powder',
    image:
      'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh8YNSOdbjW9fDirwmrBIKKuSYRiRcaS8LEKdy_LeHqwTQg-ZdLBwjWyKolMmBK2rOW53mhKmi_159XyTKIc9apxpG_X68yH5qrBfbNrc-FPBp18ssikNtgRiCURC4GEsc0yJ_0N-MrgOLzAFGrnWiIPXn4s7JTuDm1vD9ODPCd641SoM9YIpmSUjhGbuI/s320/DhaniaPowder.jpeg',
    emoji: '🌶️',
    price: 36,
    quantity: 1,
  },
  {
    id: 7,
    name: 'Amla Slice',
    description: 'Amla slice/Grated Amla Sweet and Sour',
    image:
      'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhKer4PX5wEHYEI1dZBE8SocseQ31sN2LA_IhWeoQKjQoFzGRQz4w7BVcfk8jIo_Zz_IXfOxzkhChp_ImDu0PQGlL16hCNEvWG08WiuOg9bSd81prYXFhaiN3esA0rFusbllztfD4Q7vF1c-yP5vCdUTnDFFbqhsAXHUZPqaPtp_c3V8B3BREBpefUOZFc/s320/AmlaSlice.jpeg',
    emoji: '🍵',
    price: 50,
    quantity: 1,
  },
  {
    id: 8,
    name: 'Wheat Vermicelli',
    description: 'Vermicelli to make your favourite Semia upma, kheer',
    image:
      'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiQwF1eOg7FsxoIKWpVWZ1REYloDHNZmFLkrEcrj3muJc2U_vHEng8j9kjbJ4nVZZKAIYzvVW_LRrSFcu0KfZz2Kc-fbcWk6ejgvN16f_yrpkUGGpnnbNOjlIeP1spsu9gucGuOsYppaBR2GB_mJ3qzQHuTv-VszZijCO04zx6QIMU2h0cU5jfKsvUg8Ak/s320/WheatVermicelli.jpeg',
    emoji: '🍵',
    price: 150,
    quantity: 1,
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

const starsHtml = (avg: number) => {
  const out = [] as string[]
  for (let i = 1; i <= 5; i += 1) {
    out.push(`<span class="${avg >= i ? 'sf' : 'se'}">★</span>`)
  }
  return out.join('')
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

function App() {
  const [page, setPage] = useState<Page>('home')
  const [selectedItemId, setSelectedItemId] = useState<number>(1)
  const [reviews, setReviews] = useState<Review[]>(readStoredReviews)
  const [orders, setOrders] = useState<Order[]>(readStoredOrders)
  const [socialUser, setSocialUser] = useState<SocialUser | null>(null)
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null)
  const [apiStatus, setApiStatus] = useState('✓ Ready')
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
    paymentMethod: 'razorpay',
  })

  const selectedItem = useMemo(
    () => ITEMS.find((item) => item.id === selectedItemId) ?? ITEMS[0],
    [selectedItemId],
  )

  useEffect(() => {
    window.localStorage.setItem('feedbackReviews', JSON.stringify(reviews))
  }, [reviews])

  useEffect(() => {
    window.localStorage.setItem('orders', JSON.stringify(orders))
  }, [orders])

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
    if (page === 'home') setApiStatus('✓ Loaded reviews')
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
    setPage(nextPage)
    if (nextPage !== 'feedback') setReviewSubmitted(false)
  }

  const loginWith = (provider: 'google' | 'facebook' | 'twitter') => {
    const demos = {
      google: {
        name: 'Demo Google User',
        email: 'demo@gmail.com',
        handle: 'demo@gmail.com',
        avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=4285F4&color=fff&size=80',
        provider: 'Google',
      },
      facebook: {
        name: 'Demo Facebook User',
        email: 'demo@fb.com',
        handle: 'facebook.com/demo',
        avatar: 'https://ui-avatars.com/api/?name=Facebook+User&background=1877F2&color=fff&size=80',
        provider: 'Facebook',
      },
      twitter: {
        name: 'Demo Twitter User',
        email: '',
        handle: '@demo_user',
        avatar: 'https://ui-avatars.com/api/?name=Twitter+User&background=000000&color=fff&size=80',
        provider: 'X/Twitter',
      },
    }

    setSocialUser(demos[provider])
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

  const submitReview = (event: FormEvent) => {
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
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    }

    setReviews((current) => [newReview, ...current])
    setReviewSubmitted(true)
    setReviewForm({
      reviewerName: '',
      reviewerEmail: '',
      reviewComment: '',
      rating: 0,
    })
    setHoverRating(0)
  }

  const saveOrder = async (paymentMethod: string, paymentId = '') => {
    const orderData: Order = {
      id: `ORD-${Date.now()}`,
      productId: selectedItem.id,
      productName: selectedItem.name,
      price: selectedItem.price,
      deliveryCharge: DELIVERY_CHARGE,
      totalAmount: selectedItem.price + DELIVERY_CHARGE,
      customerName: checkoutForm.deliveryName,
      customerMobile: checkoutForm.deliveryMobile,
      customerEmail: checkoutForm.deliveryEmail,
      deliveryAddress: checkoutForm.deliveryAddress,
      paymentMethod,
      paymentId,
      status: paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid',
      orderDate: new Date().toISOString(),
      timestamp: Date.now(),
    }

    setOrders((current) => [orderData, ...current])
    setOrderSuccess(orderData)
  }

  const initiatePayment = async (event: FormEvent) => {
    event.preventDefault()

    if (!selectedItem) return

    const name = checkoutForm.deliveryName.trim()
    const mobile = checkoutForm.deliveryMobile.trim()
    const email = checkoutForm.deliveryEmail.trim()
    const address = checkoutForm.deliveryAddress.trim()
    const paymentMethod = checkoutForm.paymentMethod

    if (!name || !mobile || !email || !address) {
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

    if (!window.Razorpay) {
      alert(
        'Payment gateway not configured. Please contact the administrator.\n\nFor testing, you can use "Cash on Delivery" option.',
      )
      return
    }

    const total = selectedItem.price + DELIVERY_CHARGE
    const razorpayOptions = {
      key: 'rzp_live_xxxxx',
      amount: total * 100,
      currency: 'INR',
      name: 'Maharashtrian Masalas',
      description: `Order for ${selectedItem.name}`,
      image: selectedItem.image,
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

  const renderHome = () => (
    <div className="page-shell">
      <header>
        <h1>Our Products</h1>
        <p>Explore our range of authentic Maharashtrian masalas.</p>
      </header>

      <div className="container">
        <div className="api-status ok">
          <span className="dot dot-ok"></span>
          {apiStatus}
        </div>

        <div className="section-title">Products</div>
        <div className="items-grid">
          {ITEMS.map((item) => {
            const stats = getStats(item.id, reviews)
            const latest = reviews.find((review) => review.itemId === item.id)

            return (
              <div key={item.id} className="item-card">
                <div className="item-img-wrap">
                  {item.image ? (
                    <img src={item.image} alt={item.name} />
                  ) : (
                    <div className="item-img-placeholder">
                      <span className="icon">{item.emoji || '📦'}</span>
                    </div>
                  )}
                </div>

                <div className="item-body">
                  <div className="item-name">{item.name}</div>
                  <div className="item-desc">{item.description}</div>

                  {stats ? (
                    <>
                      <div className="card-rating-row">
                        <div className="card-stars" dangerouslySetInnerHTML={{ __html: starsHtml(stats.avg) }} />
                        <span className="card-avg">{stats.avg.toFixed(1)}</span>
                        <span className="card-count">({stats.count} review{stats.count !== 1 ? 's' : ''})</span>
                      </div>
                      <div className="rating-bars">
                        {[5, 4, 3, 2, 1].map((number) => {
                          const countForStar = stats.dist[number - 1] || 0
                          const percent = stats.count ? Math.round((countForStar / stats.count) * 100) : 0
                          return (
                            <div key={number} className="rating-bar-row">
                              <span className="rbl">{number}</span>
                              <div className="bar-track">
                                <div className="bar-fill" style={{ width: `${percent}%` }}></div>
                              </div>
                              <span className="bar-n">{countForStar}</span>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  ) : (
                    <p className="no-reviews-tag">No reviews yet — be first!</p>
                  )}

                  {latest && (
                    <div className="card-comment-snip">
                      "{latest.comment.length > 90 ? `${latest.comment.slice(0, 90)}…` : latest.comment}"
                      <span className="snip-by">— {latest.name}</span>
                    </div>
                  )}

                  <div className="card-action-row">
                    <button
                      type="button"
                      className="btn-card-action accent"
                      onClick={() => goToPage('feedback', item.id)}
                    >
                      ★ Review
                    </button>
                    <button
                      type="button"
                      className="btn-card-action"
                      onClick={() => goToPage('order', item.id)}
                    >
                      🛒 Order
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="select-hint">
          <span className="arr">👇</span>
          Click Review or Order to get started
        </div>
      </div>
    </div>
  )

  const renderFeedback = () => (
    <div className="page-shell">
      <header>
        <a href="#" onClick={() => goToPage('home')} className="brand-link">
          <h1>Our Products</h1>
          <p>Explore our range of authentic Maharashtrian masalas.</p>
        </a>
      </header>

      <div className="container">
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

              <div className="social-divider">Share Feedback Publicly</div>

              <div className="social-btns">
                <button type="button" className="social-btn" onClick={() => loginWith('google')}>
                  <span>🔵</span> Google
                </button>
                <button type="button" className="social-btn" onClick={() => loginWith('facebook')}>
                  <span>📘</span> Facebook
                </button>
                <button type="button" className="social-btn" onClick={() => loginWith('twitter')}>
                  <span>𝕏</span> X / Twitter
                </button>
              </div>

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

              <button type="submit" className="btn-submit">
                Submit Review →
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
            <button type="button" className="btn-another accent" onClick={() => goToPage('home')}>
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
            {ITEMS.map((item) => (
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
          <h1>Our Products</h1>
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
            <div className="checkout-grid">
              <div>
                <div className="cart-items">
                  <h3>Your Items</h3>
                  <div className="cart-item">
                    <div className="item-detail">
                      <strong>{selectedItem.name}</strong>
                      <span>Qty: 1 × {formatPrice(selectedItem.price)}</span>
                    </div>
                    <div className="item-price">{formatPrice(selectedItem.price)}</div>
                  </div>
                </div>
                <div className="order-summary">
                  <h3>Order Summary</h3>
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>{formatPrice(selectedItem.price)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Delivery Charge</span>
                    <span>{formatPrice(DELIVERY_CHARGE)}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-total">Total Amount</span>
                    <span className="summary-total">{formatPrice(selectedItem.price + DELIVERY_CHARGE)}</span>
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
                    Pay {formatPrice(selectedItem.price + DELIVERY_CHARGE)} & Complete Order →
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div className="success-msg">
            <div className="chk">✓</div>
            <h3>Order Confirmed!</h3>
            <p>
              Order ID: <strong>{orderSuccess.id}</strong>
              <br />A confirmation email has been sent to <strong>{orderSuccess.customerEmail}</strong>
            </p>
            <button
              type="button"
              className="btn-another"
              onClick={() => goToPage('feedback', orderSuccess.productId)}
            >
              Write a Review (Optional)
            </button>
            <button type="button" className="btn-another accent" onClick={() => goToPage('home')}>
              Back to Products
            </button>
          </div>
        )}
      </div>
    </div>
  )

  if (page === 'feedback') return renderFeedback()
  if (page === 'order') return renderOrder()
  return renderHome()
}

export default App
