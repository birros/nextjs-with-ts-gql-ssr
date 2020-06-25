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

## About login & logout

As long as Apollo does not improve the on-the-fly change of credentials as well
as the cleaning of data, especially hooks after a logout, it is necessary to
reload the entire page in order to clean the data and also reset the connections
with the new credentials :

```typescript
// after login or logout mutation
document.location.reload()
```
