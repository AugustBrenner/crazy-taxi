"use strict"

var requestHandler 		= require('xhr-request')
var url 				= require('url')

var buildQueryString 	= require("mithril/querystring/build")

var FILE_PROTOCOL_REGEX = new RegExp("^file://", "i")



var RequestClosure = function(request_options){

	var callbackCount = 0

	var oncompletion
	function setCompletionCallback(callback) {oncompletion = callback}

	function finalizer() {
		var count = 0
		function complete() {if (--count === 0 && typeof oncompletion === "function") oncompletion()}

		return function finalize(promise) {
			var then = promise.then
			promise.then = function() {
				count++
				var next = then.apply(promise, arguments)
				next.then(complete, function(e) {
					complete()
					if (count === 0) throw e
				})
				return finalize(next)
			}
			return promise
		}
	}
	function normalize(args, extra) {
		if (typeof args === "string") {
			var url = args
			args = extra || {}
			if (args.url == null) args.url = url
		}
		return args
	}

	function request(args, extra) {

		// console.log('request1')

		var finalize = finalizer()

		args = normalize(args, extra)

		var promise = new Promise(function(resolve, reject) {

			// console.log('request')
			if (args.method == null) args.method = "GET"
			args.method = args.method.toUpperCase()

			var useBody = (args.method === "GET" || args.method === "TRACE") ? false : (typeof args.useBody === "boolean" ? args.useBody : true)

			if (typeof args.serialize !== "function") args.serialize = typeof FormData !== "undefined" && args.data instanceof FormData ? function(value) {return value} : JSON.stringify
			if (typeof args.deserialize !== "function") args.deserialize = deserialize
			if (typeof args.extract !== "function") args.extract = extract

			args.url = interpolate(args.url, args.data)
			if (useBody) args.data = args.serialize(args.data)
			else args.url = assemble(args.url, args.data)

			var params = {
				method: args.method,
				uri: args.url,
			}

			if(typeof args.user === "string" || typeof args.password === "string") params.auth = {}

			if(typeof args.user === "string") params.auth.user = args.user

			if(typeof args.password === "string") params.auth.pass = args.password

			if (args.serialize === JSON.stringify && useBody) {
				params.json = true
			}

			if (args.deserialize === deserialize) {
				params.json = true
			}

			for (var key in args.headers) if ({}.hasOwnProperty.call(args.headers, key)) {

				if(!params.headers) params.headers = []

				params.headers.push({
					name: key,
					value: args.headers[key]
				})
			}

			if (useBody && (args.data != null)) params.body = args.data


			if(!(/^https?:\/\/|^\/\//i).test(params.uri)){

				// request_options.base_url = request_options.base_url.replace(/\/$/, '')

				var url_obj = url.parse(request_options.base_url)

				request_options.base_url = url_obj.protocol + '//' + url_obj.host

				params.uri = params.uri.replace(/^\//, '')

				params.uri = request_options.base_url + '/' + params.uri
				
				if(request_options.headers) params.headers = request_options.headers
			}

			var req = requestHandler(params.uri, params, function (error, data) {
				
				// Don't throw errors on xhr.abort().
				// if(aborted) return
				
				if (error) return reject(error)

				try{
					if (req.connection._httpMessage.res.statusCode >= 400) return reject(data)
				}
				catch(e){}

				resolve(cast(args.type, data))
			})

		})

		return args.background === true ? promise : finalize(promise)
	}

	function jsonp(args, extra) {
		var finalize = finalizer()
		args = normalize(args, extra)

		var promise = new Promise(function(resolve, reject) {
			var callbackName = args.callbackName || "_mithril_" + Math.round(Math.random() * 1e16) + "_" + callbackCount++
			var script = $window.document.createElement("script")
			$window[callbackName] = function(data) {
				script.parentNode.removeChild(script)
				resolve(cast(args.type, data))
				delete $window[callbackName]
			}
			script.onerror = function() {
				script.parentNode.removeChild(script)
				reject(new Error("JSONP request failed"))
				delete $window[callbackName]
			}
			if (args.data == null) args.data = {}
			args.url = interpolate(args.url, args.data)
			args.data[args.callbackKey || "callback"] = callbackName
			script.src = assemble(args.url, args.data)
			$window.document.documentElement.appendChild(script)
		})
		return args.background === true? promise : finalize(promise)
	}

	function interpolate(url, data) {
		if (data == null) return url

		var tokens = url.match(/:[^\/]+/gi) || []
		for (var i = 0; i < tokens.length; i++) {
			var key = tokens[i].slice(1)
			if (data[key] != null) {
				url = url.replace(tokens[i], data[key])
			}
		}
		return url
	}

	function assemble(url, data) {
		var querystring = buildQueryString(data)
		if (querystring !== "") {
			var prefix = url.indexOf("?") < 0 ? "?" : "&"
			url += prefix + querystring
		}
		return url
	}

	function deserialize(data) {
		try {return data !== "" ? JSON.parse(data) : null}
		catch (e) {throw new Error(data)}
	}

	function extract(xhr) {return xhr.responseText}

	function cast(type, data) {
		if (typeof type === "function") {
			if (Array.isArray(data)) {
				for (var i = 0; i < data.length; i++) {
					data[i] = new type(data[i])
				}
			}
			else return new type(data)
		}
		return data
	}



	return {request: request, jsonp: jsonp, setCompletionCallback: setCompletionCallback}
}

module.exports = RequestClosure
