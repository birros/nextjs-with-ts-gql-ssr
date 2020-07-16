import { AuthConfig } from './auth'
import { serialize, parse, CookieSerializeOptions } from 'cookie'
import { sign, verify } from 'jsonwebtoken'
import { IncomingMessage, ServerResponse } from 'http'
import crypto from 'crypto'

export const CSRF_HEADER_NAME = 'x-csrf-token'
const CSRF_COOKIE_NAME = 'csrf_token'
const MAX_AGE = 15 * 60 // 15 min (in seconds)
const COOKIE_NAME = 'token'
const COOKIE_OPTIONS: CookieSerializeOptions = {
  secure:
    process.env.NODE_ENV !== 'development' &&
    process.env.COOKIE_SECURE !== 'false',
  sameSite: 'lax',
  path: '/',
}
const COOKIE_OPTIONS_JWT: CookieSerializeOptions = {
  ...COOKIE_OPTIONS,
  maxAge: MAX_AGE,
  httpOnly: true,
}
const COOKIE_OPTIONS_CSRF: CookieSerializeOptions = {
  ...COOKIE_OPTIONS,
  httpOnly: false,
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
  csrf: async (req) => {
    const xCsrfToken =
      CSRF_HEADER_NAME in req.headers &&
      !Array.isArray(req.headers[CSRF_HEADER_NAME])
        ? req.headers[CSRF_HEADER_NAME]
        : undefined

    const csrfToken =
      req.headers.cookie && CSRF_COOKIE_NAME in parse(req.headers.cookie)
        ? parse(req.headers.cookie).csrf_token
        : undefined

    if (!csrfToken || !xCsrfToken || xCsrfToken !== csrfToken) {
      if (process.env.NODE_ENV !== 'development') {
        throw new Error('error.csrf')
      } else {
        console.warn('error.csrf')
      }
    }
  },
}

export const initCSRF = (
  req: IncomingMessage | undefined,
  res: ServerResponse | undefined
) => {
  const cookie = process.browser ? document.cookie : req?.headers.cookie
  if (cookie) {
    const cookies = parse(cookie)
    if (CSRF_COOKIE_NAME in cookies) {
      const csrf_token = cookies.csrf_token
      return csrf_token
    }
  }

  if (!process.browser) {
    const newCookie = serialize(
      CSRF_COOKIE_NAME,
      crypto.randomBytes(32).toString('base64'),
      COOKIE_OPTIONS_CSRF
    )
    res?.setHeader('Set-Cookie', newCookie)
  }

  return undefined
}
