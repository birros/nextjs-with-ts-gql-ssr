import { IncomingMessage, ServerResponse } from 'http'
import crypto from 'crypto'
import { serialize, parse, CookieSerializeOptions } from 'cookie'
import { COOKIE_OPTIONS, CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from './constants'

const COOKIE_OPTIONS_CSRF: CookieSerializeOptions = {
  ...COOKIE_OPTIONS,
  httpOnly: false,
}

export const setupCSRF = (
  req: IncomingMessage | undefined,
  res: ServerResponse | undefined
) => {
  const csrfToken = getCSRFToken(req)

  if (!process.browser && !csrfToken) {
    const newCookie = serialize(
      CSRF_COOKIE_NAME,
      crypto.randomBytes(32).toString('base64'),
      COOKIE_OPTIONS_CSRF
    )
    res?.setHeader('Set-Cookie', newCookie)
  }
}

export const getCSRFToken = (req: IncomingMessage | undefined) => {
  const cookie = process.browser ? document.cookie : req?.headers.cookie
  if (cookie) {
    const cookies = parse(cookie)
    if (CSRF_COOKIE_NAME in cookies) {
      const csrfToken = cookies[CSRF_COOKIE_NAME]
      return csrfToken
    }
  }

  return undefined
}

export const checkCSRF = (req: IncomingMessage | undefined) => {
  if (!req) {
    throw new Error('error.no_request_object')
  }

  const xCsrfToken =
    CSRF_HEADER_NAME in req.headers &&
    !Array.isArray(req.headers[CSRF_HEADER_NAME])
      ? req.headers[CSRF_HEADER_NAME]
      : undefined

  const csrfToken =
    req.headers.cookie && CSRF_COOKIE_NAME in parse(req.headers.cookie)
      ? parse(req.headers.cookie)[CSRF_COOKIE_NAME]
      : undefined

  if (!csrfToken || !xCsrfToken || xCsrfToken !== csrfToken) {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('error.csrf')
    } else {
      console.warn('error.csrf')
    }
  }
}
