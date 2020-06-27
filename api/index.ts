import { ApolloServer } from 'apollo-server-express'
import express from 'express'
import http from 'http'
import { CorsOptionsDelegate } from 'cors'
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

const corsOptions: CorsOptionsDelegate = (req, callback) => {
  const origin = req.header('Origin')
  if (!origin) {
    callback(null, {
      credentials: true,
    })
  } else {
    callback(null, {
      origin,
      credentials: true,
    })
  }
}

const app = express()
const httpServer = http.createServer(app)

server.applyMiddleware({ app, cors: corsOptions, path: GRAPHQL_PATH })
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
