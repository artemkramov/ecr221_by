/**
 * Created by Andrew on 11.02.2015.
 */
var AppRouter = Backbone.Router.extend({
    routes: {
        "":'mainScr',
        /*    "sales":'salesScr',
         "sales/plu":'salesPLUScr',
         "receipt":'receiptScr',*/
        "plu":'pluScr',
        "table":'tableScr',
        "fm":'fmScr',
        "network":'networkScr'
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
    /*salesScr: function() {
     salesScreen.leftCol.model.modelIdx=0;
     salesScreen.page = new SalesSumPage();
     salesScreen.render();
     },
     salesPLUScr: function() {
     salesScreen.leftCol.model.modelIdx=1;
     salesScreen.page = new SalesPLUPage();
     salesScreen.render();
     },
     receiptScr: function() { tapeView.render(); },*/

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
    fmScr: function() { this.view = new FiscalPage();},
    networkScr: function() { this.view = new GroupTable({group:'net'}); }
});

var appStart = function(){
    ecrStatus = new ECRStatus();

    //var pluCell = new Backbone.Model({size:0});
    fiscalCell = new FiscalCell({firstRep:1,firstTime:new Date(2000,1,1),fiscalize:true,lastRep:5000,lastTime:new Date()});
    networkCell = new Backbone.Collection();

    htmlLog = new Log();

    mainScreenCells = [
        /*
        new MainCell({model:new Backbone.Model({
            lnk:'#sales',img:'sales',name:'Sales',
            addView: new SalesView()
        })}),
        new MainCell({model:new Backbone.Model({
            lnk:'#receipt',img:'receipt',name:'Receipts',
            addView: new ReceiptsView()
        })}),*/
        new MainCell({model:new Backbone.Model({
            lnk:'#plu',img:'plu',name:'PLU'
            //addView: new PLUView()
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
        })})//,
        //new MainCell({model:new Backbone.Model({lnk:'#modem',img:'modem',name:'Modem'})})
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

