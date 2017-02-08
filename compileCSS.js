var fs 				= require('fs')
var path 			= require('path')
var postcss 		= require('postcss')
var precss 			= require('precss')
var sugarss 		= require('sugarss')
var autoprefixer 	= require('autoprefixer')
var CleanCSS 		= require('clean-css')


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

var plugins = [
	precss({
		import: { 
			disable: true
		},
		mixins: {
			disable: true 
		}
	}),
]

if(process.env.NODE_ENV !== 'production') plugins.push(autoprefixer)

var postCSS = postcss(plugins)

var clean = new CleanCSS()

module.exports = function(input){

	var _caller_dir_path = path.dirname(_getCallerFile())

	var _target_file_path  = path.resolve(_caller_dir_path, input)

	var file = fs.readFileSync(_target_file_path)

	var process_options = {from: _target_file_path, parser: sugarss}

	if(process.env.NODE_ENV !== 'production') process_options.map = {inline: true}

	var lazyObject = postCSS.process(file, process_options)

	if(process.env.NODE_ENV !== 'production') return lazyObject.css

	return clean.minify(lazyObject.css, lazyObject.map).styles

}
