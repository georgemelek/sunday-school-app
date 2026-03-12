module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['expo/node_modules/babel-preset-expo'],
  }
}
