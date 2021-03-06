import { AuthConfig } from './auth'
import {
  RefreshDocument,
  RefreshMutation,
} from '../graphql/RefreshMutation.graphql'
import { RefreshCallback } from './autoRefresh'
import { LogoutCallback, IsUnauthorized } from './autoLogout'
import {
  COOKIE_OPTIONS,
  MAX_AGE,
  JWT_SECRET,
  COOKIE_NAME,
  JWT_SECRET_ENCODING,
  ERROR_UNAUTHORIZED,
} from './constants'

const USER_EXAMPLE: UserServerSide = {
  id: '42',
  username: 'foo',
  roles: ['USER'],
}
const USER_EXAMPLE_PASSWORD = 'bar'

interface LoginInput {
  username: string
  password: string
}

interface UserServerSide {
  id: string
  username: string
  roles: string[]
}

interface UserClientSide {
  id: string
}

export const authConfig: AuthConfig<
  LoginInput,
  UserServerSide,
  UserClientSide
> = {
  env: {
    COOKIE_OPTIONS,
    MAX_AGE,
    JWT_SECRET,
    COOKIE_NAME,
    JWT_SECRET_ENCODING,
  },
  hooks: {
    login: async (_env, loginInput) => {
      if (
        loginInput.username !== USER_EXAMPLE.username ||
        loginInput.password !== USER_EXAMPLE_PASSWORD
      ) {
        throw new Error('error.credentials')
      }

      return USER_EXAMPLE
    },
    serialize: async (_env, userServerSide) => {
      return {
        id: userServerSide.id,
      }
    },
    deserialize: async (_env, userClientSide) => {
      return {
        id: userClientSide.id,
        username: USER_EXAMPLE.username,
        roles: USER_EXAMPLE.roles,
      }
    },
  },
}

export const refreshCallback: RefreshCallback = async (client) => {
  const { data, errors } = await client.mutate<RefreshMutation>({
    mutation: RefreshDocument,
  })
  const connected = !errors && data ? data.refresh : false
  return connected
}

export const isUnauthorized: IsUnauthorized = async (graphQLErrors) => {
  for (const { message } of graphQLErrors) {
    if (message === ERROR_UNAUTHORIZED) {
      return true
    }
  }
  return false
}

export const logoutCallback: LogoutCallback = async () => {
  document.location.reload()
}
