'use strict';

const config = require('./../config');
const util = require('./utility');

const bodyParser = require('body-parser');
const fs = require('fs');

let runningServers = [];

module.exports = function(app, server) {
	app.get('/api/server', function(req, res) {
		fs.readFile(config.servers, 'utf8', function(err, data) {
			if(err) throw(err);
			util.resetRunning(JSON.parse(data).servers, function(servers){
				res.json(servers);
			});
		})
	})

	app.get('/api/server/:name/logs', function(req, res) {
		fs.readFile(config.servers, 'utf8', function(err, data) {
			if(err) throw(err);
			data = JSON.parse(data);
			util.findServerByName(req.params.name, data.servers, function(server) {
				if(server) {
					res.json(server.logs);
				}
				else {
					res.sendStatus(404);
				}
			})
		})
	})
}