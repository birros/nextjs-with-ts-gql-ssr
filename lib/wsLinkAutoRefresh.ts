import { WebSocketLink } from 'apollo-link-ws'

export const withWsLinkAutoRefresh = (
  wsLink: WebSocketLink,
  timeout: number
): WebSocketLink => {
  setInterval(
    // @ts-ignore
    () => wsLink.subscriptionClient.close(false, false),
    timeout
  )

  return wsLink
}
