import { NextApiHandler } from 'next'
import { serialize } from 'cookie'
import { GraphQLClient } from 'graphql-request'
import { gql } from 'apollo-boost'
import { getSdk } from '../../lib/_generated/sdk'
import { withCSRFHandler } from '../../lib/csrf'

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT ?? ''

export const LoginApi = gql`
  mutation LoginApi($username: String!, $password: String!) {
    login(input: { username: $username, password: $password }) {
      bearer
    }
  }
`

const login: NextApiHandler = async (_, res) => {
  const client = new GraphQLClient(GRAPHQL_ENDPOINT)
  const sdk = getSdk(client)

  try {
    const { login } = await sdk.LoginApi({ username: 'foo', password: 'bar' })
    const bearer = login?.bearer
    if (bearer) {
      res.setHeader('Set-Cookie', serialize('bearer', bearer, { path: '/' }))
    }
  } catch (e) {
    const message: string =
      e?.response?.errors?.length > 0 ? e?.response?.errors[0].message : ''
    console.warn(message)
  }

  return res.writeHead(302, { Location: '/' }).end()
}

export default withCSRFHandler(login)
