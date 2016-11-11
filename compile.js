const webpack 		= require('webpack')
const MemoryFS 		= require('memory-fs')
const path 			= require('path')
const fs 		 	= require('fs')

const render 		= require('mithril-node-render')
const hyperscript 	= require('mithril/hyperscript')





const _bundled_mithril = fs.readFileSync(path.resolve(__dirname, './node_modules/mithril/mithril.min.js'),'utf8')





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


	const fs = new MemoryFS()

	const compiler = webpack({
		entry: _target_file_path,
		output: {
			path: _caller_dir_path,
            filename: 'bundle.js',
            library: _target_file_path,
            libraryTarget: 'umd'
        },
		externals: {
	        "crazy-taxi": "m"
	    },
	    module: {
			loaders: [
				{ test: /crazy-taxi/, loader: 'ignore-loader' }
			]
		}
	})

	compiler.outputFileSystem = fs

	compiler.run(function(err, stats) {

		// console.log(stats.toString({
  //           chunks: false,
  //           colors: true
  //       }))
		// console.log(_caller_dir_path)
	  	_bundled_files = fs.readFileSync(path.resolve(_caller_dir_path, 'bundle.js'), 'utf8')

	  	// console.log(_bundled_files.slice(0,30))
	})

	return (params) => {

		params = params || {}

		let output_string = `
			<div id="${_target_file_path}">
			${render(hyperscript(_compiled_files, params))}

			<script>
				${_bundled_mithril}
				${_bundled_files}
				window['${_target_file_path}-init'] = ${JSON.stringify(params)}
				m.mount(document.getElementById('${_target_file_path}'), {view: function () { return m(window['${_target_file_path}'], window['${_target_file_path}-init'])}})
			</script>
		`

		return output_string
	}
}


module.exports = compile