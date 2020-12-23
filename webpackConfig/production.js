const webpackMerge = require('webpack-merge')
const baseConfig = require('./base')
const utils = require('./utils')
const productionConfig = {
  devtool:'cheap-module-source-map',
  plugins:utils.productionPlugins
}
module.exports = webpackMerge(baseConfig, productionConfig)