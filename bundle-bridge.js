'use strict'

var c 			= require('./server.js')
var routes 		= require('CT_PLACEHOLDER_FOR_ENTRY')


var BundleBridge = {}

BundleBridge.oninit = function(vnode){

	c.store = vnode.attrs.store
}

BundleBridge.view = function(vnode){
	return c(vnode.attrs.component)
}

module.exports = {
	shim: BundleBridge,
	routes: routes, 
}