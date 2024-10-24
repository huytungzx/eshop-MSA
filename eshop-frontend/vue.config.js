const HtmlWebpackPlugin = require('html-webpack-plugin');
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
const webpack = require('webpack');

module.exports = {
    css: {
        extract: false,
    },
    configureWebpack: {
        output: {
            filename: "app.js",
            chunkFilename: '[id].js'
        },
        plugins: [
            new webpack.optimize.LimitChunkCountPlugin({
                maxChunks: 1,
            }),
            new HtmlWebpackPlugin({
                title: "frontend",
                inject: true,
                template: 'public/index.html',
                favicon: 'public/favicon.ico'
            }),
            new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/\.(js|css)$/]),
        ],
    }
}