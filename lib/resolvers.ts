import {
  QueryResolvers,
  MutationResolvers,
  SubscriptionResolvers,
} from '../graphql/typeDefs.graphqls'
import { ResolverContext } from './apollo'
import { PubSub } from 'graphql-subscriptions'
import { parse, serialize } from 'cookie'
import { IncomingMessage, ServerResponse } from 'http'

const BEARER_COOKIE_KEY = 'bearer'
const BEARER_COOKIE_VALUE = 'lorem'

const pubsub = new PubSub()

const isAuthorized = (req: IncomingMessage | undefined): boolean => {
  if (!req || !req.headers || !req.headers.cookie) {
    return false
  }

  const cookies = parse(req.headers.cookie)
  if (cookies[BEARER_COOKIE_KEY] !== BEARER_COOKIE_VALUE) {
    return false
  }

  return true
}

const setAuthorization = (
  res: ServerResponse | undefined,
  authorized: boolean
): boolean => {
  if (!res) {
    return false
  }

  const options = {
    secure:
      process.env.NODE_ENV !== 'development' &&
      process.env.COOKIE_SECURE !== 'false',
    httpOnly: true,
  }
  const cookie = authorized
    ? serialize(BEARER_COOKIE_KEY, BEARER_COOKIE_VALUE, {
        ...options,
      })
    : serialize(BEARER_COOKIE_KEY, '', {
        ...options,
        expires: new Date(),
      })
  res.setHeader('Set-Cookie', cookie)

  return true
}

const Query: Required<QueryResolvers<ResolverContext>> = {
  counter(_parent, _args, _context, _info) {
    if (!isAuthorized(_context.req)) {
      throw new Error('error.unauthorized')
    }

    return {
      count: 10,
    }
  },
}

const Mutation: Required<MutationResolvers<ResolverContext>> = {
  login(_parent, _args, _context, _info) {
    return setAuthorization(_context.res, true)
  },
  logout(_parent, _args, _context, _info) {
    return setAuthorization(_context.res, false)
  },
}

const Subscription: Required<SubscriptionResolvers<ResolverContext>> = {
  counter: {
    subscribe: (_parent, _args, _context, _info) => {
      if (!isAuthorized(_context.req)) {
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
