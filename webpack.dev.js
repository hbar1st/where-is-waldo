const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const webpack = require("webpack");

module.exports = merge(common, {
  plugins: [new webpack.DefinePlugin({
    API_URL: JSON.stringify("http://localhost:3000")
  })],
  mode: "development",
    devtool: "eval-source-map",
    devServer: {
      watchFiles: ["./src/template.html"],
    },
});
