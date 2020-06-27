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

### Change env vars

```shell
$ cp .env.example .env
$ edit .env
```

Or

```shell
$ export PORT=4000
$ export API_PORT=4001
```

### Reverse proxy

In order to keep the same origin as a vanilla nextjs use a reverse proxy:

```shell
$ docker-compose -f build-aux/reverse-proxy/docker-compose.yaml up -d # start
$ docker-compose -f build-aux/reverse-proxy/docker-compose.yaml down  # stop
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

<!-- -->

[1]: https://github.com/vercel/next.js/tree/master/examples/with-typescript-graphql
