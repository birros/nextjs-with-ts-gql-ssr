import withApollo from 'next-with-apollo'
import { ApolloProvider } from '@apollo/react-hooks'
import { InMemoryCache } from 'apollo-boost'
import { ApolloClient } from 'apollo-client'
import { WebSocketLink } from 'apollo-link-ws'
import { HttpLink } from 'apollo-link-http'
import { split, ApolloLink } from 'apollo-link'
import { getMainDefinition } from 'apollo-utilities'
import { onError } from 'apollo-link-error'
import Cookies from 'universal-cookie'

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT ?? ''
const GRAPHQL_ENDPOINT_WS =
  GRAPHQL_ENDPOINT?.replace(/^https/, 'wss').replace(/^http/, 'ws') ?? ''

export default withApollo(
  ({ initialState, headers }) => {
    const cookies = new Cookies(!process.browser ? headers?.cookie : null)
    const bearer = cookies.get('bearer')

    /**
     * errorLink: when the query fails on server side:
     *   1. fix loading to true
     *   2. fix data { <result> } to null
     * see: https://github.com/apollographql/react-apollo/issues/3361#issuecomment-590853434
     */
    const errorLink = onError(({ response }) => {
      if (!process.browser && response) {
        const nullData = new Proxy(
          {},
          {
            get() {
              return null
            },
          }
        )

        response.errors = undefined
        response.data = nullData
      }
    })

    const httpLink = new HttpLink({
      uri: GRAPHQL_ENDPOINT,
      headers: {
        Authorization: bearer ? `Bearer ${bearer}` : '',
      },
    })

    const createWsLink = () => {
      return new WebSocketLink({
        uri: GRAPHQL_ENDPOINT_WS,
        options: {
          reconnect: true,
          connectionParams: {
            Authorization: bearer ? `Bearer ${bearer}` : '',
          },
        },
      })
    }

    const link = process.browser
      ? split(
          ({ query }) => {
            const definition = getMainDefinition(query)
            return (
              definition.kind === 'OperationDefinition' &&
              definition?.operation === 'subscription'
            )
          },
          createWsLink(),
          httpLink
        )
      : ApolloLink.from([errorLink, httpLink])

    return new ApolloClient({
      link,
      cache: new InMemoryCache().restore(initialState || {}),
    })
  },
  {
    render: ({ Page, props }) => {
      return (
        <ApolloProvider client={props.apollo}>
          <Page {...props} />
        </ApolloProvider>
      )
    },
  }
)
