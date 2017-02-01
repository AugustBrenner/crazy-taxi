'use strict'
var webpack 		= require('webpack')
var MemoryFS 		= require('memory-fs')
var shortid 		= require('shortid')
var path 			= require('path')
var fs 		 		= require('fs')

var render 			= require('mithril-node-render')
var hyperscript 	= require('mithril/hyperscript')





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

	var _bundle_id = shortid.generate()

	var fs = new MemoryFS()

	var compiler = webpack({
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
			loaders: [
				{ test: /crazy-taxi/, loader: 'ignore-loader' }
			]
		}
	})

	compiler.outputFileSystem = fs

	compiler.run(function(err, stats) {

	  	_bundled_files = fs.readFileSync(path.resolve(_caller_dir_path, 'bundle.js'), 'utf8')

	})

	return (params, config) => {

		params = params || {}
		config = config || {}

		var render_id = shortid.generate()

		try{
			var output = render(hyperscript(_compiled_files, params))
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
				"m.mount(document.getElementById('" + render_id + "'), {view: function () { return m(window['" + _bundle_id + "'], " + JSON.stringify(params).replace('\u2028', '\\u2028').replace('\u2029', '\\u2029') + ")}})" +
			'</script>'
		

		return output_string
	}
}


module.exports = compile