import { ApolloClient } from 'apollo-client'
import { WebSocketLink } from 'apollo-link-ws'
import { SubscriptionClient } from 'subscriptions-transport-ws'
import { useActivityInterval } from './activityDetector'

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

export const useAutoRefresh = (
  client: ApolloClient<any>,
  refresh: RefreshCallback,
  context: AutoRefreshContext,
  timeout: number
) => {
  let connected = false
  let atLeastRefreshedOnce = false

  const cb = async () => {
    if (!process.browser) {
      return
    }

    connected = await refresh(client)

    if (connected && atLeastRefreshedOnce && context.subscriptionClient) {
      context.subscriptionClient.close(false, false)
      setTimeout(async () => {
        // Refresh all queries to retrieve data that could have been created
        // during the time interval when the websocket is closed during
        // subscriptionClient.close.
        await client.reFetchObservableQueries()
      }, 5 * 1000)
    }
    atLeastRefreshedOnce = true
  }

  cb()
  useActivityInterval(() => connected && cb(), timeout)
}
