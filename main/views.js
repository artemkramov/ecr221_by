/**
 * Created by Andrew on 27.06.2014.
 */

// <editor-fold desc="----------------------General Views------------------------------">

/**
 * Collection View.
 * Creates one elemView per collection item and insert it to appendEl
 */
var CollectionView = Backbone.View.extend({
	subView: {},
	initialize: function (args) {
		if (args && args.elemView) this.elemView = args.elemView;
		this.initEl();
		this.listenTo(this.model, 'add', this.addElem);
		this.listenTo(this.model, 'reset', this.addAll);
	},
	initEl:     function () {
		this.$el.html('');
		this.appendEl = this.$el;
	},
	addElem:    function (f) {
		this.subView = new this.elemView({model: f});
		this.appendEl.append(this.subView.render().$el);
	},
	addAll:     function () {
		this.initEl();
		this.model.each(this.addElem, this);
	},
	render:     function () {
		this.addAll();
		//this.model.each(this.addElem,this);
		return this;
	},
	remove: function() {
		this.subView.remove();
	}
});

var ArrayOfViews = Backbone.View.extend({
	initialize: function (args) {
		if (args && args.views) this.views = args.views;
	},
	render:     function () {
		this.$el.html('');
		_.each(this.views, function (view) {
			this.$el.append(view.render().$el);
		}, this);
		return this;
	}
});

/**
 * Modal.
 * Handle modal dialog stored to #modalDialog DOM element. Assumed that it Bootstarap 3 modal.
 * Can set the window title in header part as string.
 * Can set the footer as set of buttons or raw
 * Can set the dialog body as another Backbone.View object
 * Emit clickDlg event on button clicking or closing the dialog
 */
var Modal = Backbone.View.extend({
	events:     {
		'click .modal-footer button': 'click',
		'hidden.bs.modal':            'cancel'
	},
	el:         '#modalDialog',
	cancel:     function () {
		events.trigger('clickDlg', 'hide');
	},
	click:      function (ev) {
		events.trigger('clickDlg', $(ev.target).data('ev'));
	},
	waitClick:  function (buttons) {
		if (buttons) this.setButtons(buttons);
		var ret = new $.Deferred();
		this.listenTo(events, 'clickDlg', function (btn) {
			if ((btn == 'cancel') || (btn == 'hide')) {
				ret.reject(btn);
			} else {
				ret.resolve(btn);
			}
			//if (btn=='cancel') this.hide();
		});
		return ret.promise();
	},
	show:       function (body) {
		if (body) {
			if (this.body) {
				this.body.remove();
				delete this.body;
			}
			this.body = body;
			this.set({body: body.$el});
		}
		this.$el.modal("show");
	},
	hide:       function () {
		this.$el.modal("hide");
	},
	set:        function (value) {
		_.isString(value) && (value = {body: value});
		if (_.isObject(value)) {
			var t;
			('header' in value) && this.$('.modal-title').html(value.header);
			if ('body' in value) {
				t = this.$('.modal-body').empty();
				if (value.body) t.append(value.body);
			}
			if ('footer' in value) {
				t = this.$('.modal-footer').empty();
				if (value.footer) t.append(value.footer);
			}
		}
	},
	setButtons: function (value) {
		var content = "";
		if (_.isObject(value)) {
			_.each(value, function (el, idx) {
				var btn_class   = 'default';
				var btn_text    = "OK";
				var btn_dismiss = false;
				if (_.isString(el)) {
					btn_text = el;
				} else if (_.isArray(el)) {
					(el.length > 0) && (btn_text = el[0]);
					(el.length > 1) && (btn_class = el[1]);
					(el.length > 2) && (btn_dismiss = true);
				} else if (_.isObject(el)) {
					('name' in el) && (btn_text = el['name']);
					('type' in el) && (btn_class = el['type']);
					btn_dismiss = 'dismiss' in el;
				}
				content += ['<button type="button" class="btn btn-', btn_class, '" data-ev="', idx, '"',
					btn_dismiss ? ' data-dismiss="modal"' : "", '>', btn_text, '</button>'].join('');
			});
		}
		this.set({footer: content});
	}
});

var ConfirmModal = Modal.extend({

	callbackConfirm: function () {
	},

	autoClose: false,

	setCallback:  function (callback) {
		this.callbackConfirm = callback;
		this.setButtons(this.buttons());
	},
	buttons:      function () {
		return {
			confirm: [t('yes'), 'primary'],
			cancel:  [t('None'), 'danger']
		};
	},
	click:        function (ev) {
		var buttonType = 'handle-' + $(ev.target).data('ev').toString();
		buttonType     = toCamelCase(buttonType);
		if (!_.isUndefined(this[buttonType]) && _.isFunction(this[buttonType])) {
			this[buttonType]();
			this.setButtons({});
		}
	},
	cancel:     function () {
		this.$el.off('click', '.modal-footer button');
		events.trigger('clickDlg', 'hide');
	},
	handleCancel: function () {
		this.$el.off('click', '.modal-footer button');
		this.hide();
	},
	handleConfirm: function() {
		if (_.isFunction(this.callbackConfirm)) {
			if (this.autoClose) {
				this.hide();
			}
			$('body').removeClass('modal-open');
			this.callbackConfirm();
			this.$el.off('click', '.modal-footer button');
		}
	}

});

// </editor-fold>

// <editor-fold desc="----------------------Main Screen Views--------------------------">

var LanguageSelector = Backbone.View.extend({
	tagName:   'select',
	className: 'pull-right',
	events:    {
		'change': 'langChg'
	},
	render:    function () {
		_.each(schema.langs, function (value) {
			this.$el.append($("<option>").attr("value", value).text(value));
		}, this);
		this.$el.val(schema.lang);
		return this;
	},
	langChg:   function (e) {
		e.preventDefault();
		schema.switchLang(this.$el.val());
		this.$el.val(schema.lang);
		appRouter.navigate("", {trigger: true, replace: true});
		Backbone.history.loadUrl(Backbone.history.fragment);
		return false;
	}
});

/**
 * ECR summary element. Contains some ecr status data
 */

