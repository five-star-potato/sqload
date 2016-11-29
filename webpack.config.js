var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    devtool: 'source-map',
    
    entry: ['./src/main'],
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
            "window.jQuery": "jquery"
        }),
        new CopyWebpackPlugin([
            /*
            { from: 'src/jquery-3.1.1.js'},
            { from: 'node_modules/bootstrap/dist/js/bootstrap.min.js'},
            */
            { from: 'src/bootstrap-bootswatch-paper.min.css', to: "css"},
            { from: 'node_modules/bootstrap/dist/fonts', to: "fonts" },
            { from: 'src/app/columns.component.html' }
        ])
    ]
};