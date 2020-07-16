import { AuthConfig } from './auth'
import { serialize, parse, CookieSerializeOptions } from 'cookie'
import { sign, verify } from 'jsonwebtoken'
import { COOKIE_OPTIONS } from './constants'

const MAX_AGE = 15 * 60 // 15 min (in seconds)
const COOKIE_NAME = 'token'
const COOKIE_OPTIONS_JWT: CookieSerializeOptions = {
  ...COOKIE_OPTIONS,
  maxAge: MAX_AGE,
  httpOnly: true,
}

const JWT_SECRET = 'loremipsum'
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
  login: async (loginInput) => {
    if (
      loginInput.username !== USER_EXAMPLE.username ||
      loginInput.password !== USER_EXAMPLE_PASSWORD
    ) {
      throw new Error('error.credentials')
    }

    return USER_EXAMPLE
  },
  serialize: async (userServerSide) => {
    return {
      id: userServerSide.id,
    }
  },
  stringify: async (userClientSide) => {
    const payload = sign(userClientSide, JWT_SECRET)
    return payload
  },
  write: async (res, payload) => {
    const cookie = serialize(COOKIE_NAME, payload, COOKIE_OPTIONS_JWT)
    res.setHeader('Set-Cookie', cookie)
  },
  read: async (req) => {
    if (!req.headers.cookie) {
      return undefined
    }

    const cookies = parse(req.headers.cookie)

    if (COOKIE_NAME in cookies === false) {
      return undefined
    }

    const payload = cookies['token']
    return payload
  },
  parse: async (payload) => {
    const userClientSide = verify(payload, JWT_SECRET, {
      maxAge: `${MAX_AGE}s`,
    }) as UserClientSide
    return userClientSide
  },
  deserialize: async (userClientSide) => {
    return {
      id: userClientSide.id,
      username: USER_EXAMPLE.username,
      roles: USER_EXAMPLE.roles,
    }
  },
  clear: async (res) => {
    const cookie = serialize(COOKIE_NAME, '', {
      ...COOKIE_OPTIONS,
      maxAge: undefined,
      expires: new Date(),
    })

    res.setHeader('Set-Cookie', cookie)
  },
}
