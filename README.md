# Next.js with TypeScript, GraphQL and SSR

This repo is based on [with-typescript-graphql][1] and adds graphqhl
subscriptions. If your project doesn't need subscriptions consider using the
original repo.

## Workflow

### Setup

```shell
$ npm ci
```

### Production

```shell
$ npm run build
$ npm start
```

### Development

```shell
$ npm run dev
```

**Caution**: To test the production version without ssl, you need to disable
secure cookie:

```shell
$ COOKIE_SECURE=false npm start
```

## About login & logout

As long as Apollo does not improve the on-the-fly change of credentials as well
as the cleaning of data, especially hooks after a logout, it is necessary to
reload the entire page in order to clean the data and also reset the connections
with the new credentials :

```typescript
// after login or logout mutation
document.location.reload()
```

## Serverless deployment & WebSocket

Since WebSockets are not supported by most serverless providers, this type of
project must be deployed on a hybrid stack:

1.  A non-serverless infrastructure to manage only the websocket requests on a
    sub-domain:

    `<commit>.example.org`

2.  A serverless infra on the main domain, as can be done on Vercel:

    `example.org`

Two modifications of the code are necessary to make it compatible with this
hybrid stack:

1.  Change the link from apollo websocket to subdomain:

    `wss://<commit>.example.org`

2.  Specify in the cookie returned by the frontend server the main domain, so
    that the cookie is sent to the subdomain:

    `example.org`

<!-- -->

[1]: https://github.com/vercel/next.js/tree/canary/examples/with-typescript-graphql
