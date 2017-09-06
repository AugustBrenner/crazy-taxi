'use strict'

var express   = require('express')
var c         = require('crazy-taxi')


const app = express()

app.use(c.router('./routes.js'))

app.listen(process.env.PORT || 3000)
