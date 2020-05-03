const { ApolloServer, gql, PubSub } = require('apollo-server-express')
const express = require('express')
const http = require('http')

const authorizedToken = 'bearer_example'
const verifyToken = (token) => token === authorizedToken

const pubsub = new PubSub()

const typeDefs = gql`
  type Mutation {
    login(input: LoginInput!): LoginResult
  }

  type Query {
    hello: String!
    counter: Counter!
  }

  input LoginInput {
    username: String!
    password: String!
  }

  type LoginResult {
    bearer: String!
  }

  type Counter {
    count: Int!
    countStr: String
  }

  type Subscription {
    counter: Counter!
  }
`

const resolvers = {
  Mutation: {
    login: (_, { input }) => {
      const { username, password } = input
      console.log(`login: ${username}:${password}`)
      return {
        bearer: authorizedToken,
      }
    },
  },
  Query: {
    hello: () => 'Hello from server',
    counter: (_, __, { isAuthorized }) => {
      if (!isAuthorized) {
        throw new Error('Authentification required')
      }

      return { count: 10 }
    },
  },
  Counter: {
    countStr: (counter) => `Current count: ${counter.count}`,
  },
  Subscription: {
    counter: {
      subscribe: (_, __, { pubsub, isAuthorized }) => {
        if (!isAuthorized) {
          throw new Error('Authentification required')
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
  },
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req, connection }) => {
    const isWebsocket = connection !== undefined
    const authorization =
      (isWebsocket
        ? connection.context.authorization
        : req.headers.authorization) || ''
    const token = authorization.replace('Bearer ', '')

    const isAuthorized = verifyToken(token)

    if (isWebsocket) {
      return { ...req, pubsub, isAuthorized }
    } else {
      return { ...req, isAuthorized }
    }
  },
  subscriptions: {
    onConnect: (connectionParams) => {
      return { authorization: connectionParams.Authorization }
    },
  },
})

const PORT = 4000
const app = express()
const httpServer = http.createServer(app)

server.applyMiddleware({ app })
server.installSubscriptionHandlers(httpServer)

httpServer.listen(PORT, () => {
  console.log(
    `🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`
  )
  console.log(
    `🚀 Subscriptions ready at ws://localhost:${PORT}${server.subscriptionsPath}`
  )
})