var SummaryTable = Backbone.View.extend({
	tagName:    'div',
	className:  'well row',
	//model:ecrStatus,
	events:     {
		'click button.pull-right': 'logout'
	},
	initialize: function () {
		this.listenTo(this.model, 'change', this.render);
	},
	template:   _.template($('#status-tbl').html()),
	render:     function () {
		//if (!this.model.has('model')) return this;
		try {
			this.$el.html(this.template(this.model.toJSON()));
		} catch (e) {
		}
		if (this.model.has('err')) {
			var $this = this;
			schema.parseError(this.model.get('err'), function (msg) {
				$this.$el.append('<div class="alert alert-danger alert-dismissable">' + msg + '</div>');
			});
		}
		return this;
	},
	logout:     function (e) {
		e.preventDefault();
		//clearInterval(tickHandler);
		$.ajax('/cgi/state', {username: 'logout'}).always(function () {
			$.get('/cgi/state');
		});
		/*var u=new URL(document.URL);
		 u.username='logout';
		 u.password='none';
		 Backbone.history.stop();
		 window.location.replace(u.toString());*/
		return false;
	}
});

/**
 * The main screen element button. Contains subpage name, subpage link, and image. Can render additional information as subview
 */
var MainCell = Backbone.View.extend({
	tagName:   'div',
	className: 'col-md-6',//'col-md-4',
	template:  _.template('<h2><a class="btn btn-default" href="<%=lnk%>"><img src="img/<%=img%>-h.png"/></a> <%=t(name)%></h2>'),
	render:    function () {
		this.$el.html(this.template(this.model.toJSON()));
		var addV = this.model.get('addView');
		if (addV) {
			this.$el.append(addV.render().$el);
		}
		return this;
	}
});

/**
 * Additional subview to display specific cell information
 */
var AddView = Backbone.View.extend({
	tagName:    'table',
	className:  'table table-striped',
	initialize: function () {
		this.listenTo(this.model, 'change', this.render);
	},
	render:     function () {
		try {
			this.$el.html(this.template(this.model.toJSON()));
		} catch (e) {
		}
		return this;
	}
});

/*var SalesView = AddView.extend({
 template: _.template($('#sales-cell').html()),
 model:salesCell
 });

 var ReceiptsView = AddView.extend({
 template: _.template($('#receipts-cell').html()),
 model:receiptsCell
 });

 var PLUView = AddView.extend({
 template: _.template('<tr><td>Total count:</td><td><%=size%></td></tr>'),
 model:pluCell
 });*/

var PrgView = AddView.extend({
	tagName:   'div',
	className: '',
	template:  _.template('<%if (IsWrk) print("<div class=\'alert alert-warning\'>"+t("<strong>Attention!</strong> Day report is open. Most tables are uneditable.")+"</div>");%>')
	//model:ecrStatus
});

var FiscalView = AddView.extend({
	template: _.template($('#fiscal-cell').html())
	//initialize: function() {
	//    fiscalCell.on('changed',this.render,this);
	//}
	//model:fiscalCell
});

var NetworkView = AddView.extend({
	render:   function () {
		this.$el.html(this.template({models: this.model.models}));
		return this;
	},
	template: _.template($('#network-cell').html())
	//model:networkCell
});


/**
 * Main Screen View
 */
var MainScreenView = Backbone.View.extend({
	//el:'#content',
	initialize: function (args) {
		this.$summary = new SummaryTable({model: ecrStatus});
		if (args) {
			if (args.cells) this.cells = args.cells;
			if (args.inrow) this.inrow = args.inrow;
		}
		if (!this.inrow) this.inrow = 2;
		this.lang = new LanguageSelector();
	},
	render:     function () {
		this.$el.html('');
		this.$el.append(this.lang.render().$el);
		this.$el.append(this.$summary.render().$el);
		if (this.cells) {
			var row = false;
			var cnt = 0;
			for (var cell in this.cells) {
				if (cnt == 0) {
					row = $('<div class="row"></div>');
					this.$el.append(row);
				}
				row.append(this.cells[cell].render().$el);
				cnt++;
				if (cnt == this.inrow) cnt = 0;
			}
		}
		return this;
	}
});

// </editor-fold>

//<editor-fold desc="----------------------Page Screen--------------------------------">
var LeftColumn = Backbone.View.extend({
	tagName:   'nav',
	className: 'col-md-2',
	template:  _.template($('#left-col').html()),
	remove:    function () {
		if (this.addView) {
			this.addView.remove();
		}
		this.$el.remove();
		this.stopListening();
		return this;
	},
	render:    function () {
		this.$el.html(this.template(this.model)).children().affix();
		if (this.addView) {
			this.$el.children().last().append(this.addView.render().$el);
		}
		return this;
	}
});

var TableLeftColumn = LeftColumn.extend({
	events:     {'click li': "showEl"},
	initialize: function (args) {
		if (args && args.model && args.model.models) {
			this.addView = new ImpExView(args);
		}
	},
	showEl:     function (e) {
		e.preventDefault();
		$('#' + $(e.target).data("ref"))[0].scrollIntoView();
		return false;
	},
	template:   _.template($('#table-left-col').html())
});

var PageScreen = Backbone.View.extend({
	render: function () {
		this.$el.html('');
		var row = $('<div class="row"></div>');
		this.$el.append(row);
		row.append(this.leftCol.render().$el);
		row.append(this.page.render().$el);
		return this;
	},
	remove: function () {
		this.page.remove();
	}
});

var PageView = Backbone.View.extend({
	tagName:   'div',
	className: 'col-md-10',
	render:    function () {
		this.$el.html(this.template(this.model.toJSON()));
		return this;
	}
});

var PagesScreen = PageScreen.extend({
	initialize: function (args) {
		this.leftCol = new LeftColumn({model: {modelIdx: args.no, models: args.models}}
		);
		if (args.models[args.no].addView) this.leftCol.addView = args.models[args.no].addView;
		this.page = args.models[args.no].page;
	}
});

