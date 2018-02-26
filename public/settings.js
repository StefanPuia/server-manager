window.onload = function() {
	callServer('/api/server', {}, function(servers) {
		parseServerList(servers);
	})
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

function parseServerList(servers) {
	let serverList = $('#server-list')[0];
	servers.forEach(function(server) {

		let li = newEl('li');
        li.dataset.name = server.name;

		li.append(newEl('a', {
			href: "#",
			textContent: server.name
		}))

        li.addEventListener('click', showServerSettings);
		serverList.append(li)
	})
}

function showServerSettings(e) {
    $('#server-settings')[0].style.visibility = 'hidden';
    let name = e.currentTarget.dataset.name;
    callServer('/api/server/' + name, {}, function(server) {
        $('#server-name')[0].textContent = server.name;
        $('#server-settings')[0].style.visibility = 'visible';
    })    
}