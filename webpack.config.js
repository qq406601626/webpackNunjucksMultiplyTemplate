const { NODE_ENV } = process.env
const config = require(`./webpackConfig/${NODE_ENV}`)
module.exports = config
