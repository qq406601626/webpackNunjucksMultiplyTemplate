const profile = (process.env.NODE_ENV || 'dev').slice(0, 3)
const configProfile = require(`./${profile}`)
module.exports = configProfile

