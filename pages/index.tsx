import { useEffect } from 'react'
import { useCounterSubscription } from '../graphql/CounterSubscription.graphql'
import { useApolloClient } from '@apollo/react-hooks'
import {
  useCounterQuery,
  CounterDocument,
  CounterQuery,
} from '../graphql/CounterQuery.graphql'
import { initializeApollo } from '../lib/apollo'

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

const Index = () => {
  const { data } = useCounterQueryWithSubscription()
  const { counter } = data!

  return (
    <div>
      <p>Count: {counter.count}</p>
    </div>
  )
}

export async function getStaticProps() {
  const apolloClient = initializeApollo()

  await apolloClient.query({ query: CounterDocument })

  return {
    props: {
      initialApolloState: apolloClient.cache.extract(),
    },
  }
}

export default Index
