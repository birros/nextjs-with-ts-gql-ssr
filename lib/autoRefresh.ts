import { ApolloClient } from 'apollo-client'
import { WebSocketLink } from 'apollo-link-ws'
import { SubscriptionClient } from 'subscriptions-transport-ws'
import { useActivityInterval } from './activityDetector'

export type RefreshCallback = (client: ApolloClient<any>) => Promise<boolean>

let subscriptionClient: SubscriptionClient | undefined

export const withAutoRefresh = (wsLink: WebSocketLink): WebSocketLink => {
  // @ts-ignore
  subscriptionClient = wsLink.subscriptionClient
  return wsLink
}

export const useAutoRefresh = (
  client: ApolloClient<any>,
  refresh: RefreshCallback,
  timeout: number
) => {
  let connected = false
  let atLeastRefreshedOnce = false

  const cb = async () => {
    if (!process.browser) {
      return
    }

    connected = await refresh(client)

    if (connected && atLeastRefreshedOnce && subscriptionClient) {
      subscriptionClient.close(false, false)
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
