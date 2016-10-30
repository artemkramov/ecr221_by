/**
 * Created by Andrew on 27.06.2014.
 */

var events = {};
_.extend(events,Backbone.Events);

var DevInfo = Backbone.Model.extend({url:'/cgi/dev_info'});
var devInfo = new DevInfo();

var ECRStatus = Backbone.Model.extend({
    url:'/cgi/state',
    defaults: { 'online':false, 'name': 'Device',dev_fn:'-',dev_nn:'-',dev_dat:'-',dev_ver:'-',dev_id:'-' },
    refresh: function() {
        var $this = this;
        this.fetch({remove:false}).always(function(x,txt) { $this.syncDate.call($this,txt=='success')});
    },
    initialize: function() {
        this.nextTime = new Date();
        devInfo.on('change',function() { this.set(devInfo.attributes);},this);
        this.on('change:name',function() {devInfo.fetch();});
        events.on('tick',this.tick,this);
        this.refresh();
    },
    syncDate: function(ok) {
        this.set('online',ok);
        var d = this.get('time');
        if (ok && _.isNumber(d)) {
            this.fetch_ok = true;
            this.set('time',new Date(d*1000));
        }
        setTimeout(_.bind(this.refresh,this),60000);
    },
    getTime:function() {
        var d = this.get('time');
        return new Date(_.isNumber(d)?d*1000:d.getTime());
    },
    tick: function() {
        if (this.fetch_ok) {
            this.fetch_ok=false;
            return;
        }
        var d = this.get('time');
        this.set('time',new Date(_.isNumber(d)?d*1000:(d.getTime()+1000)));
    },
    merge: function() { this.set(devInfo.attributes);
    }
});

var FiscalCell = Backbone.Model.extend({
    initialize: function(){
        var $this = this;
        $.getJSON("/cgi/tbl/FDay?s=1&e=2",function(data){
            if (_.isArray(data)) data = data[0];
            if (_.isObject(data)) {
                if ('id' in data) { $this.set('firstRep',data.id);
                } else {$this.unset('firstRep');}
                if ('Date' in data) {
                    $this.set('firstTime',new Date(data.Date*1000));
                } else { $this.unset('firstTime');}
            }
            $this.set('fiscalize',$this.has('firstRep'));
        });
        $.getJSON("/cgi/tbl/FDay?s=-1",function(data,status){
            if (_.isArray(data)) data = data[0];
            if (_.isObject(data)) {
                if ('id' in data) {
                    //console.log('set lastRep',data.id)
                    $this.set('lastRep', data.id);
                } else $this.unset('lastRep');
                if ('Date' in data) {
                    $this.set('lastTime', new Date(data.Date * 1000));
                } else $this.unset('lastTime');
            }
        });
    }
});

var TableModel = Backbone.Model.extend({
    /*validate:function(attrs,options) {
     for(name in attrs) {

     }
     },*/
    initialize: function(attrs,opts) {
        if (opts && opts.schema) this.schema = opts.schema;
        if (opts && opts.urlRoot) this.urlRoot = opts.urlRoot;
    },
    sync: function(method, model, options) {
        if (this.schema.syncCol && (method === 'create' || method === 'update' || method === 'patch')) {
            var a = (options && options.attrs) || options;
            _.each(_.intersection(_.keys(a),this.schema.syncCol),function(e){
                a[e] = schema.parseOut(schema.typeCol(this.schema,e),a[e]);
            },this);
        }
        return Backbone.sync(method, model, options);
    },
    parse: function(response/*,option*/) {
        //console.log('parse',response,option,this.schema);
        if (_.isArray(response)) {
            _.each(response,function(el){
                if (_.isObject(el)) this.parseRow(el);
            },this);
        } else if (_.isObject(response)) { this.parseRow(response);
        }
        return response;
    },
    parseRow: function (o) {
        schema.fixIn(this.schema,o);
        if (_.has(o,'err')) {
            var $this = this;
            schema.parseError(o.err,function(msg,field){
                if ($this.collection) { $this.collection.trigger('err',$this, msg, field);
                } else { $this.trigger('err', $this, msg, field);
                }
            });
            delete o.err;
        }
    },
    isNew: function() {return this.newModel;}
});

