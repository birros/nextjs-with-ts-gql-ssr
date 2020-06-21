import { DocumentNode } from 'graphql'
import {
  SubscriptionHookOptions,
  useApolloClient,
  useQuery,
} from '@apollo/react-hooks'
import gql from 'graphql-tag'
import { useState, useEffect } from 'react'
import { OperationVariables } from '@apollo/react-common'
import { ApolloError } from 'apollo-boost'

interface Result<TData, TVariables> {
  variables: TVariables | undefined
  loading: boolean
  error: ApolloError | undefined
  data: TData | undefined
}

export const useSubscriptionWithSSR = <
  TData = any,
  TVariables = OperationVariables
>(
  subscription: DocumentNode,
  options?: SubscriptionHookOptions<TData, TVariables>
): Result<TData, TVariables> => {
  const query = gql(
    subscription.loc?.source.body.replace(/subscription /gi, 'query ') ?? ''
  )

  const client = useApolloClient()
  const { loading, error, data } = useQuery(query, options)
  const [result, setResult] = useState({
    data: null,
    error: null,
  })

  useEffect(() => {
    if (process.browser) {
      const observable = client
        .subscribe({
          query: subscription,
          ...options,
        })
        .subscribe({
          next(data) {
            setResult({
              data: data.data,
              error: null,
            })
          },
          error(error) {
            setResult({
              data: null,
              error,
            })
          },
        })

      return () => observable.unsubscribe()
    }
  }, [subscription, options])

  return {
    variables: options?.variables || undefined,
    loading,
    error: result.error ?? error,
    data: result.data ?? data,
  }
}
