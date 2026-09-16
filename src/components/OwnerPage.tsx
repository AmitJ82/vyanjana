import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { sortOrdersForOwner } from '../storeRules'

type LineItem = {
  productName: string
  weight: string
  price: number
  quantity: number
  total: number
}

type OwnerOrder = {
  id: string
  orderDate: string
  status: string
  paymentMethod: string
  paymentId?: string
  customerName: string
  customerMobile: string
  customerEmail: string
  deliveryAddress: string
  city: string
  state: string
  totalAmount: number
  deliveryDate?: string
  adminComment?: string
  lineItems: LineItem[]
}

type OwnerProduct = {
  itemId: number
  item: string
  weight: string
  price: number
  inventory: number
}

type OwnerPageProps = {
  apiUrl?: string
  onBack: () => void
}

const statuses = ['Pending', 'Payment Verified', 'Processing', 'Shipped', 'Delivered', 'Cancelled']

const formatPrice = (value: number) => `₹${value}`

export default function OwnerPage({ apiUrl, onBack }: OwnerPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [orders, setOrders] = useState<OwnerOrder[]>([])
  const [products, setProducts] = useState<OwnerProduct[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const visibleOrders = useMemo(() => {
    return sortOrdersForOwner(orders)
      .filter((order) => statusFilter === 'all' || order.status === statusFilter)
  }, [orders, statusFilter])

  const post = async (payload: Record<string, string>) => {
    if (!apiUrl) throw new Error('Owner API is not configured')
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    })
    return response.json() as Promise<{ status: string; message?: string; token?: string }>
  }

  const loadOrders = async (sessionToken: string) => {
    if (!apiUrl) throw new Error('Owner API is not configured')
    const response = await fetch(`${apiUrl}?action=adminOrders&token=${encodeURIComponent(sessionToken)}`, { cache: 'no-cache' })
    const data = await response.json() as { status: string; message?: string; orders?: OwnerOrder[] }
    if (data.status !== 'success') throw new Error(data.message || 'Could not load orders')
    setOrders(data.orders ?? [])
  }

  const loadProducts = async (sessionToken: string) => {
    if (!apiUrl) throw new Error('Owner API is not configured')
    const response = await fetch(`${apiUrl}?action=adminProducts&token=${encodeURIComponent(sessionToken)}`, { cache: 'no-cache' })
    const data = await response.json() as { status: string; message?: string; products?: OwnerProduct[] }
    if (data.status !== 'success') throw new Error(data.message || 'Could not load inventory')
    const uniqueProducts = new Map<number, OwnerProduct>()
    ;(data.products ?? []).forEach((product) => {
      if (!uniqueProducts.has(product.itemId)) uniqueProducts.set(product.itemId, product)
    })
    setProducts(Array.from(uniqueProducts.values()))
  }

  const login = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      const response = await post({ action: 'adminLogin', username, password })
      if (response.status !== 'success' || !response.token) throw new Error(response.message || 'Invalid owner credentials')
      setToken(response.token)
      await loadOrders(response.token)
      await loadProducts(response.token)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Owner login failed')
    } finally {
      setBusy(false)
    }
  }

  const updateInventory = async (product: OwnerProduct) => {
    setBusy(true)
    setMessage('')
    try {
      const response = await post({
        action: 'adminUpdateInventory',
        token,
        productId: String(product.itemId),
        inventory: String(product.inventory),
      })
      if (response.status !== 'success') throw new Error(response.message || 'Could not update inventory')
      setMessage(`Updated inventory for ${product.item}`)
      await loadProducts(token)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Inventory update failed')
    } finally {
      setBusy(false)
    }
  }

  const updateOrder = async (order: OwnerOrder) => {
    setBusy(true)
    setMessage('')
    try {
      const response = await post({
        action: 'adminUpdateOrder',
        token,
        orderId: order.id,
        status: order.status,
        deliveryDate: order.deliveryDate || '',
        adminComment: order.adminComment || '',
      })
      if (response.status !== 'success') throw new Error(response.message || 'Could not update order')
      setMessage(`Updated ${order.id}`)
      await loadOrders(token)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Order update failed')
    } finally {
      setBusy(false)
    }
  }

  const updateLocalOrder = (orderId: string, field: 'status' | 'deliveryDate' | 'adminComment', value: string) => {
    setOrders((current) => current.map((order) => (
      order.id === orderId ? { ...order, [field]: value } : order
    )))
  }

  useEffect(() => {
    if (!token) return
    const timer = window.setInterval(() => {
      loadOrders(token).catch(() => undefined)
      loadProducts(token).catch(() => undefined)
    }, 60000)
    return () => window.clearInterval(timer)
  }, [token])

  if (!token) {
    return (
      <div className="container owner-page">
        <button type="button" className="back-link" onClick={onBack}>Back to Store</button>
        <section className="owner-login feedback-section">
          <h2>Owner Login</h2>
          <p className="subtitle">Review payments and manage delivery updates.</p>
          <form onSubmit={login}>
            <div className="form-group-full">
              <label htmlFor="ownerUsername">Username</label>
              <input id="ownerUsername" value={username} onChange={(event) => setUsername(event.target.value)} required />
            </div>
            <div className="form-group-full">
              <label htmlFor="ownerPassword">Password</label>
              <input id="ownerPassword" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </div>
            {message && <p className="owner-message error">{message}</p>}
            <button type="submit" className="btn-submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          </form>
        </section>
      </div>
    )
  }

  return (
    <div className="container owner-page">
      <div className="owner-toolbar">
        <div>
          <button type="button" className="back-link" onClick={onBack}>Back to Store</button>
          <h2>Order Review</h2>
        </div>
        <button type="button" className="account-action" onClick={() => setToken('')}>Sign out</button>
      </div>
      <div className="owner-filter-bar">
        <label htmlFor="ownerStatusFilter">Show orders</label>
        <select id="ownerStatusFilter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">All statuses</option>
          {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <span>{visibleOrders.length} order{visibleOrders.length === 1 ? '' : 's'}</span>
      </div>
      {message && <p className="owner-message">{message}</p>}
      <section className="owner-inventory">
        <div className="owner-section-heading">
          <div>
            <h2>Inventory</h2>
            <p>Set available stock. Products at zero are hidden from customers.</p>
          </div>
        </div>
        <div className="owner-inventory-grid">
          {products.length ? products.map((product) => (
            <div className="owner-inventory-item" key={product.itemId}>
              <div>
                <strong>{product.item}</strong>
                <span>{product.weight} · ID {product.itemId}</span>
              </div>
              <input
                type="number"
                min="0"
                step="1"
                value={product.inventory}
                aria-label={`Inventory for ${product.item}`}
                onChange={(event) => {
                  const inventory = Math.max(0, Number.parseInt(event.target.value, 10) || 0)
                  setProducts((current) => current.map((item) => item.itemId === product.itemId ? { ...item, inventory } : item))
                }}
              />
              <button type="button" className="account-action" disabled={busy} onClick={() => updateInventory(product)}>
                Save
              </button>
            </div>
          )) : <p className="empty-history">No products found.</p>}
        </div>
      </section>
      <div className="owner-orders">
        {visibleOrders.length ? visibleOrders.map((order) => (
          <article className="owner-order" key={order.id}>
            <div className="owner-order-heading">
              <div>
                <h3>{order.id}</h3>
                <p>{order.customerName} · {order.customerMobile} · {order.customerEmail}</p>
              </div>
              <strong>{formatPrice(order.totalAmount)}</strong>
            </div>
            <p className="owner-order-meta">{order.city}, {order.state} · {order.paymentMethod} · {new Date(order.orderDate).toLocaleString()}</p>
            <p>{order.lineItems.map((item) => `${item.productName} (${item.weight}) × ${item.quantity}`).join(', ')}</p>
            <div className="owner-order-fields">
              <label>
                Payment / order status
                <select value={order.status} onChange={(event) => updateLocalOrder(order.id, 'status', event.target.value)}>
                  {!statuses.includes(order.status) && <option value={order.status}>{order.status}</option>}
                  {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
              <label>
                Delivery date
                <input type="date" value={order.deliveryDate || ''} onChange={(event) => updateLocalOrder(order.id, 'deliveryDate', event.target.value)} />
              </label>
              <label>
                Delivery comment
                <textarea value={order.adminComment || ''} onChange={(event) => updateLocalOrder(order.id, 'adminComment', event.target.value)} placeholder="Add delivery instructions or a customer update" />
              </label>
            </div>
            <button type="button" className="btn-pay owner-save" disabled={busy} onClick={() => updateOrder(order)}>
              {busy ? 'Saving…' : 'Save Order Update'}
            </button>
          </article>
        )) : <p className="empty-history">No orders found.</p>}
      </div>
    </div>
  )
}
