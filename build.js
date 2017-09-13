'use strict'

var webpack 			= require('webpack')
var MemoryFS 			= require('memory-fs')
var shortid 			= require('shortid')
var path 				= require('path')
var fs 		 			= require('fs')
var StringReplacePlugin = require("string-replace-webpack-plugin")
var ExtractTextPlugin 	= require('extract-text-webpack-plugin')
var SpriteLoaderPlugin 	= require('svg-sprite-loader/plugin')
var styleLoader 		= require('style-loader')
var cssLoader 			= require('css-loader')
var babelLoader 		= require('babel-loader')
var requireFromString 	= require('require-from-string')
var Router 				= require('./router.js')
var url 				= require('url')
var AWS 				= require('aws-sdk')
var loki 				= require('lokijs')
var cheerio 			= require('cheerio')

var renderHyperscript 	= require('mithril-node-render')
var hyperscript 		= require('mithril/hyperscript')
var Request 			= require('./request.js')

var SETTINGS 			= require('./settings.js')

// SETTINGS.set('production', true)


shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_')

function _getCallerFile() {

	var origPrepareStackTrace = Error.prepareStackTrace

    try {

    	Error.prepareStackTrace = function (_, stack) { return stack }
        
        var error = new Error()

        var stack = error.stack

        Error.prepareStackTrace = origPrepareStackTrace

        var currentfile = stack.shift().getFileName()

        var callerfile

        while (stack.length) {
            
            callerfile = stack.shift().getFileName()

            if(currentfile !== callerfile) return callerfile
        }
    }
    catch (err) {}
    return undefined;
}






