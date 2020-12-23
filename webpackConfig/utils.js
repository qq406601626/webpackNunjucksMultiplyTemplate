const glob = require('glob')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
let entry, templates, developmentPlugins, productionPlugins
// 1、扫描src目录下所有文件夹，如果文件夹中包含html，则检查是否有同名的js文件，如果有，则打包该js文件
// 2、把js文件引入到html中
const getFiles = (filesPath) => {
  let files = glob.sync(path.join(__dirname, filesPath))
  let obj = {}
  let filePath, fileKey, extname
  for (let i = 0; i < files.length; i++) {
    filePath = path.resolve(files[i])
    extname = path.extname(filePath) // 文件后缀 eg: .js
    fileKey = filePath.replace(path.join(__dirname, '../src/pages/'), '').replace(extname, '')// 入口key eg: spacial/fifth/index
    obj[fileKey] = filePath
  }
  return obj
}
const getDevelopmentHtmlWebpackPlugins = () => {
  let htmlWebpackPlugins = []
  let setting = null
  for (let name in templates) {
    setting = {
      filename: `${name}.html`,
      template:templates[name],
      inject: false, // js插入的位置，true/'head'/'body'/false
      cache:false,
    }
    // (仅)有入口的模版自动引入资源
    if (name in entry) {
      setting.chunks = [name]
      setting.inject = true
    }
    htmlWebpackPlugins.push(new HtmlWebpackPlugin(setting))
    setting = null
  }
  return htmlWebpackPlugins
}
const getProductionHtmlWebpackPlugins = () => {
  let htmlWebpackPlugins = []
  let setting = null
  for (let name in templates) {
    setting = {
      filename: `${name}.html`,
      template: templates[name],
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
      inject: false, // js插入的位置，true/'head'/'body'/false
    }
    // (仅)有入口的模版自动引入资源
    if (name in entry) {
      setting.chunks = ['manifest', 'vendor', 'common', name]
      setting.inject = true
    }
    htmlWebpackPlugins.push(new HtmlWebpackPlugin(setting))
    setting = null
  }
  return htmlWebpackPlugins
}
entry = getFiles('../src/pages/**/*.js')
templates = getFiles('../src/pages/**/*.njk')
developmentPlugins = getDevelopmentHtmlWebpackPlugins()
productionPlugins = getProductionHtmlWebpackPlugins()
module.exports = {
  entry, templates, developmentPlugins,productionPlugins
}