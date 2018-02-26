'use strict';

let ws = new WebSocket("ws://" + window.location.hostname + ":" + (window.location.port || 80) + "/");
let statuses = ['starting', 'running', 'stopping', 'stopped', 'error', 'not found']


window.addEventListener('load', function() {
    ws.addEventListener('message', receivedMessageFromServer);
    $('#server-search')[0].addEventListener('input', serverSearch);

    callServer('/api/server', {}, function(servers) {
    	parseServers(servers);
    })
})

// calls to the server

function callSocket(payload) {
	if (ws.readyState != ws.OPEN) {
        ws = new WebSocket("ws://" + window.location.hostname + ":" + (window.location.port || 80) + "/");
    }
	ws.send(JSON.stringify(payload));
}

async function callServer(url, options, callback) {
	const response = await fetch(url, options);
    if (!response.ok) {
        el.textContent = "Server error:\n" + response.status;
        return;
    }

    let data = await response.text();
    if (!data) {
        data = JSON.stringify({err: "error on fetch"});
    }

    try {
        data = JSON.parse(data);
    } catch(err) {
        data = {response: data};
    }
    callback(data);
}

function receivedMessageFromServer(e) {
    let data = {};

    try {
    	data = JSON.parse(e.data)
    }
    catch(err) {
    	data = {
    		raw: e.data,
    		name: '',
    		type: 'error',
    		error: err
    	}
    }

    if(typeof data.name != 'undefined') {
    	data.name = data.name.toLowerCase();
    }
    else {
    	data.name = '';
    }

    switch(data.type) {
    	case 'status':
    		switch(data.status) {
    			case 0:
		    	case 1:
					displayStartStop(data.name, 0, 1);
				break;

				case 2:
				case 3:
				case 5:
					displayStartStop(data.name, 1, 0);
				break;
    		}
    		log(data.name + ' ' + statuses[data.status]);
    	break;

    	case 'stdout':
    		log(data.name + ': ' + data.raw);
    		displayStartStop(data.name, 0, 1);
    	break;

    	case 'exit':
    		log(data.name + ': Process exited with code ' + data.code);
    		displayStartStop(data.name, 1, 0);
    	break;

    	case 'stderr':
    		log(data.name + ' error.\n' + data.raw);
    	break;

    	case 'error':
    		log('data error' + JSON.stringify(data, null, 4));
    	break;
	}
}




// server functions

function serverRestart(e) {
	serverStop(e);
	serverStart(e);
}

function serverStart(e) {
	let name = e.currentTarget.dataset.name;
    let port = $('#port-' + name)[0].value;
	let payload = {
		method: 'start',
		name: name,
        port: port
	}
	callSocket(payload);
}

function serverStop(e) {
	let name = e.currentTarget.dataset.name;
	let payload = {
		method: 'stop',
		name: name
	}
	callSocket(payload);
}

function serverVisit(e) {
    let name = e.currentTarget.dataset.name;
    callServer('/api/server/' + name, {}, function(data) {
        window.open('/?port=' + data.port);
    })
}

function serverSettings(e) {

}

function serverLogs(e) {
	let name = e.currentTarget.dataset.name;
	callServer('/api/server/' + name + '/logs', {}, function(data) {
    	log(JSON.stringify(data, null, 4));
	});
}

function serverSearch() {
    let query = $('#server-search')[0].value.toLowerCase();

    let servers = $('.server');

    servers.forEach(function(server) {
        if(server.dataset.name.indexOf(query) != -1) {
            server.style.display = 'block';
        }
        else {
            server.style.display = 'none';
        }
    })
}

function serverSend(server, command) {
    let payload = {
        method: 'stop',
        name: server,
        payload: command
    }
    callSocket(payload);
}

function serverClearLogs(server) {
    let payload = {
        method: 'clearlogs',
        name: server
    }
    callSocket(payload);
}