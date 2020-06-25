import { ApolloServer } from 'apollo-server-micro'
import http from 'http'
import cors from 'micro-cors'
import { config } from 'dotenv'
import { schema } from '../lib/schema'

config()

const PORT: number =
  process.env.PORT && parseInt(process.env.PORT) !== NaN
    ? parseInt(process.env.PORT)
    : 3000

const API_PORT: number =
  process.env.API_PORT && parseInt(process.env.API_PORT) !== NaN
    ? parseInt(process.env.API_PORT)
    : 3001

const server = new ApolloServer({
  schema,
  context: async ({ req, res, connection }) => {
    const isWebsocket = connection !== undefined

    if (isWebsocket) {
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

const corsMiddleware = cors({
  origin: `http://localhost:${PORT}`,
})

const handler = server.createHandler()
const improvedHandler = corsMiddleware((req: any, res: any) =>
  req.method === 'OPTIONS' ? res.end() : handler(req, res)
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
