const path = require('path')
const webpackMerge = require('webpack-merge')
const baseConfig = require('./base')
const utils = require('./utils')
const developmentConfig = {
  devtool: 'cheap-module-eval-source-map',
  output: {
    publicPath: '/'
  },
  devServer: {
    // contentBase: path.join(__dirname, '../src/pages'), // boolean | string | array, static file location
    // watchContentBase: true, // contentBase下文件变动将reload页面(默认false)
    // watchOptions:{
    //   ignored: "**/*.js"
    // }
    openPage: 'index.html', // 指定默认启动浏览器时打开的页面
    index: '/', // 指定首页位置
    host: 'localhost', // 默认localhost,想外部可访问用'0.0.0.0'
    port: 8081, // 默认8080
    inline: true, // 可以监控js变化
    hot: true, // 热启动
    open: true, // 启动时自动打开浏览器（指定打开chrome，open: 'Google Chrome'）
    compress: true, // 一切服务都启用gzip 压缩
    disableHostCheck: true, // true：不进行host检查
    quiet: false,
    https: false,
    clientLogLevel: 'none',
    stats: { // 设置控制台的提示信息
      chunks: false,
      children: false,
      modules: false,
      entrypoints: false, // 是否输出入口信息
      warnings: false,
      performance: false, // 是否输出webpack建议（如文件体积大小）
    },
    historyApiFallback: {
      disableDotRule: true,
    },
    watchOptions: {
      ignored: /node_modules/, // 略过node_modules目录
    },
    proxy: {},
  },
  plugins: utils.developmentPlugins
}

module.exports = webpackMerge(baseConfig, developmentConfig)