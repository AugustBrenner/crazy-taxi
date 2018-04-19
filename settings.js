'use strict'

var SETTINGS = {
	production: false,
	env: {},
}



module.exports = {
	set: function(key, value){
		SETTINGS[key] = value
	}, 
	get: function(key){
		if(!key) return SETTINGS
		return SETTINGS[key]
	}
}