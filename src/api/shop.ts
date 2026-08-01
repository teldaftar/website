import { api } from './http'
import type { Shop, UpdateShopPayload } from './types'

export const shopApi = {
  get() {
    return api.get<Shop>('/shop').then((r) => r.data)
  },
  update(payload: UpdateShopPayload) {
    return api.patch<Shop>('/shop', payload).then((r) => r.data)
  },
}
