'use strict';

const config = require('./../config');
const util = require('./utility');

const dateFormat = require('dateformat');
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

	    ws.on('error', (err) => {});

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
					util.findServerByName(message.name, function(server) {
						if(typeof server.running != 'undefined') {
							if(server.running == true) {
								wsAllSend(JSON.stringify({
									name: server.name,
									type: 'status',
									status: config.status.running
								}));
							}
							else {
								if(server.app && server.config && server.portvar && server.port) {
									util.setConfigPort(server, message.port, function() {
										server.running = true;
										let serverProcess = {
											name: server.name
										}

										wsAllSend(JSON.stringify({
											name: server.name,
											type: 'status',
											status: config.status.starting
										}));

										serverProcess.process = util.startServer(server, function(string) {
											let output = JSON.parse(string);
											let now = new Date();
											let timestamp = dateFormat(now, "dd mmm yyyy HH:MM:ss");
											let log = timestamp + "\n" + output.type + "\n" + output.raw + "\n";
											server.logs += log;
											server.port = message.port;
											util.updateServer(server, function() {
												wsAllSend(string);
											})
											runningServers.push(serverProcess);
										})
									})
								}
								else {
									wsAllSend(JSON.stringify({
										name: server.name,
										type: 'status',
										status: config.status.confignotvalid
									}));
								}
							}
							
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

				case 'stop':
					util.findRunningServerByName(message.name, runningServers, function(server, serverProcess, index) {
						if(server) {
							if(typeof server.running != 'undefined' && server.running == true) {
								serverProcess.kill();
								server.running = false;
								util.updateServer(server, function() {
									wsAllSend(JSON.stringify({
										name: server.name,
										type: 'status',
										status: config.status.stopping
									}));
									runningServers.splice(index, 1);
								})
							}
							else {
								wsAllSend(JSON.stringify({
									name: message.name,
									type: 'status',
									status: config.status.stopped
								}));
							}
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
					util.findRunningServerByName(message.name, runningServers, function(server) {
						if(server && typeof server.running != 'undefined' && server.running == true) {
							server.process.stdin.setEncoding('utf-8');
							server.process.stdin.write(`${message.payload}\n`);
							server.running = false;
							wsAllSend(JSON.stringify({
								name: server.name,
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