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

function run_help() {
	log(functions.help.desc);
	Object.keys(functions).forEach(function(k){
		log(k.toUpperCase() + "    " + functions[k].desc);
	});
}

function run_clear() {
	let console = $('#console')[0];
	console.textContent = '';
	console.scrollTop = console.scrollHeight;
}

function run_start(params) {
	let e = createEventTarget(params[0]);
	serverStart(e);
}

function run_stop(params) {
	let e = createEventTarget(params[0]);
	serverStop(e);
}

function run_restart(params) {
	let e = createEventTarget(params[0]);
	serverRestart(e);
}

function run_logs(params) {
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
	}
}