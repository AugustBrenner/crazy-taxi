const webpack 		= require('webpack')
const MemoryFS 		= require('memory-fs')
const path 			= require('path')
const fs 		 	= require('fs')
const shortid 		= require('shortid')

const render 		= require('mithril-node-render')
const hyperscript 	= require('mithril/hyperscript')





const _bundled_framework = fs.readFileSync(require.resolve('mithril/mithril.min.js'),'utf8')





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






const compile = (input) => {

	const _caller_dir_path = path.dirname(_getCallerFile())

	const _target_file_path  = path.resolve(_caller_dir_path, input)

	const _compiled_files = require(_target_file_path)
	
	let _bundled_files = ''

	const _bundle_id = shortid.generate()

	const fs = new MemoryFS()

	const compiler = webpack({
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

		if(false)

		params = params || {}
		config = config || {}

		const render_id = shortid.generate()

		let output_string = `
			<div id="${render_id}">
				${render(hyperscript(_compiled_files, params))}
			</div>

			<script>
				${config.exclude_framework ? '' : _bundled_framework}
				${_bundled_files}
				m.mount(document.getElementById('${render_id}'), {view: function () { return m(window['${_bundle_id}'], ${JSON.stringify(params)})}})
			</script>
		`

		return output_string
	}
}


module.exports = compile