const c 		= require('crazy-taxi')

require('./like.svg')
require('./styles.css')




var Home = {

	oninit: function(vnode) {

		if(!c.store.getCollection('greetings')) c.store.addCollection('greetings')

	    const Greetings = c.store.getCollection('greetings')

	    vnode.state.greetings = Greetings.find()

	    if(vnode.state.greetings.length === 0){

			return (new Promise((resolve, reject) => {

			setTimeout(function(){
					resolve()
				}, 400)
			}))
			.then(function(){

				vnode.state.greetings = [{greeting: 'Hello!'}]

				Greetings.insert(vnode.state.greetings)

				c.redraw()
			})
	    	
	    }

	},
 
	view: function(vnode) {
		return [
			c('head', [
				c.styles,
				c('title', 'Home'),
			]),
			c('body', [
				c('a', {href:'/page2', oncreate: c.route.link}, 'Page 2'),
				c('pre', JSON.stringify(vnode.state.greetings, null, 4)),
			]),
		]
	}
}

var Page2 = {

	oninit: function(vnode){

		if(!c.store.getCollection('greetings')) c.store.addCollection('greetings')

	    const Greetings = c.store.getCollection('greetings')

	    var greeting = Greetings.findOne({greeting: 'Hi'})

	    if(!greeting) greeting = Greetings.insert({greeting: 'Hi'})

	    greeting.count = (greeting.count || 0) + 1

	    Greetings.update(greeting)
	},
		
	view: function(vnode) {
		return [
			c('head', [
				c('title', 'Page 2'),
				c.styles,
			]),
			c('body', [
				c('a', {href:'/', oncreate: c.route.link}, 'Home'),
				c('svg', c('use', {'xlink:href': '#icon-like'})),
				c('pre', JSON.stringify(vnode.attrs, null, 4)),
				c.svgs
			]),
		]
	}
}




// Routes

const router 	= {

	'/'			              : Home,

	'/page2'              : Page2,
	'/page2/:param2...' 	: Page2,

}

module.exports = router