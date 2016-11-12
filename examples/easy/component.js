'use strict'

var c = require('crazy-taxi')


var Component = {
    // Lifecycle method, called before the view renders.
    oninit: function(vnode) {
        vnode.state.name = vnode.attrs.name

        vnode.state.randomName = function(e){
            var name_array = [
                'Benedict Kapusniak',
                'Leota Wetsel',
                'Bryon Caselli',
                'Karin Nersesian',
                'Monroe Soprych',
                'Alfonso Noerenberg',
            ]

            vnode.state.name = name_array[Math.floor(Math.random() * name_array.length)]
        }

        // An async call just to show you that you can use async calls within the init function.
        // The server will ignore them.  The client will use them :)
        vnode.state.async_response = c.request({
            method: "GET",
            url: "https://jsonplaceholder.typicode.com/posts",
            initialValue: []
        })
    },
   
    view: function(vnode) {
        return c('div', [
        	c('h1', ['Hello ' + vnode.state.name]),
            c('button', {onclick: vnode.state.randomName}, 'Say Hi!'),
            c('pre', JSON.stringify(vnode.state.async_response().slice(0, 4), null, 4))
        ])
    }
}

module.exports = Component
