import { IncomingMessage, ServerResponse } from 'http'

export interface AuthConfig<LoginInput, UserServerSide, UserClientSide> {
  login: (loginInput: LoginInput) => Promise<UserServerSide>
  serialize: (userServerSide: UserServerSide) => Promise<UserClientSide>
  stringify: (userClientSide: UserClientSide) => Promise<string>
  write: (res: ServerResponse, payload: string) => Promise<void>
  read: (req: IncomingMessage) => Promise<string | undefined>
  parse: (payload: string) => Promise<UserClientSide>
  deserialize: (userClientSide: UserClientSide) => Promise<UserServerSide>
  clear: (res: ServerResponse) => Promise<void>
  csrf: (req: IncomingMessage) => Promise<void>
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
  ) => Promise<void>
  logout: (
    req: IncomingMessage | undefined,
    res: ServerResponse | undefined
  ) => Promise<void>
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
  csrf,
}) => {
  return {
    login: async (req, res, loginInput) => {
      if (!req) {
        throw new Error('error.no_request_object')
      }
      if (!res) {
        throw new Error('error.no_response_object')
      }

      csrf(req)
      const userServerSide = await login(loginInput)
      const userClientSide = await serialize(userServerSide)
      const payload = await stringify(userClientSide)
      await write(res, payload)
    },
    authenticate: async (req, _res, checkCSRF = false) => {
      if (!req) {
        throw new Error('error.no_request_object')
      }

      if (checkCSRF) {
        csrf(req)
      }

      const payload = await read(req)
      if (payload === undefined) {
        return undefined
      }

      const userClientSide = await parse(payload)
      const userServerSide = deserialize(userClientSide)
      return userServerSide
    },
    logout: async (req, res) => {
      if (!req) {
        throw new Error('error.no_request_object')
      }
      if (!res) {
        throw new Error('error.no_response_object')
      }

      csrf(req)
      clear(res)
    },
  }
}
