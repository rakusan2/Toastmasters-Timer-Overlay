"use strict";
const path = require("path");
const { merge } = require('webpack-merge');
const LiveReloadPlugin = require('webpack-livereload-plugin');

const commonConfig = {
    entry: './web/src/web.ts',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                options: { projectReferences: true }
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    output: {
        filename: 'web.js',
        path: path.resolve(__dirname, 'web'),
    },
};

const prodConfig = {
    mode: 'production',
};

const devConfig = {
    mode: 'development',
    devtool: 'inline-source-map',
    plugins: [
        new LiveReloadPlugin({ appendScriptTag: true })
    ]
};

module.exports = env => {
    if (env.development) return merge(commonConfig, devConfig);
    else if (env.production) return merge(commonConfig, prodConfig);
    else throw new Error("No Config Found");
}
