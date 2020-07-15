import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import cookieSession from 'cookie-session'
import { CookieSerializeOptions } from 'cookie'
import { IncomingMessage, ServerResponse } from 'http'

const SESSION_SECRET = 'secret'

const USER_EXAMPLE = {
  id: 42,
  username: 'foo',
  password: 'bar',
}

interface User {
  id: number
  username: string
}

interface UserSession {
  id: number
}

passport.serializeUser<User, UserSession>(function (user, done) {
  done(null, { id: user.id })
})

passport.deserializeUser<User, UserSession>(function (session, done) {
  const { id } = session
  if (id === USER_EXAMPLE.id) {
    const user = {
      id: USER_EXAMPLE.id,
      username: USER_EXAMPLE.username,
    }
    return done(null, user)
  }

  return done('error.deserialize_user', undefined)
})

passport.use(
  'local',
  new LocalStrategy((username, password, done) => {
    if (
      username === USER_EXAMPLE.username &&
      password === USER_EXAMPLE.password
    ) {
      return done(null, {
        id: USER_EXAMPLE.id,
        username: USER_EXAMPLE.username,
      })
    }

    return done('error.credentials', undefined)
  })
)

const cookieOptions: CookieSerializeOptions = {
  maxAge: 15 * 60 * 1000, // 15 min
  secure:
    process.env.NODE_ENV !== 'development' &&
    process.env.COOKIE_SECURE !== 'false',
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
}

export const useAuth = async (
  _req: IncomingMessage | undefined,
  _res: ServerResponse | undefined
): Promise<User | undefined> => {
  if (!_req) {
    throw new Error('error.no_request')
  }

  const req: any = _req
  const res: any = _res ? _res : {}

  await new Promise((then) => {
    cookieSession({
      name: 'session',
      secret: SESSION_SECRET,
      signed: true,
      ...cookieOptions,
    })(req, res, () => {
      passport.initialize()(req, res, () => {
        passport.session()(req, res, () => {
          if (cookieOptions.secure) {
            req.session._ctx.sessionCookies.secure = true
          }
          then()
        })
      })
    })
  })

  return req.user
}

export const authenticate = async (
  _req: IncomingMessage | undefined,
  res: ServerResponse | undefined,
  username: string,
  password: string
) => {
  await useAuth(_req, res)

  if (!_req) {
    throw new Error('error.no_request')
  }
  if (!res) {
    throw new Error('error.no_response')
  }

  const req: any = _req

  req.body = { username, password }
  await new Promise((then) =>
    passport.authenticate('local', { failWithError: true }, (err, user) => {
      if (!user || err) {
        throw new Error(err)
      }
      req.login(user, (subErr: any) => {
        if (subErr) {
          throw new Error(subErr)
        }
        then()
      })
    })(req, res, then)
  )
  return true
}

export const logout = async (
  _req: IncomingMessage | undefined,
  res: ServerResponse | undefined
) => {
  await useAuth(_req, res)

  if (!_req) {
    throw new Error('error.no_request')
  }

  const req: any = _req

  req.logout()
  req.session = null
  req.sessionOptions.maxAge = 0
  return true
}
