var webpack = require('webpack');
var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
//var ElectronPackager = require("webpack-electron-packager");

module.exports = {
    devtool: 'source-map',
    entry: {
        app: path.join(__dirname, "src", "main"),
        vendor: [path.join(__dirname, "src", "vendor"), 'jquery', 'd3', "bootstrap"]
    },
    output: {
        publicPath: "",
        path: path.join(__dirname, "dist"),
        filename: '[name].js'
    },
    module: {
        loaders: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                loader: 'ts'
            },
            {
                test: /\.css$/,
                exclude: /node_modules/,
                loader: "style-loader!css-loader"
            }
            /*,
            { 
                test: /worker\.js$/,
                loader: 'worker'
            }*/
        ]
    },
    resolve: {
        extensions: ['', '.js', '.ts']
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.join(__dirname, "src", "index.html")
        }),
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            "window.jQuery": "jquery"
        }),
        new CopyWebpackPlugin([
            /*
            { from: 'src/jquery-3.1.1.js'},
            { from: 'node_modules/bootstrap/dist/js/bootstrap.min.js'},
            */
            { from: 'node_modules/clipboard/dist/clipboard.min.js'},            
            { from: 'src/css', to: "css" },
            { from: 'node_modules/font-awesome/css/font-awesome.css', to: "css" },
            { from: 'src/img', to: "img" },
            /* { from: 'node_modules/bootstrap/dist/fonts', to: "fonts" }, */
            { from: 'src/fonts/Plavsky.otf', to: "fonts" },
            /* { from: 'src/fonts/NeoGen.ttf', to: "fonts" }, */
            { from: 'node_modules/font-awesome/fonts', to: "fonts" },
            { from: 'src/app/columns.component.html' }
        ]),
        new webpack.optimize.CommonsChunkPlugin({
            name: ['app', 'vendor']
        }),
    ]
    /*,
    worker: {
        output: {
            filename: "hash.worker.js",
            chunkFilename: "[id].hash.worker.js"
        }
    }
    /*,
    new ElectronPackager({
        dir: "./",
        arch: "x64",
        platform: "win32",
    })
    */
};