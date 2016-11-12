'use strict'

// Node Modules =====================================================
const express 		= require('express')
const c 			= require('crazy-taxi')


// Server Config =====================================================
const app = express()


// Routes ============================================================
const component = c.compile('./component.js')


app.get('*', (req, res) => {

	res.send(component({text: 'Hello World!'}))

})


// Run Server ========================================================
app.listen(3000)