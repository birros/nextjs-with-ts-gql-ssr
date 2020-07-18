import {
  QueryResolvers,
  MutationResolvers,
  SubscriptionResolvers,
  Counter,
} from '../graphql/typeDefs.graphqls'
import { GraphQLResolveInfo } from 'graphql'
import { ResolverContext } from './apollo'
import { PubSub } from 'graphql-subscriptions'
import { useAuth } from './auth'
import { authConfig } from './authConfig'
import { checkCSRF } from './csrf'

const { authenticate, login, logout, refresh } = useAuth(authConfig)

const pubsub = new PubSub()

const Query: Required<QueryResolvers<ResolverContext>> = {
  async counter(_parent, _args, { req, res }, _info) {
    const user = await authenticate(req, res)
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
    checkCSRF(req)
    return await login(req, res, { username, password })
  },
  async logout(_parent, _args, { req, res }, _info) {
    checkCSRF(req)
    return await logout(req, res)
  },
  async refresh(_parent, _args, { req, res }, _info) {
    checkCSRF(req)
    return await refresh(req, res)
  },
}

const Subscription: Required<SubscriptionResolvers<ResolverContext>> = {
  counter: {
    subscribe: async (_parent, _args, { req, res }, _info) => {
      const user = await authenticate(req, res)
      if (!user) {
        throw new Error('error.unauthorized')
      }

      const channel = Math.random().toString(36).substring(2, 15) // random channel name

      let count = 10
      setInterval(() => {
        const payload: Counter = {
          count: count++,
        }

        pubsub.publish(channel, payload)
      }, 1000)

      return pubsub.asyncIterator<Counter>(channel)
    },
    resolve: async (
      payload: Counter,
      _args: {},
      { req, res }: ResolverContext,
      _info: GraphQLResolveInfo
    ) => {
      const user = await authenticate(req, res)
      if (!user) {
        throw new Error('error.unauthorized')
      }

      return payload
    },
  },
}

export default { Query, Mutation, Subscription }
