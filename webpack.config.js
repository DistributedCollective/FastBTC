const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: {
    main: ['./src/main.js', './src/styles.css'],
    dirPagination: ['./src/dirPagination.js'],
    db: ['./src/db.js'],
  },
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: 'src/index.html',
          to: ''
        },
        {
          from: 'src/db.html',
          to: ''
        },
        {
          from: 'src/db2.html',
          to: ''
        },
        {
          from: 'src/summary.html',
          to: ''
        },
        {
          from: 'src/styles.css',
          to: ''
        },
      ],
    }),
  ],
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
};
