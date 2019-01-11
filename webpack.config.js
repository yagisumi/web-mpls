const path = require('path');
const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
// const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CleanWebpackPlugin = require('clean-webpack-plugin')
const { VueLoaderPlugin } = require('vue-loader');

// Reference
//
// Webpackを頑張って設定して、すごい静的サイトジェネレータとして使おう
// https://qiita.com/toduq/items/2e0b08bb722736d7968c
//
// SassのビルドもWebpackでHot Module Replacementしたい
// https://qiita.com/UFO/items/ae95f7f53d56ad5240ca

const PUG_LOADER = {
  loader: 'pug-loader',
  options: {
    pretty: true,
  },
}

const pugLoaders = ['apply-loader', PUG_LOADER]

const CSS_LOADER = {
  loader: 'css-loader',
  options: {
    // minimize: true,
    sourceMap: true,
  }
}

const POSTCSS_LOADER = {
  loader: 'postcss-loader',
  options: {
    ident: 'postcss',
    plugins: (loader) => [require('autoprefixer')()]
  }
}

const SASS_LOADER = {
  loader: 'sass-loader',
  options: {
    sourceMap: true,
    indentedSyntax: true,
    data: "@import global",
    includePaths: [path.resolve(__dirname, "./src/sass")],
  }
}

const sassLoaders = [CSS_LOADER, POSTCSS_LOADER, SASS_LOADER]

const SCSS_LOADER = {
  loader: 'sass-loader',
  options: {
    sourceMap: true,
    // data: "@import global",
    // includePaths: [path.resolve(__dirname, "./src/scss")],
  }
}

const scssLoaders = [CSS_LOADER, POSTCSS_LOADER, SCSS_LOADER]

const plugins = [
  new ExtractTextPlugin('[name]'),
  new CleanWebpackPlugin(['dist']),
  new VueLoaderPlugin(),
  new CopyWebpackPlugin([
    {
      from: './public/',
      to: './',
    }
  ]),
]

let mode = 'development'

const entryMap = {
  'main.js': './src/main.ts',
  'index.html': './src/index.pug',
}

if (process.env.NODE_ENV === 'production') {
  mode = 'production'
  entryMap['style.css'] = './src/style.sass'
}
else {
  entryMap['style.js'] = './src/style.js'
  // plugins.push(new webpack.HotModuleReplacementPlugin())
}

const config = {
  mode: mode,
  entry: entryMap,
  output: {
    filename: '[name]',
    publicPath: '/',
    path: path.resolve(__dirname, 'dist'),
  },
  devtool: 'source-map',
  devServer: {
    // hot: true,
  },
  module: {
    rules: [
      {
        test: /\.css/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              url: false,
            }
          },
        ],
      },
      {
        test: /\.pug$/,
        oneOf: [
          {
            resourceQuery: /\?vue/,
            use: [
              'pug-plain-loader',
            ]
          },
          {
            use: ExtractTextPlugin.extract(pugLoaders),
          },
        ],
      },
      {
        test: /\.sass$/,
        oneOf: [
          {
            resourceQuery: /\?dev/,
            use: [
              'style-loader',
              ...sassLoaders,
            ]
          },
          {
            resourceQuery: /\?vue/,
            use: [
              'vue-style-loader',
              ...sassLoaders,
            ]
          },
          {
            use: ExtractTextPlugin.extract(sassLoaders),
          }
        ],
      },
      {
        test: /\.scss$/,
        oneOf: [
          {
            resourceQuery: /\?dev/,
            use: [
              'style-loader',
              ...scssLoaders,
            ]
          },
          {
            resourceQuery: /\?vue/,
            use: [
              'vue-style-loader',
              ...scssLoaders,
            ]
          },
          {
            use: ExtractTextPlugin.extract(scssLoaders),
          }
        ],
      },
      {
        test: /.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              appendTsSuffixTo: [/\.vue$/]
            },
          },
        ],
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        // options: {
        //   loaders: {
        //     scss: 'vue-style-loader!css-loader!sass-loader', // <style lang="scss">
        //     sass: 'vue-style-loader!css-loader!sass-loader?indentedSyntax' // <style lang="sass">
        //   }
        // }
      },
    ]
  },
  plugins: plugins,
  externals: {
    'vue': 'Vue'
  },
}

module.exports = config
