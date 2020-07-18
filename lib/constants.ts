import { CookieSerializeOptions } from 'cookie'

export const GRAPHQL_PATH = '/api/graphql'

export const COOKIE_OPTIONS: CookieSerializeOptions = {
  secure:
    process.env.NODE_ENV !== 'development' &&
    process.env.COOKIE_SECURE !== 'false',
  sameSite: 'lax',
  path: '/',
}

export const COOKIE_NAME = 'auth.token'

export const JWT_SECRET = 'loremipsum'

export const CSRF_HEADER_NAME = 'x-csrf-token'

export const CSRF_COOKIE_NAME = 'csrf.token'

export const ERROR_UNAUTHORIZED = 'error.unauthorized'

export const MAX_AGE = 15 * 60 // 15 min (in seconds)

export const AUTO_REFRESH_TIMEOUT = 1 * 60 * 1000 // 1 min (in seconds)
