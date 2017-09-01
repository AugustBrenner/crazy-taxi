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



var http = require('http')
var c = require('crazy-taxi')

var router = c.router('./router.js').s3({
	bucket_name: '',
	access_key_id: '',
	secret_access_key: '',
	cdn_uri: '',
})

http.createServer(router).listen(3000)