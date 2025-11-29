const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const webpack = require("webpack");

const WALDO_API = "https://where-is-waldo-api-vczk.onrender.com";

module.exports = merge(common, {
  mode: "production",
  devtool: "source-map",
  plugins: [new webpack.DefinePlugin({
    API_URL: JSON.stringify(WALDO_API)
  })],
});
