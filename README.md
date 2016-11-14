Crazy Taxi
========
Universal Javascript: easy and seamless

----------

Crazy taxi is based on Mithril.js and uses hyperscript syntax (pure JS) for it's templates.  Dead simple backend rendering.

	var ct = require('crazy-taxi’)

	var component = ct.compile('./component.js’)
	
	var compiledHTMLString = component({name: ‘Joe’})



The rendering of each component is independent, and functions independently on the front end.  Any attributes you pass into the compiled function are pre-rendered and hydrated automatically on the client!

	var rendered_page = `
		<head>
			<title>Craaaaazy Taaaaxi</title>
		</head>

		<body>
			<h1>
				${component_one({name: ‘Joe’})}
				${component_one({name: ‘Schmoe’})}
			<h2>

			<p>
				${component_two({title: ‘Programmer’})}
			</p>

			<div>
				<p>
					Don't be afraid to write HUUUUGE components!
				</p>
				${huge_component_with_lots_of_children()}
			</div>
		</body>
	`


Template Engine:
------------------------
Crazy Taxi's tempating is powered by [Mithril.js](https://github.com/lhorie/mithril.js/tree/rewrite)  A super tiny (7kb gzip & min), [ultra fast](http://mithril.js.org/benchmarks.html) library that is extremely easy to learn. 

Mithril Uses [Hyperscript](https://github.com/dominictarr/hyperscript) templating, which unlike JSX is pure javascript so it's easy to reason about and requires no transpilation:

	var SimpleMarkupComponent = {
	    view: function(vnode) {
	        return c('div', [ 
		        c('p', {style:{'color': 'orange'}} ,'Hello!')
	        ]
	    }
	}



Just like React, Mithril uses a virtual DOM to diff changes and redraw the page.  This means is has lifecycle components, just like react:

	var ComponentWithHooks = {
	    oninit: function(vnode) {
	        console.log("initialized")
	    },
	    oncreate: function(vnode) {
	        console.log("DOM created")
	    },
	    onupdate: function(vnode) {
	        console.log("DOM updated")
	    },
	    onbeforeremove: function(vnode, done) {
	        console.log("exit animation can start")
	        done()
	    },
	    onremove: function(vnode) {
	        console.log("removing DOM element")
	    },
	    onbeforeupdate: function(vnode, old) {
	        return true
	    },
	    view: function(vnode) {
	        return "hello"
	    }
	}

Options:
------------
Once a Crazy Taxi component has been compiled, you can pass options into the returned function:

> **Options:**
> 
> - exclude_framework: **Bool** 
> Removes the the compiled Mithril framework from the output string. By default Crazy Taxi will include Mithril in every output string generation. If you have more than one component being sent from the server at a time, you can set *exclude_framework: true* for every component after the first and just let them piggy back of the first components framework instance.



Examples:
=========

Basic:
--------
**/component.js:**
		
	var c = require('crazy-taxi')
	
	module.exports = {
	   
	   // This is the view. It renders hyperscript.
	    view: function(vnode) {
	        return c('h1', vnode.attrs.text)
	    }
	}
**/server.js**

	const express 		= require('express')
	const c 			= require('crazy-taxi')
	
	const app = express()

	const component = c.compile('./component.js')
	
	app.get('*', (req, res) => {
	
		res.send(component({text: 'Hello World!'}))
	
	})
	

	app.listen(3000)

Easy:
--------
**/component.js:**

	var c = require('crazy-taxi')
	
	const Component = {
	
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



**/server.js**

	const express 		= require('express')
	const ct 			= require('crazy-taxi')
	const random_name 	= require('node-random-name')
	
	
	const app = express()
	
	
	const asyncFunction = () => new Promise((resolve, reject) => {
		
		setTimeout(() => {
	
			resolve(random_name())
	
		}, 100)
	})
	
	
	
	const component = ct.compile('./component.js')
	
	app.get('*', (req, res) => {
	
		asyncFunction().then(name => {
	
			res.send(`
	
				${component({name: name})}
	
				${component({name: 'Joe Schmoe'}, {exclude_framework: true})}
			`)
		})
	
	})
	
	
	app.listen(3000)


Universal Javascript: Finally Easy
===========================
