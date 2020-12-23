// https://www.atyantik.com/setting-up-webpack-with-typescript-part-3-2-the-novice-programmer/
const NODE_ENV = process.env.NODE_ENV
const path = require('path')
const fs = require('fs')
const webpack = require('webpack')
const {CleanWebpackPlugin} = require('clean-webpack-plugin') // 清空打包目录的插件

const nodeExternals = require('webpack-node-externals')

const assetsPath = v => path.posix.join('/static/', v)

const isProduction =
  typeof NODE_ENV !== 'undefined' && NODE_ENV === 'production'
const mode = isProduction ? 'production' : 'development'

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), {encoding: 'utf-8'}))
// 处理package.json问题
if(!fs.existsSync(path.join(__dirname, '../dist'))){
  fs.mkdirSync(path.join(__dirname, '../dist'))
}
let resultPackage = {}
;['name','version','main','author','dependencies'].forEach(key => resultPackage[key] = packageJson[key])
fs.writeFileSync(path.join(__dirname, '../dist/package.json'), JSON.stringify(resultPackage, null, 2), {encoding: 'utf-8'})
fs.writeFileSync(path.join(__dirname, '../dist/.babelrc'), fs.readFileSync(path.join(__dirname, '../.babelrc'), {encoding: 'utf-8'}))
fs.writeFileSync(path.join(__dirname, '../dist/postcss.config.js'), fs.readFileSync(path.join(__dirname, '../postcss.config.js'), {encoding: 'utf-8'}))

module.exports = {
  target: 'node',
  mode,
  devtool: false,
  entry: {
    server: '../server/server.js',
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, '../dist'),
  },
  externals: [nodeExternals()],
  context: path.join(__dirname, '../server'),
  node: {
    __filename: false,
    __dirname: false,
  },
  resolve: {
    alias: {
      '@': path.join(__dirname, '../server'),
      '@@': path.join(__dirname, '../fe'),
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
      {
        test: /\.(png|jpe?g|gif|svg|webp)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 10000,
            name: assetsPath('/images/[name].[contenthash:8].[ext]'),
          },
        },
      },
    ],
  },
  plugins: [
    new webpack.ProgressPlugin(),
    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: ['server.js'],
      verbose: true,
    }),
  ],
  optimization: {
    // splitChunks: {
    //   chunks: 'all'
    // },
  },
}
