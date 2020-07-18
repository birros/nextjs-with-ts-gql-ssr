import crypto from 'crypto'
import { AuthConfig, EncryptedObject } from './auth'
import { serialize, parse, CookieSerializeOptions } from 'cookie'
import { sign, verify } from 'jsonwebtoken'
import {
  COOKIE_OPTIONS,
  MAX_AGE,
  JWT_SECRET,
  COOKIE_NAME,
  JWT_SECRET_ENCODING,
} from './constants'
import {
  RefreshDocument,
  RefreshMutation,
} from '../graphql/RefreshMutation.graphql'
import { RefreshCallback } from './autoRefresh'
import { LogoutCallback } from './autoLogout'
import {
  LogoutDocument,
  LogoutMutation,
} from '../graphql/LogoutMutation.graphql'

const ENCRYPTION_TYPE = 'aes-256-cbc'
const ENCRYPTION_ENCODING = 'base64'
const BUFFER_ENCRYPTION = 'utf8'
const ENCRYPTION_KEY = Buffer.from(JWT_SECRET, JWT_SECRET_ENCODING)
const COOKIE_OPTIONS_JWT: CookieSerializeOptions = {
  ...COOKIE_OPTIONS,
  maxAge: MAX_AGE,
  httpOnly: true,
}
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
  encrypt: async (userClientSide) => {
    const payload = JSON.stringify(userClientSide)
    const iv = crypto.randomBytes(16)

    const cipher = crypto.createCipheriv(ENCRYPTION_TYPE, ENCRYPTION_KEY, iv)
    let encrypted = cipher.update(payload, BUFFER_ENCRYPTION)
    encrypted = Buffer.concat([encrypted, cipher.final()])

    return {
      iv: iv.toString(ENCRYPTION_ENCODING),
      data: encrypted.toString(ENCRYPTION_ENCODING),
    }
  },
  tokenize: async (encryptedObject) => {
    const payload = sign(encryptedObject, JWT_SECRET)
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

    const payload = cookies[COOKIE_NAME]
    return payload
  },
  detokenize: async (payload) => {
    try {
      const encryptedObject = verify(payload, JWT_SECRET, {
        maxAge: `${MAX_AGE}s`,
      }) as EncryptedObject
      return encryptedObject
    } catch (e) {}
    return undefined
  },
  decrypt: async (encryptedObject) => {
    try {
      const iv = Buffer.from(encryptedObject.iv, ENCRYPTION_ENCODING)
      const encrypted = Buffer.from(encryptedObject.data, ENCRYPTION_ENCODING)

      const decipher = crypto.createDecipheriv(
        ENCRYPTION_TYPE,
        ENCRYPTION_KEY,
        iv
      )
      let decrypted = decipher.update(encrypted)
      decrypted = Buffer.concat([decrypted, decipher.final()])

      const payload = decrypted.toString()
      const userClientSide: UserClientSide = JSON.parse(payload)

      return userClientSide
    } catch (e) {}
    return undefined
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
}

export const refreshCallback: RefreshCallback = async (client) => {
  const { data, errors } = await client.mutate<RefreshMutation>({
    mutation: RefreshDocument,
  })
  const connected = !errors && data ? data.refresh : false
  return connected
}

export const logoutCallback: LogoutCallback = async (client) => {
  if (client) {
    await client.mutate<LogoutMutation>({
      mutation: LogoutDocument,
    })
  }
  document.location.reload()
}
