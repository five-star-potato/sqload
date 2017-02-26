module.exports = {
     entry: {generator: './src/app/worker/generator.worker.ts'},
     output: {
         path: './dist',
         filename: '[name].bundle.js'
     },
    resolve: {
        extensions: ['', '.js', '.ts']
    },
    module: {
        loaders: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                loader: 'ts'
            }
        ]
    }
 };