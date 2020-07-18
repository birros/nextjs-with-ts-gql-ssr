import { ApolloLink } from 'apollo-link'
import { onError } from 'apollo-link-error'
import { useActivityDetector } from './activityDetector'
import ApolloClient from 'apollo-client'

export type LogoutCallback = (client?: ApolloClient<any>) => Promise<void>

export const withAutoLogout = (
  link: ApolloLink,
  logoutCallback: LogoutCallback,
  unauthorizedMessage: string
): ApolloLink => {
  const errorLink = onError(({ graphQLErrors }) => {
    if (graphQLErrors)
      graphQLErrors.forEach(({ message }) => {
        if (message === unauthorizedMessage) {
          logoutCallback()
        }
      })
  })

  if (process.browser) {
    return errorLink.concat(link)
  }
  return link
}

export const useAutoLogout = (logout: LogoutCallback, timeout: number) => {
  useActivityDetector({
    onActivity: () => {},
    onIdle: logout,
    timeout,
  })
}
