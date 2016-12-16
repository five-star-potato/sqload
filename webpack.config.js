var webpack = require('webpack');
var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    devtool: 'source-map',
    entry: path.join(__dirname, "src", "main"),
    output: {
        path: path.join(__dirname, "dist"),
        filename: 'app.bundle.js'
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
            { from: 'src/css', to: "css"},
            { from: 'node_modules/bootstrap/dist/fonts', to: "fonts" },
            { from: 'src/fonts/Plavsky.otf', to: "fonts" },
            { from: 'src/fonts/NeoGen.ttf', to: "fonts" },
            { from: 'src/app/columns.component.html' }

        ])
    ]
};