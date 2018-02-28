'use strict';

const config = require('./app/config');
const util = require('./app/core/utility');

util.resetServers();

const express = require('./app/core/express');

const api = require('./app/core/api')(express);

const httpWSServer = require('./app/core/wsocket')(express);

httpWSServer.listen(config.serverPort, function() {
    console.log(`Listening on ${config.serverPort}.`);
});