'use strict';

const fs = require('fs');

module.exports.findServerByName = function(name, servers, callback) {
    for (let i = 0; i < servers.length; i++) {
        if (servers[i].name.toLowerCase() == name.toLowerCase()) {
            callback(servers[i]);
            return;
        }
    }
    callback(null);
}

module.exports.startServer = function(server, callback) {
    const {
        spawn
    } = require('child_process');
    const bat = spawn(server.app, [server.path], {
        detached: true,
    });

    bat.unref();

    bat.stdout.on('data', (data) => {
        server.running = true;
        callback(JSON.stringify({
            name: server.name,
            raw: data.toString().replace(/([a-zA-Z]+:\\)+(.+\\)+/g, 'fakepath\\'),
            type: 'stdout'
        }));
    });

    bat.stderr.on('data', (data) => {
        server.running = false;
        callback(JSON.stringify({
            name: server.name,
            raw: data.toString().replace(/([a-zA-Z]+:\\)+(.+\\)+/g, 'fakepath\\'),
            type: 'stderr'
        }));
    });

    bat.on('exit', (code) => {
        server.running = false;
        callback(JSON.stringify({
            name: server.name,
            code: code,
            type: 'exit'
        }));
    });
    return bat;
}

module.exports.removeServerByName = function(name, servers, callback) {
    let result = [];
    servers.forEach(function(server) {
        if(server.name != name) {
            result.push(server);
        }
    })
    callback(result);
}

module.exports.updateServer = function(server, servers, callback) {
    let s = Object.assign({}, server)
    delete s.process;
    for (let i = 0; i < servers.length; i++) {
        if (servers[i].name.toLowerCase() == s.name.toLowerCase()) {
            servers[i] = Object.assign({}, s);
        }
    }
    callback({servers: servers});
}

module.exports.resetRunning = function(servers, callback) {
     for (let i = 0; i < servers.length; i++) {
        if(typeof servers[i].running != 'undefined') {
            servers[i].running = false;
        }
    }
    callback(servers);
}

module.exports.setConfigPort = function(server, port, callback) {
    fs.readFile(server.config, 'utf8', function(err, data) {
        if(err) throw(err);
        let configcontents = data
            .replace(new RegExp(`(${server.portvar}.+?)[0-9]+`, "gm"), `$1${port}`);

        fs.writeFile(server.config, configcontents, function(err) {
            if(err) throw err;
            callback();
        })
    })
}