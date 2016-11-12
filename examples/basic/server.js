'use strict'

const express 	= require('express')
const c 		= require('crazy-taxi')


const component = c.compile('./component.js')

const app = express()

app.get('*', (req, res) => {
	res.send(component({text: 'Hello World!'}))
})

app.listen(3000)
