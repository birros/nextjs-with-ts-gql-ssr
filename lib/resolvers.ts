import {
  QueryResolvers,
  SubscriptionResolvers,
} from '../graphql/typeDefs.graphqls'
import { ResolverContext } from './apollo'
import { PubSub } from 'graphql-subscriptions'

const pubsub = new PubSub()

const Query: Required<QueryResolvers<ResolverContext>> = {
  counter(_parent, _args, _context, _info) {
    return {
      count: 10,
    }
  },
}

const Subscription: Required<SubscriptionResolvers<ResolverContext>> = {
  counter: {
    subscribe: () => {
      const channel = Math.random().toString(36).substring(2, 15) // random channel name

      let count = 10
      setInterval(
        () => pubsub.publish(channel, { counter: { count: count++ } }),
        1000
      )

      return pubsub.asyncIterator(channel)
    },
  },
}

export default { Query, Subscription }
