'use strict'

var express   = require('express')
var c         = require('crazy-taxi')


const app = express()

c.set('production', process.env.NODE_ENV === 'production')

app.use(c.router('./routes.js').s3({
	access_key_id: 'AKIAIGZCUFYWO2CDXW2Q',
	secret_access_key: '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',
	bucket_url: 'https://s3-us-west-2.amazonaws.com/wheelwell-photo-assets/site-assets/',
	cdn_url: 'https://d3c8j4mxmubrpz.cloudfront.net/site-assets/',
}))

app.listen(process.env.PORT || 3000)
