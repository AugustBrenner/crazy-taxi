
// Dependencies =====================================================
var c = require('crazy-taxi')


// The component =====================================================
const Component = {

    // This is the oninit lifecycle method. It is called before the view renders.
    oninit: function(vnode) {

        // Set the name from the passed in attribute 'name'.
        vnode.state.name = vnode.attrs.name

        // Attach a function to the view that changes the name to a random one.
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
        .run(function(posts){
            
            return posts.slice(0, 4)
        })

    },
   
   // This is the view. It renders hyperscript.
    view: function(vnode) {
        return c('div', [

        	c('h1', ['Hello ' + vnode.state.name]),

            c('button', {onclick: vnode.state.randomName}, 'Say Hi!'),

            c('pre', JSON.stringify(vnode.state.async_response(), null, 4))
        ])
    }
}

module.exports = Component