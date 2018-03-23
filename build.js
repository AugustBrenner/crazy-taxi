'use strict'

var webpack 			= require('webpack')
var MemoryFS 			= require('memory-fs')
var shortid 			= require('shortid')
var path 				= require('path')
var fs 		 			= require('fs')
var StringReplacePlugin = require("string-replace-webpack-plugin")
var ExtractTextPlugin 	= require('extract-text-webpack-plugin')
var SpriteLoaderPlugin 	= require('svg-sprite-loader/plugin')
var SvgStorePlugin 		= require('external-svg-sprite-loader/lib/SvgStorePlugin')

var UglifyJsPlugin 		= require('uglifyjs-webpack-plugin')
var styleLoader 		= require('style-loader')
var cssLoader 			= require('css-loader')
var babelLoader 		= require('babel-loader')
var requireFromString 	= require('require-from-string')
var Router 				= require('./router.js')
var url 				= require('url')
var AWS 				= require('aws-sdk')
var loki 				= require('lokijs')
var cheerio 			= require('cheerio')
var argv 				= require('yargs').argv

var renderHyperscript 	= require('mithril-node-render')
var hyperscript 		= require('mithril/hyperscript')
var Request 			= require('./request.js')

var SETTINGS 			= require('./settings.js')

// SETTINGS.set('production', true)


var build_count = 0


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



function _getRootDir(caller_dir_path){

	var path_array = caller_dir_path.split(path.sep)

	var root_dir

	while(path_array.length > 0){

		var current_dir = path_array.join(path.sep)

		var files_in_dir = fs.readdirSync(current_dir)

		if(files_in_dir.indexOf('package.json') > -1 || files_in_dir.indexOf('node_modules') > -1){

			root_dir = current_dir

			break
		}

		path_array.pop()
	}

	if(!root_dir) throw 'Root directory not found.'

	return root_dir

}




