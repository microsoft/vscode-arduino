const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Webpack = require("webpack");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    devtool: "source-map",

    entry: [
        `${__dirname}/app/index.tsx`
    ],
    output: {
        path: `${__dirname}/../../out/views`,
        filename: "app.js"
    },
    resolve: {
        extensions: [".js", ".ts", ".tsx"]
    },
    module: {
        rules: [{
            test: /\.tsx?$/,
            loader: "ts-loader"
        }, {
            test: /\.css$/,
            use:[MiniCssExtractPlugin.loader,'css-loader'],
        }, {
            test: /\.scss$/,
            use:[MiniCssExtractPlugin.loader,'css-loader', 'sass-loader'],
        }, {
            test: /\.(eot|ttf|woff|woff2)$/,
            loader: "file-loader?name=/fonts/[name].[ext]"
        }, {
            test: /\.svg$/,
            loader: "svg-url-loader?name=/fonts/[name].[ext]"
        }]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: `${__dirname}/app/index.html`,
        }),
        // new Webpack.optimize.UglifyJsPlugin({
        //     compressor: {
        //         warnings: false,
        //     },
        // }),
        new MiniCssExtractPlugin({
            filename: "styles/app.css"
        })
    ]
};