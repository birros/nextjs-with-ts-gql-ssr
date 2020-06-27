const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const merge = require('webpack-merge')
const nodeExternals = require('webpack-node-externals')
const webpack = require('webpack')
require('dotenv').config()

const common = require('./webpack.common.js')
const commonConfig = { ...common }
delete commonConfig.env

const NODE_ENV = 'production'

module.exports = merge(commonConfig, {
  devtool: 'source-map',
  externals: [nodeExternals({})],
  mode: NODE_ENV,
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.EnvironmentPlugin({
      ...common.env,
      NODE_ENV: NODE_ENV,
    }),
  ],
})
