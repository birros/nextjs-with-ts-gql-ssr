import { IncomingMessage, ServerResponse } from 'http'
import crypto from 'crypto'
import { serialize, parse, CookieSerializeOptions } from 'cookie'
import { sign, verify } from 'jsonwebtoken'

interface EncryptedObject {
  iv: string
  data: string
}

interface RequiredEnv {
  COOKIE_OPTIONS: CookieSerializeOptions
  MAX_AGE: number
  JWT_SECRET: string
  COOKIE_NAME: string
  JWT_SECRET_ENCODING: BufferEncoding
}

interface CoreEnv {
  ENCRYPTION_TYPE: string
  ENCRYPTION_ENCODING: BufferEncoding
  BUFFER_ENCRYPTION: 'utf8' | 'ascii' | 'binary'
  ENCRYPTION_KEY: Buffer
  COOKIE_OPTIONS_JWT: CookieSerializeOptions
}

type Env = RequiredEnv & CoreEnv

interface RequiredHooks<LoginInput, UserServerSide, UserClientSide> {
  login: (env: Env, loginInput: LoginInput) => Promise<UserServerSide>
  logout?: (env: Env, userServerSide: UserServerSide) => Promise<void>
  serialize: (
    env: Env,
    userServerSide: UserServerSide
  ) => Promise<UserClientSide>
  deserialize: (
    env: Env,
    userClientSide: UserClientSide
  ) => Promise<UserServerSide>
}

interface CoreHooks<UserClientSide> {
  encrypt?: (
    env: Env,
    userClientSide: UserClientSide
  ) => Promise<EncryptedObject>
  decrypt?: (
    env: Env,
    encryptedObject: EncryptedObject
  ) => Promise<UserClientSide | undefined>
  tokenize?: (env: Env, encryptedObject: EncryptedObject) => Promise<string>
  detokenize?: (
    env: Env,
    payload: string
  ) => Promise<EncryptedObject | undefined>
  write?: (env: Env, res: ServerResponse, payload: string) => Promise<void>
  read?: (env: Env, req: IncomingMessage) => Promise<string | undefined>
  clear?: (env: Env, res: ServerResponse) => Promise<void>
}

type Hooks<LoginInput, UserServerSide, UserClientSide> = RequiredHooks<
  LoginInput,
  UserServerSide,
  UserClientSide
> &
  CoreHooks<UserClientSide>

