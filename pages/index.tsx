import React from 'react'
import { NextPage } from 'next'
import { gql } from 'apollo-boost'
import { getDataFromTree } from '@apollo/react-ssr'
import withApollo from '../lib/with-apollo'
import { useHelloIndexQuery } from '../lib/_generated/graphql'
import { useCounterIndexSubscription } from '../lib/_generated/hooks-with-ssr'
import { withCSRF, InputHiddenCSRF } from '../lib/csrf'

export const HelloIndex = gql`
  query HelloIndex {
    hello
  }
`

const Query: React.FC = () => {
  const { loading, error, data } = useHelloIndexQuery()
  const isError = error !== undefined || data?.hello === null

  if (loading) return <p>Loading...</p>
  if (isError) return <p>Error...</p>

  const hello = data?.hello

  return <div>{hello}</div>
}

export const CounterIndex = gql`
  subscription CounterIndex {
    counter {
      count
      countStr
    }
  }
`

const Subscription: React.FC = () => {
  const { loading, error, data } = useCounterIndexSubscription()
  const isError = error !== undefined || data?.counter === null

  if (loading) return <p>Loading...</p>
  if (isError) return <p>Error, please login...</p>

  const counter = data?.counter

  return (
    <div>
      <div>Count: {counter?.count}</div>
      <div>{counter?.countStr}</div>
    </div>
  )
}

interface ApiButtonProps {
  to: string
}

const ApiButton: React.FC<ApiButtonProps> = ({ to, children }) => (
  <form action={to} method="post">
    <InputHiddenCSRF />
    <button type="submit">{children}</button>
  </form>
)

const Index: NextPage = () => (
  <div>
    <ul>
      <li>
        <ApiButton to="/api/login">login</ApiButton>
      </li>
      <li>
        <ApiButton to="/api/logout">logout</ApiButton>
      </li>
    </ul>
    <Query />
    <Subscription />
  </div>
)

export default withApollo(withCSRF(Index), { getDataFromTree })
