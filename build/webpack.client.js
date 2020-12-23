// path为Node的核心模块
const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const OptimizeCss = require('optimize-css-assets-webpack-plugin')
const CompressionWebpackPlugin = require('compression-webpack-plugin')
const nodeEnv = (process.env.NODE_ENV || 'production').slice(0, 3)
const find = require('find')
const extend = require('extend')
const configProfile = require('../src/config')
const imgdomain = configProfile.imgdomain.split(':').slice(1).join(':')
const qiniurc = require('../.qiniurc.js')

// 处理静态资源的文件夹根目录
const assetsPath = v => path.posix.join('static', v)

// 处理html中js和css得引入问题
function HtmlDealPlugin(options) { }
HtmlDealPlugin.prototype.apply = function (compiler) {
  compiler.plugin('compilation', function (compilation) {
    compilation.plugin('html-webpack-plugin-after-html-processing', function (
      htmlPluginData,
    ) {
      let scriptStr = ''
      let styleStr = ''
      if (htmlPluginData.assets.js) {
        htmlPluginData.assets.js.forEach(function (item) {
          scriptStr += '<script src="' + item + '"></script>\n'
        })
      }

      if (htmlPluginData.assets.css) {
        htmlPluginData.assets.css.forEach(function (item) {
          styleStr += '<link rel="stylesheet" href="' + item + '"/>\n'
        })
      }

      if (styleStr) {
        styleStr = `{% block css %}\n${styleStr}{% endblock %}\n`
      }
      if (scriptStr) {
        scriptStr = `{% block javascript %}\n${scriptStr}{% endblock %}\n`
      }
      if (styleStr || scriptStr) {
        htmlPluginData.html = `${styleStr}${scriptStr}${htmlPluginData.html}`
      }
    })
  })
}
// 处理入口文件和html文件
function HtmlConfig(entryConfig = {}) {
  this.entryConfig = entryConfig
  this.layerConfig = {}
}
HtmlConfig.prototype = {
  push(obj) {
    if (!obj.path) {
      this.layerConfig[obj.html] = ''
      return
    }
    let count = this.getChunk(obj.name, true)
    if (count !== '') {
      this.entryConfig[count] = extend(true, {}, this.entryConfig[count], obj)
      return
    }
    // 查找数字
    for (let i = 1; i < 100; i++) {
      if (!this.entryConfig[count]) {
        count = i
        break
      }
    }
    count = Math.max(...Object.keys(this.entryConfig), -1) + 1
    this.entryConfig[count] = obj
  },
  getChunk(name, ignore = false) {
    let resultChunk = ''
    Object.keys(this.entryConfig).forEach(chunk => {
      if (this.entryConfig[chunk].name === name) {
        resultChunk = chunk
      }
    })
    if (!resultChunk && !ignore) {
      throw new Error('不存在该chunk: ' + name)
    }
    return resultChunk
  },
  getEntry(base = '') {
    let resultObj = {}
    Object.keys(this.entryConfig).forEach(key => {
      resultObj[key] = base + this.entryConfig[key].path
    })
    console.log('扫描到的entry: ', JSON.stringify(resultObj))
    return resultObj
  },
  getHtmlWebpachPlugin() {
    let arr = []
    Object.keys(this.layerConfig).forEach(key => {
      arr.push(
        new HtmlWebpackPlugin({
          template: `fe/pages/${key}`,
          filename: `views/${key}`,
          inject: false,
          chunks: [],
        }),
      )
    })
    Object.keys(this.entryConfig).forEach(chunk => {
      let item = this.entryConfig[chunk]
      arr.push(
        new HtmlWebpackPlugin({
          template: `fe/pages/${item.html}`,
          filename: `views/${item.html}`,
          inject: false,
          chunks: [chunk],
        }),
      )
    })
    return arr
  },
}
const htmlConfing = new HtmlConfig()