export interface AuthConfig<LoginInput, UserServerSide, UserClientSide> {
  env: RequiredEnv
  hooks: Hooks<LoginInput, UserServerSide, UserClientSide>
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

export const coreAuthConfig: CoreHooks<any> = {
  encrypt: async (env, userClientSide) => {
    const payload = JSON.stringify(userClientSide)
    const iv = crypto.randomBytes(16)

    const cipher = crypto.createCipheriv(
      env.ENCRYPTION_TYPE,
      env.ENCRYPTION_KEY,
      iv
    )
    let encrypted = cipher.update(payload, env.BUFFER_ENCRYPTION)
    encrypted = Buffer.concat([encrypted, cipher.final()])

    return {
      iv: iv.toString(env.ENCRYPTION_ENCODING),
      data: encrypted.toString(env.ENCRYPTION_ENCODING),
    }
  },
  decrypt: async (env, encryptedObject) => {
    try {
      const iv = Buffer.from(encryptedObject.iv, env.ENCRYPTION_ENCODING)
      const encrypted = Buffer.from(
        encryptedObject.data,
        env.ENCRYPTION_ENCODING
      )

      const decipher = crypto.createDecipheriv(
        env.ENCRYPTION_TYPE,
        env.ENCRYPTION_KEY,
        iv
      )
      let decrypted = decipher.update(encrypted)
      decrypted = Buffer.concat([decrypted, decipher.final()])

      const payload = decrypted.toString()
      const userClientSide = JSON.parse(payload)

      return userClientSide
    } catch (e) {}
    return undefined
  },
  tokenize: async (env, encryptedObject) => {
    const payload = sign(encryptedObject, env.JWT_SECRET)
    return payload
  },
  detokenize: async (env, payload) => {
    try {
      const encryptedObject = verify(payload, env.JWT_SECRET, {
        maxAge: `${env.MAX_AGE}s`,
      }) as EncryptedObject
      return encryptedObject
    } catch (e) {}
    return undefined
  },
  write: async (env, res, payload) => {
    const cookie = serialize(env.COOKIE_NAME, payload, env.COOKIE_OPTIONS_JWT)
    res.setHeader('Set-Cookie', cookie)
  },
  read: async (env, req) => {
    if (!req.headers.cookie) {
      return undefined
    }

    const cookies = parse(req.headers.cookie)

    if (env.COOKIE_NAME in cookies === false) {
      return undefined
    }

    const payload = cookies[env.COOKIE_NAME]
    return payload
  },
  clear: async (env, res) => {
    const cookie = serialize(env.COOKIE_NAME, '', {
      ...env.COOKIE_OPTIONS,
      maxAge: undefined,
      expires: new Date(),
    })

    res.setHeader('Set-Cookie', cookie)
  },
}

type Parameters<T> = T extends (...args: infer T) => any ? T : never

export const useAuth: UseAuth = ({
  env: envInput,
  hooks: {
    login: loginHook,
    logout: logoutHook,
    serialize,
    deserialize,
    encrypt = coreAuthConfig.encrypt,
    decrypt = coreAuthConfig.decrypt,
    tokenize = coreAuthConfig.tokenize,
    detokenize = coreAuthConfig.detokenize,
    write = coreAuthConfig.write,
    read = coreAuthConfig.read,
    clear = coreAuthConfig.clear,
  },
}) => {
  if (!encrypt) throw new Error('error.no_encrypt_function')
  if (!decrypt) throw new Error('error.no_decrypt_function')
  if (!tokenize) throw new Error('error.no_tokenize_function')
  if (!detokenize) throw new Error('error.no_detokenize_function')
  if (!write) throw new Error('error.no_write_function')
  if (!read) throw new Error('error.no_read_function')
  if (!clear) throw new Error('error.no_clear_function')

  const env: Env = {
    ...envInput,
    ENCRYPTION_TYPE: 'aes-256-cbc',
    ENCRYPTION_ENCODING: 'base64',
    BUFFER_ENCRYPTION: 'utf8',
    ENCRYPTION_KEY: Buffer.from(
      envInput.JWT_SECRET,
      envInput.JWT_SECRET_ENCODING
    ),
    COOKIE_OPTIONS_JWT: {
      ...envInput.COOKIE_OPTIONS,
      maxAge: envInput.MAX_AGE,
      httpOnly: true,
    },
  }

  const login = async (
    _req: IncomingMessage | undefined,
    res: ServerResponse | undefined,
    loginInput: Parameters<typeof loginHook>[1]
  ) => {
    if (!res) {
      throw new Error('error.no_response_object')
    }

    const userServerSide = await loginHook(env, loginInput)
    const userClientSide = await serialize(env, userServerSide)
    const encryptedObject = await encrypt(env, userClientSide)
    const payload = await tokenize(env, encryptedObject)
    await write(env, res, payload)
    return true
  }

  const authenticate = async (
    req: IncomingMessage | undefined,
    _res: ServerResponse | undefined
  ) => {
    if (!req) {
      throw new Error('error.no_request_object')
    }

    const payload = await read(env, req)
    if (payload === undefined) {
      return undefined
    }

    const encryptedObject = await detokenize(env, payload)
    if (encryptedObject === undefined) {
      return undefined
    }

    const userClientSide = await decrypt(env, encryptedObject)
    if (userClientSide === undefined) {
      return undefined
    }

    const userServerSide = await deserialize(env, userClientSide)
    return userServerSide
  }

  const logout = async (
    req: IncomingMessage | undefined,
    res: ServerResponse | undefined
  ) => {
    if (!res) {
      throw new Error('error.no_response_object')
    }

    const userServerSide = await authenticate(req, res)
    if (userServerSide && logoutHook) {
      await logoutHook(env, userServerSide)
    }

    await clear(env, res)
    return true
  }

  const refresh = async (
    req: IncomingMessage | undefined,
    res: ServerResponse | undefined
  ) => {
    try {
      const userServerSide = await authenticate(req, res)

      if (userServerSide && res) {
        const userClientSide = await serialize(env, userServerSide)
        const encryptedObject = await encrypt(env, userClientSide)
        const payload = await tokenize(env, encryptedObject)
        await write(env, res, payload)
        return true
      }
    } catch (e) {}
    return false
  }

  return {
    login,
    authenticate,
    logout,
    refresh,
  }
}
