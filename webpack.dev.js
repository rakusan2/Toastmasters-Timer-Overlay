const merge = require('webpack-merge');
const common = require('./webpack.common.js');
var LiveReloadPlugin = require('webpack-livereload-plugin');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  plugins: [
    new LiveReloadPlugin({ appendScriptTag: true })
  ]
});