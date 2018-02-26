'use strict';

const path = require('path');

module.exports = {
	serverPort: 5000,
	views: path.join(__dirname, './../views'),
	servers: path.join(__dirname, './../servers.json'),
	status: {
		starting: 0,
		running: 1,
		stopping: 2,
		stopped: 3,
		error: 4,
		notfound: 5,
	}
}