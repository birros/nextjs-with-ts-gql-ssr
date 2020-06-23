import { useCounterQuery, CounterDocument } from '../graphql/Counter.graphql'
import { initializeApollo } from '../lib/apollo'

const Index = () => {
  const { data } = useCounterQuery()
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