var router = function(relative_path) {

	var _bundle_id = shortid.generate()

	var cache = {
		_bundle_id: _bundle_id
	}

	var config = {}

	var _caller_dir_path = path.dirname(_getCallerFile())

	var _target_file_path  = path.resolve(_caller_dir_path, relative_path)

	var _compiled_files = {view: function(){}}

	var _use_cache

	var saveBundle = function(value){
		
		Object.assign(cache, value)

		fs.writeFileSync(path.join(_getRootDir(_caller_dir_path), '.crazy-taxi-cache.json'), JSON.stringify(cache))

		if(build_count === 0) process.exit()
	}

	if(argv['use-cache']){

		try{
			cache = JSON.parse(fs.readFileSync(path.join(_getRootDir(_caller_dir_path), '.crazy-taxi-cache.json'))) || {}
			
			_bundle_id = cache._bundle_id

			_use_cache = true
		}
		catch(e){
			console.error('No cache found.')

			_use_cache = false

			cache = {}
		}
	}
	
	var _bundled_scripts_server = cache._bundled_scripts_server || ''

	var _bundled_scripts_client = cache._bundled_scripts_client || ''

	var _bundled_svg_client = cache._bundled_svg_client || ''

	var _bundled_scripts_client_url = cache._bundled_scripts_client_url || ''

	var _bundled_styles_client = cache._bundled_styles_client || ''

	var _bundled_styles_client_url = cache._bundled_styles_client_url || ''

	var _server_router = Router({}, function(){})

	var _source_maps = ''

	var _memory_fs = new MemoryFS()





















	var webpack_config_client = {
		mode: SETTINGS.get('production') ? 'production' : 'development',
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
		              	use: {
					      	loader: "css-loader",
					      	options: {
					      		minimize: true,
					      		sourceMap: !SETTINGS.get('production'),
					      	}
					    },
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
			      	// exclude: /(node_modules|bower_components)/,
			      	use: {
			        	loader: 'babel-loader',
			        	options: {
        					presets: ['babel-preset-env'].map(require.resolve),
      					}
			      	}
			    },
			    {
	                test: /\.svg$/,
	                use: {
	                	loader: 'external-svg-sprite-loader',
	                	options: {
	                		iconName: 'icon-[name]',
	                		name: 'bundle_client.svg',
	                	},
	                }
	            },
		  //       {
				// 	test: /\.svg$/,
				// 	use: [
				// 		{
				// 			loader: 'svg-sprite-loader',
				// 			options: {
				// 				symbolId: 'icon-[name]',
				// 				extract: true,
				// 				spriteFilename: 'bundle_client.svg'
				// 			}
				// 		},
				// 		'svgo-loader'
				// 	]
				// },
				// {
				// 	test: path.resolve(__dirname, 'node_modules/mithril/mithril.min.js'),
				// 	loader: 'expose-loader?c'
				// },

				// {
				// 	test: path.resolve(__dirname, 'node_modules/lokijs'),
				// 	loader: 'expose-loader?loki'
				// },
				// {
				// 	test: /mithril\.min/,
				// 	loader: 'expose-loader?c'
				// },

				{
					test: /mithril\/index/,
					use: [{
						loader: 'expose-loader',
						options: 'c'
					}]
				},

				{
					test: /lokijs/,
					use: [{
						loader: 'expose-loader',
						options: 'loki'
					}]
				},

				// {
				// 	test: /lokijs/,
				// 	loader: 'expose-loader?loki'
				// },
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
				'crazy-taxi': 'mithril/index.js',
				// 'crazy-taxi': 'node_modules/mithril/mithril.min.js',
				// 'crazy-taxi': ['node_modules/mithril/mithril.min.js', path.resolve(__dirname, 'node_modules/mithril/mithril.min.js')],
				// 'lokijs': ['node_modules/lokijs', path.resolve(__dirname, 'node_modules/lokijs')],
			},
			// modules: [
			// 	path.resolve(__dirname, 'node_modules'),
			// 	'node_modules',
			// ],
		},
		plugins: [
	      	new StringReplacePlugin(),


	      	new ExtractTextPlugin({
	          	filename: 'bundle_client.css'
	        }),

	        // new SpriteLoaderPlugin(),

	        new SvgStorePlugin(),

	        new webpack.DefinePlugin({
		      	'process.env.CRAZY_TAXI_HOST': JSON.stringify(''),
		      	'process.env.NODE_ENV': JSON.stringify(SETTINGS.get('production') ? 'production' : 'development'),
		    }),
	   	],
	   	devtool: SETTINGS.get('production') ? false : 'cheap-eval-source-map'
	}

	if(SETTINGS.get('production')){

		// webpack_config_client.devtool = 'source-map'

		webpack_config_client.plugins = webpack_config_client.plugins.concat([

			new webpack.LoaderOptionsPlugin({
	            minimize: true,
	            debug: false
	        }),
			
			new UglifyJsPlugin({
				uglifyOptions: {
					ie8: false,
					ecma: 8,
					mangle: {
		                keep_fnames: true
		            },
					output: {
						comments: false,
						beautify: false,
					},
					warnings: false
				}
		    }),

		])

	}

	else {
		webpack_config_client.devtool = 'cheap-eval-source-map'
	}





























	var webpack_config_server = {
		mode: SETTINGS.get('production') ? 'production' : 'development',
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
	      	new webpack.BannerPlugin({
	      		banner: 'require("source-map-support").install();',
	      		raw: true,
	      		entryOnly: false,
	      	}),
	      	new webpack.DefinePlugin({
		      	'process.env.CRAZY_TAXI_HOST': JSON.stringify(''),
		      	'process.env.NODE_ENV': JSON.stringify(SETTINGS.get('production') ? 'production' : 'development'),
		    }),
		],
	   	devtool: 'sourcemap'
	}



















	var compiler_client = webpack(webpack_config_client)

	compiler_client.outputFileSystem = _memory_fs

	build_count++


	var compiler_server = webpack(webpack_config_server)

	compiler_server.outputFileSystem = _memory_fs

	build_count++


	var bundleFilesClient = function(err, stats) {

		// if(!SETTINGS.get('production')) 
		console.log('[webpack:build]', stats.toString({
            chunks: false,
            chunkModules: false,
            modules: false,
            timings: true,
            colors: true,
        }))

		try{

			// console.log(path.resolve(_caller_dir_path, 'bundle.js'))
	  		_bundled_scripts_client = _memory_fs.readFileSync(path.resolve(_caller_dir_path, 'bundle_client.js'), 'utf8')

	  		if(Object.keys(stats.compilation.assets).indexOf('bundle_client.css') > -1){

	  			_bundled_styles_client = _memory_fs.readFileSync(path.resolve(_caller_dir_path, 'bundle_client.css'), 'utf8')

	  			// _bundled_scripts_client += '(function(){'+
	  			// 	'c.styles = c("style",{key:"styles"},' + JSON.stringify(_bundled_styles_client).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029') + ');' +
	  			// '})();'


	  			if(argv.build) saveBundle({_bundled_styles_client: _bundled_styles_client})
	  		}
	  		
	  		if(Object.keys(stats.compilation.assets).indexOf('bundle_client.svg') > -1){

	  			_bundled_svg_client = _memory_fs.readFileSync(path.resolve(_caller_dir_path, 'bundle_client.svg'), 'utf8')

	  			if(argv.build) saveBundle({_bundled_svg_client: _bundled_svg_client})

	  			// _bundled_svg_client = (_bundled_svg_client.slice(0, 4) + ' style="display: none !important;"' + _bundled_svg_client.slice(4)).replace(/\n/g, '')

	  			// _bundled_scripts_client += '(function(){'+
	  			// 	"c.svgs = c.trust(" + JSON.stringify(_bundled_svg_client).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029') + ");" +
	  			// '})();'
	  		}

	  		// _source_maps = _memory_fs.readFileSync(path.resolve(_caller_dir_path, 'bundle.js.map'), 'utf8')


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

					build_count--

					if(argv.build) saveBundle({_bundled_scripts_client_url: _bundled_scripts_client_url})

				})

				// if(_bundled_styles_client){

				// 	var base64dataStyles = new Buffer(_bundled_styles_client, 'utf8')
				// 	var content_length_styles =  Buffer.byteLength(_bundled_styles_client, 'utf8')

				// 	config.s3.putObject({
				// 		Bucket: config.s3_bucket_name,
				// 		Key: config.s3_bucket_directories + '/' + stats.hash + '.bundle.css',
				// 		Body: base64dataStyles,
				// 		ACL: 'public-read',
				// 		CacheControl: 'public, max-age=31536000',
				// 		ContentLength: content_length_styles,
				// 		ContentType: 'text/css; charset=utf-8',
				// 	}, function (error, response) {

				// 		if(error) return console.error('Failed to upload client styles. Falling back to inline styles.')

				// 		console.log('Successfully uploaded client styles')

				// 		_bundled_styles_client_url = config.cdn_url.replace(/\/$/, '') + '/' + stats.hash + '.bundle.css'
				// 	})
				// }
	  		}
	  		else {

	  			build_count--
	  			if(argv.build) saveBundle({_bundled_scripts_client: _bundled_scripts_client})
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
			// var $ = cheerio.load(output)

			// if(_bundled_styles_client_url){
			// 	$('head').append('<link id="' + render_id + '_styles" rel="stylesheet" type="text/css" href="' + _bundled_styles_client_url + '">')
			// }
			// else {
				// $('head').append('<style id="' + render_id + '_styles">' + _bundled_styles_client + '</style>')
			// }


			output = '<!doctype html>' +
			'<html><head>' + '<style id="' + render_id + '_styles">' + _bundled_styles_client + '</style>' + output.slice(6, -7) +

				(_bundled_svg_client.slice(0, 4) + ' style="display: none !important;" id="' + render_id + '_svgs">' + _bundled_svg_client.slice(4)).replace(/\n/g, '') + 

				'<script>' +

				"function " + render_id + "_init(){" +

					"var styles = document.getElementById('" + render_id + "_styles');" +
					"var svgs = document.getElementById('" + render_id + "_svgs');" +

					// "if(styles.tagName.toUpperCase() === 'LINK'){" +
					// 	"styles = c('link', {key: styles.id, id:styles.id, rel:'stylesheet', type:'text/css', href:styles.href})" + 
					// "}" +

					// "else{" +
						"styles = c('style', {key: styles.id}, styles.innerHTML);" + 
					// "};" +

					// "var scripts = document.getElementById('" + render_id + "_scripts');" +

					// "if(scripts.src){" +
					// 	"scripts = c('script', {key: '" + render_id + "-styles', src:scripts.src})" + 
					// "}" +

					// "else{" +
					// 	"scripts = c('script', {key: '" + render_id + "-styles'}, scripts.innerHTML)" + 
					// "};" +

					"c.styles = styles;" + 
					// "c.scripts = scripts;" +
					// "c.svgs = c.trust('" + _bundled_svg_client + "');" +
					"c.svgs = c.trust(svgs.outerHTML);" + 
					// "window.global_styles = '" + _bundled_styles_client_url + "';" +
					"c.store = new loki('crazy-taxi.db');" +
					"c.store.loadJSON(" + JSON.stringify(store.serialize()).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029') + ");" +
					"c.route.prefix('');c.route(document.documentElement, '/', window['" + _bundle_id + "']);" +
				"}" +

				// "c.store = new loki('crazy-taxi.db');" +
				// "c.store.loadJSON(" + JSON.stringify(store.serialize()).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029') + ");" +
				// "c.route.prefix('');c.route(document.documentElement, '/', window['" + _bundle_id + "']);" +

			'</script>' +

			(_bundled_scripts_client_url ? 
				('<script id="' + render_id + '_scripts">' + 
					"(function(c,r,a,z,y){" +
						"y=c.createElement(r);s=c.getElementsByTagName(r)[0];y.src=a;y.addEventListener('load',z,false);s.parentNode.insertBefore(y,s);" +
					"})(document,'script','" + _bundled_scripts_client_url + "', " + render_id + "_init);" + 
				"</script>")
			:
				'<script id="' + render_id + '_scripts">' + _bundled_scripts_client + ' ' + render_id + '_init();</script>') +

			'</body></html>'


			// $('body').append(

			// 		(_bundled_svg_client.slice(0, 4) + ' style="display: none !important;" id="' + render_id + '_svgs">' + _bundled_svg_client.slice(4)).replace(/\n/g, '') + 

			// 		'<script>' +

			// 		"function " + render_id + "_init(){" +

			// 			"var styles = document.getElementById('" + render_id + "_styles');" +
			// 			"var svgs = document.getElementById('" + render_id + "_svgs');" +

			// 			// "if(styles.tagName.toUpperCase() === 'LINK'){" +
			// 			// 	"styles = c('link', {key: styles.id, id:styles.id, rel:'stylesheet', type:'text/css', href:styles.href})" + 
			// 			// "}" +

			// 			// "else{" +
			// 				"styles = c('style', {key: styles.id}, styles.innerHTML);" + 
			// 			// "};" +

			// 			// "var scripts = document.getElementById('" + render_id + "_scripts');" +

			// 			// "if(scripts.src){" +
			// 			// 	"scripts = c('script', {key: '" + render_id + "-styles', src:scripts.src})" + 
			// 			// "}" +

			// 			// "else{" +
			// 			// 	"scripts = c('script', {key: '" + render_id + "-styles'}, scripts.innerHTML)" + 
			// 			// "};" +

			// 			"c.styles = styles;" + 
			// 			// "c.scripts = scripts;" +
			// 			// "c.svgs = c.trust('" + _bundled_svg_client + "');" +
			// 			"c.svgs = c.trust(svgs.outerHTML);" + 
			// 			"window.global_styles = '" + _bundled_styles_client_url + "';" +
			// 			"c.store = new loki('crazy-taxi.db');" +
			// 			"c.store.loadJSON(" + JSON.stringify(store.serialize()).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029') + ");" +
			// 			"c.route.prefix('');c.route(document.documentElement, '/', window['" + _bundle_id + "']);" +
			// 		"}" +

			// 		// "c.store = new loki('crazy-taxi.db');" +
			// 		// "c.store.loadJSON(" + JSON.stringify(store.serialize()).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029') + ");" +
			// 		// "c.route.prefix('');c.route(document.documentElement, '/', window['" + _bundle_id + "']);" +

			// 	'</script>' +

			// 	(_bundled_scripts_client_url ? 
			// 		('<script id="' + render_id + '_scripts">' + 
			// 			"(function(c,r,a,z,y){" +
			// 				"y=c.createElement(r);s=c.getElementsByTagName(r)[0];y.src=a;y.addEventListener('load',z,false);s.parentNode.insertBefore(y,s);" +
			// 			"})(document,'script','" + _bundled_scripts_client_url + "', " + render_id + "_init);" + 
			// 		"</script>")
			// 	:
			// 		'<script id="' + render_id + '_scripts">' + _bundled_scripts_client + ' ' + render_id + '_init();</script>')
			// )

			// if(_bundled_scripts_client_url){
			// 	$('body').append('<script id="' + render_id + '_scripts">' + 
			// 		"(function(c,r,a,z,y){" +
			// 			"y=c.createElement(r);s=c.getElementsByTagName(r)[0];y.src=a;y.addEventListener('load',z,false);s.parentNode.insertBefore(y,s);" +
			// 		"})(document,'script','" + _bundled_scripts_client_url + "', " + render_id + "_init);" + 
			// 	"</script>")
			// 	// $('body').append('<script id="' + render_id + '_scripts" src="'+ _bundled_scripts_client_url +'"></script>')
			// }

			// else {
			// 	$('body').append('<script id="' + render_id + '_scripts">' + _bundled_scripts_client + ' ' + render_id + '_init();</script>')
			// 	// $('body').append('<script id="' + render_id + '_scripts">' + _bundled_scripts_client +'</script>')
			// }

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
			// return $.html()
			return output
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
            chunkModules: false,
            modules: false,
            timings: true,
            colors: true,
        }))

		try{


	  		_bundled_scripts_server = _memory_fs.readFileSync(path.resolve(_caller_dir_path, 'bundle_server.js'), 'utf8')

	  		build_count--

	  		if(argv.build) saveBundle({_bundled_scripts_server: _bundled_scripts_server})

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



	if(argv['build-mobile']){

		if(!argv['output']) throw "'--output {directory path}' is required"


		var webpack_config_mobile = {
			mode: SETTINGS.get('production') ? 'production' : 'development',
			entry: _target_file_path,
			output: {
				path: _caller_dir_path,
		        filename: 'bundle_mobile.js',
		        library: 'APP_BUNDLE',
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
			              	use: {
						      	loader: "css-loader",
						      	options: {
						      		minimize: true,
						      		sourceMap: !SETTINGS.get('production'),
						      	}
						    },
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
				      	// exclude: /(node_modules|bower_components)/,
				      	use: {
				        	loader: 'babel-loader',
				        	options: {
	        					presets: ['babel-preset-env'].map(require.resolve),
	      					}
				      	}
				    },
			        {
						test: require.resolve('./mobile.js'),
						loader: 'expose-loader?c'
					},
			        { 
			            test: /\.js$/,
			            loader: StringReplacePlugin.replace({
			                replacements: [
			                    {
			                        pattern: /crazy-taxi/g,
			                        replacement: function (match, p1, offset, string) {
			                            return 'crazy-taxi/mobile'
			                        }
			                    }
			                ]
			            })
			        },
				    {
		                test: /\.svg$/,
		                use: {
		                	loader: 'external-svg-sprite-loader',
		                	options: {
		                		iconName: 'icon-[name]',
		                		name: 'bundle_mobile.svg',
		                	},
		                }
		            },
				]
			},
			resolveLoader: {
				modules: [
					path.resolve(__dirname, 'node_modules'),
					'node_modules',
				],
			},
			plugins: [
		      	new StringReplacePlugin(),


		      	new ExtractTextPlugin({
		          	filename: 'bundle_mobile.css'
		        }),

		        // new SpriteLoaderPlugin(),

		        new SvgStorePlugin(),

		        new webpack.DefinePlugin({
			      	'process.env.CRAZY_TAXI_HOST': JSON.stringify(argv.host || ''),
			    }),
		   	],
		   	// devtool: SETTINGS.get('production') ? false : 'cheap-eval-source-map'
		}

		if(SETTINGS.get('production')){

			// webpack_config_mobile.devtool = 'source-map'

			webpack_config_mobile.plugins = webpack_config_mobile.plugins.concat([

				new webpack.LoaderOptionsPlugin({
		            minimize: true,
		            debug: false
		        }),
				
				new UglifyJsPlugin({
					uglifyOptions: {
						ie8: false,
						ecma: 8,
						mangle: {
			                keep_fnames: true
			            },
						output: {
							comments: false,
							beautify: false,
						},
						warnings: false
					}
			    }),

			    new webpack.DefinePlugin({
			      	'process.env.NODE_ENV': JSON.stringify('production'),
			    }),

			])

		}




		var compiler_mobile = webpack(webpack_config_mobile)

		compiler_mobile.outputFileSystem = _memory_fs

		compiler_mobile.run(function(err, stats) {


			if(err) console.log(err)


			console.log('[webpack:build]', stats.toString({
	            chunks: false,
	            chunkModules: false,
	            modules: false,
	            timings: true,
	            colors: true,
	        }))

			try{


		  		var scripts_mobile = _memory_fs.readFileSync(path.resolve(_caller_dir_path, 'bundle_mobile.js'), 'utf8')
		  		var styles_mobile = _memory_fs.readFileSync(path.resolve(_caller_dir_path, 'bundle_mobile.css'), 'utf8')
		  		var svgs_mobile = _memory_fs.readFileSync(path.resolve(_caller_dir_path, 'bundle_mobile.svg'), 'utf8')

		  		scripts_mobile += 'c.svgs = c.trust(\'<div style="display: none !important;">' + svgs_mobile + '</div>\');'


		  		var mobile_output_dir = path.resolve(_getRootDir(_caller_dir_path), argv['output'])

		  		var count = 2
		  		fs.writeFile(mobile_output_dir + '/bundle.js', scripts_mobile, (error, response) => {
		  			console.log("Scripts Written to '" + mobile_output_dir + '/bundle.js' + "'.")
		  			if(--count == 0) process.exit()
		  		})
		  		fs.writeFile(mobile_output_dir + '/bundle.css', styles_mobile, (error, response) => {
		  			console.log("Styles Written to '" + mobile_output_dir + '/bundle.css' + "'.")
		  			if(--count == 0) process.exit()
		  		})
		  		// fs.writeFile(mobile_output_dir + '/bundle.svg', svgs_mobile, (error, response) => {
		  		// 	console.log("SVG Icons Written to '" + mobile_output_dir + '/bundle.svg' + "'.")
		  		// 	if(--count == 0) process.exit()
		  		// })


			}
			catch(error){

				console.error(error)

			}

		})

	}


	else if(_use_cache){

		console.log('Using Cache')

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

	else if(SETTINGS.get('production')){
		
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