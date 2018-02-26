'use strict';

const config = require('./../config');

const express = require('express');
const app = express();

app.set('view engine', 'ejs');
app.set('views', config.views);
app.use('/public', express.static('public'))

module.exports = app;

app.get('/', function(req, res) {
	if(typeof req.query.port != 'undefined') {
		let port = req.query.port;
		if(port.match(/[0-9]+/g) && port > 0 && port < 65536) {
			res.redirect('http://' + req.hostname + ':' + port);
		}
		else {
			res.status(200).render('index');
		}
	}
	else {
		res.status(200).render('index');
	}
})

app.get('/settings', function(req, res) {
	res.render('settings');
})