const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const merge = require('webpack-merge')
const nodeExternals = require('webpack-node-externals')
const webpack = require('webpack')
require('dotenv').config()

const common = require('./webpack.common.js')
const commonConfig = { ...common }
delete commonConfig.env

const NODE_ENV = 'development'

module.exports = merge.smart(commonConfig, {
  devtool: 'inline-source-map',
  entry: ['webpack/hot/poll?1000', common.entry],
  externals: [
    nodeExternals({
      whitelist: ['webpack/hot/poll?1000'],
    }),
  ],
  mode: NODE_ENV,
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.EnvironmentPlugin({
      ...common.env,
      NODE_ENV: NODE_ENV,
    }),
  ],
  watch: true,
})
