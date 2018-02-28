'use strict';

const config = require('./../config');
const util = require('./utility');

const bodyParser = require('body-parser');

let runningServers = [];

module.exports = function(app, server) {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: true
    }));

	app.get('/api/server', function(req, res) {
		util.getServers(function(servers){
			res.json(servers);
		});
	})

	app.post('/api/server', function(req, res) {
		util.createServer(function(servers){
			res.json(servers);
		});
	})

	app.delete('/api/server/:name', function(req, res) {
		util.deleteServer(req.params.name, function(servers){
			res.json(servers)
		});
	})

	app.post('/api/server/:name', function(req, res) {
		let server = req.body;
		server.running = false;
		util.updateServer(server, function(servers){
			res.json(servers);
		});
	})

	app.get('/api/server/:name', function(req, res) {
		util.findServerByName(req.params.name, function(server) {
			if(server) {
				res.json(server);
			}
			else {
				res.sendStatus(404);
			}
		})
	})

	app.get('/api/server/:name/logs', function(req, res) {
		util.findServerByName(req.params.name, function(server) {
			if(server) {
				res.json({logs: server.logs});
			}
			else {
				res.sendStatus(404);
			}
		})
	})
}