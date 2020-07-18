import { ApolloLink } from 'apollo-link'
import { onError } from 'apollo-link-error'

export type LogoutCallback = (() => Promise<void>) | (() => void)

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
