/**
 * Created by Andrew on 11.02.2015.
 */
var AppRouter = Backbone.Router.extend({
    routes: {
        "":'mainScr',
        "plu":'pluScr',
        "table":'tableScr',
        "network":'networkScr',
        "modem": 'modemScr',
        "fm": 'fisc',
        "fm/fisc": "ffisc",
        "fm/time": 'ftime',
        'fm/reset':'freset'
    },
    execute: function(callback, args) {
        if (this.view) {
            this.view.remove();
            delete this.view;
        }
        if (callback) callback.apply(this, args);
        $('#content').html('').append(this.view.render().$el);
    },
    mainScr: function() {
        this.view = new MainScreenView({inrow:2,cells:mainScreenCells});
    },
    pluScr: function() {
        this.view = new TableContainer({
            model: schema.get('PLU'),
            tblMode:true,
            show:true,
            table:PLUTableDisplay,
            form:PLUFormDisplay
        });
    },
    tableScr: function() { this.view = new GroupTable({group:'cfg'});},
    networkScr: function() { this.view = new GroupTable({group:'net'}); },
    fiscTab:0,
    modemScr: function() { this.view = new GPRSState();},
    fisc: function() {
        if (this.fiscTab==1) { this.ftime();
        } else if (this.fiscTab==2) { this.freset();
        } else this.ffisc();
    },
    ffisc: function() {
        this.fiscTab=0;
        this.view = new FiscalPage({no:0,page:new FiscDo()});
    },
    ftime: function() {
        this.fiscTab=1;
        this.view = new FiscalPage({no:1,page:new FiscTime()});
    },
    freset: function() {
        this.fiscTab=2;
        this.view = new FiscalPage({no:2,page:new FiscReset()});
    }
});

var appStart = function(){
    ecrStatus = new ECRStatus();

    fiscalCell = new FiscalCell({firstRep:1,firstTime:new Date(2000,1,1),fiscalize:true,lastRep:5000,lastTime:new Date()});
    networkCell = new Backbone.Collection();

    htmlLog = new Log();
    mainScreenCells = [
        new MainCell({model:new Backbone.Model({
            lnk:'#plu',img:'plu',name:'PLU'
        })}),
        new MainCell({
            model:new Backbone.Model({lnk:'#table',img:'table',name:'Settings',
            addView: new PrgView({model:ecrStatus})
        })}),
        new MainCell({model:new Backbone.Model({
            lnk:'#fm',img:'fm',name:'Fiscal',
            addView: new FiscalView({model:fiscalCell})
        })}),
        new MainCell({
            model:new Backbone.Model({lnk:'#network',img:'network',name:'Network',
            addView: new NetworkView({model:networkCell})
        })}),
        new MainCell({model:new Backbone.Model({lnk:'#modem',img:'modem',name:'Modem'})})
    ];

    networkCell.url='/cgi/netifs';
    networkCell.fetch();

    schema = new Schema();
    appRouter = new AppRouter();
    tickHandler = 0;

    is_type = {};
    var chkInput = function() {
        var i = document.createElement("input");
        _.each(['number','date','time','datetime-local'],function(t){
            i.setAttribute("type", t);
            is_type[t]=i.type!="text";
        });
    };
    chkInput();

    jQuery.event.props.push('dataTransfer');
    Backbone.emulateHTTP = true;
    tickHandler = setInterval(_.bind(events.trigger,events,'tick'),1000);
    schema.load(function(){ Backbone.history.start();
    });
};

