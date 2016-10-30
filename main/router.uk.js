/**
 * Created by Andrew on 11.02.2015.
 */
var AppRouter = Backbone.Router.extend({
	routes:  {
		"":                'mainScr',
		/*    "sales":'salesScr',
		 "sales/plu":'salesPLUScr',
		 "receipt":'receiptScr',*/
		"plu":             'pluScr',
		"table":           'tableScr',
		"network(/:page)": 'networkScr',
		"modem(/:page)":   'modemScr',
		"fm(/:page)":      'fisc',
		"logo":            'logoScr',
		"report":          'repScr'
	},
	execute: function (callback, args) {
		if (this.view) {
			this.view.remove();
			delete this.view;
		}
		if (callback) callback.apply(this, args);
		$('#content').html('').append(this.view.render().$el);
	},
	mainScr: function () {
		this.view = new MainScreenView({inrow: 2, cells: mainScreenCells});
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

	pluScr:     function () {
		this.view = new TableContainer({
			model:   schema.get('PLU'),
			tblMode: true,
			show:    true,
			table:   PLUTableDisplay,
			form:    PLUFormDisplay
		});
	},
	repScr:     function () {
		this.view = new ReportPage();
	},
	logoScr:    function () {
		this.view = new LogoView();
	},
	tableScr:   function () {
		this.view = new GroupTable({group: 'cfg'});
	},
	networkTab: 0,
	networkScr: function (page) {
		switch (page) {
			case "state":
				this.networkTab = 0;
				break;
			case "settings":
				this.networkTab = 1;
				break;
		}
		this.view = new PagesScreen({no: this.networkTab, models: networkPages});
		//this.view = new GroupTable({group:'net'});
	},
	modemTab:   0,
	fiscTab:    0,
	modemScr:   function (page) {
		switch (page) {
			case "state":
				this.modemTab = 0;
				break;
			case "settings":
				this.modemTab = 1;
				break;
			case "docs":
				this.modemTab = 2;
				break;
		}
		this.view = new PagesScreen({no: this.modemTab, models: modemPages});
	},
	fisc:       function (page) {
		switch (page) {
			case "fisc":
				this.fiscTab = 0;
				break;
			case "time":
				this.fiscTab = 1;
				break;
			case "reset":
				this.fiscTab = 2;
				break;
		}
		this.view = new PagesScreen({no: this.fiscTab, models: fiscalPages});
	}
});

var appStart = function () {
	modemState = new ModemStatus();
	ecrStatus  = new ECRStatus();
	gprsExists = false;
	//var pluCell = new Backbone.Model({size:0});
	fiscalCell  = new FiscalCell({
		firstRep:  1,
		firstTime: new Date(2000, 1, 1),
		fiscalize: true,
		lastRep:   5000,
		lastTime:  new Date()
	});
	networkCell = new NetworkInfo();

	htmlLog         = new Log();
	mainScreenCells = [
		/*
		 new MainCell({model:new Backbone.Model({
		 lnk:'#sales',img:'sales',name:'Sales',
		 addView: new SalesView()
		 })}),
		 new MainCell({model:new Backbone.Model({
		 lnk:'#receipt',img:'receipt',name:'Receipts',
		 addView: new ReceiptsView()
		 })}),
		 new MainCell({model:new Backbone.Model(
		 {lnk:'#plu',img:'plu',name:'PLU'
		 //addView: new PLUView()
		 })}),*/
		new MainCell({
			model: new Backbone.Model({
				lnk:     '#table', img: 'table', name: 'Settings',
				addView: new PrgView({model: ecrStatus})
			})
		}),
		new MainCell({
			model: new Backbone.Model({
				lnk:     '#fm', img: 'fm', name: 'Fiscal',
				addView: new FiscalView({model: fiscalCell})
			})
		}),
		new MainCell({
			model: new Backbone.Model({
				lnk:     '#network', img: 'network', name: 'Network',
				addView: new NetworkView({model: networkCell})
			})
		}),
		new MainCell({model: new Backbone.Model({lnk: '#report', img: 'sales', name: 'Reports'})})
	];
	schema          = new Schema();
	appRouter       = new AppRouter();
	tickHandler     = 0;

	is_type              = {};
	var chkInput         = function () {
		var i = document.createElement("input");
		_.each(['number', 'date', 'time', 'datetime-local'], function (t) {
			i.setAttribute("type", t);
			is_type[t] = i.type != "text";
		});
	};
	chkInput();

	jQuery.event.props.push('dataTransfer');
	Backbone.emulateHTTP = true;

	var qryDone      = $.Deferred();
	var schemaLoaded = $.Deferred();

	networkCell.refresh().always(function () {
		qryDone.resolve();
	});
	schema.load(function () {
		schemaLoaded.resolve();
	});
	$.when(qryDone, schemaLoaded).always(function () {
		if (schema.get('PLU')) {
			mainScreenCells.unshift(new MainCell({
				model: new Backbone.Model(
					{
						lnk: '#plu', img: 'plu', name: 'PLU'
						//addView: new PLUView()
					})
			}));
		}
		if (schema.get('Logo')) {
			mainScreenCells.push(new MainCell({
				model: new Backbone.Model(
					{
						lnk: '#logo', img: 'logo', name: 'Logo'
						//addView: new PLUView()
					})
			}));
		}
		modemPages   = [
			{lnk: '#modem/state', name: 'State', page: new ModemState({model: modemState})},
			{
				lnk: "#modem/settings", name: 'Settings', page: new TableContainer({
				model:     schema.get('NSMEP'),
				className: 'col-md-10',
				tblMode:   false,
				show:      true
			})
			},
			{lnk: "#modem/docs", name: 'Documents', page: new ModemDocs()}
		];
		fiscalPages  = [
			{lnk: '#fm/fisc', name: 'Fiscalization', page: new FiscDo()},
			{lnk: '#fm/time', name: 'Time', page: new FiscTime()},
			{lnk: '#fm/reset', name: 'Reset', page: new FiscReset()}
		];
		var models   = schema.tableGroup('net');
		networkViews = [new InterfacesTable()];
		if (gprsExists) {
			networkViews.push(new GPRSState());
		}
		networkPages = [
			{
				lnk: '#network/state', name: 'State', page: new ArrayOfViews({
				tagName:   'div',
				className: 'col-md-10',
				views:     networkViews
			})
			},
			{
				lnk:     "#network/settings", name: 'Settings', page: new CollectionView({
				model:     new Backbone.Collection(models),
				tagName:   'div',
				className: 'col-md-10',
				elemView:  TableContainer
			}), addView: new ImpExView({model: {models: models}})
			}
		];
		tickHandler  = setInterval(_.bind(events.trigger, events, 'tick'), 1000);
		Backbone.history.start();
	});
};

