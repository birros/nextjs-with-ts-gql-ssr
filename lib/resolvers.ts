import {
  QueryResolvers,
  MutationResolvers,
  SubscriptionResolvers,
} from '../graphql/typeDefs.graphqls'
import { ResolverContext } from './apollo'
import { PubSub } from 'graphql-subscriptions'
import { useAuth, authenticate, logout } from './passport'

const pubsub = new PubSub()

const Query: Required<QueryResolvers<ResolverContext>> = {
  async counter(_parent, _args, { req, res }, _info) {
    const user = await useAuth(req, res)
    if (!user) {
      throw new Error('error.unauthorized')
    }

    return {
      count: 10,
    }
  },
}

const Mutation: Required<MutationResolvers<ResolverContext>> = {
  async login(_parent, { input: { username, password } }, { req, res }, _info) {
    return await authenticate(req, res, username, password)
  },
  async logout(_parent, _args, { req, res }, _info) {
    return await logout(req, res)
  },
}

const Subscription: Required<SubscriptionResolvers<ResolverContext>> = {
  counter: {
    subscribe: async (_parent, _args, { req, res }, _info) => {
      const user = await useAuth(req, res)
      if (!user) {
        throw new Error('error.unauthorized')
      }

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

export default { Query, Mutation, Subscription }
