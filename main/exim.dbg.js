/**
 * Created by Andrew on 27.06.2014.
 */

var ImpExView = Backbone.View.extend({
    events: {
        "click .export":"_export",
        "dragstart .export":"dragexport",
        'dragover .import':"dragover",
        'drop .import':"dropimport",
        'click .import':'clickimport',
        'change .icsv': 'fileimport'
    },
    //tagName:'div',
    template: _.template($('#impex-view').html()),
    render: function() {
        this.$el.html(this.template());
        this.$('[data-toggle="tooltip"]').tooltip({placement:'bottom'});
        return this;
    },
    dragover: function(ev) {
        ev.dataTransfer.dropEffect='copy';
        ev.preventDefault();
    },
    fileimport: function() { this.Import(this.$('.icsv')[0].files);},
    dropimport: function(ev) {
        ev.preventDefault();
        if (ev.dataTransfer.files && ev.dataTransfer.files.length) {
            this.Import(ev.dataTransfer.files);
        } else {
            this.Import(ev.dataTransfer.getData("Text"));
        }
    },
    Import: function(data) {
        if (!data) return;
        var modal = new Modal();
        modal.show(new ImportDisplay());
        this.importLoadHnd(data,modal);
    },
    importError: function(m) { events.trigger('importError',{msg:m});},
    importLoad: function(data) { return loadTexts(data,this.importError); },
    importLoadHnd: function(data,modal) {
        modal.set({header:"Import: Load Data",footer:''});
        var $this = this;
        this.importLoad(data).then(
            function(inf) { $this.importParseHnd(inf,modal); },
            function (inf) { // error parse data
                if (!inf) {
                    modal.setButtons(modal.body.fatalButtons());
                    return;
                }
                modal.waitClick(modal.body.rncButtons()).done( function(btn) {
                    if (btn=='next') $this.importParseHnd(inf,modal);
                    if (btn=='retry') $this.importLoadHnd(data,modal);
                });
            }
        );
    },
    importParse: function(inf) {
        var ret = new $.Deferred();
        if (!_.isArray(inf)) { this.importError("Internal error"); ret.reject();
        } else {
            var promises = _.map(inf,function(el){
                var data = el.data;
                var name = el.name;
                var ret = new jQuery.Deferred();
                data = _.map(data.split('\r\n'),function(s){return s.trim();});
                var p = [];
                while(data.length) {
                    var idx = _.indexOf(data,"");
                    var r=[];
                    if (idx>0) { r = data.splice(0, idx+1);
                    } else {
                        r = data;
                        data=[];
                    }
                    var tblname = r.shift();
                    p.push(schema.CSVTable(tblname,r,name));
                }
                $.when.apply($, p).then(
                    function () { ret.resolve(arguments);},
                    function () { ret.reject(arguments);}
                );
                return ret.promise();
            },this);
            $.when.apply($, promises).done(function(){ret.resolve(_.uniq(_.flatten(arguments)));
            }).fail(function(){ ret.reject(_.uniq(_.compact(_.flatten(arguments))));
            });
        }
        return ret.promise();
    },
    importParseHnd: function(inf,modal) {
        modal.set({header:"Import: Parse Data",footer:''});
        var $this = this;
        this.importParse(inf).then(
            function(names) { $this.importSaveHnd(names,modal); },
            function (names) { // error parse data
                if (!names) {
                    modal.setButtons(modal.body.fatalButtons());
                    return;
                }
                modal.waitClick(modal.body.ncButtons()).done( function() { $this.importSaveHnd(names,modal);});
            }
        );
    },
    importSave: function(names) {
        var ret = new jQuery.Deferred();
        var promises = _.map(names,function(name){
            var r = new jQuery.Deferred();
            var tbl = schema.table(name);
            var res;
            if (tbl instanceof Backbone.Collection) {
                res = tbl.syncSave(function(err){
                    err['tbl']=name;
                    events.trigger('importError',err);
                });
                if (!res) {r.resolve();
                } else { res.then(_.bind(r.resolve,r), _.bind(r.reject,r,name) );
                }
            } else {
                if (tbl.hasChanged()) {
                    this.listenTo(tbl,'invalid',function(m,err) {
                        events.trigger('importError',{msg:err,tbl:name});
                    });
                    var err = false;
                    this.listenTo(tbl,'err',function(data,msg,field){
                        err = true;
                        events.trigger('importError',{msg:msg,tbl:name,fld:field});
                    });
                    var $this=this;
                    res = tbl.save(tbl.changedAttributes(),{
                        patch:true,
                        success:function(model,response,option) {
                            $this.stopListening(tbl,'err');
                            if (err) { r.reject(name);
                            } else {r.resolve();
                            }
                        },
                        error:function(model,response,option) {
                            events.trigger('importError',{msg:xhrError(response),tbl:name});
                            $this.stopListening(tbl,'err');
                            r.reject(name);
                        }
                    });
                    this.stopListening(tbl,'invalid');
                    if (!res) {
                        this.stopListening(tbl,'err');
                        r.reject();
                    }
                } else { r.resolve();
                }
            }
            return r.promise();
        },this);
        $.when.apply($, promises).done(function(){
            ret.resolve();
        }).fail(function(){
            ret.reject(_.uniq(_.compact(_.flatten(arguments))));
        });
        return ret.promise();
    },
    importSaveHnd: function(names,modal) {
        modal.set({header:"Import: Save Data",footer:''});
        var $this = this;
        this.importSave(names).then(
            function() {
                modal.set({header:"Import: Done"});
                modal.setButtons(modal.body.doneButtons());
            },
            function (names) { // error parse data
                modal.waitClick(modal.body.rcButtons()).done( function() { $this.importSaveHnd(names,modal);});
            }
        );
    },
    clickimport: function() {this.$('.icsv').click();},
    csvExport: function() {
        var ret = new jQuery.Deferred();
        var m = this.model.models;
        var promises = _.map(m,function(t){return schema.tableFetch(t.get('id')); });
        $.when.apply($, promises).done(function(){
            ret.resolve(_.reduce(m,function(r,t){return r+schema.tableCSV(t.get('id'))+'\r\n'; },""));
        }).fail(function(){ret.reject();});
        return ret.promise();
    },
    _export: function() {
        var $this=this;
        this.csvExport().done(function(txt){ $this.$('.csv').attr('href',window.URL.createObjectURL(new Blob([txt])))[0].click();
        });
    },
    dragexport: function(ev) {
        var tmp = $.ajaxSettings.async;
        $.ajaxSettings.async=false;
        this.csvExport().done(function(txt){ ev.dataTransfer.setData("Text",txt); });
        $.ajaxSettings.async=tmp;
    }
});

var ImportDisplay = Backbone.View.extend({
    tagName:'ul',
    className:'list-group',
    initialize: function() {
        this.listenTo(events,'importError',this.addError);
    },
    errTmpl:_.template($('#impex-err').html(),0,{variable:'d'}),
    addError: function(err) {
        this.$el.append(this.errTmpl(err));
    },
    fatalButtons: function() { return {cancel:['Close','danger',1]}; },
    rncButtons: function() {
        return {
            retry:'Retry',
            next:['Next','primary'],
            cancel:['Close','danger']
        };
    },
    ncButtons: function() {
        return {
            next:['Next','primary'],
            cancel:['Close','danger']
        };
    },
    rcButtons: function() {
        return {
            retry:'Retry',
            cancel:['Close','danger']
        };
    },
    doneButtons: function() {
        return {cancel:['Done','primary',1]};
    }
});
