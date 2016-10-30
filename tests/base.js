HTTP = {};
HTTP._factories = [
function() { return new XMLHttpRequest(); },
function() { return new ActiveXObject("Msxml2.XMLHTTP"); },
function() { return new ActiveXObject("Microsoft.XMLHTTP"); }
];
HTTP._factory = null;
HTTP.newRequest = function() {
	if (HTTP._factory != null) return HTTP._factory();
	for(var i = 0; i < HTTP._factories.length; i++) {
		try {
			var factory = HTTP._factories[i];
			var request = factory();
			if (request != null) {
				HTTP._factory = factory;
				return request;
			}
		} catch(e) { continue;
		}
	}
	HTTP._factory = function() { throw new Error("XMLHttpRequest does not supported");
	}
	HTTP._factory();
}

HTTP.getText = function (url, callback, errorHandler) {
    var request = HTTP.newRequest();
    request.onreadystatechange = function () {
        if (request.readyState == 4) { 
            if (request.status == 200) { callback(request.responseText);
            } else if (errorHandler) { errorHandler(request.status, request.statusText);
            }
        }
    }
    request.open("GET", url);
    request.send(null);
    return request;
};

HTTP.getJSON = function (url, callback, errorHandler) {
    return HTTP.getText(url, function (t) { callback(eval('('+t+')'));},errorHandler);
	/*var request = HTTP.newRequest();
	request.onreadystatechange = function() {
		if (request.readyState == 4 && request.status == 200) callback(eval('('+request.responseText+')'));
	}
	request.open("GET", url);
	request.send(null);*/
};

HTTP.postJSON = function (url, values, callback, errorHandler) {
	var request = HTTP.newRequest();
	request.onreadystatechange = function () {
		if (request.readyState == 4) {
			if (request.status == 200) {
				if (callback) callback(eval(request.responseText));
			} else {
				if (errorHandler) errorHandler(request.status, request.statusText);
				else if (callback) callback(null);
			}
		}
	}
	request.open("POST", url);
	if (request.overrideMimeType) { request.overrideMimeType("text/json");
	} else {        request.setRequestHeader("Content-Type","text/json");
	}
	request.send(HTTP.encodeJSON(values));
};

HTTP.encodeJSON = function (values) {
	var pairs = [];
	for (var name in values) {
		var value = values[name].toString();
		var pair = name + ":\"" + value + '"';
		pairs.push(pair);
	}
	return '{' + pairs.join(',') + '}';
};

function initGetElByClass() {
	if (document.getElementsByClassName) {
		getElementsByClass = function (classList, node) {
			return (node || document).getElementsByClassName(classList);
		}
	} else {
		getElementsByClass = function (classList, node) {
			var node = node || document;
			var list = node.getElementsByTagName('*');
			var length = list.length;
			var classArray = classList.split("/\s+/");
			var classes = classArray.length;
			var result = [], i, j;
			for (i = 0; i < length; i++) {
				for (j = 0; j < classes; j++) {
					if (list[i].className.search('\\b' + classArray[j] + '\\b') != -1) {
						result.push(list[i]);
						break;
					}
				}
			}
			return result;
		}
	}
}

function id(val) {
    return document.getElementById(val);
}

function at(el, txt) {
    return el.appendChild(document.createTextNode(txt));
}
function ae(el, add) {
    return el.appendChild(document.createElement(add));
}

LOG = {
    root: null,
    l: null,
    progs: {},
    tmoId: 0
};

LOG.del = function () {
    if (LOG.l && LOG.root) {
        LOG.root.innerHTML = "";
    }
    LOG.l = null;
    LOG.root = null;
    LOG.progs = {};
    HTTP.getText("cgi/log?p=1", function () { });
};

LOG.add = function (to) {
    if (LOG.l) return;
    if (typeof to == "string") { LOG.root = id(to);
    } else LOG.root = to;
    var el = ae(LOG.root, "button");
    el.className = "close"; el.innerHTML = "&times;";
    el.onclick = function () { LOG.del(); }
    el = ae(LOG.root, "details"); el.open = "open";
    el.innerHTML = "<summary>Log</summary>";
    LOG.l = ae(el, "div"); LOG.l.style.height = "100px";
    LOG.l.style.overflow = "auto"; LOG.l.style.resize = "vertical";
    LOG.progs = {};
};

LOG.str = function (s) {
    if (LOG.l) {
        at(LOG.l, s); ae(LOG.l, "br"); LOG.l.scrollTop = LOG.l.scrollHeight;
    }
};

LOG.progDo = function (id, v, m) {
    if (LOG.l) {
        var prog = LOG.progs[id];
        if (prog) {
            prog.value = v;
            if (m) prog.nextSibling.innerHTML = m;
            if (prog.value == prog.max) {
                prog.parentElement.removeChild(prog);
                delete LOG.progs[id];
            }
        }
    }
};

LOG.progAdd = function (id, p, sz, v, m) {
    if (LOG.l) {
        at(LOG.l, p);
        var prog = ae(LOG.l, "progress"); ae(LOG.l, "span"); ae(LOG.l, "br");
        LOG.progs[id] = prog;
        prog.max = sz;
        if (!v) v = "0";
        LOG.progDo(id, v, m);
        LOG.l.scrollTop = LOG.l.scrollHeight;
    }
};

LOG.callback = function () {
    LOG.tmoId = 0;
    HTTP.getText("cgi/log", function (t) {
        if (t == "--END--") { // log end
            return;
        } else if (t != "--EMPTY--") {
            var lines = t.split('\n');
            for (line in lines) {
                line = lines[line];
                if (line.length == 0) continue;
                if (line.indexOf("-PS-") == 0) { //progress bar start
                    var ln = line.substr(4, line.length).split('\t');
                    while(ln.length<5) ln.push("");
                    LOG.progAdd(ln[0], ln[1], ln[2], ln[3], ln[4]);
                } else if (line.indexOf("-PM-") == 0) { //progress bar message
                    var ln = line.substr(4, line.length).split('\t');
                    while (ln.length < 3) ln.push("");
                    LOG.progDo(ln[0], ln[1], ln[2]);
                } else { LOG.str(line);
                }
            }
            LOG.tmoId = setTimeout(LOG.callback, 1000);
        } else { LOG.tmoId = setTimeout(LOG.callback, 2000);
        }
    });
}

LOG.monitor = function (to) {
    LOG.add(to);
    HTTP.getText("cgi/log?p=0", function (t) { if (t == "OK") { LOG.tmoId = setTimeout(LOG.callback, 1000);}
    });
}