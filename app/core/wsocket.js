'use strict';

const config = require('./../config');
const util = require('./utility');

const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');
const httpServer = http.createServer();
const wss = new WebSocket.Server({
    server: httpServer,
});

let runningServers = [];
let clients = [];

module.exports = function(app) {
	httpServer.on('request', app);

	wss.on('connection', function connection(ws, req) {
		clients.push(ws);

	    ws.on('error', (err) => {console.log(err)});

		    // listen for messages
	    ws.on('message', function incoming(message) {
	    	try {
	        	message = JSON.parse(message);
	        }
	        catch (err){
	        	message = {
	        		raw: message
	        	}
	        }

	        switch(message.method) {
	        	case 'start':
	        		fs.readFile(config.servers, 'utf8', function(err, fileData) {
						if(err) throw err;
						util.findServerByName(message.name, JSON.parse(fileData).servers, function(server) {
							util.findServerByName(message.name, runningServers, function(running) {
								if(running && typeof running.running != 'undefined') {
									if(running.running == true) {
										wsAllSend(JSON.stringify({
											name: server.name,
											type: 'status',
											status: config.status.running
										}));
									}
									else {
										util.setConfigPort(server, message.port, function() {
											running.running = true;
											running.process = util.startServer(running, function(string) {
												let log = {
													timestamp: new Date(),
													log: JSON.parse(string)
												}
												running.logs.push(log);
												running.port = message.port;
												util.updateServer(running, JSON.parse(fileData).servers, function(servers) {
													fs.writeFile(config.servers, JSON.stringify(servers, null, 4));
													wsAllSend(string);
												})
											})
											wsAllSend(JSON.stringify({
												name: server.name,
												type: 'status',
												status: config.status.starting
											}));
										})
									}
									
								}
								else if(server) {
									util.setConfigPort(server, message.port, function() {									
										server.running = true;
										if(typeof server.logs == 'undefined') {
											server.logs = [];
										}
										server.process = util.startServer(server, function(string) {
											let log = {
												timestamp: new Date(),
												log: JSON.parse(string)
											}
											server.logs.push(log);
											server.port = message.port;
											util.updateServer(server, JSON.parse(fileData).servers, function(servers) {
												fs.writeFile(config.servers, JSON.stringify(servers, null, 4));
												wsAllSend(string);
											})
										})
										
										runningServers.push(server);
										wsAllSend(JSON.stringify({
											name: server.name,
										type: 'status',
											status: config.status.starting
										}));
									})
								}
								else {
									wsAllSend(JSON.stringify({
										name: message.name,
										type: 'status',
										status: config.status.notfound
									}));
								}
							});
						});						
					})
				break;

				case 'stop':
					util.findServerByName(message.name, runningServers, function(running) {
						if(running && typeof running.running != 'undefined' && running.running == true) {
							running.process.kill();
							running.running = false;
							wsAllSend(JSON.stringify({
								name: running.name,
								type: 'status',
								status: config.status.stopped
							}));
						}
						else {
							wsAllSend(JSON.stringify({
								name: message.name,
								type: 'status',
								status: config.status.notfound
							}));
						}
					});
				break;

				case 'send':
					util.findServerByName(message.name, runningServers, function(running) {
						if(running && typeof running.running != 'undefined' && running.running == true) {
							running.process.stdin.setEncoding('utf-8');
							running.process.stdin.write(`${message.payload}\n`);
							running.running = false;
							wsAllSend(JSON.stringify({
								name: running.name,
								type: 'status',
								status: config.status.stopped
							}));
						}
						else {
							wsAllSend(JSON.stringify({
								name: message.name,
								type: 'status',
								status: config.status.notfound
							}));
						}
					});
				break;

				default:
					wsAllSend(JSON.stringify({
						method: 'undefined',
						type: 'undefined',
						raw: message
					}));
				break;
	        }
	    });
	});

	return httpServer;
}

function wsAllSend(string) {
	clients.forEach(function(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(string);
        }
    });
}