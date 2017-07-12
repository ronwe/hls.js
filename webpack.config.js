const pkgJson = require('./package.json');
const path = require('path');
const webpack = require('webpack');

const buildConstants = {
  __VERSION__: JSON.stringify(pkgJson.version)
};

const uglifyJsOptions = {
  screwIE8: true,
  stats: true,
  compress: {
    warnings: false
  },
  mangle: {
    toplevel: true,
    eval: true,
    props: {regex : /^_/}
  }
};

const commonConfig = {
  entry: './src/hls.js',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [
          path.resolve(__dirname, 'node_modules')
        ],
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  }
};

const commonPlugins = [
  new webpack.optimize.OccurrenceOrderPlugin(),
  new webpack.optimize.ModuleConcatenationPlugin(),
  new webpack.DefinePlugin(buildConstants)
];

const distPlugins = commonPlugins.concat([
  new webpack.optimize.UglifyJsPlugin(uglifyJsOptions),
  new webpack.LoaderOptionsPlugin({
    minimize: true,
    debug: false
  })
]);

let lightDistAliases = {};

if (!process.env.SUBTITLE) {
  lightDistAliases = Object.assign({}, lightDistAliases, {
    './utils/cues': './empty.js',
    './controller/timeline-controller': './empty.js',
    './controller/subtitle-track-controller': './empty.js',
    './controller/subtitle-stream-controller': './empty.js'
  });
}

if (!process.env.ALT_AUDIO) {
  lightDistAliases = Object.assign({}, lightDistAliases, {
    './controller/audio-track-controller': './empty.js',
    './controller/audio-stream-controller': './empty.js'
  });
}

const multiConfig = [
  {
    name: 'debug',
    output: {
      filename: 'hls.js',
      chunkFilename: '[name].js',
      sourceMapFilename: 'hls.js.map',
      path: path.resolve(__dirname, 'dist'),
      publicPath: '/hls.js/dist/',
      library: 'Hls',
      libraryTarget: 'umd',
      libraryExport: 'default'
    },
    plugins: commonPlugins,
    devtool: 'source-map',
  },
  {
    name: 'dist',
    output: {
      filename: 'hls.min.js',
      chunkFilename: '[name].js',
      path: path.resolve(__dirname, 'dist'),
      publicPath: '/hls.js/dist/',
      library: 'Hls',
      libraryTarget: 'umd',
      libraryExport: 'default'
    },
    plugins: distPlugins
  },
  {
    name: 'light',
    output: {
      filename: 'hls.light.js',
      chunkFilename: '[name].js',
      sourceMapFilename: 'hls.light.js.map',
      path: path.resolve(__dirname, 'dist'),
      publicPath: '/hls.js/dist/',
      library: 'Hls',
      libraryTarget: 'umd',
      libraryExport: 'default'
    },
    resolve: {
      alias: lightDistAliases
    },
    plugins: commonPlugins,
    devtool: 'source-map'
  },
  {
    name: 'light-dist',
    output: {
      filename: 'hls.light.min.js',
      chunkFilename: '[name].js',
      path: path.resolve(__dirname, 'dist'),
      publicPath: '/hls.js/dist/',
      library: 'Hls',
      libraryTarget: 'umd',
      libraryExport: 'default'
    },
    resolve: {
      alias: lightDistAliases
    },
    plugins: distPlugins
  }
].map(fragment => Object.assign({}, commonConfig, fragment));

// webpack matches the --env arguments to a string; for example, --env.debug.min translates to { debug: true, min: true }
module.exports = (envArgs) => {
  if (!envArgs) {
    // If no arguments are specified, return every configuration
    return multiConfig;
  }

  // Find the first enabled config within the arguments array
  const enabledConfigName = Object.keys(envArgs).find(envName => envArgs[envName]);
  let enabledConfig = multiConfig.find(config => config.name === enabledConfigName);

  if (!enabledConfig) {
    console.error(`Couldn't find a valid config with the name "${enabledConfigName}". Known configs are: ${multiConfig.map(config => config.name).join(', ')}`);
    return;
  }

  return enabledConfig;
};
