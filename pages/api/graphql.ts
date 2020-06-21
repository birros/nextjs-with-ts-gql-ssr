import { ApolloServer } from 'apollo-server-micro'
import typeDefs, { QueryResolvers } from '../../graphql/typeDefs.graphqls'

const Query: Required<QueryResolvers> = {
  counter(_parent, _args, _context, _info) {
    return {
      count: 10,
    }
  },
}

const resolvers = { Query }

const apolloServer = new ApolloServer({ typeDefs, resolvers })

export const config = {
  api: {
    bodyParser: false,
  },
}

export default apolloServer.createHandler({ path: '/api/graphql' })
