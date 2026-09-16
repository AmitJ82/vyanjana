import { describe, expect, it } from 'vitest'
import type { Product } from './types'
import {
  canAddInventoryItem,
  getAvailableProducts,
  getDeliveryZone,
  sortOrdersForOwner,
} from './storeRules'

const product = (inventory?: number): Product => ({
  id: 1,
  name: 'Goda Masala',
  category: 'masala',
  weight: '100 g',
  description: 'Test product',
  image: '',
  emoji: '',
  price: 120,
  quantity: 1,
  inventory,
})

describe('inventory rules', () => {
  it('hides products at zero inventory but keeps unlimited products visible', () => {
    expect(getAvailableProducts([product(0), product(3), product()])).toHaveLength(2)
  })

  it('allows quantities up to stock and rejects quantities beyond stock', () => {
    expect(canAddInventoryItem(product(3), 2)).toBe(true)
    expect(canAddInventoryItem(product(3), 3)).toBe(false)
    expect(canAddInventoryItem(product(), 100)).toBe(true)
  })
})

describe('delivery zones', () => {
  const config = {
    shopCity: 'Bangalore',
    shopCityAliases: ['Bengaluru'],
    shopState: 'Karnataka',
    zoneCities: ['Mumbai', 'Delhi'],
  }

  it('recognizes source city aliases as local delivery', () => {
    expect(getDeliveryZone(' Bengaluru ', 'Karnataka', config)).toBe('local')
  })

  it('prioritizes metro, state, and other-state zones correctly', () => {
    expect(getDeliveryZone('Mumbai', 'Maharashtra', config)).toBe('zoneMetro')
    expect(getDeliveryZone('Mysuru', 'Karnataka', config)).toBe('withinState')
    expect(getDeliveryZone('Pune', 'Maharashtra', config)).toBe('otherStates')
  })
})

describe('owner order sorting', () => {
  it('places active orders before completed, delivered, or cancelled orders', () => {
    const orders = [
      { id: 'delivered', status: 'Delivered', orderDate: '2026-09-16T12:00:00Z' },
      { id: 'pending', status: 'Pending', orderDate: '2026-09-15T12:00:00Z' },
      { id: 'processing', status: 'Processing', orderDate: '2026-09-17T12:00:00Z' },
    ]

    expect(sortOrdersForOwner(orders).map((order) => order.id)).toEqual(['processing', 'pending', 'delivered'])
  })
})
