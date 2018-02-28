'use strict';

const fs = require('fs');
const config = require('./../config');

module.exports.findServerByName = function(name, callback) {
    fs.readFile(config.servers, 'utf8', function(err, fileData) {
        if (err) throw err;
        let servers = JSON.parse(fileData).servers;
        for (let i = 0; i < servers.length; i++) {
            if (servers[i].name.toLowerCase() == name.toLowerCase()) {
                callback(servers[i]);
                return;
            }
        }
    })
}

module.exports.startServer = function(server, callback) {
    const {
        spawn
    } = require('child_process');
    const bat = spawn(server.app, [server.parameters], {
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
            raw: code,
            type: 'exit'
        }));
    });
    return bat;
}

module.exports.removeServerByName = function(name, servers, callback) {
    let result = [];
    servers.forEach(function(server) {
        if (server.name != name) {
            result.push(server);
        }
    })
    callback(result);
}

module.exports.updateServer = function(server, callback) {
    fs.readFile(config.servers, 'utf8', function(err, data) {
        if (err) throw (err);
        let name = server.name;
        if (typeof server.oldname != 'undefined') {
            name = server.oldname;
        }
        let servers = JSON.parse(data).servers;
        let s = Object.assign({}, server)
        for (let i = 0; i < servers.length; i++) {
            if (servers[i].name.toLowerCase() == name.toLowerCase()) {
                servers[i] = Object.assign({}, s);
            }
        }
        let output = {
            servers: servers
        };
        fs.writeFile(config.servers, JSON.stringify(output, null, 4));
        callback(servers);
    })
}

module.exports.resetServers = function() {
    fs.readFile(config.servers, 'utf8', function(err, data) {
        if (err) throw (err);
        let servers = JSON.parse(data).servers;
        servers.forEach(function(server) {
            server.running = false;
        })
        let output = {
            servers: servers
        };
        fs.writeFile(config.servers, JSON.stringify(output, null, 4));
    })
}

module.exports.setConfigPort = function(server, port, callback) {
    fs.readFile(server.config, 'utf8', function(err, data) {
        if (err) throw (err);
        let configcontents = data
            .replace(new RegExp(`(${server.portvar}.+?)[0-9]+`, "gm"), `$1${port}`);

        fs.writeFile(server.config, configcontents, function(err) {
            if (err) throw err;
            callback();
        })
    })
}

module.exports.findRunningServerByName = function(name, servers, callback) {
    for (let i = 0; i < servers.length; i++) {
        if (servers[i].name.toLowerCase() == name.toLowerCase()) {
            module.exports.findServerByName(name, function(server) {
                callback(server, servers[i].process, i);
            })
        }
    }
}

module.exports.getServers = function(callback) {
    fs.readFile(config.servers, 'utf8', function(err, data) {
        if (err) throw (err);
        let servers = JSON.parse(data).servers;
        callback(servers);
    })
}

module.exports.createServer = function(callback) {
    fs.readFile(config.servers, 'utf8', function(err, data) {
        if (err) throw (err);
        let servers = JSON.parse(data).servers;

        let max = 0;
        servers.forEach(function(server) {
            if (server.name.toLowerCase().match(/new-server-/g)) {
                let parts = server.name.split('-');
                let id = parts[parts.length - 1];
                if (id > max) {
                    max = id;
                }
            }
        })
        max++;

        let newServer = {
            name: "New-Server-" + max,
            parameters: "",
            config: "",
            portvar: "",
            port: "",
            running: false,
            app: "cmd.exe",
            logs: ""
        }
        servers.unshift(newServer);
        let output = {
            servers: servers
        };
        fs.writeFile(config.servers, JSON.stringify(output, null, 4));
        callback(servers);
    })
}

module.exports.deleteServer = function(name, callback) {
    fs.readFile(config.servers, 'utf8', function(err, data) {
        if (err) throw (err);
        let servers = JSON.parse(data).servers;
        let newArray = [];
        servers.forEach(function(server, index) {
            if (server.name.toLowerCase() != name.toLowerCase()) {
                newArray.push(server);
            }
        })
        let output = {
            servers: newArray
        };
        fs.writeFile(config.servers, JSON.stringify(output, null, 4));
        callback(newArray);
    })
}