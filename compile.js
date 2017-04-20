'use strict'
var webpack 			= require('webpack')
var MemoryFS 			= require('memory-fs')
var shortid 			= require('shortid')
var path 				= require('path')
var fs 		 			= require('fs')
var StringReplacePlugin = require("string-replace-webpack-plugin")
var styleLoader 		= require('style-loader')
var cssLoader 			= require('css-loader')
var deasync 			= require('deasync')

var render 				= require('mithril-node-render')
var hyperscript 		= require('mithril/hyperscript')

var SETTINGS 			= require('./settings.js')





var _bundled_framework = fs.readFileSync(require.resolve('mithril/mithril.min.js'),'utf8')





function _getCallerFile() {
    try {
        var err = new Error();
        var callerfile;
        var currentfile;

        Error.prepareStackTrace = function (err, stack) { return stack; };

        currentfile = err.stack.shift().getFileName();

        while (err.stack.length) {
            callerfile = err.stack.shift().getFileName();

            if(currentfile !== callerfile) return callerfile;
        }
    } catch (err) {}
    return undefined;
}






var compile = (input) => {

	var _caller_dir_path = path.dirname(_getCallerFile())

	var _target_file_path  = path.resolve(_caller_dir_path, input)

	var _compiled_files = require(_target_file_path)
	
	var _bundled_files = ''

	var _source_maps = ''

	var _bundle_id = shortid.generate()

	var fs = new MemoryFS()

	var webpack_config = {
		entry: _target_file_path,
		output: {
			path: _caller_dir_path,
            filename: 'bundle.js',
            library: _bundle_id,
            libraryTarget: 'umd'
        },
		externals: {
	        "crazy-taxi": 'm'
	    },
	    module: {
			rules: [
			 	{
		        	test: /\.css$/,
		        	use: [
						{
							loader: "crazy-taxi/node_modules/style-loader"
						},
						{
							loader: "crazy-taxi/node_modules/css-loader",
							options: {
								minimize: SETTINGS.get('production')
							}
						}
        			]
		        },
				{ 
		            test: /\.js$/,
		            loader: StringReplacePlugin.replace({
		                replacements: [
		                    {
		                        pattern: /c\.requireOnClient/g,
		                        replacement: function (match, p1, offset, string) {
		                            return 'require'
		                        }
		                    }
		                ]
		            })
		        },
		        { 
					test: /^crazy-taxi$/,
					loader: 'ignore-loader'
				},
			]
		},
		plugins: [
	      	new StringReplacePlugin()
	   	]
	}

	if(SETTINGS.get('production')){

		// webpack_config.devtool = 'source-map'

		webpack_config.plugins = webpack_config.plugins.concat([

			new webpack.LoaderOptionsPlugin({
                minimize: true,
                debug: false
            }),
			
			new webpack.optimize.UglifyJsPlugin({
		      	// sourceMap: webpack_config.devtool && (webpack_config.devtool.indexOf("sourcemap") >= 0 || webpack_config.devtool.indexOf("source-map") >= 0),
		      	beautify: false,
	            mangle: {
	                screw_ie8: true,
	                keep_fnames: true
	            },
	            compress: {
	                screw_ie8: true,
	                warnings: false
	            },
	            comments: false
		    }),

		    new webpack.DefinePlugin({
		      'process.env.NODE_ENV': JSON.stringify('production')
		    })

		])

	}

	else {
		webpack_config.devtool = 'cheap-eval-source-map'
	}


	var compiler = webpack(webpack_config)

	compiler.outputFileSystem = fs


	var bundleFiles = function(err, stats) {

		// if(!SETTINGS.get('production')) 
		console.log('[webpack:build]', stats.toString({
            chunks: false,
            colors: true
        }))

		try{
			// console.log(path.resolve(_caller_dir_path, 'bundle.js'))
	  		_bundled_files = fs.readFileSync(path.resolve(_caller_dir_path, 'bundle.js'), 'utf8')
	  		// _source_maps = fs.readFileSync(path.resolve(_caller_dir_path, 'bundle.js.map'), 'utf8')
		}
		catch(e){

			var error_message = e.toString() + '\n'
			if(e.stack) e.stack.forEach((callsite, index) => {
				error_message += '  ' + callsite.getFileName() + ': ' + callsite.getLineNumber() + '\n'
			})
			console.error(error_message)

		}

	}


	if(SETTINGS.get('production')){
		
		compiler.run(bundleFiles)
	}

	else {
		
		compiler.watch({ 
		    aggregateTimeout: 300,
		    // poll: true 
		}, bundleFiles)
	}


	return (params, config) => {

		params = params || {}
		config = config || {}

		var render_id = shortid.generate()

		try{
			var output = ''
			var done = false

			render(hyperscript(_compiled_files, params)).then(function(out){
				output = out
				done = true
			})
			.catch(function(error){
				console.error(error)
				done = true
			})

			deasync.loopWhile(function(){return !done})

		}
		catch(e){

			var error_message = e.toString() + '\n'
			if(e.stack) e.stack.forEach((callsite, index) => {
				error_message += '  ' + callsite.getFileName() + ': ' + callsite.getLineNumber() + '\n'
			})
			console.error(error_message)

			var output = ''
		}

		var output_string = 
			'<div id="' + render_id + '">' +
				output +
			'</div>' +
			'<script>' +
				(config.exclude_framework ? '' : _bundled_framework) +
				_bundled_files + 
				"m.mount(document.getElementById('" + render_id + "'), {view: function () { return m(window['" + _bundle_id + "'], " + JSON.stringify(params).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029') + ")}})" +
			'</script>'
		

		return output_string
	}
}


module.exports = compile