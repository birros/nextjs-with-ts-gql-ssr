import { CookieSerializeOptions } from 'cookie'

export const GRAPHQL_PATH = '/api/graphql'

export const COOKIE_OPTIONS: CookieSerializeOptions = {
  secure:
    process.env.NODE_ENV !== 'development' &&
    process.env.COOKIE_SECURE !== 'false',
  sameSite: 'lax',
  path: '/',
}
