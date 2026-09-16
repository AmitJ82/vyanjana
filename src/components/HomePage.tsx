import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Page, Product, Review } from '../types'
import { getAvailableProducts } from '../storeRules'

type RatingStats = {
  avg: number
  count: number
}

type HomePageProps = {
  products: Product[]
  reviews: Review[]
  apiStatus: string
  accountPanel: ReactNode
  onNavigate: (page: Exclude<Page, 'home'>, itemId?: number) => void
}

const starsHtml = (avg: number) => {
  const out = [] as string[]
  for (let index = 1; index <= 5; index += 1) {
    out.push(`<span class="${avg >= index ? 'sf' : 'se'}">★</span>`)
  }
  return out.join('')
}

const getStats = (itemId: number, reviewList: Review[]): RatingStats | null => {
  const itemReviews = reviewList.filter((review) => review.itemId === itemId)
  if (!itemReviews.length) return null

  const avg = itemReviews.reduce((sum, review) => sum + review.rating, 0) / itemReviews.length
  return { avg, count: itemReviews.length }
}

export default function HomePage({ products, reviews, apiStatus, accountPanel, onNavigate }: HomePageProps) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const availableProducts = useMemo(() => getAvailableProducts(products), [products])
  const categories = useMemo(
    () => Array.from(new Set(availableProducts.map((product) => product.category).filter(Boolean))),
    [availableProducts],
  )
  const visibleProducts = selectedCategory === 'all'
    ? availableProducts
    : availableProducts.filter((product) => product.category === selectedCategory)
  const selectedCategoryLabel = selectedCategory === 'all' ? 'All products' : selectedCategory

  return (
    <div className="page-shell">
      <header className="home-header">
        <div className="home-wrap home-nav">
          <a href="#top" className="home-brand">
            <span className="home-brand-mark">व्यं</span>
            <span className="home-brand-text">
              <strong>Vyanjana Dravyani</strong>
              <small>Freshly Ground Spices</small>
            </span>
          </a>
          <nav className="home-nav-links" aria-label="Main navigation">
            <a href="#products">Products</a>
            <a href="#why">Why us</a>
            <a href="#contact">Contact</a>
            <button type="button" className="home-owner-link" onClick={() => onNavigate('owner')}>Owner</button>
          </nav>
        </div>
      </header>

      <main id="top">
        <section className="home-hero home-wrap">
          <div className="home-hero-copy">
            <div className="home-eyebrow">Pure &amp; Natural · Traditional Recipes</div>
            <h2>Spices ground the way your grandmother made them</h2>
            <p>No preservatives, no shortcuts — just stone-ground masalas made in small batches, straight from Maharashtra&apos;s kitchens to yours.</p>
            <div className="home-hero-actions">
              <a className="home-button home-button-primary" href="#products">See our spices</a>
              <a className="home-button home-button-outline" href="#contact">Get in touch</a>
            </div>
          </div>
          <div className="home-hero-art">
            {availableProducts[0]?.image ? <img src={availableProducts[0].image} alt={availableProducts[0].name} /> : <div className="home-hero-placeholder">🌿</div>}
          </div>
        </section>

        <section className="home-wrap home-trust" id="why">
          <div className="home-trust-item"><div className="home-trust-icon">🌿</div><h3>Pure &amp; natural</h3><p>शुद्ध व नैसर्गिक — nothing added, nothing hidden.</p></div>
          <div className="home-trust-item"><div className="home-trust-icon">🥣</div><h3>Traditional taste</h3><p>पारंपरिक चव — recipes passed down through generations.</p></div>
          <div className="home-trust-item"><div className="home-trust-icon">✓</div><h3>No preservatives</h3><p>कोणतेही प्रिझरवेटिव्ह नाही — ground fresh, sold fresh.</p></div>
        </section>

        <div className="container home-account">
          {accountPanel}
          <div className={`api-status ${apiStatus.includes('Saving') ? 'loading' : apiStatus.includes('locally') ? 'err' : 'ok'}`}>
            <span className="dot dot-ok"></span>
            {apiStatus}
          </div>
        </div>

        <section className="home-shelf" id="products">
          <div className="home-wrap">
            <div className="home-section-head">
              <div className="home-rule"></div>
              <div className="home-section-title-row">
                <h2>Our spice shelf</h2>
                <div className="home-category-switcher" role="group" aria-label="Filter products by category">
                  <button
                    type="button"
                    className={selectedCategory === 'all' ? 'active' : ''}
                    onClick={() => setSelectedCategory('all')}
                  >
                    All products
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      className={selectedCategory === category ? 'active' : ''}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
              <nav className="home-breadcrumbs" aria-label="Breadcrumb">
                <a href="#top">Home</a>
                <span aria-hidden="true">/</span>
                <a href="#products" onClick={() => setSelectedCategory('all')}>Products</a>
                {selectedCategory !== 'all' && (
                  <>
                    <span aria-hidden="true">/</span>
                    <span aria-current="page">{selectedCategoryLabel}</span>
                  </>
                )}
              </nav>
              <p>{selectedCategory === 'all' ? 'Seven staples for a Maharashtrian kitchen — each roasted and ground to order.' : `Showing ${visibleProducts.length} ${selectedCategoryLabel} product${visibleProducts.length === 1 ? '' : 's'}.`}</p>
            </div>
            <div className="items-grid">
              {visibleProducts.map((item) => {
                const stats = getStats(item.id, reviews)
                const latest = reviews.find((review) => review.itemId === item.id)
                return (
                  <div key={item.id} className="item-card">
                    <div className="item-img-wrap">
                      {item.image ? <img src={item.image} alt={item.name} /> : <div className="item-img-placeholder"><span className="icon">{item.emoji || '📦'}</span></div>}
                    </div>
                    <div className="item-body">
                      <div className="item-name">{item.name}</div>
                      <div className="item-desc">{item.description}</div>
                      {stats ? (
                        <div className="card-rating-row">
                          <div className="card-stars" dangerouslySetInnerHTML={{ __html: starsHtml(stats.avg) }} />
                          <span className="card-avg">{stats.avg.toFixed(1)}</span>
                          <span className="card-count">({stats.count} review{stats.count !== 1 ? 's' : ''})</span>
                        </div>
                      ) : <p className="no-reviews-tag">No reviews yet — be first!</p>}
                      {latest && <div className="card-comment-snip">&quot;{latest.comment.length > 90 ? `${latest.comment.slice(0, 90)}…` : latest.comment}&quot;<span className="snip-by">— {latest.name}</span></div>}
                      <div className="card-action-row">
                        <button type="button" className="btn-card-action accent" onClick={() => onNavigate('feedback', item.id)}>★ Review</button>
                        <button type="button" className="btn-card-action" onClick={() => onNavigate('order', item.id)}>🛒 Order</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="select-hint"><span className="arr">👇</span>Click Review or Order to get started</div>
          </div>
        </section>

        <section className="home-contact" id="contact">
          <div className="home-wrap">
            <h2>Order your spices</h2>
            <p>Call or WhatsApp us directly — we pack and ship fresh, small-batch masalas across India.</p>
            <div className="home-phones"><div><small>Vyanjana Dravyani</small>96575 25529</div><div><small>Ambe Mohor Pithi</small>96204 16306</div></div>
          </div>
        </section>
        <footer className="home-footer"><div className="home-wrap">Vyanjana Dravyani — Freshly Ground Spices, made in small batches.</div></footer>
      </main>
    </div>
  )
}
