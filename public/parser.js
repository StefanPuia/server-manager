'use strict';

function $(query) {
	let result = document.querySelectorAll(query);
	return result;
}

function newEl(tag, attr = {}) {
    let el = document.createElement(tag);
    Object.assign(el, attr);
    return el;
}

function parseServers(servers) {
	let row = $('main .row')[0];

	for(let i = 0; i < servers.length / 3; i++) {
		for(let j = 0; j < 3 && typeof servers[i*3 + j] != 'undefined'; j++) {
			let server = servers[i*3 + j];

			let serverDiv = newEl('div', {
				classList: "col-md-4 center server"
			});
			serverDiv.append(newEl('h2', {
				textContent: server.name
			}));

			let temp;
			server.name = server.name.toLowerCase();
			serverDiv.dataset.name = server.name;

			temp = newEl('input', {
				value: server.port,
				id: "port-" + server.name
			})
			temp.style.textAlign = 'center';
			temp.addEventListener('input', checkPortValue);
			serverDiv.append(temp)

			serverDiv.append(newEl('br'));
			serverDiv.append(newEl('br'));

			temp = newEl('button', {
				classList: 'btn btn-success server-start',
				innerHTML: '<i class="glyphicon glyphicon-play"></i>'
			});
			temp.dataset.name = server.name;
			temp.style.display = server.running?'none':'';
			serverDiv.append(temp);


			temp = newEl('button', {
				classList: 'btn btn-danger server-stop',
				innerHTML: '<i class="glyphicon glyphicon-stop"></i>'
			})
			temp.dataset.name = server.name;
			temp.style.display = server.running?'':'none'
			serverDiv.append(temp);

			
			temp = newEl('button', {
				classList: 'btn btn-warning server-restart',
				innerHTML: '<i class="glyphicon glyphicon-refresh"></i>'
			})
			temp.dataset.name = server.name;
			serverDiv.append(temp);


			temp = newEl('button', {
				classList: 'btn btn-default server-settings',
				innerHTML: '<i class="glyphicon glyphicon-wrench"></i>'
			})
			temp.dataset.name = server.name;
			serverDiv.append(temp);


			temp = newEl('button', {
				classList: 'btn btn-default server-logs',
				innerHTML: '<i class="glyphicon glyphicon-info-sign"></i>'
			})
			temp.dataset.name = server.name;
			serverDiv.append(temp);


			temp = newEl('button', {
				classList: 'btn btn-default server-visit',
				innerHTML: '<i class="glyphicon glyphicon-share-alt"></i>'
			})
			temp.dataset.name = server.name;
			temp.dataset.port = server.port;
			serverDiv.append(temp);

			row.append(serverDiv);
		}
	}




	$('.server-start').forEach(function(el){el.addEventListener('click', serverStart)});
	$('.server-stop').forEach(function(el){el.addEventListener('click', serverStop)});
	$('.server-restart').forEach(function(el){el.addEventListener('click', serverRestart)});
	$('.server-settings').forEach(function(el){el.addEventListener('click', serverSettings)});
	$('.server-logs').forEach(function(el){el.addEventListener('click', serverLogs)});
	$('.server-visit').forEach(function(el){el.addEventListener('click', serverVisit)});
}

function displayStartStop(name, start, stop) {
	if($(`.server-start[data-name="${name}"]`).length > 0) {
		$(`.server-start[data-name="${name}"]`)[0].style.display = start?'':'none';
	}
	if($(`.server-stop[data-name="${name}"]`).length > 0) {
		$(`.server-stop[data-name="${name}"]`)[0].style.display = stop?'':'none';
	}
}

function createEventTarget(name) {
	let e = {
		currentTarget: {
			dataset: {
				name: name
			}
		}
	}

	return e;
}

function checkPortValue(e) {
	let value = e.currentTarget.value.trim();
	if(!value) {
		value = 0;
	}

	try {
		value = parseInt(value);
	}
	catch(err) {
		value = 65536;
	}

	if(value < 0 || value > 65536) {
		value = 65536;
	}

	e.currentTarget.value = value;
}