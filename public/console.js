'use strict';

let history = [''];
let currentHistory = 0;
let awaitConfirmation = {
	accept: "",
	waiting: false,
	type: "",
	echo: "",
	decline: ""
}

window.addEventListener('load', function() {
	$('#consoleinput')[0].addEventListener('keyup', function(e) {
		let console = $('#consoleinput')[0]
		if(e.which == 13 && console.value.trim().length > 0) {
			execute(console.value);
			console.value = '';
		}
		if(e.keyCode == 38) {
			historyUp();
		}
		if(e.keyCode == 40) {
			historyDown();
		}
	})
})

function historyUp() {
	if(history.length > 0 && currentHistory > 0) {
		currentHistory--;
		$('#consoleinput')[0].value = history[currentHistory];
	}
}

function historyDown() {
	if(history.length > 0 && currentHistory < history.length - 1) {
		currentHistory++;
		$('#consoleinput')[0].value = history[currentHistory];
	}
}

function log(data) {
	let console = $('#console')[0];
	if(data == "\n\n") {
		console.textContent = console.textContent + '\n';
	}
	else {
		data = data.trim();
		if(data != '') {
			console.textContent = console.textContent + '\n' + data;
		}
	}
	console.scrollTop = console.scrollHeight;
	
}

function execute(string) {
	history.splice(history.length - 1, 0, string);
	currentHistory = history.length - 1;

	let parts = string.split(' ');
	let fcall = parts[0].toLowerCase();
	let params = parts.slice(1);

	if(awaitConfirmation.waiting) {
		if(fcall == awaitConfirmation.accept) {
			run_accept();
		}
		else {
			log(awaitConfirmation.decline);
		}
		reset_awaitConfirmation();
	}
	else {
		log("> " + string);
		if(typeof functions[fcall] != 'undefined') {
			let f = window[functions[fcall].function];
			if(typeof f === 'function') {
			    f(params);
			}
		}
		else {
			log(`Command '${fcall}' not found. Try "help".`);
		}
	}	
}

function reset_awaitConfirmation() {
	awaitConfirmation = {
		accept: "",
		waiting: false,
		type: "",
		echo: "",
		decline: ""
	}
}

function run_help(params) {
	if(params[0]) {
		let f = null;
		Object.keys(functions).forEach(function(k){
			if(k == params[0]) {
				f = functions[k];
				f.name = k;
			}
		});
		if(f) {
			log(f.name.toUpperCase() + "    " + functions[f.name].desc);
			if(f.vars) {
				Object.keys(f.vars).forEach(function(v){
					log(f.vars[v].name.toUpperCase() + "    " + f.vars[v].desc);
				})
			}
		}
		else {
			log(`Help for '${params[0]}' not found. Try "help".`);
		}
	}
	else {
		log(functions.help.desc);
		Object.keys(functions).forEach(function(k){
			log(k.toUpperCase() + "    " + functions[k].desc);
		});
	}
}

function run_clear() {
	let console = $('#console')[0];
	console.textContent = '';
	console.scrollTop = console.scrollHeight;
}

function run_start(params) {
	if(params.length == 0) {
		log(functions['start'].desc);
	}
	let e = createEventTarget(params[0]);
	serverStart(e);
}

function run_stop(params) {
	if(params.length == 0) {
		log(functions['stop'].desc);
	}
	let e = createEventTarget(params[0]);
	serverStop(e);
}

function run_restart(params) {
	if(params.length == 0) {
		log(functions['restart'].desc);
	}
	let e = createEventTarget(params[0]);
	serverRestart(e);
}

function run_send(params) {
	if(params.length == 0) {
		log(functions['send'].desc);
	}
	let server = params[0];
	let command = params[1];
	serverSend(server, command);
}

function run_logs(params) {
	if(params.length == 0) {
		log(functions['logs'].desc);
	}
	callServer('/api/server/' + params[0] + '/logs', {}, function(data) {
    	let stdout = JSON.stringify(data, null, 4);
    	if(stdout.length > 1000) {
    		log("Output longer than 1000 characters. Output? (y/n)");
    		awaitConfirmation = {
    			waiting: true,
    			echo: stdout,
    			type: "longstring",
    			accept: "y",
    			decline: "Output canceled."
    		}
    	}
    	else {
    		log(stdout);
    	}
	});
}

function run_accept() {
	switch(awaitConfirmation.type) {
		case "longstring":
			log(awaitConfirmation.echo);
		break;
	}
}

function run_console(params) {
	let console = $('#console')[0];
	let main = $('main')[0];
	switch (params[0]) {
		case 'height':
			if(params[1] && params[1].match(/[0-9]+/g) && params[1] > 0) {
				console.style.height = params[1] + 'vh';
				main.style.marginBottom = parseInt(params[1] + 10) + 'vh';
			}
			else {
				log(`Parameter value required.`);
			}
		break;

		case 'foreground':
			if(params[1]) {
				if(params[1] == 'default') {
					console.style.color = "#333";
				}
				else {
					console.style.color = params[1];
				}
			}
			else {
				log(`Parameter value required.`);
			}
		break;

		case 'background':
			if(params[1]) {
				if(params[1] == 'default') {
					console.style.backgroundColor = "#f5f5f5";
				}
				else {
					console.style.backgroundColor = params[1];
				}
			}
			else {
				log(`Parameter value required.`);
			}
		break;

		default:
			log(`Parameter '${params[0]}' not valid for this function. Try "help console".`)
		break;
	} 
}

function run_clearlogs(params) {
	if(params.length == 0) {
		log(functions['clearlogs'].desc);
	}
	serverClearLogs(params[0]);
}

let functions = {
	"help":	{
		desc: "show all functions",
		function: "run_help"
	},
	"clear": {
		desc: "clear the console",
		function: "run_clear"
	},
	"start": {
		desc: "start a server: start [servername]",
		function: "run_start"
	},
	"stop": {
		desc: "stop a server: stop [servername]",
		function: "run_stop"
	},
	"restart": {
		desc: "restart a server: restart [servername]",
		function: "run_restart"
	},
	"logs": {
		desc: "get the server logs: logs [servername]",
		function: "run_logs"
	},
	"send": {
		desc: "send a command to a running server: send [servername] [command]",
		function: "run_send"
	},
	"console": {
		desc: "set or get console variables: console <var> <value>",
		function: "run_console",
		vars: [{
			name: "height",
			desc: "change the height of the console 15 < h < 90 (vw)"
		}, {
			name: "foreground",
			desc: "change the foreground colour hex/rgb/name"
		}, {
			name: "background",
			desc: "change the background colour hex/rgb/name"
		}]
	}, 
	"clearlogs": {
		desc: "clears the server logs. CANNOT BE UNDONE.",
		function: "run_clearlogs"
	}
}