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
    main: "./frontend/js/main.js",
    app: "./frontend/js/app.js",
    ui: "./frontend/js/ui.js",
    api: "./frontend/js/api.js",
    editor: "./frontend/js/editor.js",
    ai: "./frontend/js/ai.js",
    navigation: "./frontend/js/navigation.js",
    "syntax-highlighter": "./frontend/js/syntax-highlighter.js",
    "syntax-checker": "./frontend/js/syntax-checker.js",
    "progress-tracker": "./frontend/js/progress-tracker.js",
    "error-boundary": "./frontend/js/error-boundary.js",
    "error-handler": "./frontend/js/error-handler.js",
    form: "./frontend/js/form.js",
    config: "./frontend/js/config.js",
    "lazy-loader": "./frontend/js/lazy-loader.js",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "js/[name].[contenthash].js",
    clean: true,
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
          from: path.resolve(__dirname, "frontend/js"),
          to: path.resolve(__dirname, "dist/js")
        },
        {
          from: path.resolve(__dirname, "frontend/css"),
          to: path.resolve(__dirname, "dist/css")
        },
        {
          from: path.resolve(__dirname, "backend/server.js/data"),
          to: path.resolve(__dirname, "dist/data")
        },
        {
          from: path.resolve(__dirname, "frontend/data"),
          to: path.resolve(__dirname, "dist/data")
        },
        {
          from: path.resolve(__dirname, "frontend/manifest.json"),
          to: path.resolve(__dirname, "dist/manifest.json")
        },
        {
          from: path.resolve(__dirname, "frontend/sw.js"),
          to: path.resolve(__dirname, "dist/sw.js")
        },
        {
          from: path.resolve(__dirname, "frontend/favicon.ico"),
          to: path.resolve(__dirname, "dist/favicon.ico")
        },
        {
          from: path.resolve(__dirname, "frontend/favicon-dark.ico"),
          to: path.resolve(__dirname, "dist/favicon-dark.ico")
        },
        // Removed HTML files from copy since they're handled by HtmlWebpackPlugin
      ],
    }),
    new MiniCssExtractPlugin({
      filename: "css/[name].[contenthash].css",
    }),
    new HtmlWebpackPlugin({
      template: "./frontend/index.html",
      filename: "index.html",
      chunks: ["main", "app", "ui", "api", "navigation", "lazy-loader"],
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
      },
      base: "/",
    }),
    new HtmlWebpackPlugin({
      template: "./frontend/lessons.html",
      filename: "lessons.html",
      chunks: ["main", "app", "ui", "api", "navigation"],
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
      },
    }),
    new HtmlWebpackPlugin({
      template: "./frontend/editor.html",
      filename: "editor.html",
      chunks: [
        "main",
        "config",
        "error-boundary",
        "error-handler",
        "api",
        "ui",
        "editor",
        "syntax-highlighter",
        "syntax-checker",
        "progress-tracker",
      ],
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
      },
    }),
    new HtmlWebpackPlugin({
      template: "./frontend/ai.html",
      filename: "ai.html",
      chunks: ["main", "ai", "api"],
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
      },
    }),
    new HtmlWebpackPlugin({
      template: "./frontend/lesson-viewer.html",
      filename: "lesson-viewer.html",
      chunks: ["main", "app", "ui", "api"],
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
      },
    }),
    new HtmlWebpackPlugin({
      template: "./frontend/study-guide.html",
      filename: "study-guide.html",
      chunks: ["main", "app", "ui"],
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
      },
    }),
    new HtmlWebpackPlugin({
      template: "./frontend/contact.html",
      filename: "contact.html",
      chunks: ["main", "form"],
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
      },
    }),
    new HtmlWebpackPlugin({
      template: "./frontend/ask-ai.html",
      filename: "ask-ai.html",
      chunks: ["main", "ai", "api"],
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
      },
    }),
    new HtmlWebpackPlugin({
      template: "./frontend/code-explainer.html",
      filename: "code-explainer.html",
      chunks: ["main", "ai", "api"],
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
      },
    }),
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
