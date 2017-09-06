const c 		= require('crazy-taxi')

import symbol from './like.svg'




var Home = {

    oninit: function(vnode) {

      	return (new Promise((resolve, reject) => {

      		setTimeout(function(){
      			resolve()
      		}, 200)
      	}))
      	.then(function(){
      		vnode.state.greeting = 'Hello!'
      		c.redraw()
      	})
    },
   
    view: function(vnode) {
        return [
        	c('head', [
        		c('title', 'Home')
        	]),
        	c('body', [
        		c('a', {href:'/page2', oncreate: c.route.link}, 'Page 2'),
        		c('p', vnode.state.greeting)
        	]),
        ]
    }
}

var Page2 = {
    
    view: function(vnode) {
        return [
        	c('head', [
        		c('title', 'Page 2')
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