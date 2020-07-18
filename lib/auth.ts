import { IncomingMessage, ServerResponse } from 'http'

export interface AuthConfig<LoginInput, UserServerSide, UserClientSide> {
  login: (loginInput: LoginInput) => Promise<UserServerSide>
  serialize: (userServerSide: UserServerSide) => Promise<UserClientSide>
  stringify: (userClientSide: UserClientSide) => Promise<string>
  write: (res: ServerResponse, payload: string) => Promise<void>
  read: (req: IncomingMessage) => Promise<string | undefined>
  parse: (payload: string) => Promise<UserClientSide | undefined>
  deserialize: (userClientSide: UserClientSide) => Promise<UserServerSide>
  clear: (res: ServerResponse) => Promise<void>
}

interface Returns<LoginInput, UserServerSide> {
  authenticate: (
    req: IncomingMessage | undefined,
    res: ServerResponse | undefined
  ) => Promise<UserServerSide | undefined>
  login: (
    req: IncomingMessage | undefined,
    res: ServerResponse | undefined,
    loginInput: LoginInput
  ) => Promise<boolean>
  logout: (
    req: IncomingMessage | undefined,
    res: ServerResponse | undefined
  ) => Promise<boolean>
  refresh: (
    req: IncomingMessage | undefined,
    res: ServerResponse | undefined
  ) => Promise<boolean>
}

type UseAuth = <LoginInput, UserServerSide, UserClientSide>(
  props: AuthConfig<LoginInput, UserServerSide, UserClientSide>
) => Returns<LoginInput, UserServerSide>

export const useAuth: UseAuth = ({
  login,
  serialize,
  stringify,
  write,
  read,
  parse,
  deserialize,
  clear,
}) => {
  const authenticate = async (
    req: IncomingMessage | undefined,
    _res: ServerResponse | undefined
  ) => {
    if (!req) {
      throw new Error('error.no_request_object')
    }

    const payload = await read(req)
    if (payload === undefined) {
      return undefined
    }

    const userClientSide = await parse(payload)
    if (userClientSide === undefined) {
      return undefined
    }

    const userServerSide = await deserialize(userClientSide)
    return userServerSide
  }

  return {
    login: async (_req, res, loginInput) => {
      if (!res) {
        throw new Error('error.no_response_object')
      }

      const userServerSide = await login(loginInput)
      const userClientSide = await serialize(userServerSide)
      const payload = await stringify(userClientSide)
      await write(res, payload)
      return true
    },
    authenticate,
    logout: async (_req, res) => {
      if (!res) {
        throw new Error('error.no_response_object')
      }

      await clear(res)
      return true
    },
    refresh: async (req, res) => {
      try {
        const userServerSide = await authenticate(req, res)

        if (userServerSide && res) {
          const userClientSide = await serialize(userServerSide)
          const payload = await stringify(userClientSide)
          await write(res, payload)
          return true
        }
      } catch (e) {}
      return false
    },
  }
}
