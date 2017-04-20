'use strict'

var express 		= require('express')
var c 			    = require('crazy-taxi')
var random_name     = require('node-random-name')

c.set('production', true)

const component = c.compile('./component.js')


const asyncFunction = () => new Promise((resolve, reject) => {	
	setTimeout(() => {
		resolve(random_name())
	}, 100)
})


const app = express()


app.get('*', (req, res) => {
	asyncFunction().then(name => {
		res.send(`
			${component({name: name})}
			${component({name: 'Joe Schmoe'}, {exclude_framework: true})}
		`)
	})
})

app.listen(3000)
