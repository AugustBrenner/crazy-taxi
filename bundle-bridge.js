'use strict'

var c 			= require('./server.js')
var routes 		= require('CT_PLACEHOLDER_FOR_ENTRY')


var BundleBridge = {}

BundleBridge.oninit = function(vnode){

	c.store = vnode.attrs.store
	c.request = vnode.attrs.requestHandler.request
	c.jsonp = vnode.attrs.requestHandler.jsonp
	// c.styles = c.trust(vnode.attrs.styles)
	// c.scripts = c.trust(vnode.attrs.scripts)
}

BundleBridge.view = function(vnode){
	return c(vnode.attrs.component)
}

module.exports = {
	shim: BundleBridge,
	routes: routes, 
}