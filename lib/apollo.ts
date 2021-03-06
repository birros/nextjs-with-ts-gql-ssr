import { useMemo } from 'react'
import { IncomingMessage, ServerResponse } from 'http'
import { ApolloClient } from 'apollo-client'
import { InMemoryCache, NormalizedCacheObject } from 'apollo-cache-inmemory'
import { WebSocketLink } from 'apollo-link-ws'
import { getMainDefinition } from 'apollo-utilities'
import { split, ApolloLink } from 'apollo-link'
import {
  GRAPHQL_PATH,
  CSRF_HEADER_NAME,
  AUTO_LOGOUT_IDLE_TIMEOUT,
  AUTO_LOGOUT_INTERVAL_TIMEOUT,
  AUTO_REFRESH_IDLE_TIMEOUT,
  AUTO_REFRESH_INTERVAL_TIMEOUT,
} from './constants'
import { setupCSRF, getCSRFToken } from './csrf'
import { refreshCallback, logoutCallback, isUnauthorized } from './config'
import {
  withAutoRefresh,
  useAutoRefresh,
  createAutoRefreshContext,
} from './autoRefresh'
import { withAutoLogout, useAutoLogout } from './autoLogout'
import { isConnectedNoCache } from './connected'

export type ResolverContext = {
  req?: IncomingMessage
  res?: ServerResponse
}

const GRAPHQL_ENDPOINT = process.browser
  ? `${document.location.origin}${GRAPHQL_PATH}`
  : ''
const GRAPHQL_ENDPOINT_WS = process.browser
  ? `${document.location.origin
      .replace(/^https/, 'wss')
      .replace(/^http/, 'ws')}${GRAPHQL_PATH}`
  : ''

let apolloClient: ApolloClient<NormalizedCacheObject> | undefined

const autoRefreshContext = createAutoRefreshContext()

const createIsomorphLink = (context: ResolverContext = {}): ApolloLink => {
  if (!process.browser) {
    setupCSRF(context.req, context.res)

    const { SchemaLink } = require('apollo-link-schema')
    const { schema } = require('./schema')
    return new SchemaLink({ schema, context })
  } else {
    const csrfToken = getCSRFToken(context.req)
    const headers = csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : undefined

    const { HttpLink } = require('apollo-link-http')
    return new HttpLink({
      uri: GRAPHQL_ENDPOINT,
      credentials: 'same-origin',
      headers,
    })
  }
}

const createWsLink = () =>
  withAutoRefresh(
    new WebSocketLink({
      uri: GRAPHQL_ENDPOINT_WS,
      options: {
        reconnect: true,
      },
    }),
    autoRefreshContext
  )

const createLink = (context?: ResolverContext) =>
  withAutoLogout(
    process.browser
      ? split(
          ({ query }) => {
            const definition = getMainDefinition(query)
            return (
              definition.kind === 'OperationDefinition' &&
              definition?.operation === 'subscription'
            )
          },
          createWsLink(),
          createIsomorphLink()
        )
      : createIsomorphLink(context),
    isUnauthorized,
    logoutCallback
  )

const createApolloClient = (context?: ResolverContext) =>
  new ApolloClient({
    ssrMode: typeof window === 'undefined',
    link: createLink(context),
    cache: new InMemoryCache(),
  })

export function initializeApollo(
  initialState: any = null,
  // Pages with Next.js data fetching methods, like `getStaticProps`, can send
  // a custom context which will be used by `SchemaLink` to server render pages
  context?: ResolverContext
) {
  const _apolloClient = apolloClient ?? createApolloClient(context)

  useAutoRefresh(
    _apolloClient,
    refreshCallback,
    autoRefreshContext,
    AUTO_REFRESH_IDLE_TIMEOUT,
    AUTO_REFRESH_INTERVAL_TIMEOUT
  )
  useAutoLogout(
    _apolloClient,
    isConnectedNoCache,
    logoutCallback,
    AUTO_LOGOUT_IDLE_TIMEOUT,
    AUTO_LOGOUT_INTERVAL_TIMEOUT
  )

  // If your page has Next.js data fetching methods that use Apollo Client, the initial state
  // get hydrated here
  if (initialState) {
    _apolloClient.cache.restore(initialState)
  }
  // For SSG and SSR always create a new Apollo Client
  if (typeof window === 'undefined') return _apolloClient
  // Create the Apollo Client once in the client
  if (!apolloClient) apolloClient = _apolloClient

  return _apolloClient
}

export function useApollo(initialState: any) {
  const store = useMemo(() => initializeApollo(initialState), [initialState])
  return store
}
