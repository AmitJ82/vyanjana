import type { Product } from './types'

type DeliveryZoneConfig = {
  shopCity: string
  shopCityAliases: string[]
  shopState: string
  zoneCities: string[]
}

type DeliveryZone = 'local' | 'zoneMetro' | 'withinState' | 'otherStates'

type OrderLike = {
  status: string
  orderDate: string
}

const completedStatuses = new Set(['completed', 'delivered', 'cancelled'])

export const getAvailableProducts = (products: Product[]) => (
  products.filter((product) => (
    product.variants?.length
      ? product.variants.some((variant) => variant.inventory === undefined || variant.inventory > 0)
      : product.inventory === undefined || product.inventory > 0
  ))
)

export const canAddInventoryItem = (product: Product, currentQuantity: number, amount = 1, weight = product.weight) => {
  const variant = product.variants?.find((entry) => entry.weight === weight)
  const inventory = variant?.inventory ?? product.inventory
  return inventory === undefined || currentQuantity + amount <= inventory
}

export const getDeliveryZone = (cityValue: string, stateValue: string, config: DeliveryZoneConfig): DeliveryZone => {
  const city = cityValue.trim().toLowerCase()
  const state = stateValue.trim().toLowerCase()
  const sourceCities = [config.shopCity, ...config.shopCityAliases]
    .map((sourceCity) => sourceCity.trim().toLowerCase())
    .filter(Boolean)

  if (city && sourceCities.includes(city)) return 'local'
  if (config.zoneCities.some((zoneCity) => zoneCity.trim().toLowerCase() === city)) return 'zoneMetro'
  if (state && state === config.shopState.trim().toLowerCase()) return 'withinState'
  return 'otherStates'
}

export const sortOrdersForOwner = <T extends OrderLike>(orders: T[]) => [...orders].sort((first, second) => {
  const firstComplete = completedStatuses.has(first.status.trim().toLowerCase())
  const secondComplete = completedStatuses.has(second.status.trim().toLowerCase())
  if (firstComplete !== secondComplete) return firstComplete ? 1 : -1
  return new Date(second.orderDate).getTime() - new Date(first.orderDate).getTime()
})