/*var SalesSumPage = PageView.extend({ template: _.template($('#sales-sum').html()), model:sumRep });

 var SalesPLURow = Backbone.View.extend({
 tagName:'tr',
 template: _.template('<td><%=id%></td><td><%=name%></td><td><%=kol%></td><td><%=sum%></td>'),
 render: function() {
 this.$el.html( this.template( this.model.toJSON() ) );
 return this;
 }
 });
 var SalesPLUPage = CollectionView.extend({ //PageView.extend({ template: _.template($('#sales-plu').html()), model:pluRep });
 tagName:'div',
 className:'col-md-10',
 elemView: SalesPLURow,
 model:pluRep,
 initEl:function() {
 var tbl = $('<table>');
 tbl.addClass('table table-striped');
 tbl.html('<thead><tr><th>Код</th><th>Назва</th><th>Кількість</th><th>Сума</th></tr></thead>');
 this.appendEl = $('<tbody>');
 tbl.append(this.appendEl);
 this.$el.append(tbl);
 }
 });
 var salesScreen = new PageScreen();
 salesScreen.leftCol = new LeftColumn({ model:{modelIdx:0,
 models:[
 {lnk:'#sales',name:'Summary'},
 {lnk:"#sales/plu",name:'PLU report'}
 ]}});

 var ChkPickRow = Backbone.View.extend({
 tagName:'option',
 render: function() {
 var no = this.model.get('no');
 this.$el.html( no );
 return this;
 }
 });

 var ChkPick = CollectionView.extend({
 initEl: function() {
 this.$el.html($('#chk-sel').html());
 this.appendEl = this.$('select');
 },
 events: { 'change':'viewEl' },
 elemView: ChkPickRow,
 model:receipts,
 viewEl: function() { $('#chk'+this.appendEl.val())[0].scrollIntoView(); }
 });

 var ChkFilter = Backbone.View.extend({
 initialize: function() {
 this.$el.html($('#chk-filter').html());
 },
 events: {
 'click #chk-flt-flt': 'filter',
 'click #chk-flt-clr': 'filterClr'
 },
 filter: function() {
 var code = $('#chk-flt-сode').val();
 var name = $('#chk-flt-name').val();
 if ((code=="") && (name=="" )) { $('.chk').show();
 } else {
 $('.chk').hide();
 if (code) { $('.sale div:first-child, .salekol div:first-child').each(function(){
 var t = $(this);
 if (t.text()==code) t.parent().parent().show();
 });}
 if (name) { $('.sale div:nth-child(2), .salekol div:nth-child(2)').each(function() {
 var t = $(this);
 if (t.text()==name) t.parent().parent().show();
 });}
 }
 return false;
 },
 filterClr: function() { $('.chk').show(); return false; }
 });

 var ChkLeft = Backbone.View.extend({
 tagName:'div',
 className:'col-md-2',
 initialize: function() {
 this.pick = new ChkPick();
 this.filter = new ChkFilter();
 },
 render: function() {
 this.$el.html('');
 var cont = $('<div data-spy="affix" data-offset-top="0">');
 this.$el.append(cont);
 cont.append(this.pick.render().$el);
 cont.append(this.filter.render().$el);
 cont.append('<a href="#" class="btn btn-default col-md-11">Back</a>');
 return this;
 }
 });

 var ChkView = Backbone.View.extend({
 tagName:'div',
 template: _.template($('#chk-view').html()),
 render: function() {
 this.$el.html( this.template( this.model.toJSON() ) );
 return this;
 }
 });

 var TapeView = CollectionView.extend({
 tagName:'div',
 className:'col-md-10',
 elemView: ChkView,
 model:receipts
 });

 var tapeView = new PageScreen();
 tapeView.leftCol = new ChkLeft();
 tapeView.page = new TapeView();
 */
//</editor-fold>

//<editor-fold desc="----------------------Table Elements-----------------------------">
var Toolbar = Backbone.View.extend({
	tagName:    'div',
	className:  'navbar-right',
	tmpl:       _.template($('#form-bar-template').html()),
	hideTbl:    false,
	initialize: function (args) {
		if (args) {
			if (args.tmpl) this.tmpl = args.tmpl;
			if (args.hideTbl) this.hideTbl = args.hideTbl;
			if (args.form) {
				this.listenTo(events, "buttonBlock:" + args.form, this.btnHandler);
			}
		}
	},
	btnHandler: function (name, dsb) {
		var el = this.$('[data-ev="' + name + '"]');
		if (dsb) {
			el.attr("disabled", "disabled");
			if (name == 'refresh') el.children('span').addClass('loading');
		} else {
			if (name == 'refresh') el.children('span').removeClass('loading');
			el.removeAttr("disabled");
		}
	},
	render:     function () {
		this.$el.html(this.tmpl()).css('margin', '5px');
		if (this.hideTbl) this.$('.tblctrl').hide();
		return this;
	}
});

