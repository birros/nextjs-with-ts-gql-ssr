import { ApolloServer } from 'apollo-server-micro'
import http, { IncomingMessage, ServerResponse } from 'http'
import cors from 'micro-cors'
import { schema } from '../lib/schema'
import { GRAPHQL_PATH } from '../lib/config'

const API_PORT: number =
  process.env.API_PORT && parseInt(process.env.API_PORT) !== NaN
    ? parseInt(process.env.API_PORT)
    : 3001

const server = new ApolloServer({
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

const corsMiddleware = cors()
const handler = server.createHandler({ path: GRAPHQL_PATH })
const improvedHandler = corsMiddleware(
  (req: IncomingMessage, res: ServerResponse) => {
    if (req.headers.origin) {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin)
    }
    req.method === 'OPTIONS' ? res.end() : handler(req, res)
  }
)
const httpServer = new http.Server(improvedHandler)
server.installSubscriptionHandlers(httpServer)

// Hot Module Replacement
if (module.hot) {
  module.hot.accept()
  module.hot.dispose(() => httpServer.close())
}

httpServer.listen(API_PORT, () => {
  console.log(
    `🚀 Server ready at http://localhost:${API_PORT}${server.graphqlPath}`
  )
  console.log(
    `🚀 Subscriptions ready at ws://localhost:${API_PORT}${server.subscriptionsPath}`
  )
})
