"use strict"

var c = require("mithril/hyperscript")

var SETTINGS = require('./settings.js')

// var redrawService = require("mithril/redraw")

c.withAttr = require("mithril/util/withAttr")
c.prop = require("mithril/stream")
c.redraw = function(){}
c.parseQueryString = require("mithril/querystring/parse")
c.buildQueryString = require("mithril/querystring/build")

c.version = "bleeding-edge"

c.compile = require('./compile')
c.router = require('./build')

// c.compileCSS = require('./compileCSS')

c.requireOnClient = function(){}

c.set = SETTINGS.set
c.get = SETTINGS.get

c.route = {
	link: function(){}
}


// Polyfill
// var _stream = require('mithril/stream')

// var streamPolyfill = function(args){
// 	var stream = _stream()
// 	if (args.initialValue !== undefined) stream(args.initialValue)
// 	return stream
// }

c.request = () => new Promise((resolve, reject) => {})
c.jsonp = () => new Promise((resolve, reject) => {})


module.exports = c