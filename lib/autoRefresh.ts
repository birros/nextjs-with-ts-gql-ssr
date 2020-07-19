import { ApolloClient } from 'apollo-client'
import { WebSocketLink } from 'apollo-link-ws'
import { SubscriptionClient } from 'subscriptions-transport-ws'
import { useActivityInterval } from './activityDetector'
import { wait } from './wait'

export type RefreshCallback = (client: ApolloClient<any>) => Promise<boolean>

interface AutoRefreshContext {
  subscriptionClient: SubscriptionClient | undefined
}

export const createAutoRefreshContext = (): AutoRefreshContext => ({
  subscriptionClient: undefined,
})

export const withAutoRefresh = (
  wsLink: WebSocketLink,
  context: AutoRefreshContext
): WebSocketLink => {
  // @ts-ignore
  context.subscriptionClient = wsLink.subscriptionClient
  return wsLink
}

export const useAutoRefresh = async (
  client: ApolloClient<any>,
  refresh: RefreshCallback,
  context: AutoRefreshContext,
  idleTimeout: number,
  intervalTimeout: number
) => {
  if (!process.browser) {
    return
  }

  let connected = await refresh(client)
  let atLeastRefreshedOnce = false

  const cb = async () => {
    if (!atLeastRefreshedOnce) {
      atLeastRefreshedOnce = true
      return
    }

    connected = await refresh(client)

    if (connected && context.subscriptionClient) {
      context.subscriptionClient.close(false, false)

      // Refresh all queries to retrieve data that could have been created
      // during the time interval when the websocket is closed during
      // subscriptionClient.close.
      await wait(5)
      await client.reFetchObservableQueries()
    }
  }

  useActivityInterval(() => connected && cb(), idleTimeout, intervalTimeout)
}