var FormDisplay = Backbone.View.extend({
	events:        {
		//'click button.btn':'saveData',
		'submit':     'saveData',
		'blur input': 'validField'
	},
	fill:          function (isAll, def) {
		if (isAll) {
			this.clearFormData();
			this.setFormData(this.data.attributes, def);
		} else {
			this.setFormData(this.data.changed, def);
		}
	},
	saveData:      function (ev) {
		ev.preventDefault();
		events.trigger("buttonBlock:" + this.model.id, "refresh", true);
		this.$('button.btn').button('loading');
		var $this = this;
		var o     = this.formInObj();
		this.data.save(o, {patch: true, silent: true})
			.always(function () {
				$('button.btn', $this.$el).button('reset');
				events.trigger("buttonBlock:" + $this.model.id, "refresh", false);
			});
	},
	validField:    function (ev) {
		if ('validity' in ev.target) {
			if (ev.target.checkValidity()) {
				$(ev.target).parents('.form-group').addClass('has-success').removeClass('has-error');
			} else {
				$(ev.target).parents('.form-group').removeClass('has-success').addClass('has-error');
			}
		} else console.log("check validity impossible");

	},
	formInObj:     function (all) {
		f       = this.$('form')[0];
		var obj = {};
		var rem = {};
		$.each(f.elements, function (idx, el) {
			name = f.elements[idx].name;
			if (name == "") return;
			switch (el.type) {
				case "radio":
					if (all || (el.checked && !el.defaultChecked)) obj[name] = el.value;
					break;
				case "checkbox":
					if (!(all || (name in rem))) rem[name] = true;
					if (name in obj) {
						if (el.checked) obj[name] |= 1 << el.value;
					} else {
						obj[name] = el.checked ? (1 << el.value) : 0;
					}
					if (!all && (el.checked != el.defaultChecked)) rem[name] = false;
					break;
				case "select-one":
					if (all || (!el.options[el.selectedIndex].defaultSelected)) {
						obj[name] = el.options[el.selectedIndex].value;
					}
					break;
				case "time":
					if (all || (el.value != el.defaultValue)) {
						if (_.isString(el.value)) {
							var d     = new Date(0);
							var n     = el.value.split(':');
							d.setHours.apply(d, n);
							obj[name] = d;
						}
					}
					break;
				default:
					if (all || (el.value != el.defaultValue)) obj[name] = el.value;
					break;
			}
		});
		$.each(rem, function (idx, r) {
			if (r) delete obj[idx];
		});
		return obj;
	},
	clearFormData: function () {
		this.$(':input').each(function (idx, el) {
			var $flt = 0;
			el       = $(el);
			if (el.length == 0) return;
			switch (el.prop('type')) {
				case "password":
				case "email":
				case "text":
				case "url":
				case "number":
				case "range":
				case "date":
					el.val('');
					el.prop('defaultValue', '');
					break;
				case "radio":
					$flt = el.filter('[value="1"]').prop('checked', 'checked');
					$flt.prop('defaultChecked', 'checked');
					break;
				case "checkbox":
					el.attr('checked', false);
					el.prop('defaultChecked', false);
					break;
				case "select-one":
					el.val(1);
					break;
			}
		});
	},
	setFormData:   function (obj, def) {
		for (var name in obj) {
			var val = obj[name];
			//if (typeof (this.$el[0][name]) != "object") continue;
			var el   = $('[name=' + name + ']', this.$el);
			var $flt = 0;
			if (el.length == 0) continue;
			switch (el.prop('type')) {
				case "radio":
					$flt = el.filter('[value="' + val + '"]').prop('checked', 'checked');
					if (def) $flt.prop('defaultChecked', 'checked');
					break;
				case "checkbox":
					if (_.isString(val)) val = parseInt(val);
					el.attr('checked', false);
					if (def) el.prop('defaultChecked', false);
					for (var i = 0; val != 0; i++, val >>= 1) {
						if (val & 1) {
							$flt = el.filter('[value="' + i + '"]').prop('checked', 'checked')
							if (def) $flt.prop('defaultChecked', 'checked');
						}
					}
					break;
				case "select-one":
					el.val(val);
					if (def) {
						$.each(el[0].options, function (idx, o) {
							o.defaultSelected = o.index == el[0].selectedIndex;
						});
					}
					break;
				case "time":
				{
					var v = ('0' + val.getHours()).slice(-2) + ':' + ('0' + val.getMinutes()).slice(-2) + ':' + ('0' + val.getSeconds()).slice(-2);
					el.val(v);
					if (def) el.prop('defaultValue', v);
				}
					break;
				default:
					el.val(val);
					if (def) el.prop('defaultValue', val);
			}
		}
	},
	template:      _.template($('#form-template').html()),
	tmpl:          _.template($('#form-bar-template').html()),
	render:        function () {
		this.$el.html(this.template(this.model.toJSON()));
		if (!this.data) {
			var name = this.model.get('id');
			var tbl  = schema.table(name);
			if (!tbl) return this;
			if (tbl instanceof Backbone.Collection) {
				this.tbl = tbl;
				this.row = 0;
				if (tbl.length) this.data = tbl.at(0);
			} else {
				if ('tbl' in this) delete this.tbl;
				if ('row' in this) delete this.row;
				this.data = tbl;
			}
			var $this = this;
			$.when(schema.tableFetch(name)).done(function () {
				console.log("fetch done");
				if ($this.tbl) {
					if ($this.tbl.length == 0) {
						$this.tbl.newRow();
					}
					$this.data = $this.tbl.at(0);
					$this.fill(true, true);
					events.trigger("buttonBlock:" + $this.model.id, "first", true);
					events.trigger("buttonBlock:" + $this.model.id, "prev", true);
				} else $this.onSync();
				$this.data.on('sync', $this.onSync, $this);
				$this.data.on('change', function () {
					$this.fill(false, false);
				}, $this);
			});
		}
		return this;
	},
	onSync:        function () {
		this.fill(true, true);
	},
	change:        function (pos) {
		if (!this.tbl) return;
		if (pos == this.row) return;
		if (pos < 0) return;
		if (pos >= this.tbl.length) return;
		this.data.off('sync', this.onSync);
		this.row  = pos;
		this.data = this.tbl.at(pos);
		events.trigger("buttonBlock:" + this.model.id, "first", pos == 0);
		events.trigger("buttonBlock:" + this.model.id, "prev", pos == 0);
		events.trigger("buttonBlock:" + this.model.id, "next", pos == this.tbl.length - 1);
		events.trigger("buttonBlock:" + this.model.id, "last", pos == this.tbl.length - 1);
		this.fill(true, true);
		this.data.on('sync', this.onSync, this);
	},
	event:         function (ev) {
		if (!_.isUndefined(ev)) {
			switch (ev) {
				case 'refresh':
					if (this.data) {
						var $this = this;
						events.trigger("buttonBlock:" + this.model.id, "refresh", true);
						this.data.fetch().always(function () {
							events.trigger("buttonBlock:" + $this.model.id, "refresh", false);
						});
					}
					break;
				case 'last':
					this.change(this.tbl.length - 1);
					break;
				case 'first':
					this.change(0);
					break;
				case 'next':
					this.change(this.row + 1);
					break;
				case 'prev':
					this.change(this.row - 1);
					break;
			}
		}
	}
});

