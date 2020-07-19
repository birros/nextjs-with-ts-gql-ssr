import {
  ConnectedDocument,
  ConnectedQuery,
  useConnectedQuery,
} from '../graphql/ConnectedQuery.graphql'
import ApolloClient from 'apollo-client'

export const isConnected = async (client: ApolloClient<any>) => {
  const {
    data: { connected },
  } = await client.query<ConnectedQuery>({
    query: ConnectedDocument,
  })

  return connected
}

export const isConnectedNoCache = async (client: ApolloClient<any>) => {
  const {
    data: { connected },
  } = await client.query<ConnectedQuery>({
    query: ConnectedDocument,
    fetchPolicy: 'network-only',
  })

  return connected
}

export const useConnected = () => {
  const { data } = useConnectedQuery()
  const { connected } = data!

  return connected
}
