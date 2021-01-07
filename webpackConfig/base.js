const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const utils = require('./utils')
const environmentConfig = require('../environmentConfig')
const styleLoader = process.env.NODE_ENV === 'development' ? 'style-loader' : MiniCssExtractPlugin.loader // 在启用dev-server时，mini-css-extract-plugin插件不能使用contenthash给文件命名 => 所以本地起dev-server服务调试时，使用style-loader
module.exports = {
  entry: utils.entry,
  output: {
    path: path.join(__dirname, '../dist'),
    filename: '[name].js'
  },
  module: {
    rules: [{
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.(css|styl)$/,
        use: [
          styleLoader,
          'css-loader',
          'postcss-loader',
          'stylus-loader',
        ],
      },
      {
        test: /\.(html|njk)$/,
        use: [{
            loader: 'html-loader',
          },
          {
            loader: path.resolve(__dirname, '../src/libs/nunjucks-html-loader.js'),
            options: {
              searchPaths: [
                path.join(__dirname, '../src/pages'),
              ],
              // filters: require('./filters'),
              context: {
                environmentConfig
              },
              contextFileName:'context'
            }
          },
        ]
      },
    ],
  },
  resolve: {
    extensions: [".js", ".json", ".jsx", ".css"],
  },
  // alias: {},
  target: 'web',
  plugins: [
    new CopyWebpackPlugin([{
      from: path.resolve(__dirname, '../static'),
      to: path.resolve(__dirname, '../dist/static'),
    }, ]),
    new MiniCssExtractPlugin({
      filename: 'static/css/[name].[contenthash:7].css',
      chunkFilename: 'static/css/[name].[contenthash:7].css',
    }),
  ],
}