var TableDisplay = Backgrid.Grid.extend({
	initialize: function (args) {
		if (args && args.model) {
			if (!args.columns) {
				var col = args.model.get('elems');
				if (this.selAll) col = [{name: "", cell: "select-row", headerCell: "select-all"}].concat(col);
				this.columns = args.columns = col;
			}
			if (!args.collection) {
				args            = _.extend(args, {collection: schema.table(args.model.id)});
				this.collection = args.collection;
			}
		}
		Backgrid.Grid.prototype.initialize.apply(this, arguments);
		var $this = this;
		this.$el.on('keydown', function (ev) {
			if (ev.keyCode == 46) {
				$this.event('del');
			} else if (ev.keyCode == 45) {
				$this.event('ins');
			}
		});
		this.listenTo(this.collection, "backgrid:selected", this.btnDel);
		this.listenTo(this.collection, "change", this.syncSave);
	},
	syncSave:   function () {
		this.collection.syncSave();
	},
	btnDel:     function () {
		events.trigger("buttonBlock:" + this.model.id, "del", this.getSelectedModels().length == 0);
	},
	className:  'backgrid table table-striped',
	tmpl:       _.template($('#table-bar-template').html()),
	event:      function (ev) {
		//console.log('event',ev);
		if (!_.isUndefined(ev)) {
			switch (ev) {
				case 'refresh':
				{
					var $this = this;
					events.trigger("buttonBlock:" + this.model.id, "refresh", true);
					this.collection.fetch().always(function () {
						events.trigger("buttonBlock:" + $this.model.id, "refresh", false);
					});
				}
					break;
			}
		}
	},
	render:     function () {
		var self       = this;
		var view       = Backgrid.Grid.prototype.render.apply(this);
		var paginator  = new Backgrid.Extension.Paginator({
			collection:              self.collection,
			renderMultiplePagesOnly: true
		});
		var fieldCount = self.model.get('elems').length;
		/**
		 * Check if the table is PLU then include the column with checkboxes
		 */
		if (self.model.get("id") == "PLU") {
			fieldCount++;
		}
		var pagination = paginator.render().$el;
		/**
		 * Check if the pagination isn't empty
		 */
		if (pagination.find('ul').length) {
			/**
			 * Create tfoot element and append to the table
			 * @type {*|jQuery|HTMLElement}
			 */
			var tfoot = $("<tfoot />");
			var tr    = $("<tr />");
			var td    = $("<td />").attr('colspan', fieldCount.toString()).addClass('backgrid-pagination-cell').append(pagination);
			tr.append(td);
			tfoot.append(tr);
			view.$el.find("thead").after(tfoot);
		}
		return view;
	},
});

var PLUTableDisplay = TableDisplay.extend({
	tmpl:       _.template($('#plu-table-bar-template').html()),
	selAll:     true,
	initialize: function (args) {
		TableDisplay.prototype.initialize.apply(this, arguments);
		if (args && args.model) {
			this.addToolbar = new ImpExView({model: {models: [args.model]}});
		}
	},
	event:      function (ev) {
		if (!_.isUndefined(ev)) {
			var $this = this;
			switch (ev) {
				case 'del':
					this.collection.deleteRows(this.getSelectedModels());
					break;
				case 'ins':
					this.collection.newRow();
					break;
				case 'del-all':
				{
					var $this = this;
					var opt   = {data: []}
					opt.error = function (resp) {
						$this.collection.trigger('error', $this.collection, resp, opt);
					};
					this.collection.sync('update', this.collection, opt).done(function () {
						$this.collection.reset();
					});
				}
					break;
				default:
					TableDisplay.prototype.event.call(this, ev);
			}
		}
	},
	remove:     function () {
		if (this.addToolbar) {
			this.addToolbar.remove();
			delete this.addToolbar;
			this.addToolbar = 0;
		}
		Backgrid.Grid.prototype.remove.call(this);
	}
});

var PLUFormDisplay = FormDisplay.extend({
	tmpl:       _.template($('#plu-form-bar-template').html()),
	initialize: function (args) {
		if (args && args.model) {
			this.addToolbar = new ImpExView({model: {models: [args.model]}});
		}
	},
	event:      function (ev) {
		if (!_.isUndefined(ev)) {
			var $this = this;
			switch (ev) {
				case 'del':
					if (this.tbl.length == 0) return;
					if (this.tbl.length == 1) {
						if (!this.data.isNew()) {
							this.event('ins');
							this.tbl.at(1).destroy();
						}
						return;
					}
					if (this.tbl.length == (this.row + 1)) {
						this.change(this.row - 1);
						this.tbl.at(this.tbl.length - 1).destroy();
						return;
					}
					this.change(this.row + 1);
					this.tbl.at(this.row - 1).destroy();
					return;
				case 'del-all':
				{
					var $this = this;
					var opt   = {data: []};
					opt.error = function (resp) {
						$this.collection.trigger('error', $this.collection, resp, opt);
					};
					this.tbl.sync('update', this.tbl, opt).done(function () {
						$this.tbl.reset();
						$this.event('ins');
					});
				}
					return;
				case 'ins':
					this.tbl.newRow();
					this.row += 1;
					this.change(0);
					break;
				default:
					FormDisplay.prototype.event.call(this, ev);
			}
		}
	},
	remove:     function () {
		if (this.addToolbar) {
			this.addToolbar.remove();
			delete this.addToolbar;
			this.addToolbar = 0;
		}
		Backbone.View.prototype.remove.call(this);
	}
});

