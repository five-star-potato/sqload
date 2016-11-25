var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    devtool: 'source-map',
    
    entry: ['./src/main', './src/bootstrap-flex.min.css'],
    output: {
        path: './dist',
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
            template: './src/index.html'
        }),
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            "window.jQuery": "jquery",
            "window.Tether": "tether"
        })
        /*
        new CopyWebpackPlugin([
            { from: 'src/bootstrap.css' }
        ])
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            "window.jQuery": "jquery",
            "window.Tether": "tether"
        })
        */
    ]
};