var TableCollection = Backbone.Collection.extend({
    initialize:function(models, options) {
        if (options && options.url) this.url = options.url;
    },
    parse: function(resp/*,options*/) {
        var key = this.model.prototype.schema.get('key') || 'id';
        if (_.isArray(resp)) {
            var toRemove=[];
            _.each(resp,function(el){
                if (! key in el) {
                    toRemove.push(el);
                    if ('err' in el) {
                        var $this = this;
                        schema.parseError(el.err,function(msg,field){
                            $this.trigger('err',el, msg, field);
                        });
                    }
                }
            });
            resp = _.difference(resp,toRemove);
        } else {
            if (! key in resp) {
                if ('err' in resp) {
                    var $this = this;
                    schema.parseError(resp.err,function(msg,field){
                        $this.trigger('err',el, msg, field);
                    });
                }
                return [];
            }
        }
        return resp;
    },
    syncSave: function(errorRep) {
        var toSync = [];
        var toAdd = [];
        var cols = _.map(this.model.prototype.schema.get('elems'),function(el){
            return (("editable" in el) && !el.editable)?0:el.name;
        });
        cols = _.compact(cols);
        this.each(function(model) {
            if (model.hasChanged() || model.isNew()) {
                if (model.isNew()) {
                    var k = model.keys();
                    var c = _.intersection(k,cols);
                    if (c.length==cols.length) {
                        toAdd.push(model.attributes);
                        //model.newModel = false;
                    }
                } else {
                    var e = {};
                    e[model.idAttribute]=model.id;
                    e = _.extend(e,model.changedAttributes());
                    toSync.push(e);
                }
            }
        },this);
        var promises = [];
        var key = this.model.prototype.schema.get('key') || 'id';
        if (toSync.length) {
            var err_id=null;
            var err=false;
            var sp = new $.Deferred();
            this.sync('patch',this,{
                attrs:toSync,
                context:this,
                success:function(resp){
                    if (_.isObject(resp)&& _.isEmpty(resp) ) {
                        _.each(toSync,function(el){
                            var e = this.get(el[key]);
                            e && e.set({},{silent:true});
                        },this);
                    }
                    this.on('err',function(model,msg,field){
                        if (errorRep) {errorRep({msg:msg,fld:field,row:model.id})}
                        err_id=model.id;
                        err=true;
                    },this);
                    this.set(resp,{remove:false, parse:true, silent:true});
                    this.off('err',null,this);
                    if (err) {
                        if (toSync.length>1 && err_id) {
                            _.find(toSync,function(el){
                                if (el[key]==err_id) return true;
                                var e = this.get(el[key]);
                                e && e.set({},{silent:true});
                                return false;
                            });
                        }
                        sp.reject();
                    } else sp.resolve();
                },
                error:function(xhr/*,status,error*/) {
                    if (errorRep) errorRep({msg:xhrError(xhr)});
                    sp.reject();
                }
            });
            promises.push(sp);
        }
        if (toAdd.length) {
            var err_ida=null;
            var erra=false;
            var ap = new $.Deferred();
            this.sync('create',this,{
                attrs:toAdd,
                context:this,
                success:function(resp){
                    if (_.isObject(resp)&& _.isEmpty(resp) ) {
                        _.each(toAdd,function(el){
                            var e = this.get(el[key]);
                            if (e) {
                                e.set({},{silent:true});
                                delete e.newModel;
                            }
                        },this);
                    } else {
                        this.on('err',function(model,msg,field){
                            if (errorRep) {errorRep({msg:msg,fld:field,row:model.id})}
                            err_ida=model.id;
                            erra=true;
                        },this);
                        this.set(resp,{remove:false, parse:true, silent:true});
                        this.off('err',null,this);
                    }
                    if (erra) {
                        if (toAdd.length>1 && err_id) {
                            _.find(toAdd,function(el){
                                if (el[key]==err_ida) return true;
                                var e = this.get(el[key]);
                                if (e) {
                                    e.set({}, {silent: true});
                                    delete e.newModel;
                                }
                                return false;
                            });
                        }
                        ap.reject();
                    } else ap.resolve();
                },
                error:function(xhr/*,status,error*/) {
                    if (errorRep) errorRep({msg:xhrError(xhr)});
                    ap.reject();
                }
            });
            promises.push(ap);
        }
        return (promises.length==0)?false:$.when.apply($, promises);
    },
    deleteRows: function(models) {_.each(models,function(m){ m.destroy({wait:true});});},
    newRow: function() {this.unshift({}).newModel=true;}
});

var NetworkInfo = Backbone.Collection.extend({
    url:'/cgi/netifs',
    /*initialize: function(){

    },*/
    refresh: function() {
        var d = $.Deferred();
        var $this = this;
        this.fetch().done(function() {
            $this.remove($this.where({name:'Loopback'}));
            if (gprsExists) {
                $.get('/cgi/mdm_info').done(function (data) {
                    $this.add({name:'GPRS',addr:data.ip});
                    d.resolve();
                }).fail(function(){d.reject();});
            } else d.resolve();
        }).fail(function(){d.reject();});
        return d.promise();
    }
});

/*var salesCell = new Backbone.Model({zno:1,total:0.0,taxes:0.0,discounts:0.0,insafe:0.0});
 var receiptsCell = new Backbone.Model({receipts:0,returns:0,lrSum:0.0,lrNo:0.0,lrTime:0});*/
