import {
  ConnectedDocument,
  ConnectedQuery,
  useConnectedQuery,
} from '../graphql/ConnectedQuery.graphql'
import ApolloClient from 'apollo-client'

export const isConnected = async (apolloClient: ApolloClient<any>) => {
  const {
    data: { connected },
  } = await apolloClient.query<ConnectedQuery>({
    query: ConnectedDocument,
  })

  return connected
}

export const useConnected = () => {
  const { data } = useConnectedQuery()
  const { connected } = data!

  return connected
}
