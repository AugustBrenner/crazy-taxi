'use strict'

// Node Modules =====================================================
const express 		= require('express')
const ct 			= require('crazy-taxi')
const random_name 	= require('node-random-name')



// Server Config =====================================================
const app = express()


const asyncFunction = () => new Promise((resolve, reject) => {
	
	setTimeout(() => {

		resolve(random_name())

	}, 100)
})



// Routes =====================================================
const component = ct.compile('./component.js')

app.get('*', (req, res) => {

	asyncFunction().then(name => {

		res.send(`

			${component({name: name})}

			${component({name: 'Joe Schmoe'}, {exclude_framework: true})}
		`)
	})

})


// Run Server =====================================================
app.listen(3000)