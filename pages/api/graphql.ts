import { ApolloServer } from 'apollo-server-micro'
import { schema } from '../../lib/schema'
import { Server } from 'http'
import { NextApiHandler, NextApiResponse } from 'next'
import { GRAPHQL_PATH } from '../../lib/constants'

interface SubscriptionHandlersInstalled {
  subscriptionHandlersInstalled: boolean | undefined
}

interface SubscriptionServerOptions {
  path: string
}

const apolloServer = new ApolloServer({
  playground: {
    subscriptionEndpoint: GRAPHQL_PATH,
    settings: {
      'request.credentials': 'include',
    },
  },
  schema,
  context: async ({ req, res, connection }) => {
    const isWebsocket = connection !== undefined

    if (isWebsocket && connection) {
      return {
        req: connection.context.request,
      }
    } else {
      return { req, res }
    }
  },
  subscriptions: {
    onConnect: (_, __, ctx) => {
      return ctx
    },
  },
})

const setupSubscriptionHandlers = (res: NextApiResponse) => {
  const server =
    res.socket && (res.socket as any).server instanceof Server
      ? ((res.socket as any).server as Server & SubscriptionHandlersInstalled)
      : undefined

  const subscriptionServerOptions =
    apolloServer && (apolloServer as any).subscriptionServerOptions
      ? ((apolloServer as any)
          .subscriptionServerOptions as SubscriptionServerOptions)
      : undefined

  if (
    subscriptionServerOptions &&
    server &&
    !server.subscriptionHandlersInstalled
  ) {
    subscriptionServerOptions.path = GRAPHQL_PATH
    apolloServer.installSubscriptionHandlers(server)
    server.subscriptionHandlersInstalled = true
  }
}

const apolloHandler = apolloServer.createHandler({ path: GRAPHQL_PATH })

const handler: NextApiHandler = (req, res) => {
  setupSubscriptionHandlers(res)
  apolloHandler(req, res)
}

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
}

export default handler
