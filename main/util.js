/**
 * Created by Andrew on 27.06.2014.
 */
/*var CHK_TYPE = {SALE:0,IO:1,RET:2};

 function classChk(type) {
 switch (type) {
 case CHK_TYPE.SALE: return 'chk';
 case CHK_TYPE.IO:   return 'chk io';
 case CHK_TYPE.RET:  return 'chk ret';
 }
 return 'chk';
 }
 function notZ(n,kind) {
 if (n) {
 if (!kind) return n.toFixed(2);
 return n;
 }
 return "";
 }*/

function dateStr(d,format) {
    if (_.isNumber(d)) d = new Date(d*1000);
    if (format=='d') return d.toLocaleDateString();
    if (format=='t') return d.toLocaleTimeString();
    return d.toLocaleString();
}

function extractLabels(labels) {
    var ret = labels.match(/[^\s"']+|"(?:[^"]*)"|'(?:[^']*)'/g);
    for(var i in ret) { if ((ret[i][0]=='"') || (ret[i][0]=="'")) ret[i]=ret[i].slice(1,-1);
    }
    return ret;
}

function formatAlert(msg) {
    return '<div class="alert alert-danger alert-dismissable">'+
        '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>'+
        msg+'</div>';
}

function xhrError(resp) {
    var msg = resp.statusText;
    if (resp.status) msg = msg+'('+resp.status+')';
    return msg;
}

function failMessage(args) {
    if (args[2]) {
        var e = args[2];
        if (e.message) return args[1]+':'+ e.message;
        if (_.isString(e)) return [args[1],e].join(" : ");
    }
    if (args[0].status==200) return args[1];
    return [args[1],":",args[0].statusText,"(",args[0].status,")"].join();
}

function blockDef(e) {
    e.preventDefault();
    return false;
}

function wait(tmo) {
    var deferred = $.Deferred();
    setTimeout(deferred.resolve, tmo);
    return deferred.promise();
}

function IP2Str(ip) {
    if (_.isFinite(ip)) return  ((ip>>24)&0xFF)+'.'+((ip>>16)&0xFF)+'.'+((ip>>8)&0xFF)+'.'+(ip & 0xFF);
    if (_.isUndefinite(ip)) return '-';
    return ip;
}

function decHexStr(val) {
    if (typeof val == "number") return val.toString(10) + " (" + val.toString(16) + ")";
    return val;
}

function t(m) { return schema.str(m); }

function pad(n) {
    var s = n.toString();
    if (s.length > 1) return s;
    return "0" + s;
}

function afterTime(val) {
    if (typeof val != "number") return val;
    if (val > 0) return pad((val / 3600) >> 0) + ":" + pad(((val % 3600) / 60) >> 0) + ":" + pad(val % 60);
    return t("immediately");
}

function modemStateDecode(val) {
    var st = "";
    if ((val & 0x01) == 0) {
        st = st + t('SAM not found')+'<br>'; //"Модуль безпеки відсутній<br>";
    } else if (val & 0x02) {
        st = st + t('SAM not paired')+'<br>';//"Модуль безпеки не сполучений<br>";
    }
    if ((val & 0x04) == 0) {
        st = st + t('Nonpersonalized device')+'<br>';//"Відсутня персоналізація<br>";
    } else if (val & 0x8) {
        st = st + t('Wrong personalization')+'<br>';//"Неналежна персоналізація<br>";
    }
    if((val&16)==0){st=st+t("Document store error")+"<br>";}//Помилка у сховищі документів
    if (st.length > 4) {
        return st.slice(0, -4);
    }
    return t('Working');//"Робота";
}

function callProc(addr) {
    var $btn = 0;
    if (_.isObject(addr)) {
        $btn = $(addr.btn);
        addr = addr.addr;
    }
    if ($btn) $btn.button('loading');
    $.get(addr, _.rest(arguments).join('&')).done(function(d){
        if ($btn) $btn.button('reset');
        if (!_.isEmpty(d)) {
            var msg = '';
            if (d.err) {
                schema.parseError(d.err, function (m) {msg+=['<p>',m,'</p>'].join('');});
            } else msg += t('Unknown error');
            var modal = new Modal();
            modal.set({
                header:t('Error!!!'),
                body: msg
            });
            modal.show();
        }
    }).fail(function() {
        if ($btn) $btn.button('reset');
        var modal = new Modal();
        modal.set({
            header:t('Error!!!'),
            body: failMessage(arguments)
        });
        modal.show();
    });
}

function toStringDate(v,format) {
    var d = v.getDate()+'';
    if (d.length==1) d = '0'+d;
    var m = (v.getMonth()+1)+'';
    if (m.length==1) m = '0'+m;
    var y = v.getFullYear();
    if (!format || format=='d-m-y') { return d+'-'+m+'-'+y;
    }
    if (format=='y-m-d') { return y+'-'+m+'-'+d;
    }
    if (format=='ymd') { return y+m+d;
    }
}

function setDate(elem, date) {
    if (is_type['date']) { elem.valueAsDate = date;
    } else {elem.value=toStringDate(date);
    }
}
function getDate(e) {
    if (_.isString(e)) e = document.getElementById(e);
    if (is_type['date']) return e.valueAsDate;
    var entry = e.value;
    var mo,day, yr;
    var re = /^\d{2}[\/-]\d{2}[\/-]\d{4}$/;
    if (!re.test(entry)) return false;
    var delimChar = (entry.indexOf("/") != -1) ? "/" : "-";
    var deliml = entry.indexOf(delimChar);
    var delim2 = entry.lastIndexOf(delimChar);
    day = parseInt(entry.substring(0, deliml), 10);
    mo = parseInt(entry.substring(deliml+1, delim2), 10);
    yr = parseInt(entry.substring(delim2+1), 10);
    var testDate = new Date(yr, mo-1, day);
    if (testDate.getDate() != day)     { return false;
    }
    if (testDate.getMonth() + 1 != mo) { return false;
    }
    if (testDate.getFullYear() != yr)  { return false;
    }
    return testDate;
}

function getTime(e) {
    if (is_type['time']) return e.valueAsDate;
    var entry = e.value;
    var n = entry.split(':');
    var d = new Date();
    d.setHours.apply(d,n);
    _.each([d.getHours(), d.getMinutes(), d.getSeconds()],function(v,idx) {
        if (idx< n.length) {
            if (v!= parseInt(n[idx],10) ) { d = false;
            }
        } else if (v!=0) { d = false;
        }
    });
    return d;
}


function getNumber(e) {
    if (is_type['number']) return e.valueAsNumber;
    return parseInt(e.value);
}

function formatHelp(d) {

    if (_.isArray(d)) { return ['<div class="help-block col-md-5">', d.join('<br>'),'</div>'].join('');
    }
    return ['<span class="help-block">', d.toString(),'</span>'].join('');
}

// sRGB luminance(Y) values
rY = 0.212655;
gY = 0.715158;
bY = 0.072187;

// Inverse of sRGB "gamma" function. (approx 2.2)
function inv_gam_sRGB(ic) {
    var c = ic/255.0;
    if ( c <= 0.04045 ) return c/12.92;
    else                return Math.pow(((c+0.055)/(1.055)),2.4);
}

// sRGB "gamma" function (approx 2.2)
function gam_sRGB(v) {
    if(v<=0.0031308) v *= 12.92;
    else             v = 1.055*Math.pow(v,1.0/2.4)-0.055;
    return Math.round(v*255);
}

// GRAY VALUE ("brightness")
function gray(r, g, b) {
    return gam_sRGB(rY*inv_gam_sRGB(r) + gY*inv_gam_sRGB(g) + bY*inv_gam_sRGB(b));
}

if (!String.prototype.endsWith) {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

/**
 * Async load a number text files to array of objects
 * @param data - string content or html files collection
 * @param err - callback function that display read errors. function(message) {...}
 * @returns - promise of deferred call
 *  the callback of done() or fail() is array of objects {data: 'file content', name: 'file name'}, or [{data:'string'}] when <tt>data</tt> param is a 'string'
 */
function loadTexts(data,err) {
    var ret = new jQuery.Deferred();
    if (_.isString(data)) { ret.resolve([{data:data}]);
    } else if (_.isArray(data)) {
        var res = [];
        var promises = _.map(data,function(f){
            var r = new FileReader();
            var p = new $.Deferred();
            r.onload = function(ev) {
                res.push({data:ev.target.result,name: f.name});
                p.resolve();
            };
            r.onerror = function(ev) {
                //events.trigger('importError',{msg:ev.getMessage()});
                if (err) err(ev.getMessage());
                p.reject();
            };
            r.readAsText(f);
            return p.promise();
        });
        $.when.apply($, promises).done(function(){ ret.resolve(res.length?res:false);
        }).fail(function(){ ret.reject(res.length?res:false);
        });
    } else {
        if (err) err("Wrong import data");
        //events.trigger('importError',{msg:"Wrong import data"});
        ret.reject();
    }
    return ret.promise();
}
