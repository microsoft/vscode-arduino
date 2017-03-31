const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Webpack = require("webpack");
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const SpritesmithPlugin = require('webpack-spritesmith');

module.exports = {
    devtool: "source-map",
    entry: [
        `${__dirname}/app/index.tsx`
    ],
    output: {
        path: `${__dirname}/../out/html`,
        filename: "app.js"
    },
    resolve: {
        extensions: [".js", ".ts", ".tsx"]
    },
    module: {
        loaders: [{
            test: /\.tsx?$/,
            loader: "ts-loader"
        }, {
            test: /\.css$/,
            loader: ExtractTextPlugin.extract({
                fallback: "style-loader",
                use: "css-loader"
            }),
        }, {
            test: /\.scss$/,
            loader: ExtractTextPlugin.extract({
               fallback: "style-loader",
               use: "css-loader!sass-loader" 
            }),
        }, {
            test: /\.(eot|svg|ttf|woff|woff2)$/,
            loader: 'file-loader?name=/fonts/[name].[ext]'
        }, {
            test: /spritesheet\.png$/,
            loaders: 'file-loader?name=/sprites/[name].[ext]'
        }]
    },
    plugins: [
        new SpritesmithPlugin({
            src: {
                cwd: path.join(__dirname, './app/sprites'),
                glob: '*.@(jpg|png|gif)',
            },
            target: {
                image: path.join(__dirname, './app/sprites-generated/spritesheet.png'),
                css: path.join(__dirname, './app/sprites-generated/spritesheet.css'),
            },
            apiOptions: {
                cssImageRef: '../sprites-generated/spritesheet.png',
            },
        }),
        new HtmlWebpackPlugin({
            template: `${__dirname}/app/index.html`,
        }),
        // new Webpack.optimize.UglifyJsPlugin({
        //     compressor: {
        //         warnings: false,
        //     },
        // }),
        new ExtractTextPlugin({
            filename: "styles/app.css",
            allChunks: true
        })
    ]
};