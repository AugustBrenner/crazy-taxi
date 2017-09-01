'use strict'

var webpack 			= require('webpack')
var MemoryFS 			= require('memory-fs')
var shortid 			= require('shortid')
var path 				= require('path')
var fs 		 			= require('fs')
var StringReplacePlugin = require("string-replace-webpack-plugin")
var ExtractTextPlugin 	= require('extract-text-webpack-plugin')
var styleLoader 		= require('style-loader')
var cssLoader 			= require('css-loader')
var requireFromString 	= require('require-from-string')
var Router 				= require('router')

var renderHyperscript 	= require('mithril-node-render')
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






var build = function(relative_path) {

	var _caller_dir_path = path.dirname(_getCallerFile())

	var _target_file_path  = path.resolve(_caller_dir_path, relative_path)

	var _compiled_files = {view: function(){}}
	
	var _bundled_files_server = ''

	var _bundled_files_client = ''

	var _bundled_styles_client = ''

	var _server_router = Router()

	var _source_maps = ''

	var _bundle_id = shortid.generate()

	var fs = new MemoryFS()









	var webpack_config_client = {
		entry: _target_file_path,
		output: {
			path: _caller_dir_path,
	        filename: 'bundle_client.js',
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
		        	use: ExtractTextPlugin.extract({
		              	fallback: 'style-loader',
		              	use: [ 'css-loader' ]
		          	})
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
	      	new StringReplacePlugin(),

	      	new ExtractTextPlugin({
	          	filename: 'bundle_client.css'
	        }),
	   	]
	}

	if(SETTINGS.get('production')){

		// webpack_config_client.devtool = 'source-map'

		webpack_config_client.plugins = webpack_config_client.plugins.concat([

			new webpack.LoaderOptionsPlugin({
	            minimize: true,
	            debug: false
	        }),
			
			new webpack.optimize.UglifyJsPlugin({
		      	// sourceMap: webpack_config_client.devtool && (webpack_config_client.devtool.indexOf("sourcemap") >= 0 || webpack_config_client.devtool.indexOf("source-map") >= 0),
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
		webpack_config_client.devtool = 'cheap-eval-source-map'
	}






	var webpack_config_server = {
		entry: path.resolve(__dirname, 'bundle-bridge.js'),
		output: {
			path: _caller_dir_path,
	        filename: 'bundle_server.js',
	        library: _bundle_id,
	        libraryTarget: 'umd'
	    },
	    target: 'node',
	    module: {
			rules: [
			 	{
		        	test: /\.css$/,
		        	loader: 'ignore-loader',
		        },
		        { 
		            test: /\.js$/,
		            include: [
          				path.resolve(__dirname, 'bundle-bridge.js')
          			],
		            loader: StringReplacePlugin.replace({
		                replacements: [
		                    {
		                        pattern: /CT_PLACEHOLDER_FOR_ENTRY/g,
		                        replacement: function (match, p1, offset, string) {
		                            return _target_file_path
		                        }
		                    }
		                ]
		            })
		        },
		        { 
		            test: /\.js$/,
		            loader: StringReplacePlugin.replace({
		                replacements: [
		                    {
		                        pattern: /crazy-taxi/g,
		                        replacement: function (match, p1, offset, string) {
		                            return 'crazy-taxi/server'
		                        }
		                    }
		                ]
		            })
		        },
			]
		},
		plugins: [
	      	new StringReplacePlugin(),
		],
	   	devtool: 'cheap-eval-source-map'
	}

	console.log(path.resolve(__dirname, "compile.js"))







	var compiler_client = webpack(webpack_config_client)

	compiler_client.outputFileSystem = fs


	var compiler_server = webpack(webpack_config_server)

	compiler_server.outputFileSystem = fs


	var bundleFilesClient = function(err, stats) {

		// if(!SETTINGS.get('production')) 
		console.log('[webpack:build]', stats.toString({
            chunks: false,
            colors: true,
            // chunks: true,
            // maxModules: Infinity,
            // exclude: undefined,
        }))

		try{

			// console.log(path.resolve(_caller_dir_path, 'bundle.js'))
	  		_bundled_files_client = fs.readFileSync(path.resolve(_caller_dir_path, 'bundle_client.js'), 'utf8')
	  		if(Object.keys(stats.compilation.assets).indexOf('bundle_client.css') > -1) _bundled_styles_client = fs.readFileSync(path.resolve(_caller_dir_path, 'bundle_client.css'), 'utf8')
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






	var render = function(shim, component) {

		var render_id = shortid.generate()

		var store = {
			data: null,
			get: function(){
				return store.data
			},
			set: function(data){
				store.data = data
			}
		}

		return renderHyperscript(shim, {
			store: store,
			component: component,
		}).then(function(output){

			var output_string = 
			'<html><head></head><body>' +
				'<style>' + _bundled_styles_client + '</style>' +
				'<div id="' + render_id + '" class="ct-root">' +
					output +
				'</div>' +
				'<script>' +
					_bundled_framework +
					_bundled_files_client + 
					"m.store={data:" + JSON.stringify(store.get()).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029') + ",get:function(){return m.store.data},set:function(data){m.store.data=data}};" +
					"m.route.prefix('');m.route(document.getElementById('" + render_id + "'), '/', window['" + _bundle_id + "']);" +
				'</script></body>'

			return output_string
		})
		.catch(function(error){

			var error_message = error.toString() + '\n'
			if(error.stack) error.stack.forEach((callsite, index) => {
				error_message += '  ' + callsite.getFileName() + ': ' + callsite.getLineNumber() + '\n'
			})
			console.error(error_message)

			return ''

		})
	}




	var bundleFilesServer = function(err, stats) {

		// if(!SETTINGS.get('production')) 
		console.log('[webpack:build]', stats.toString({
            chunks: false,
            colors: true,
            // chunks: true,
            // maxModules: Infinity,
            // exclude: undefined,
        }))

		try{


	  		_bundled_files_server = fs.readFileSync(path.resolve(_caller_dir_path, 'bundle_server.js'), 'utf8')

	  		_compiled_files = requireFromString(_bundled_files_server)

	  		_server_router = Router()

	  		Object.keys(_compiled_files.routes).forEach(function(key){

	  			_server_router.get(key, function(req, res) {

	  				render(_compiled_files.shim, _compiled_files.routes[key])
	  				.then(function(result){
	  					res.send(result)
	  				})
	  			})
	  		})

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
		
		compiler_client.run(bundleFilesClient)
	}

	else {
		
		compiler_client.watch({ 
		    aggregateTimeout: 300,
		    // poll: true 
		}, bundleFilesClient)


		compiler_server.watch({ 
		    aggregateTimeout: 300,
		    // poll: true 
		}, bundleFilesServer)
	}


	return function(req, res, next) {
		
		_server_router(req, res, next)
	}

}


module.exports = build