var LogoView = Backbone.View.extend({
	tagName: 'div',
	img:     new Image(),
	imgX:    0,
	imgY:    0,
	width:   0,
	height:  0,
	mX:      -1,
	mY:      -1,
	events:  {
		'click #ld':        'loadECR',
		'click #lf':        'clickFile',
		'change #picFile':  'loadFile',
		'click #sd':        'save',
		'click #clr':       'clear',
		'click #gr':        'grayscale',
		'click #bw':        'blackWhite',
		'mousedown canvas': 'mdown',
		'mouseup canvas':   'mup',
		'mousemove canvas': 'mmove',
		'change #edge':     'changeBW'
	},

	changeBW: function (e) {
		e.preventDefault();
		this.toBW(this.$('#edge').val());
		return false;
	},
	toBW:     function (c) {
		var pixels = this.context.getImageData(0, 0, this.width, this.height);
		for (var i = 0, n = this.grpix.data.length; i < n; i += 4) {
			var gr             = (c > this.grpix.data[i]) ? 0 : 255;
			pixels.data[i + 0] = gr;
			pixels.data[i + 1] = gr;
			pixels.data[i + 2] = gr;
		}
		this.context.putImageData(pixels, 0, 0);
	},

	mdown:         function (e) {
		e.preventDefault();
		this.mX = e.pageX;
		this.mY = e.pageY;
		return false;
	},
	mup:           function (e) {
		e.preventDefault();
		this.mX       = -1;
		this.mY       = -1;
		this.edittype = this.imgtype;
		this.updateWarning();
		return false;
	},
	mmove:         function (e) {
		e.preventDefault();
		if (this.mX == -1) return;
		this.imgX += e.pageX - this.mX;
		this.imgY += e.pageY - this.mY;
		this.mX = e.pageX;
		this.mY = e.pageY;
		this.context.fillRect(0, 0, this.width, this.height);
		this.context.drawImage(this.img, this.imgX, this.imgY);
		return false;
	},
	loadECR:       function (e) {
		e.preventDefault();
		if (this.img.src != '/cgi/logo.bmp') {
			this.clicked = $(e.target);
			this.clicked.button('loading');
			this.img.src = '/cgi/logo.bmp';
		}
		return false;
	},
	clickFile:     function (e) {
		e.preventDefault();
		this.$('#picFile').click();
		return false;
	},
	loadFile:      function (e) {
		e.preventDefault();
		this.clicked     = $('#lf');
		this.clicked.button('loading');
		var selectedFile = e.target.files[0];
		var reader       = new FileReader();
		this.img.title   = selectedFile.name;
		var $this        = this;
		reader.onload    = function (event) {
			$this.img.src = event.target.result;
		};
		reader.readAsDataURL(selectedFile);
		return false;
	},
	save:          function (e) {
		e.preventDefault();
		if (this.width % 8) {
			this.error("BMP width not supported");
			return;
		}
		var btn         = $('#sd');
		btn.button('loading');
		var bmpInBytes  = Math.floor(this.width / 8);
		var bmpRowWidth = bmpInBytes;
		if (bmpInBytes % 4) bmpRowWidth = 4 * (Math.floor(bmpInBytes / 4) + 1);
		var data   = new ArrayBuffer(0x3E + bmpRowWidth * this.height);
		var view   = new DataView(data);
		var bytes  = new Uint8Array(data);
		view.setUint16(0, 0x4D42, true);
		view.setUint32(2, 0x3E + bmpRowWidth * this.height, true);
		view.setUint32(6, 0, true);
		view.setUint32(0x0A, 0x3E, true);
		view.setUint32(0x0E, 40, true);
		view.setUint32(0x12, this.width, true);
		view.setInt32(0x16, -this.height, true);
		view.setUint16(0x1A, 1, true);
		view.setUint16(0x1C, 1, true);
		view.setUint32(0x1E, 0, true);
		view.setUint32(0x22, bmpRowWidth * this.height, true);
		view.setUint32(0x26, 3708, true);
		view.setUint32(0x2A, 3708, true);
		view.setUint32(0x2E, 0, true);
		view.setUint32(0x32, 0, true);
		view.setUint32(0x36, 0, true);
		view.setUint32(0x3A, 0xFFFFFF, true);
		var pixels = this.context.getImageData(0, 0, this.width, this.height);
		for (var row = 0; row < this.height; row++) {
			for (var b = 0; b < bmpRowWidth; b++) {
				var bt = 0;
				if (b < bmpInBytes) {
					for (var i = 0; i < 8; i++) {
						var offs = (row * this.width + b * 8 + i) * 4;
						var val  = pixels.data[offs];
						if ((val != pixels.data[offs + 1]) || (val != pixels.data[offs + 2])) {
							this.error("The image is not monochrome");
							btn.button('reset');
							return;
						}
						if ((val != 0) && (val != 255)) {
							//console.log('bit value ', val);
							this.error("The image is not monochrome");
							btn.button('reset');
							return;
						}
						if (val == 255) bt |= 1 << (7 - i);
					}
				} else bt = 0xFF;
				view.setUint8(0x3E + row * bmpRowWidth + b, bt);
			}
		}
		var $this = this;
		$.ajax({
			method:      'POST',
			url:         '/cgi/logo.bmp',
			contentType: 'image/bmp',
			processData: false,
			data:        bytes
		}).done(function (resp) {
			if (resp.err) {
				$this.error('error', resp.err);
			}
		}).fail(function () {
			console.log('error');
		}).always(function () {
			btn.button('reset');
		});
		//console.log(bytes);
		return false;
	},
	clear:         function (e) {
		e.preventDefault();
		this.img.src  = '';
		this.context.fillRect(0, 0, this.width, this.height);
		this.edittype = "none";
		this.imgtype  = "none";
		return false;
	},
	grayscale:     function (e) {
		e.preventDefault();
		var pixels = this.context.getImageData(0, 0, this.width, this.height);
		for (var i = 0, n = pixels.data.length; i < n; i += 4) {
			var gr             = gray(pixels.data[i], pixels.data[i + 1], pixels.data[i + 2]);
			pixels.data[i]     = gr;
			pixels.data[i + 1] = gr;
			pixels.data[i + 2] = gr;
		}
		this.context.putImageData(pixels, 0, 0);
		this.edittype = "gray";
		this.updateWarning();
		return false;
	},
	blackWhite:    function (e) {
		e.preventDefault();
		this.grpix = this.context.getImageData(0, 0, this.width, this.height);
		var tbl    = new Array();
		for (var i = 0; i < 256; i++) tbl.push(0);
		for (var i = 0, n = this.grpix.data.length; i < n; i += 4) tbl[this.grpix.data[i]] += 1;
		var min       = 1;
		var max       = 255;
		var s         = 0;
		while (min < max) {
			if (s > 0) {
				s -= min * tbl[min];
				min++;
			} else {
				s += (255 - max) * tbl[max];
				max--;
			}
		}
		this.toBW(min);
		this.edittype = "bw";
		this.updateWarning();
		this.$('#edge').val(min);
		return false;
	},
	error:         function (msg) {
		this.$('.alert-warning').remove();
		var err = this.$(".alert");
		if (err.length == 0) {
			err = $('<div class="alert alert-danger" role="alert"></div>');
			this.$el.append(err);
		}
		err.html(t(msg));
	},
	updateWarning: function () {
		this.$('.alert-danger').remove();
		if (this.edittype == "bw") {
			this.$(".alert").remove();
			return;
		}
		var warn = this.$(".alert");
		if (warn.length == 0) {
			warn = $('<div class="alert alert-warning" role="alert"></div>');
			this.$el.append(warn);
		}
		var msg = "<b>This is color image.</b> Convert it to grayscale before save to device.";
		if (this.edittype == "gray") {
			msg = "<b>This is grayscale image.</b> Convert it to black&white before save to device and adjust the white point if nessesary.";
			this.$('#gr').tooltip('hide');
			this.$('#bw').tooltip('show');
		} else {
			this.$('#bw').tooltip('hide');
			this.$('#gr').tooltip('show');
		}
		warn.html(msg);
	},
	initialize:    function () {
		_.bindAll(this, 'render', 'imageInit', 'imageLoad', 'mdown', 'mup', 'mmove');
		this.img.onload = this.imageInit;
		this.rendered   = false;
		this.loaded     = false;
		if (this.img.src.endsWith('/cgi/logo.bmp')) {
			this.imageInit();
		} else this.img.src = '/cgi/logo.bmp';
	},
	imageInit:     function () {
		this.width      = this.img.width;
		this.height     = this.img.height;
		this.img.onload = this.imageLoad;
		this.loaded     = true;
		if (this.rendered) this.render();
	},
	imageLoad:     function () {
		this.imgX = 0;
		this.imgY = 0;
		this.context.drawImage(this.img, 0, 0);
		if (this.clicked) {
			this.clicked = this.clicked.button('reset');
			this.clicked = false;
		}
		this.edittype = this.imageType();
		this.imgtype  = this.edittype;
		this.updateWarning();
	},
	imageType:     function () {
		var ret    = "bw";
		var pixels = this.context.getImageData(0, 0, this.width, this.height);
		for (var i = 0, n = pixels.data.length; i < n; i += 4) {
			if ((pixels.data[i] != pixels.data[i + 1]) || (pixels.data[i] != pixels.data[i + 2])) return "color";
			if ((pixels.data[i] != 0) && (pixels.data[i] != 255)) {
				console.log(pixels.data[i]);
				ret = "gray";
			}
		}
		return ret;
	},
	render:        function () {
		this.rendered = true;
		if (!this.loaded) return this;
		var root               = $('<div class="row"></div>');
		this.$el.html("");
		this.$el.append(root);
		var canvas             = $('<canvas>').attr({width: this.width, height: this.height})
			.addClass('img-thumbnail').css("margin", "10px");
		this.context           = canvas[0].getContext('2d');
		this.context.fillStyle = "white";
		root.append($('<div class=" col-md-3"></div>').append(canvas));
		this.imageLoad();
		var tmpl               = ['<button type="button" id="', '" class="btn btn-', '" data-loading-text="',
			'" data-toggle="tooltip" title="', '"><span class="glyphicon glyphicon-', '" aria-hidden="true"></span> ', '</button>'];
		var cnt                = 0;
		root.append(
			_.reduce([
					['ld', 'default', t('Wait...'), t('Load logo from ECR'), 'open', t('Load ECR')],
					['lf', 'default', t('Wait...'), t('Import logo from file'), 'open-file', t('Load File')],
					['sd', 'default', t('Wait...'), t('Save logo to ECR'), 'save', t('Save')],
					['clr', 'default', t('Wait...'), t('Clear logo content'), 'remove', t('Clear')],
					['gr', 'default', t('Wait...'), t('Grayscale colorful logo'), 'picture', t('Gray')],
					['bw', 'default', t('Wait...'), t('Black&white grayscale logo'), 'adjust', t('B&W')]],
				function (memo, el) {
					var txt = "";
					if ((cnt % 2) == 0) txt = '<div class="btn-group col-md-3" role="group">';
					txt += _.flatten(_.zip(tmpl, el)).join('');
					if (cnt % 2) txt += '</div>';
					cnt++;
					return memo + txt;
				}, ""
			)
		);
		var inpf               = $('<input id="picFile" type="file"/>').css('display', "none");
		root.append(inpf);
		this.$el.append('<div class="row">' +
			'<div class="col-md-12"><input id="edge" type="range" min="1" max="254" data-toggle="tooltip" title="' +
			t('Adjust white point of image') +
			'"/></div></div><a href="#" class="btn btn-default" role="button"><span class="glyphicon glyphicon-arrow-left" aria-hidden="true">' +
			'</span> ' + t('Back') + '</a>');
		this.$('button').css("margin-top", '15px');
		this.$('[data-toggle="tooltip"]').tooltip({placement: 'bottom'});
		return this;
	}
});

