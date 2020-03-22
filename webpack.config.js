// We are using node's native package 'path'
// https://nodejs.org/api/path.html
const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');

// Constant with our paths
const paths = {
  DIST: path.resolve(__dirname, 'dist'),
  SRC: path.resolve(__dirname, 'src'),
  JS: path.resolve(__dirname, 'src/js'),
};

// Webpack configuration
module.exports = {
  entry: path.join(paths.JS, 'cnnvis.js'),
  output: {
    path: paths.DIST,
    filename: 'app.bundle.js'
  },

  plugins:[
    new HtmlWebpackPlugin({
        filename: 'CNNVis.html',
        template: path.join(paths.SRC,'CNNVis.html'),
    }),
    new HtmlWebpackPlugin({
        filename: 'MNIST.html',
        template: path.join(paths.SRC,'MNIST.html')
    }),
    new HtmlWebpackPlugin({
        filename: 'index.html',
        template: path.join(paths.SRC,'index.html')
    }),
  ]
  // devServer:{
  //   contentBase: paths.SRC
  // }
};