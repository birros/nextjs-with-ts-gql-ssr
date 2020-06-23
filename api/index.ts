import { ApolloServer } from 'apollo-server-micro'
import http from 'http'
import { config } from 'dotenv'
import { schema } from '../lib/schema'

config()

const API_PORT: number =
  process.env.API_PORT && parseInt(process.env.API_PORT) !== NaN
    ? parseInt(process.env.API_PORT)
    : 3001

const server = new ApolloServer({ schema })

const handler = server.createHandler()
const httpServer = new http.Server(handler)
server.installSubscriptionHandlers(httpServer)

// Hot Module Replacement
if (module.hot) {
  module.hot.accept()
  module.hot.dispose(() => httpServer.close())
}

console.log(`Listening on ${API_PORT}...`)
httpServer.listen(API_PORT, () => {
  console.log(
    `🚀 Server ready at http://localhost:${API_PORT}${server.graphqlPath}`
  )
  console.log(
    `🚀 Subscriptions ready at ws://localhost:${API_PORT}${server.subscriptionsPath}`
  )
})