var TableContainer = Backbone.View.extend({
	tagName:        'div',
	events:         {
		'click .navbar-brand': 'toggleData',
		'click button':        'click',
		'click .btnfrm':       'initFormClick',
		'click .btntbl':       'initTableClick'
	},
	table:          TableDisplay,
	form:           FormDisplay,
	initialize:     function (args) {
		if (args && args.table) this.table = args.table;
		if (args && args.form) this.form = args.form;
		this.initView(((args && (args.tblMode || args.model.get('tbl')))) ? "table" : "form");
		this.showContent                 = args && args.show;
		this.listenTo(events, 'errblk', this.errBlk);
		this.errBlk(true);
	},
	errBlk:         function (on) {
		if (on) {
			this.listenTo(schema.table(this.model.id), 'error', this.errorAlert);
			this.listenTo(schema.table(this.model.id), 'err', this.errAlert);
		} else {
			this.stopListening(schema.table(this.model.id), 'error');
			this.stopListening(schema.table(this.model.id), 'err');
		}
	},
	insertAlert:    function (msg) {
		this.$el.children(":first-child").after(formatAlert(msg));
	},
	errorAlert:     function (src, resp, opt) {
		this.insertAlert(xhrError(resp));
	},
	errAlert:       function (src, msg, field) {
		if (field) {
			msg = field + ': ' + msg;
		}
		if (src.collection) {
			msg = src.id + ': ' + msg;
		}
		this.insertAlert(msg);
	},
	click:          function (ev) {
		if (this.content) this.content.event($(ev.currentTarget).data('ev'));
	},
	initView:       function (view) {
		if (view == "form") view = new this.form({model: this.model});
		if (view == "table") view = new this.table({model: this.model});
		if (this.content) {
			this.content.remove();
			delete this.content;
		}
		if (this.toolbar) {
			this.toolbar.remove();
			delete this.toolbar;
		}
		this.content = view;
		this.toolbar = new Toolbar({tmpl: view.tmpl, hideTbl: !this.model.get('tbl'), form: this.model.id});
	},
	initFormClick:  function () {
		this.initView("form");
		this.render();
		this.toggleData();
		this.showData();
	},
	initTableClick: function () {
		this.initView("table");
		this.render();
		this.toggleData();
		this.showData();
	},
	render:         function () {
		this.delegateEvents();
		this.$el.html('');
		var header = $('<nav class="navbar navbar-default" id="' + this.model.get('id') + '" role="navigation">');
		header.html('<div class="navbar-brand col-md-3">' + this.model.get('name') + '</div>');
		$('.navbar-brand', header).css('cursor', 'pointer');
		this.toolbar.delegateEvents();
		header.append(this.toolbar.render().$el);
		if (this.content.addToolbar) {
			this.content.addToolbar.delegateEvents();
			var $e = this.content.addToolbar.render().$el;
			$e.addClass("navbar-right");
			$e.css('margin', '5px');
			header.append($e);
		}
		this.$el.append(header);
		if (this.showContent) {
			this.showContent = false;
			this.toggleData();
		}
		return this;
	},
	toggleData:     function () {
		this.showContent = !this.showContent;
		if ($('.navbar', this.$el).siblings().length) {
			this.content.$el.toggle();
			this.showContent = false;
		} else {
			var $this = this;
			$.when(schema.tableFetch(this.model.get('id'))).done(function () {
				/**
				 * Find the primary key of the model
				 */
				var key = $this.model.get('key');
				if (_.isUndefined(key)) {
					key = 'id';
				}
				var view = $this.content.render();
				if (_.isFunction(view.sort)) {
					view = view.sort(key, "ascending");
				}
				$this.$el.append(view.$el)
			});
		}
	},
	showData:       function () {
		this.showContent = false;
		this.content.$el.show();
	},
	remove: function () {
		this.content.remove();
	}
});

