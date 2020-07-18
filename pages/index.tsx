import { useCallback } from 'react'
import { GetServerSideProps } from 'next'
import { useLoginMutation } from '../graphql/LoginMutation.graphql'
import { useLogoutMutation } from '../graphql/LogoutMutation.graphql'
import { initializeApollo } from '../lib/apollo'
import { useConnected, isConnected } from '../lib/connected'
import Counter, { cacheCounter } from '../components/Counter'

const Index = () => {
  const connected = useConnected()

  const [login] = useLoginMutation()
  const [logout] = useLogoutMutation()

  const handleLoginLogout = useCallback(async () => {
    if (!connected) {
      await login()
    } else {
      await logout()
    }
    document.location.reload()
  }, [login, logout])

  return (
    <div>
      <div>
        <button onClick={handleLoginLogout}>
          {!connected ? 'login' : 'logout'}
        </button>
      </div>
      {!connected ? 'Not logged' : <Counter />}
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const apolloClient = initializeApollo(null, ctx)

  if (await isConnected(apolloClient)) {
    await cacheCounter(apolloClient)
  }

  return {
    props: {
      initialApolloState: apolloClient.cache.extract(),
    },
  }
}

export default Index
