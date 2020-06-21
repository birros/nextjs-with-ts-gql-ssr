import React, { createContext, useContext } from 'react'
import { NextApiHandler, NextPage } from 'next'
import { IncomingMessage, ServerResponse } from 'http'
import Cookies from 'universal-cookie'
import Tokens from 'csrf'
import { serialize } from 'cookie'

const getCSRFSecret = (
  req: IncomingMessage | undefined,
  res: ServerResponse | undefined
): string => {
  const cookies = new Cookies(!process.browser ? req?.headers.cookie : null)
  let csrf_secret = cookies.get('csrf_secret')

  if (!csrf_secret && !process.browser) {
    const tokens = new Tokens()
    csrf_secret = tokens.secretSync()
    res?.setHeader(
      'Set-Cookie',
      serialize('csrf_secret', csrf_secret, { path: '/' })
    )
  }

  return csrf_secret
}

const generateCSRFToken = (secret: string) => new Tokens().create(secret)

const isCSRFTokenValid = (secret: string, token: string) =>
  !secret || !token || !new Tokens().verify(secret, token)

const CSRFSecretContext = createContext('')

const createCSRFToken = () => {
  const csrf_secret = useContext(CSRFSecretContext)
  return generateCSRFToken(csrf_secret)
}

interface PageProps {
  _csrf_secret: string
}

export const withCSRF = (Page: NextPage<any>) => {
  const Component: NextPage<PageProps> = ({ _csrf_secret, ...props }) => (
    <CSRFSecretContext.Provider value={_csrf_secret}>
      <Page {...props} />
    </CSRFSecretContext.Provider>
  )
  Component.getInitialProps = async (ctx) => {
    const pageProps = Page.getInitialProps
      ? await Page.getInitialProps(ctx)
      : {}
    const _csrf_secret = getCSRFSecret(ctx.req, ctx.res)

    return {
      ...pageProps,
      _csrf_secret,
    }
  }
  return Component
}

export const InputHiddenCSRF: React.FC = () => (
  <input type="hidden" name="csrf_token" value={createCSRFToken()} />
)

export const withCSRFHandler = (handler: NextApiHandler) => {
  const middleware: NextApiHandler = (req, res) => {
    const csrf_secret = getCSRFSecret(req, res)
    const csrf_token = req.body.csrf_token

    if (isCSRFTokenValid(csrf_secret, csrf_token)) {
      return res.status(403).send('CSRF error')
    }

    if (req.method === 'POST') {
      return handler(req, res)
    }

    return res.status(501).send('Not implemented')
  }
  return middleware
}
