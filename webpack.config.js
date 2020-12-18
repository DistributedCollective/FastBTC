const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: [
    './src/initweb3.js',
    './src/main.js'
  ],
  devtool: 'inline-source-map',
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: 'src/index.html',
          to: ''
        },
      ],
    }),
  ],
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
