'use strict'

var express 		= require('express')
var ct 			    = require('crazy-taxi')
var random_name     = require('node-random-name')


const component = ct.compile('./component.js')


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
