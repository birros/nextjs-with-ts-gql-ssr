import { useEffect } from 'react'
import { useApolloClient } from '@apollo/react-hooks'
import {
  useCounterQuery,
  CounterDocument,
  CounterQuery,
} from '../graphql/CounterQuery.graphql'
import { useCounterSubscription } from '../graphql/CounterSubscription.graphql'
import ApolloClient from 'apollo-client'

export const useCounterQueryWithSubscription: typeof useCounterQuery = (
  baseOptions
) => {
  const client = useApolloClient()
  const queryResult = useCounterQuery(baseOptions)
  const subResult = useCounterSubscription({
    variables: baseOptions?.variables,
    client: baseOptions?.client,
    fetchPolicy:
      baseOptions?.fetchPolicy === 'cache-and-network'
        ? undefined
        : baseOptions?.fetchPolicy,
  })

  useEffect(() => {
    if (!subResult.loading && !subResult.error && subResult.data) {
      client.writeQuery<CounterQuery>({
        query: CounterDocument,
        data: {
          ...subResult.data,
          __typename: 'Query',
        },
      })
    }
  }, [subResult])

  return {
    ...queryResult,
    loading: queryResult.loading || subResult.loading,
    error: queryResult.error || subResult.error,
    variables: subResult.variables
      ? subResult.variables
      : queryResult.variables,
  }
}

const Counter = () => {
  const { data } = useCounterQueryWithSubscription()
  const counter = data?.counter

  return <p>{counter && `Count: ${counter.count}`}</p>
}

export const cacheCounter = async (client: ApolloClient<any>) => {
  await client.query({ query: CounterDocument })
}

export default Counter