/*    var sumRep = new Backbone.Model({
 sales: [
 {txLet:'A',txPrc:'20%',txSum:200,txTx:20,txrSum:-10,txrTx:-1},
 {txLet:'B',txPrc:'0%',txSum:100,txTx:0,txrSum:0,txrTx:0}
 ],
 money: [
 {name:'Готівка',sumIn:200,sumOut:-10,inSafe:true},
 {name:'Чек',sumIn:50,sumOut:0,inSafe:false},
 {name:'Картка',sumIn:50,sumOut:0,inSafe:false}
 ],
 oper: [
 {name:'Відсоткова знижка',ops:1,sum:15},
 {name:'Відмова',ops:1,sum:-20}
 ]
 });
 var pluRep = new Backbone.Collection([
 {id:1,name:"tov1",kol:9,sum:233.09},
 {id:2,name:"tov2",kol:9,sum:233.09},
 {id:3,name:"tov3",kol:9,sum:233.09},
 {id:4,name:"tov4",kol:9,sum:233.09},
 {id:5,name:"tov5",kol:9,sum:233.09},
 {id:6,name:"tov6",kol:9,sum:233.09}
 ]);
 //var ECRReceipt = Backbone.Collection();
 var CHKR = {SALE:0,COMM:1,PROM:2,DSK:3,ENDCHK:4,OPL:5,INOUT:6};
 var receipts = new Backbone.Collection([
 {no:1,type:CHK_TYPE.SALE,ecr_no:"AA12345678",dat:new Date(2012,11,22,12,22),rows:[
 {type:CHKR.SALE,code:1,name:'Tov1',kol:5,cen:3.25,sum:16.25,tax:'A'},
 {type:CHKR.SALE,code:3,name:'Tov3',sum:16.25,tax:'A'},
 {type:CHKR.COMM,comm:'Коментарий'},
 {type:CHKR.PROM,sum:16.25},
 {type:CHKR.DSK,void:1,prc:10,sum:-15.0},
 {type:CHKR.DSK,sum:-5.0},
 {type:CHKR.OPL,name:'Готівка',sum:100.0},
 {type:CHKR.ENDCHK}
 ]},
 {no:2,type:CHK_TYPE.RET,ecr_no:"AA12345678",dat:new Date(2012,11,22,12,22),rows:[
 {type:CHKR.SALE,code:1,name:'Tov1',kol:5,cen:3.25,sum:16.25,tax:'A'},
 {type:CHKR.SALE,code:3,name:'Tov3',sum:16.25,tax:'A'},
 {type:CHKR.COMM,comm:'Коментарий'},
 {type:CHKR.PROM,sum:16.25},
 {type:CHKR.DSK,void:1,prc:10,sum:-15.0},
 {type:CHKR.DSK,sum:-5.0},
 {type:CHKR.OPL,name:'Готівка',sum:100.0},
 {type:CHKR.ENDCHK}
 ]},
 {no:3,type:CHK_TYPE.IO,ecr_no:"AA12345678",dat:new Date(2012,11,22,12,22),rows:[
 {type:CHKR.INOUT,name:'Готівка',sum:200.0},
 {type:CHKR.ENDCHK}
 ]},
 {no:4,type:CHK_TYPE.SALE,ecr_no:"AA12345678",dat:new Date(2012,11,22,12,22),rows:[
 {type:CHKR.SALE,code:1,name:'Tov1',kol:5,cen:3.25,sum:16.25,tax:'A'},
 {type:CHKR.SALE,code:3,name:'Tov3',sum:16.25,tax:'A'},
 {type:CHKR.COMM,comm:'Коментарий'},
 {type:CHKR.PROM,sum:16.25},
 {type:CHKR.DSK,void:1,prc:10,sum:-15.0},
 {type:CHKR.DSK,sum:-5.0},
 {type:CHKR.OPL,name:'Готівка',sum:100.0},
 {type:CHKR.ENDCHK}
 ]},
 {no:5,type:CHK_TYPE.RET,ecr_no:"AA12345678",dat:new Date(2012,11,22,12,22),rows:[
 {type:CHKR.SALE,code:1,name:'Tov1',kol:5,cen:3.25,sum:16.25,tax:'A'},
 {type:CHKR.SALE,code:3,name:'Tov3',sum:16.25,tax:'A'},
 {type:CHKR.COMM,comm:'Коментарий'},
 {type:CHKR.PROM,sum:16.25},
 {type:CHKR.DSK,void:1,prc:10,sum:-15.0},
 {type:CHKR.DSK,sum:-5.0},
 {type:CHKR.OPL,name:'Готівка',sum:100.0},
 {type:CHKR.ENDCHK}
 ]},
 {no:6,type:CHK_TYPE.IO,ecr_no:"AA12345678",dat:new Date(2012,11,22,12,22),rows:[
 {type:CHKR.INOUT,name:'Готівка',sum:200.0},
 {type:CHKR.ENDCHK}
 ]}
 ]);*/