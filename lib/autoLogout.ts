import { ApolloLink } from 'apollo-link'
import { onError } from 'apollo-link-error'
import { useIdleInterval } from './activityDetector'
import ApolloClient from 'apollo-client'
import { wait } from './wait'

export type LogoutCallback = () => Promise<void>

export type IsConnected = (client: ApolloClient<any>) => Promise<boolean>

const logout = async (logoutCallback: LogoutCallback) => {
  // Waiting a few seconds allows the network to initialize after the end of
  // standby mode
  await wait(3)

  logoutCallback()
}

export const withAutoLogout = (
  link: ApolloLink,
  logoutCallback: LogoutCallback,
  unauthorizedMessage: string
): ApolloLink => {
  const errorLink = onError(({ graphQLErrors }) => {
    if (graphQLErrors)
      graphQLErrors.forEach(({ message }) => {
        if (message === unauthorizedMessage) {
          logout(logoutCallback)
        }
      })
  })

  if (process.browser) {
    return errorLink.concat(link)
  }
  return link
}

export const useAutoLogout = async (
  client: ApolloClient<any>,
  isConnected: IsConnected,
  logoutCallback: LogoutCallback,
  idleTimeout: number,
  intervalTimeout: number
) => {
  if (!process.browser) {
    return
  }

  let connected = await isConnected(client)

  const cb = async () => {
    connected = await isConnected(client)

    if (!connected) {
      logout(logoutCallback)
    }
  }

  useIdleInterval(() => connected && cb(), idleTimeout, intervalTimeout)
}