var router = function(relative_path) {

	var config = {}

	var _caller_dir_path = path.dirname(_getCallerFile())

	var _target_file_path  = path.resolve(_caller_dir_path, relative_path)

	var _compiled_files = {view: function(){}}
	
	var _bundled_scripts_server = ''

	var _bundled_svg_server = ''

	var _bundled_scripts_client = ''

	var _bundled_scripts_client_url = ''

	var _bundled_styles_client = ''

	var _bundled_styles_client_url = ''

	var _server_router = Router({}, function(){})

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
	    // externals: {
	    //     "crazy-taxi": 'm'
	    // },
	   node: {
			fs: 'empty',
			net: 'empty',
			tls: 'empty',
			'crypto': 'empty'
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
			      	test: /\.js$/,
			      	exclude: /(node_modules|bower_components)/,
			      	use: {
			        	loader: 'babel-loader',
			        	options: {
        					presets: ['babel-preset-env'].map(require.resolve),
      					}
			      	}
			    },
			    {
		        	test: /\.svg$/,
		        	loader: 'ignore-loader',
		        },
				// {
				// 	test: path.resolve(__dirname, 'node_modules/mithril/mithril.min.js'),
				// 	loader: 'expose-loader?c'
				// },

				// {
				// 	test: path.resolve(__dirname, 'node_modules/lokijs'),
				// 	loader: 'expose-loader?loki'
				// },
				{
					test: /mithril\/mithril\.min\.js/,
					loader: 'expose-loader?c'
				},

				{
					test: /lokijs/,
					loader: 'expose-loader?loki'
				},
				{
					test: _target_file_path,
					loader: 'webpack-append',
					query: 'require("lokijs")'
		        },

		  //       { 
				// 	test: /^crazy-taxi$/,
				// 	loader: 'ignore-loader'
				// },
			]
		},
		resolveLoader: {
			modules: [
				path.resolve(__dirname, 'node_modules'),
				'node_modules',
			],
		},
		resolve: {
			alias: {
				'crazy-taxi': 'mithril/mithril.min.js',
				// 'crazy-taxi': path.resolve(__dirname, 'node_modules/mithril/mithril.min.js'),
				// 'lokijs': path.resolve(__dirname, 'node_modules/lokijs'),
			}
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
	    	exprContextCritical: false,
			rules: [
			 	{
		        	test: /\.css$/,
		        	loader: 'ignore-loader',
		        },
		        {
					test: /\.svg$/,
					use: [
						{
							loader: 'svg-sprite-loader',
							options: {
								symbolId: 'icon-[name]',
								extract: true,
								spriteFilename: 'bundle_server.svg'
							}
						},
						'svgo-loader'
					]
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
				{
			      	test: /\.js$/,
			      	exclude: /(node_modules|bower_components)/,
			      	use: {
			        	loader: 'babel-loader',
			        	options: {
        					presets: ['babel-preset-env'].map(require.resolve),
      					}
			      	}
			    },
			]
		},
		resolveLoader: {
			modules: [
				path.resolve(__dirname, 'node_modules'),
				'node_modules',
			]
		},
		plugins: [
	      	new StringReplacePlugin(),
	      	new SpriteLoaderPlugin(),
		],
	   	devtool: 'cheap-eval-source-map'
	}


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
	  		_bundled_scripts_client = fs.readFileSync(path.resolve(_caller_dir_path, 'bundle_client.js'), 'utf8')
	  		if(Object.keys(stats.compilation.assets).indexOf('bundle_client.css') > -1) _bundled_styles_client = fs.readFileSync(path.resolve(_caller_dir_path, 'bundle_client.css'), 'utf8')
	  		// _source_maps = fs.readFileSync(path.resolve(_caller_dir_path, 'bundle.js.map'), 'utf8')

	  		if(SETTINGS.get('production') && config.s3){
	  			
	  			var base_64_data_scripts = new Buffer(_bundled_scripts_client, 'utf8')
	  			var content_length_scripts =  Buffer.byteLength(_bundled_scripts_client, 'utf8')

				config.s3.putObject({
					Bucket: config.s3_bucket_name,
					Key: config.s3_bucket_directories + '/' + stats.hash + '.bundle.js',
					Body: base_64_data_scripts,
					ACL: 'public-read',
					CacheControl: 'public, max-age=31536000',
					ContentLength: content_length_scripts,
					ContentType: 'application/json; charset=utf-8',
				}, function (error, response) {

					if(error) return console.error('Failed to upload client scripts. Falling back to inline scripts.')

					console.log('Successfully uploaded client scripts')
					
					_bundled_scripts_client_url = config.cdn_url.replace(/\/$/, '') + '/' + stats.hash + '.bundle.js'

				})

				if(_bundled_styles_client){

					var base64dataStyles = new Buffer(_bundled_styles_client, 'utf8')
					var content_length_styles =  Buffer.byteLength(_bundled_styles_client, 'utf8')

					config.s3.putObject({
						Bucket: config.s3_bucket_name,
						Key: config.s3_bucket_directories + '/' + stats.hash + '.bundle.css',
						Body: base64dataStyles,
						ACL: 'public-read',
						CacheControl: 'public, max-age=31536000',
						ContentLength: content_length_styles,
						ContentType: 'text/css; charset=utf-8',
					}, function (error, response) {

						if(error) return console.error('Failed to upload client styles. Falling back to inline styles.')

						console.log('Successfully uploaded client styles')

						_bundled_styles_client_url = config.cdn_url.replace(/\/$/, '') + '/' + stats.hash + '.bundle.css'
					})
				}
	  		}

		}
		catch(error){

			console.error(error)

		}

	}




	var render = function(params) {

		var render_id = shortid.generate()

		var store = new loki("crazy-taxi.db")

		return renderHyperscript(params.shim, {
			store: store,
			component: params.component,
			requestHandler: params.requestHandler,
			params: params.params,
			// scripts: "<script>" +

			// 	"function " + render_id + "_init(){" +
			// 		"c.scripts = c.trust('" + '<script id="' + render_id + '_scripts">\');' + 
			// 		"c.styles = c.trust('"+'<link id="' + render_id + '_styles" rel="stylesheet" type="text/css" href="' + _bundled_styles_client_url + '">'+ "');" +
			// 		"window.global_styles = '" + _bundled_styles_client_url + "';" +
			// 		"c.store = new loki('crazy-taxi.db');" +
			// 		"c.store.loadJSON(" + JSON.stringify(store.serialize()).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029') + ");" +
			// 		"c.route.prefix('');c.route(document.documentElement, '/', window['" + _bundle_id + "']);" +
			// 	"}" +

			// 	"(function(c,r,a,z,y){" +
			// 		"y=c.createElement(r);s=c.getElementsByTagName(r)[0];y.src=a;y.addEventListener('load',z,false);s.parentNode.insertBefore(y,s);" +
			// 	"})(document,'script','" + _bundled_scripts_client_url + "', " + render_id + "_init);" + 

			// "</script>",
			// styles: '<link id="' + render_id + '_styles" rel="stylesheet" type="text/css" href="' + _bundled_styles_client_url + '">'
		}).then(function(output){

			var $ = cheerio.load(output)


			if(_bundled_styles_client_url){
				$('head').append('<link id="' + render_id + '_styles" rel="stylesheet" type="text/css" href="' + _bundled_styles_client_url + '">')
			}
			else {
				$('head').append('<style id="' + render_id + '_styles">' + _bundled_styles_client + '</style>')
			}

			$('body').append('<script>' +

				"function " + render_id + "_init(){" +

					"var styles = document.getElementById('" + render_id + "_styles');" +

					"if(styles.tagName.toUpperCase() === 'LINK'){" +
						"styles = c('link', {key: styles.id, id:styles.id, rel:'stylesheet', type:'text/css', href:styles.href})" + 
					"}" +

					"else{" +
						"styles = c('style', {key: styles.id}, styles.innerHTML)" + 
					"};" +

					// "var scripts = document.getElementById('" + render_id + "_scripts');" +

					// "if(scripts.src){" +
					// 	"scripts = c('script', {key: '" + render_id + "-styles', src:scripts.src})" + 
					// "}" +

					// "else{" +
					// 	"scripts = c('script', {key: '" + render_id + "-styles'}, scripts.innerHTML)" + 
					// "};" +

					"c.styles = styles;" + 
					// "c.scripts = scripts;" +
					"c.svgs = c.trust('" + _bundled_svg_server.replace(/\n/g, '') + "');" +
					"window.global_styles = '" + _bundled_styles_client_url + "';" +
					"c.store = new loki('crazy-taxi.db');" +
					"c.store.loadJSON(" + JSON.stringify(store.serialize()).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029') + ");" +
					"c.route.prefix('');c.route(document.documentElement, '/', window['" + _bundle_id + "']);" +
				"}" +

			'</script>')

			if(_bundled_scripts_client_url){
				$('body').append('<script id="' + render_id + '_scripts">' + 
					"(function(c,r,a,z,y){" +
						"y=c.createElement(r);s=c.getElementsByTagName(r)[0];y.src=a;y.addEventListener('load',z,false);s.parentNode.insertBefore(y,s);" +
					"})(document,'script','" + _bundled_scripts_client_url + "', " + render_id + "_init);" + 
				"</script>")
			}

			// if(_bundled_svg_server){
			// 	console.log(_bundled_svg_server)
			// }

			else {
				$('body').append('<script id="' + render_id + '_scripts">' + _bundled_scripts_client + ' ' + render_id + '_init();</script>')
			}


			// var output_string = 
			// '<html><head>' +
			// 	(!_bundled_styles_client_url ? '<style>' + _bundled_styles_client + '</style>' : '') +
			// 	(_bundled_styles_client_url ? '<link rel="stylesheet" type="text/css" href="' + _bundled_styles_client_url + '">' : '') +
			// '</head><body>' +
			// 	'<div id="' + render_id + '" class="ct-root">' +
			// 		output +
			// 	'</div>' +
				// (_bundled_scripts_client_url ? '<script src="' + _bundled_scripts_client_url + '"></script>' : '') +
				// '<script>' +
					

				// 	// (!_bundled_scripts_client_url ? _bundled_scripts_client + " " + render_id + "_init();" :

				// 	// "(function(c,r,a,z,y){y=c.createElement(r);s=c.getElementsByTagName(r)[0];y.src=a;y.addEventListener('load',z,false);s.parentNode.insertBefore(y,s);" +
				// 	// "})(document,'script','" + _bundled_scripts_client_url + "', " + render_id + "_init);") +

				// 	"function " + render_id + "_init(){" +
				// 		"window.global_styles = '" + _bundled_styles_client_url + "';" +
				// 		"c.store = new loki('crazy-taxi.db');" +
				// 		"c.store.loadJSON(" + JSON.stringify(store.serialize()).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029') + ");" +
				// 		"c.route.prefix('');c.route(document.documentElement, '/', window['" + _bundle_id + "']);" +
				// 	"}" +

				// '</script></body>'

			return $.html()
		})
		.catch(function(error){

			console.error(error)

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


	  		_bundled_scripts_server = fs.readFileSync(path.resolve(_caller_dir_path, 'bundle_server.js'), 'utf8')

	  		if(Object.keys(stats.compilation.assets).indexOf('bundle_server.svg') > -1) _bundled_svg_server = fs.readFileSync(path.resolve(_caller_dir_path, 'bundle_server.svg'), 'utf8')

	  		_compiled_files = requireFromString(_bundled_scripts_server)

	  		_server_router = Router(_compiled_files.routes, function(component, params, req, res, next){

	  			if(!component) return res.sendStatus(404)

				var base_url = url.format({
				    protocol: req.protocol,
				    host: req.get('host'),
				    pathname: req.originalUrl
				})

  				render({
  					shim:_compiled_files.shim,
  					component: component,
  					requestHandler: Request({
  						headers: req.headers,
  						base_url: base_url,
  					}),
  					params: params,
  				})
  				.then(function(result){
  					res.send(result)
  				})
	  		})


		}
		catch(error){

			console.error(error)

		}

	}





	if(SETTINGS.get('production')){
		
		compiler_client.run(bundleFilesClient)

		compiler_server.run(bundleFilesServer)
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

	var server = function(req, res, next) {
		
		_server_router(req, res, next)
	}

	// S3 Configuration
	server.s3 = function(s3_config){

		console.log("S3 Activated")

		s3_config = s3_config || {}

		if(!s3_config.access_key_id || !s3_config.secret_access_key || !s3_config.bucket_url){

			throw "parameters 'access_key_id', 'secret_access_key', and 'bucket_url' are required."
		}

		var bucket_url_parts = /(amazonaws\.com)\/(.*?)\/(.*)\//.exec(s3_config.bucket_url)

		if(!bucket_url_parts[2]) throw "'bucket_url' is invalid, it must include: {bucket-region}.amazonaws.com/{bucket-name}/{bucket-directories}"
		
		s3_config.s3_bucket_name = bucket_url_parts[2]

		s3_config.s3_bucket_directories = bucket_url_parts[3] || ''

		AWS.config.update({accessKeyId: s3_config.access_key_id, secretAccessKey: s3_config.secret_access_key})

		s3_config.s3 = new AWS.S3()

		Object.assign(config, s3_config)

		return server
	}

	return server

}


module.exports = router