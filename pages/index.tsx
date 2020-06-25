import { useEffect, useCallback } from 'react'
import { GetServerSideProps } from 'next'
import { useApolloClient } from '@apollo/react-hooks'
import {
  useCounterQuery,
  CounterDocument,
  CounterQuery,
} from '../graphql/CounterQuery.graphql'
import { useCounterSubscription } from '../graphql/CounterSubscription.graphql'
import { useLoginMutation } from '../graphql/LoginMutation.graphql'
import { useLogoutMutation } from '../graphql/LogoutMutation.graphql'
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
  const [login] = useLoginMutation()
  const [logout] = useLogoutMutation()

  const handleLogin = useCallback(async () => {
    await login()
    document.location.reload()
  }, [login])

  const handleLogout = useCallback(async () => {
    await logout()
    document.location.reload()
  }, [login])

  return (
    <div>
      <div>
        <button onClick={handleLogin}>login</button>
        <button onClick={handleLogout}>logout</button>
      </div>
      <p>{!data ? 'Not logged' : `Count: ${data.counter.count}`}</p>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const apolloClient = initializeApollo(null, ctx)

  await Promise.all([
    (async () => {
      try {
        await apolloClient.query({ query: CounterDocument })
      } catch (e) {}
    })(),
  ])

  return {
    props: {
      initialApolloState: apolloClient.cache.extract(),
    },
  }
}

export default Index
