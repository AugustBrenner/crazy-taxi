"use strict"


var hyperscript = require("./mobile-monkey-patches/hyperscript.js")
hyperscript.trust = require("mithril/render/trust")
hyperscript.fragment = require("mithril/render/fragment")
var m = hyperscript

var PromisePolyfill = require("mithril/promise/promise")
var requestService = require("./mobile-monkey-patches/request.js")(window, PromisePolyfill)

var redrawService = require("mithril/redraw")
requestService.setCompletionCallback(redrawService.redraw)

m.mount = require("mithril/mount")
m.route = require("mithril/route")
m.withAttr = require("mithril/util/withAttr")
m.render = require("mithril/render").render
m.redraw = redrawService.redraw
m.request = requestService.request
m.jsonp = requestService.jsonp
m.parseQueryString = require("mithril/querystring/parse")
m.buildQueryString = require("mithril/querystring/build")
m.version = "bleeding-edge"
m.vnode = require("mithril/render/vnode")

var loki = require('lokijs')
m.store = new loki('crazy-taxi.db')

module.exports = m