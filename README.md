# Next.js with TypeScript, GraphQL and SSR

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

## Caveats

### About GraphQL subscription & SSR

For a subscription to work in ssr mode ensure that an equivalent query,
retrieving exactly the same content as the subscription, is interpretable by the server.

Example, the following subscription...

```graphql
subscription ExampleSubscription {
  counter {
    count
  }
}
```

...requires the following query to be interpretable by the server.

```graphql
query ExampleQuery {
  counter {
    count
  }
}
```
