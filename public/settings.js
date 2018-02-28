'use strict';

function getQueryString(field, url) {
    var href = url ? url : window.location.href;
    var reg = new RegExp('[?&]' + field + '=([^&#]*)', 'i');
    var string = reg.exec(href);
    return string ? string[1] : null;
};

window.onload = function() {
    callServer('/api/server', {}, function(servers) {
        parseServerList(servers);

        let name = getQueryString('name').toLowerCase();
        if(name && $(`#server-list li[data-name="${name}"]`).length > 0) {
            $(`#server-list li[data-name="${name}"]`)[0].click();
        }
    })

    $('#buttonServerSave')[0].addEventListener('click', serverSave);
    $('#buttonServerDelete')[0].addEventListener('click', serverDelete);
}

async function callServer(url, options, callback) {
    const response = await fetch(url, options);
    if (!response.ok) {
        console.log("Server error:\n" + response.status);
        return;
    }

    let data = await response.text();
    if (!data) {
        data = JSON.stringify({
            err: "error on fetch"
        });
    }

    try {
        data = JSON.parse(data);
    } catch (err) {
        data = {
            response: data
        };
    }
    callback(data);
}

function parseServerList(servers) {
    let serverList = $('#server-list')[0];
    serverList.innerHTML = "";

    let li = newEl('li');
    let anchor = newEl('a', {
        href: "#"
    })
    let glyphicon = newEl('i', {
        classList: "glyphicon glyphicon-plus"
    })
    anchor.append(glyphicon);
    li.append(anchor);
    li.addEventListener('click', createServer);
    serverList.append(li);

    servers.forEach(function(server) {

        let li = newEl('li');
        li.dataset.name = server.name.toLowerCase();

        li.append(newEl('a', {
            href: "#",
            textContent: server.name
        }))

        li.addEventListener('click', showServerSettings);
        serverList.append(li);
    })

    if ($('#server-list li').length > 1) {
        $('#server-list li')[1].click();
    }
}

function showServerSettings(e) {
    $('#server-settings')[0].style.visibility = 'hidden';

    let lis = $('#server-list li');
    lis.forEach(function(li) {
        li.classList.remove('active');
    })

    let li = e.currentTarget;
    li.classList.add('active');

    let name = li.dataset.name;
    callServer('/api/server/' + name, {}, function(server) {
        $('#server-name')[0].textContent = server.name;

        $('#inputServerName')[0].value = server.name;
        $('#inputServerApp')[0].value = server.app.replace(/\\/g, '/');
        $('#inputServerParams')[0].value = server.parameters.replace(/\\/g, '/');
        $('#inputServerConfig')[0].value = server.config.replace(/\\/g, '/');
        $('#inputServerPortVar')[0].value = server.portvar;
        $('#inputServerPort')[0].value = server.port;
        $('#inputServerLogs')[0].value = server.logs;

        $('#server-settings')[0].style.visibility = 'visible';
    })
}

function createServer(e) {
    callServer('/api/server', {
        method: 'post'
    }, function(servers) {
        parseServerList(servers);
    })
}

function serverSave(e) {
    let name = $('#server-name')[0].textContent.toLowerCase();

    let server = {};
    server.name = $('#inputServerName')[0].value;
    server.app = $('#inputServerApp')[0].value;
    server.parameters = $('#inputServerParams')[0].value;
    server.config = $('#inputServerConfig')[0].value;
    server.portvar = $('#inputServerPortVar')[0].value;
    server.port = $('#inputServerPort')[0].value;
    server.logs = $('#inputServerLogs')[0].value;
    server.oldname = name;

    let options = {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify(server)
    }
    callServer('/api/server/' + name, options, function(servers){
        parseServerList(servers);
        $(`#server-list li[data-name="${server.name.toLowerCase()}"]`)[0].click();
        showSaved();
    })
}

function serverDelete() {
    let name = $('#server-name')[0].textContent.toLowerCase();

    if (window.confirm("This action is irreversable. Are you sure?")) {
        callServer('/api/server/' + name, {
            method: 'delete'
        }, function(servers) {
            parseServerList(servers);
        });
    }
}

function showSaved() {
    $('#saveConfirmed')[0].style.display = 'inline-block';
    setTimeout(function() {
        $('#saveConfirmed')[0].style.display = 'none';
    }, 3000)
}