const { md } = require('./dist/generator')
const helpers = require('./dist/helpers/index')

module.exports = function(plop) {
  plop.setGenerator('md', md)

  Object.entries(helpers).forEach(([key, helper]) => {
    plop.setHelper(key, helper)
  })
}
