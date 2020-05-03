# Next.js with TypeScript, GraphQL and SSR

## Commited schema and types are based on an internal graphql server example

```shell
$ cd _server
$ npm ci
$ npm start
```

## Workflow

### Setup

```shell
$ npm ci
$ cp .env.example .env
$ edit .env
```

### Production

```shell
$ npm run build
$ npm start
```

### Development

```shell
$ npm run schema  # update ./schema.graphql
$ npm run codegen # update ./lib/_generated/*.ts
$ npm run dev
```

## Caveats

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
