import type { ClientsConfig } from '@vtex/api'
import { IOClients, LRUCache } from '@vtex/api';

import { Orders } from './orders'
import { PointsClient } from './pointsClient';
export class Clients extends IOClients {

  public get orders() {
    return this.getOrSet('orders', Orders)
  }

  public get pointsClient() {
    return this.getOrSet('points', PointsClient)
  }
}

const REQUESTS_TIMEOUT = 30000

const memoryCache = new LRUCache<string, any>({ max: 5000 })

metrics.trackCache('status', memoryCache)

export const clients: ClientsConfig<Clients> = {
  implementation: Clients,
  options: {
    default: {
      retries: 2,
      timeout: REQUESTS_TIMEOUT,
    },
    status: {
      memoryCache,
    },
  },
}

