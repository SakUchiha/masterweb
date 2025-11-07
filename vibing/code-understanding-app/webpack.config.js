const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: "production",
  entry: {
    main: "./js/main.js",
    app: "./js/app.js",
    ui: "./js/ui.js",
    api: "./js/api.js",
    editor: "./js/editor.js",
    ai: "./js/ai.js",
    navigation: "./js/navigation.js",
    "syntax-highlighter": "./js/syntax-highlighter.js",
    "syntax-checker": "./js/syntax-checker.js",
    "progress-tracker": "./js/progress-tracker.js",
    "error-boundary": "./js/error-boundary.js",
    "error-handler": "./js/error-handler.js",
    form: "./js/form.js",
    config: "./js/config.js",
    "lazy-loader": "./js/lazy-loader.js",
  },
  output: {
    path: path.resolve(__dirname, "frontend"),
    filename: "js/[name].[contenthash].js",
    clean: false, // Don't clean to preserve existing files
    publicPath: '',
    globalObject: 'this',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
        generator: {
          filename: "images/[name].[hash][ext]",
        },
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: "asset/resource",
        generator: {
          filename: "fonts/[name].[hash][ext]",
        },
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "js"),
          to: path.resolve(__dirname, "frontend/js")
        },
        {
          from: path.resolve(__dirname, "css"),
          to: path.resolve(__dirname, "frontend/css")
        },
        {
          from: path.resolve(__dirname, "backend/server.js/data"),
          to: path.resolve(__dirname, "frontend/data")
        },
        {
          from: path.resolve(__dirname, "data"),
          to: path.resolve(__dirname, "frontend/data")
        },
        {
          from: path.resolve(__dirname, "manifest.json"),
          to: path.resolve(__dirname, "frontend/manifest.json")
        },
        {
          from: path.resolve(__dirname, "sw.js"),
          to: path.resolve(__dirname, "frontend/sw.js")
        },
        {
          from: path.resolve(__dirname, "favicon.ico"),
          to: path.resolve(__dirname, "frontend/favicon.ico")
        },
        {
          from: path.resolve(__dirname, "favicon-dark.ico"),
          to: path.resolve(__dirname, "frontend/favicon-dark.ico")
        },
        // Removed HTML files from copy since they're handled by HtmlWebpackPlugin
      ],
    }),
    new MiniCssExtractPlugin({
      filename: "css/[name].[contenthash].css",
    }),
    // Disable HTML plugins for Vercel - use static files instead
    // HTML files are copied directly to frontend directory
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ["console.log", "console.info", "console.debug"],
          },
          mangle: true,
          output: {
            comments: false,
          },
        },
      }),
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: [
            "default",
            {
              discardComments: { removeAll: true },
            },
          ],
        },
      }),
    ],
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all",
          priority: 10,
        },
        common: {
          name: "common",
          minChunks: 2,
          chunks: "all",
          enforce: true,
        },
      },
    },
  },
  resolve: {
    extensions: [".js", ".json"],
    alias: {
      "@": path.resolve(__dirname, "frontend/js"),
      "@css": path.resolve(__dirname, "frontend/css"),
      "@data": path.resolve(__dirname, "frontend/data"),
    },
  },
  devtool: false, // Disable source maps for production
  performance: {
    hints: "warning",
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
};
