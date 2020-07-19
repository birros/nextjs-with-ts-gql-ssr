import { CookieSerializeOptions } from 'cookie'

export const GRAPHQL_PATH: string = '/api/graphql'

export const COOKIE_OPTIONS: CookieSerializeOptions = {
  secure:
    process.env.NODE_ENV !== 'development' &&
    process.env.COOKIE_SECURE !== 'false',
  sameSite: 'lax',
  path: '/',
}

export const COOKIE_NAME: string = 'auth.token'

export const JWT_SECRET_ENCODING: BufferEncoding = 'base64'

// node -e 'console.log(require("crypto").randomBytes(32).toString("base64"))'
export const JWT_SECRET: string = 'h3QrilQMTBYVFvdFtkOSP7cyQ9TpTWd10Ca/Q5mOllI='

export const CSRF_HEADER_NAME: string = 'x-csrf-token'

export const CSRF_COOKIE_NAME: string = 'csrf.token'

export const ERROR_UNAUTHORIZED: string = 'error.unauthorized'

export const MAX_AGE: number = 15 * 60 // 15 min (in seconds)

export const AUTO_REFRESH_IDLE_TIMEOUT: number = 1 * 60 * 1000 // 1 min (in milliseconds)

export const AUTO_REFRESH_INTERVAL_TIMEOUT: number =
  Math.ceil((2 * MAX_AGE) / 3) * 1000 // in milliseconds

export const AUTO_LOGOUT_IDLE_TIMEOUT: number = MAX_AGE * 1000 // in milliseconds

export const AUTO_LOGOUT_INTERVAL_TIMEOUT: number = 1 * 60 * 1000 // 1 min (in milliseconds)
