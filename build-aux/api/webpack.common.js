const path = require('path')
require('dotenv').config()

module.exports = {
  // CAUTION: env section is not officialy a webpack conf, this section is used
  // to set common env vars.
  // Default values comes from .env.example
  // @TODO: parse .env.example directly
  env: {
    PORT: process.env.API_PORT || 3000,
    API_PORT: process.env.API_PORT || 3001,
    COOKIE_SECURE: process.env.COOKIE_SECURE || true,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: 'ts-loader?configFile=build-aux/api/tsconfig.api.json',
      },
      {
        test: /\.graphql$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-typescript', '@babel/preset-react'],
            },
          },
          { loader: 'graphql-let/loader' },
        ],
      },
      {
        test: /\.graphqls$/,
        exclude: /node_modules/,
        use: ['graphql-tag/loader', 'graphql-let/schema/loader'],
      },
    ],
  },
  entry: path.resolve(__dirname, '..', '..', 'api', 'index.ts'),
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, '..', '..', '.dist'),
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  target: /** @type {'node'} */ ('node'),
}
