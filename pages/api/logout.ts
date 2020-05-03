import { NextApiHandler } from 'next'
import { serialize } from 'cookie'
import { withCSRFHandler } from '../../lib/csrf'

const logout: NextApiHandler = async (_, res) => {
  res.setHeader(
    'Set-Cookie',
    serialize('bearer', '', { path: '/', expires: new Date() })
  )

  return res.writeHead(302, { Location: '/' }).end()
}

export default withCSRFHandler(logout)
