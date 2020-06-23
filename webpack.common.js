const path = require('path')

module.exports = {
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: 'ts-loader?configFile=tsconfig.api.json',
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
  entry: path.join(__dirname, 'api/index.ts'),
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  target: 'node',
}
