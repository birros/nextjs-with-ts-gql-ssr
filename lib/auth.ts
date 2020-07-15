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
}) => {
  return {
    login: async (_req, res, loginInput) => {
      if (!res) {
        throw new Error('error.no_response_object')
      }

      const userServerSide = await login(loginInput)
      const userClientSide = await serialize(userServerSide)
      const payload = await stringify(userClientSide)
      await write(res, payload)
    },
    authenticate: async (req, _res) => {
      if (!req) {
        throw new Error('error.no_request_object')
      }

      const payload = await read(req)
      if (payload === undefined) {
        return undefined
      }

      const userClientSide = await parse(payload)
      const userServerSide = deserialize(userClientSide)
      return userServerSide
    },
    logout: async (_req, res) => {
      if (!res) {
        throw new Error('error.no_response_object')
      }

      clear(res)
    },
  }
}