const pagesPath = path.resolve(__dirname, '../fe/pages')
const files = find.fileSync(/\.njk$/, path.resolve(__dirname, '../fe/pages'))
files.forEach(item => {
  let jsPath = item.slice(0, -3) + 'js'
  if (fs.existsSync(jsPath)) {
    jsPath = path.relative(pagesPath, jsPath).replace(/\\/, '/')
  } else {
    jsPath = ''
  }
  const htmlPath = path.relative(pagesPath, item).replace(/\\/, '/')
  const name = htmlPath.slice(0, -4)
  htmlConfing.push({ name, path: jsPath, html: htmlPath })
})
const webpackConfig = {
  mode: nodeEnv === 'dev' ? 'development' : 'production',
  devtool: nodeEnv === 'dev' ? 'cheap-module-source-map' : 'none',
  entry: htmlConfing.getEntry('./fe/pages/'),
  output: {
    filename: assetsPath('js/[name].[contenthash:8].js'),
    chunkFilename: '[name].js',
    path: path.resolve(__dirname, '../dist'),
    publicPath: nodeEnv === 'pro' ? `${imgdomain}/${qiniurc.prefix}`: nodeEnv === 'uat' ? `${imgdomain}/${qiniurc.prefix}`: '/', // cdn
    // publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.(png|jpe?g|gif|svg|webp)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 10000,
            name: assetsPath('images/[name].[contenthash:8].[ext]'),
          },
        },
      },
      {
        test: /\.(css|styl)$/,
        use: [
          'style-loader',
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              hmr: true,
              reloadAll: true,
            },
          },
          {
            loader: 'css-loader',
            options: {
              // modules: true // css modules 模式
            },
          },
          'postcss-loader',
          'stylus-loader',
        ],
      },
      // 两种使用方式，第一种需要引入html-loader，第二种不需要引入任何loader
      // <img src="/static/images/test-1.jpg">
      // <img src="${require('./images/test-1.jpg')}"></img>
      // {
      //   test: /\.(njk)$/,
      //   use: {
      //     loader: 'html-loader',
      //   },
      // },
    ],
  },
  plugins: [
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, '../fe/static'),
        to: path.resolve(__dirname, '../dist/static'),
      },
      {
        from: path.resolve(__dirname, '../fe/favicon.ico'),
        to: path.resolve(__dirname, '../dist/favicon.ico'),
        toType: 'file',
      },
    ]),
    new webpack.ProvidePlugin({
      $: 'jquery',
    }),
    new webpack.ProgressPlugin(),
    new MiniCssExtractPlugin({
      filename: assetsPath('css/[name].[contenthash:8].css'),
      chunkFilename: '[id].css',
    }),
    // new webpack.ProvidePlugin({$: 'jquery'}),
    ...htmlConfing.getHtmlWebpachPlugin(),
    new HtmlDealPlugin(),
    new OptimizeCss(),
    new CompressionWebpackPlugin({
      filename: '[path].gz[query]', // 目标文件名
      algorithm: 'gzip', // 使用gzip压缩
      test: /\.(js|css)(\?.*)?$/,
      threshold: 10240, // 资源文件大于10240B=10kB时会被压缩
      minRatio: 0.8, // 最小压缩比达到0.8时才会被压缩
    }),
    new webpack.DefinePlugin({
      'process.env.configProfile': JSON.stringify(configProfile)
    })
  ],
  optimization: {
    // splitChunks: {
    //   chunks: 'all',
    // },
    usedExports: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../fe'),
    },
    extensions: ['.js', '.json', 'njk'],
  },
  externals: {
    jquery: 'window.$',
  },
}

if (nodeEnv !== 'dev') {
  webpackConfig.plugins.unshift(
    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: [
        'static',
        'views',
        'favicon.ico',
        '!server.js',
      ],
      verbose: true,
    }),
  )
}

if (process.env.analyz) {
  webpackConfig.plugins.push(new BundleAnalyzerPlugin())
}
module.exports = webpackConfig
