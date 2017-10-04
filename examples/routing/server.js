'use strict'

var express   = require('express')
var c         = require('crazy-taxi')


const app = express()

c.set('production', process.env.NODE_ENV === 'production')

app.use(c.router('./routes.js'))

app.listen(process.env.PORT || 3000)
