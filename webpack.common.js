"use strict";
const path = require("path");
module.exports = {
    entry: './web/src/web.ts',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules|index.*$/
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
