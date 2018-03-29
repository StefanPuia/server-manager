'use strict';

const config = require('./../config');

const express = require('express');
const app = express();

app.set('view engine', 'ejs');
app.set('views', config.views);
app.use('/public', express.static('public'))

module.exports = app;

// log all requests to console
app.use('/', (req, res, next) => {
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (ip.substr(0, 7) == "::ffff:") {
        ip = ip.substr(7)
    }
    if(config.verbose) console.log(new Date(), ip, req.method, req.url);
    next();
});

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