var GroupTable = PageScreen.extend({
	initialize: function (args) {
		var models   = schema.tableGroup(args.group);
		this.leftCol = new TableLeftColumn({model: {models: models}});
		this.page    = new CollectionView({
			model:     new Backbone.Collection(models),
			tagName:   'div',
			className: 'col-md-10',
			elemView:  TableContainer
		});
	},
	remove: function () {
		this.page.remove();
	}
});
//</editor-fold>


//<editor-fold desc="----------------------Log Elem-----------------------------------">
var Log = Backbone.View.extend({
	tagName:  'pre',
	template: _.template($('#log').html()),
	render:   function () {
		this.$el.html(this.template());
		this.insertPoint = this.$('#logtxt');
		return this;
	},
	add:      function (to) {
		if ($('#logtxt').length) return;
		$(to).append(this.render().$el);
		this.progs = {};
		this.$('button.close').click(_.bind(this.close, this));
		$.ajax({url: "cgi/log?p=0", context: this}).done(function (t) {
			if (t == "OK") {
				events.on('tick', this.tick, this);
			}
		});
	},
	working:  function () {
		return insertPoint;
	},
	/*events:{
	 'click button.close':'close'
	 },*/
	close:    function () {
		events.off('tick', this.tick);
		this.remove();
		this.insertPoint = 0;
		this.progs       = {};
		$.get('/cgi/log?p=1');
	},
	tick:     function () {
		$.ajax({url: "cgi/log", context: this}).done(function (t) {
			if (t == "--END--") { // log end
				this.close();
				return;
			} else if (t != "--EMPTY--") {
				var lines = t.split('\n');
				for (line in lines) {
					line = lines[line];
					if (line.length == 0) continue;
					if (line.indexOf("-PS-") == 0) { //progress bar start
						var ln = line.substr(4, line.length).split('\t');
						while (ln.length < 5) ln.push("");
						this.progAdd(ln[0], ln[1], ln[2], ln[3], ln[4]);
					} else if (line.indexOf("-PM-") == 0) { //progress bar message
						var ln = line.substr(4, line.length).split('\t');
						while (ln.length < 3) ln.push("");
						this.progDo(ln[0], ln[1], ln[2]);
					} else {
						this.str(line);
					}
				}
			}
		});
	},
	str:      function (line) {
		if (!this.insertPoint) return;
		this.insertPoint.append(line + '<br>');
		this.insertPoint.scrollTop(this.insertPoint.prop('scrollHeight'));
	},
	progAdd:  function (id, p, sz, v, m) {
		if (!this.insertPoint) return;
		if (!v) v = "0";
		if (!this.progs[id]) {
			var prog       = document.createElement("progress");
			this.progs[id] = prog;
			this.insertPoint.append(p, prog, $("span"), $("<br>"));
			prog.max       = sz;
			this.insertPoint.scrollTop(this.insertPoint.prop('scrollHeight'));

		}
		this.progDo(id, v, m);
	},
	progDo:   function (id, v, m) {
		if (!this.insertPoint) return;
		var prog = this.progs[id];
		if (prog) {
			prog.value = v;
			if (m) prog.nextSibling.innerHTML = m;
			if (prog.value == prog.max) {
				prog.parentElement.removeChild(prog);
				delete this.progs[id];
			}
		}
	}
});

//</editor-fold>

var InterfacesTable = Backbone.View.extend({
	template: _.template($('#interfaces-tbl').html()),
	render:   function () {
		this.$el.html(this.template({models: networkCell}));
		return this;
	}
});

