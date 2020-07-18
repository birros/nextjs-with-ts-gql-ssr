import { ApolloClient } from 'apollo-client'
import { WebSocketLink } from 'apollo-link-ws'
import { SubscriptionClient } from 'subscriptions-transport-ws'

const useActivityDetector = ({
  onIdle,
  onActivity,
  timeout,
}: {
  onIdle: Function
  onActivity: Function
  timeout: number
}) => {
  if (process.browser) {
    let timer: NodeJS.Timeout | undefined = undefined

    const refreshTimer = () => {
      if (!timer) {
        onActivity()
      }

      if (timer) {
        clearTimeout(timer)
      }

      timer = setTimeout(() => {
        timer = undefined
        onIdle()
      }, timeout)
    }

    refreshTimer()
    document.addEventListener('mousemove', refreshTimer)
    document.addEventListener('keypress', refreshTimer)
  }
}

const useActivityInterval = (interval: Function, timeout: number) => {
  let timer: NodeJS.Timeout | undefined = undefined

  useActivityDetector({
    onIdle: () => {
      if (timer) {
        clearInterval(timer)
      }
    },
    onActivity: () => {
      interval()

      if (timer) {
        clearInterval(timer)
      }
      timer = setInterval(() => interval(), timeout)
    },
    timeout,
  })
}

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

    if (connected && atLeastRefreshedOnce) {
      subscriptionClient?.close(false, false)
      setTimeout(async () => {
        // Refresh all queries to retrieve data that could have been created
        // during the time interval when the weboscket is closed during
        // withAutoRefresh.
        await client.reFetchObservableQueries()
      }, 5 * 1000)
    }
    atLeastRefreshedOnce = true
  }

  cb()
  useActivityInterval(() => connected && cb(), timeout)
}
