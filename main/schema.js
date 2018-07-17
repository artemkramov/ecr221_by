/**
 * Created by Andrew on 27.06.2014.
 */

var Schema = Backbone.Collection.extend({
	url:           '/cgi/tbl',
	initialize:    function () {
		this.cache = {};
		this.noCache = {};
	},
	tableIgnoreCache:      function (name) {
		return this.noCache[name];
	},
	table:         function (name) {
		if (name in this.cache) return this.cache[name];
		var ret = this.get(name);
		if (ret instanceof Object) {
			var addr = '/cgi/tbl';
			var key  = ret.get('key');
			var opt;
			if (ret.get('tbl')) {
				opt = {schema: ret};
				if (key) opt.idAttribute = key;
				var m            = TableModel.extend(opt);
				this.cache[name] = new TableCollection(false, {model: m, url: addr + '/' + name});
			} else {
				opt = {schema: ret, urlRoot: addr};
				if (key) opt.idAttribute = key;
				this.cache[name] = new TableModel({id: name}, opt);
			}
			return this.cache[name];
		}
		return false;
	},
	tableFetchIgnoreCache: function (name) {
		var address = '/cgi/tbl';
		var model   = this.get(name);
		var key     = model.get('key');
		var options;
		if (model.get('tbl')) {
			options = {schema: model};
			if (key) options.idAttribute = key;
			var m              = TableModel.extend(options);
			this.noCache[name] = new TableCollection(false, {model: m, url: address + '/' + name, mode: ""});
			return this.noCache[name].fetch({reset: true});
		} else {
			options = {schema: model, urlRoot: address};
			if (key) options.idAttribute = key;
			this.noCache[name] = new TableModel({id: name}, options);
			return this.noCache[name].fetch({silent: true});
		}
	},
	tableFetch:    function (name) {
		if (!(name in this.cache)) this.table(name);
		if (name in this.cache) {
			var tbl = this.cache[name];
			if (tbl instanceof Backbone.Collection) {
				//if ((tbl.length==0) || _.isEmpty(tbl.at(0).id)) return tbl.fetch();
				if (tbl.length == 0) return tbl.fetch({reset: true});
			} else {
				if (_.size(tbl.attributes) < 3) return tbl.fetch({silent: true});
			}
			return true;
		}
		return false;
	},
	CSVTable:      function (name, inf, fname) {
		var ret = new jQuery.Deferred();
		var t   = this.tableFetch(name);
		if (!t) {
			events.trigger('importError', {msg: "Unknown table", tbl: name, file: fname});
			ret.reject();
			return ret.promise();
		}
		if (inf.length < 3) {
			events.trigger('importError', {msg: "Empty table", tbl: name, file: fname});
			ret.reject();
			return ret.promise();
		}
		var $this = this;
		$.when(t).fail(function (xhr, status, thrown) {
			events.trigger('importError', {msg: "Get table: " + xhrError(xhr) + ' ' + thrown, tbl: name, file: fname});
			ret.reject();
			return ret.promise();
		}).done(function () {
			var tbl     = $this.table(name);
			var cols    = inf.shift().split('\t');
			var sch     = $this.get(name);
			var key     = sch.get('key') || "id";
			var schCols = _.chain(sch.get('elems')).map(function (col) {
				return col.name;
			}).union([key]).value();
			var unkCol  = _.difference(cols, schCols);
			if (unkCol.length) { // some columns invalid
				events.trigger('importError', {msg: "Unknown column(s): " + unkCol.join(), tbl: name, file: fname});
				ret.reject();
				return ret.promise();
			} else {
				var err   = false;
				var idIdx = _.indexOf(cols, key);
				if (tbl instanceof Backbone.Collection) { // Collection tbl
					if (idIdx < 0) { // no id column in import file
						events.trigger('importError', {msg: "No id column", tbl: name, file: fname});
						ret.reject();
						return ret.promise();
					}
					if (inf[inf.length - 1] == "") inf.pop();
					cols.splice(idIdx, 1);
					var ok = false;
					_.each(inf, function (value) {
						value = value.split('\t');
						if (value.length != (cols.length + 1)) return;
						var fw  = {};
						fw[key] = value[idIdx];
						$this.fixIn(sch, fw);
						//var row = tbl.findWhere(fw);
						var row   = tbl.get(fw[key]);
						var rowok = true;
						var o;
						if (row) {
							value.splice(idIdx, 1);
							o = _.object(cols, value);
							$this.fixIn(sch, o);
							$this.listenTo(row, 'invalid', function (m, e) {
								err   = true;
								rowok = false;
								events.trigger('importError', {msg: e, tbl: name, file: fname, row: row.id});
							});
							row.set(o);
							$this.stopListening(row, 'invalid');
							if (rowok) ok = true;
						} else if (sch.get('insertable')) {
							var idVal = value.splice(idIdx, 1)[0];
							o         = _.object(cols, value);
							o[key]    = idVal;
							$this.fixIn(sch, o);
							// !!! invalid data handling
							$this.listenTo(tbl, 'invalid', function (m, e) {
								err   = true;
								rowok = false;
								events.trigger('importError', {msg: e, tbl: name, file: fname, row: idVal});
							});
							tbl.add(o);
							$this.stopListening(row, 'invalid');
							if (rowok) {
								var m = tbl.get(o[key]);
								if (m) m.newModel = true;
								ok = true;
							}
						} else {
							err = true;
						}
					});
					if (err) {
						ret.reject(ok ? name : false);
					} else {
						ret.resolve(name);
					}
					//tbl.syncSave();
				} else { // Form tbl
					if (idIdx >= 0) { // no id column in import file
						cols.splice(idIdx, 1);
						inf = inf[0].split('\t');
						inf.splice(idIdx, 1);
					} else {
						inf = inf[0].split('\t');
					}
					var o = _.object(cols, inf);
					$this.fixIn(sch, o);
					// !!! invalid data handling
					$this.listenTo(tbl, 'invalid', function (m, e) {
						err = true;
						events.trigger('importError', {msg: e, tbl: name, file: fname});
					});
					tbl.set(o);
					$this.stopListening(tbl, 'invalid');
					if (err) {
						ret.reject();
					} else {
						ret.resolve(name);
					}
					//console.log("set",tbl);
					//tbl.save(tbl.changedAttributes,{patch:true})
				}
			}
		});
		return ret.promise();
	},
	tableCSV:      function (name) {
		if (name in this.cache) {
			var ret = name + '\r\n';
			var tbl = this.cache[name];
			var sch = this.get(name);
			var ro  = _.map(_.filter(sch.get('elems'), function (c) {
				return ('editable' in c) && !c.editable;
			}), function (e) {
				return e.name
			});
			if (tbl instanceof Backbone.Collection) {
				if (tbl.length == 0) return "";
				ro = _.without(ro, sch.get('key') || 'id');
				ret += _.keys(tbl.at(0).omit(ro)).join('\t') + '\r\n';
				tbl.each(function (v) {
					ret += _.values(v.omit(ro)).join('\t') + '\r\n';
				});
			} else {
				if (_.size(tbl.attributes) < 3) return "";
				var els = tbl.omit(ro);
				ret += _.keys(els).join('\t') + '\r\n';
				ret += _.values(els).join('\t') + '\r\n';
			}
			return ret;
		}
		return "";
	},
	tableGroup:    function (prefix) {
		return this.filter(function (el) {
			return el.get('prefix') == prefix;
		});
	},
	load:          function (callback) {
		var $this = this;
		//var dsc = Backbone.Model.extend({urlRoot:'/'});
		//this.descr = new dsc({id:'desc'});
		this.fetch({ cache: false }).done(function () {
			$.get('/desc?' + new Date().getTime()).done(function (desc) {
				$.get('/desc-ext?' + new Date().getTime()).done(function (ext) {
					$.extend(true, desc, ext);
				}).always(function () {
					$this.descr = new Backbone.Model();
					$this.descr.set(desc);
					var l       = $this.descr.get(navigator.language);
					if (l) $this.lang = navigator.language;
					if ((typeof(Storage) !== "undefined") && localStorage && (localStorage.lang)) {
						var ln = $this.descr.get(localStorage.lang);
						if (ln) {
							l          = ln;
							$this.lang = localStorage.lang;
						}
					}
					//console.log('this.descr',$this.descr);
					if (!l) {
						l = $this.descr.get(document.documentElement.lang);
						if (l) $this.lang = document.documentElement.lang;
					}
					if (!l) {
						l          = $this.descr.get('def');
						$this.lang = l;
					}
					if (!l) {
						l          = $this.descr.get('en');
						$this.lang = 'en';
					}
					if (typeof l === 'string') {
						l = $this.descr.get(l);
					}
					if (l) {
						$this.tr = l;
					}
					$this.langs = _.without($this.descr.keys(), 'id', 'def', 'regex');

					/**
					 * Set some temp extra options for test purpose
					 *
					 */
					$this.descr.get("ru").tbl.Pay.Param.labels = [
						{"val":0,"label":"разрешить вид оплаты"},
						{"val":1,"label":"возможна сдача"},
						{"val":2,"label":"нужен ввод кода клиента"},
						{"val":4,"label":"безналичная оплата"},
						{"val":5,"label":"возможна выплата"},
						{"val":6,"label":"оплата платежной картой"}
					];
					$this.descr.get("en").tbl.Pay.Param.labels = [
						{"val":0,"label":"allow payment type"},
						{"val":1,"label":"delivery possible"},
						{"val":2,"label":"need to enter the client code"},
						{"val":4,"label":"cashless payment"},
						{"val":5,"label":"payment is possible"},
						{"val":6,"label":"payment by credit card"}
					];

					$this.descr.get("ru").tbl.Flg.PrintOff.labels = [
						{"val":0,"label":"выключить принтер в режиме тренировки"},
						{"val":1,"label":"печать заголовка после предыдущего чека"},
						{"val":2,"label":"включение обрезчика"},
						{"val":3,"label":"использовать полную обрезку"},
						{"val":5,"label":"печать на бумаге 57,5 мм"}
					];
					$this.descr.get("en").tbl.Flg.PrintOff.labels = [
						{"val":0,"label":"turn off the printer in workout mode"},
						{"val":1,"label":"print the title after the previous check"},
						{"val":2,"label":"turn on trimming"},
						{"val":3,"label":"use full trim"},
						{"val":5,"label":"printing on paper 57.5 mm"}
					];

					$this.descr.get("ru").tbl.Flg.Flg1.labels = [
						{"val":0,"label":"следить за запасом товара"},
						{"val":2,"label":"контролировать количество в весовых товарах"},
						{"val":4,"label":"сортировка в отчетах по товарам"},
						{"val":8,"label":"разрешить нулевую цену"},
						{"val":9,"label":"удалять товары c запасом 0 после Z1"},
						{"val":10,"label":"удалять все товары после Z1"}
					];
					$this.descr.get("en").tbl.Flg.Flg1.labels = [
						{"val":0,"label":"keep track of the stock of goods"},
						{"val":2,"label":"control quantity in weight products"},
						{"val":4,"label":"sorting in reports by goods"},
						{"val":8,"label":"allow a zero price"},
						{"val":9,"label":"delete items with a margin of 0 after Z1"},
						{"val":10,"label":"delete all products after Z1"}
					];

					$this.descr.get("ru").tbl.Flg.Flg3.labels = [
						{"val":0,"label":"печатать код товара"},
						{"val":1,"label":"печатать название отдела"},
						{"val":2,"label":"печатать номер отдела"},
						{"val":4,"label":"не выводить Z1 отчет без инкассации всех наличных денег"},
						{"val":7,"label":"разделять продажи в чеке пустой строкой"},
						{"val":8,"label":"не печатать лого клиента"},
						{"val":15,"label":"печатать сумму налога после каждой продажи"},
						{"val":16,"label":"печатать сумму из БЭП вначале дневного отчета"},
						{"val":17,"label":"выделять накопительные итоги широким шрифтом (при использовании бумаги 80мм)"},
						{"val":18,"label":"отчет по состоянию сейфа в расширенном виде (при использовании бумаги 80мм)"}
					];
					$this.descr.get("en").tbl.Flg.Flg3.labels = [
						{"val":0,"label":"print product code"},
						{"val":1,"label":"print department name"},
						{"val":2,"label":"print department number"},
						{"val":4,"label":"do not print Z1 report without cash collection"},
						{"val":7,"label":"divide sales in check with an empty line"},
						{"val":8,"label":"do not print client's logo"},
						{"val":15,"label":"print the amount of tax after each sale"},
						{"val":16,"label":"print the amount from the BEP at the beginning of the daily report"},
						{"val":17,"label":"allocate cumulative results in a wide font (when using 80mm paper)"},
						{"val":18,"label":"report on the state of the safe in expanded form (when using paper 80mm)"}
					];

					$this.descr.get("ru").tbl.TCP.AdptFlg.labels = [
						{"val":0,"label":"10Mbps"},
						{"val":1,"label":"100Mbps"},
						{"val":2,"label":"1000Mbps"},
						{"val":3,"label":"полный дуплекс"},
						{"val":4,"label":"автоматический режим"},
						{"val":5,"label":"разрешить MDI/MDI-X"},
						{"val":8,"label":"отключить keep alive. (Для работы с Linux)"}
					];
					$this.descr.get("en").tbl.TCP.AdptFlg.labels = [
						{"val":0,"label":"10Mbps"},
						{"val":1,"label":"100Mbps"},
						{"val":2,"label":"1000Mbps"},
						{"val":3,"label":"full duplex"},
						{"val":4,"label":"auto mode"},
						{"val":5,"label":"enable MDI / MDI-X"},
						{"val":8,"label":"disable keep alive. (For working with Linux)"}
					];

					$this.each(function (model) {
						specialTableSchema.forEach(function (requiredFields) {
							if (model.get("id") == requiredFields.id) {
								var elements  = model.get("elems");
								var newFields = [];
								elements.forEach(function (field) {
									var isNeeded = false;
									_.each(requiredFields.fields, function (requiredField) {
										var name = _.isObject(requiredField) ? requiredField.name : requiredField;
										if (name == field.name) {
											isNeeded = true;
											if (_.isObject(requiredField)) {
												for (var property in requiredField) {
													field[property] = requiredField[property];
												}
											}
										}
									});
									if (isNeeded) {
										newFields.push(field);
									}
								});
								model.set("elems", newFields);
							}
						});
					});
					$this.each($this.fixupTable, $this);
					if (callback) callback();
				});
			}).always(function () {

			});
			/*$this.descr.fetch().done(function(){

			 var l = $this.descr.get(navigator.language);
			 if (l) $this.lang = navigator.language;
			 if ((typeof(Storage) !== "undefined")&&localStorage&&(localStorage.lang)) {
			 var ln = $this.descr.get(localStorage.lang);
			 if (ln) {
			 l = ln;
			 $this.lang = localStorage.lang;
			 }
			 }
			 //console.log('this.descr',$this.descr);
			 if (!l) {
			 l = $this.descr.get(document.documentElement.lang);
			 if (l) $this.lang = document.documentElement.lang;
			 }
			 if (!l) {
			 l = $this.descr.get('def');
			 $this.lang = l;
			 }
			 if (!l) {
			 l = $this.descr.get('en');
			 $this.lang = 'en';
			 }
			 if (typeof l === 'string') { l = $this.descr.get(l);
			 }
			 if (l) { $this.tr = l;
			 }
			 $this.langs = _.without($this.descr.keys(),'id','def','regex');
			 }).always(function() {
			 $this.each($this.fixupTable,$this);
			 if (callback) callback();
			 });*/
		});
	},
	switchLang:    function (l) {
		var tmp = this.descr.get(l);
		if (tmp) {
			this.lang = l;
			this.tr   = tmp;
			if (typeof(Storage) !== "undefined") localStorage.lang = l;
		}
	},
	regex:         function (id) {
		var list = (this.descr && this.descr.get('regex'));
		return (list && list[id]) || id;
	},
	parseInTypes:  ["time", "number", "summ", "percent", "qty"],
	parseIn:       function (type, val) {
		switch (type.type) {
			case "time":
			{
				if (_.isNumber(val)) return new Date(val * 1000);
				if (_.isString(val)) {
					var v = Date.parse(val);
					if (v) return new Date(v);
					return val;
				}
			}
				break;
			case "summ":
			case "percent":
			case "qty":
			case "number":
				if (_.isString(val)) {
					return (type.step && (type.step < 1)) ? parseFloat(val) : parseInt(val);
				}
				break;
		}
		return val;
	},
	fixIn:         function (tbl, obj) {
		this.fix(tbl, obj, tbl.parseCol, this.parseIn);
	},
	fix:           function (tbl, obj, col, parse) {
		if (col) _.each(_.intersection(_.keys(obj), col), function (e) {
			obj[e] = parse(this.typeCol(tbl, e), obj[e]);
		}, this);
	},
	parseOutTypes: ["number", "time", "summ", "percent", "qty"],
	parseOut:      function (type, val) {
		switch (type.type) {
			case "summ":
			case "percent":
			case "qty":
			case "number":
				if (_.isString(val)) {
					return (type.step && (type.step < 1)) ? parseFloat(val) : parseInt(val);
				}
				break;
			case "time":
			{
				if (_.isDate(val)) return val.getTime() / 1000;
				if (_.isString(val)) {
					var v = Date.parse(val);
					if (v) return v / 1000;
					return val;
				}
			}
				break;
		}
		return val;
	},
	fixOut:        function (tbl, obj) {
		this.fix(tbl, obj, tbl.syncCol, this.parseOut);
	},
	typeCol:       function (tbl, field) {
		return _.find(tbl.get('elems'), function (el) {
			return el.name == field;
		});
	},
	error:         function (id, params) {
		var txt = this.tr && this.tr.err && this.tr.err[id];
		if (txt) {
			if (params) return vsprintf(txt, params);
			return txt;
		}
		return id;
	},
	parseError:    function (err, callback) {
		var parseErrorInner = function (e, cb) {
			var msg;
			if (_.isString(e)) e = {e: e};
			if (!_.has(e, 'e')) return;
			if (_.has(e, 'p')) {
				msg = schema.error(e.e, e.p);
			} else {
				msg = schema.error(e.e);
			}
			cb(msg, e.f);
		};
		if (_.isArray(err)) {
			_.each(err, _.partial(parseErrorInner, _, callback));
		} else {
			parseErrorInner(err, callback);
		}
		/*if (_.isString(err)) { parseErrorInner({e: err},callback);
		 } else if (_.isArray(err)) { _.each(err, _.partial(parseErrorInner,_,callback));
		 } else if (_.isObject(err)) { parseErrorInner(err,callback);
		 }*/
	},
	str:           function (id) {
		return (this.tr && this.tr.str && this.tr.str[id]) || id;
	},
	fixupTable:    function (tbl) {
		var id = tbl.id;
		if (!id) return;
		var t     = this.tr && this.tr.tbl && this.tr.tbl[id];
		tbl.set('name', (t && t.label) || id);
		var pcin  = [];
		var pcout = [];
		_.each(tbl.get('elems'), function (el) {
			if (t) {
				var desc = t[el.name];
				if (desc) {
					el.label = desc.label;
					if (desc.help) el.help = desc.help;
					if (desc.labels) el.labels = desc.labels;
					if (desc.placeholder) el.placeholder = desc.placeholder;
				}
			}
			if (!el.label) el.label = el.name;
			if (_.indexOf(this.parseInTypes, el.type) >= 0) pcin.push(el.name);
			if (_.indexOf(this.parseOutTypes, el.type) >= 0) pcout.push(el.name);
			switch (el.type) { // table type conversion
				case 'number':
					el.cell = 'integer';
					return;
				case 'text':
					el.cell = 'string';
					return;
				case 'date':
					el.cell = 'date';
					return;
				case 'url':
					el.cell = 'uri';
					return;
				case 'select-one':
				case 'radio':
					el.cell = Backgrid.SelectCell.extend({
						optionValues: _.map(extractLabels(el.labels), function (v, k) {
							return [v, k];
						}),
						formatter:    RadioFormatter
					});
					return;
				case 'checkbox':
					el.cell = Backgrid.SelectCell.extend({
						optionValues: _.map(extractLabels(el.labels), function (v, k) {
							return [v, Math.pow(2, k)];
						}),
						multiple:     true,
						formatter:    CheckFormatter
					});
					return;
				case 'summ':
					el.type = 'number';
					el.cell = 'number';
					el.step = 0.01;
					return;
				case 'qty':
					el.type = 'number';
					el.cell = el.cell = Backgrid.NumberCell.extend({decimals: 3});
					el.step = 0.001;
					return;
				case 'percent':
					el.type = 'number';
					el.cell = Backgrid.PercentCell.extend({decimals: 2});
					el.step = 0.01;
					return;
				case 'time':
					el.cell = "time";
					return;
			}
			/*if (el.cell=='int') {
			 el.cell = Backgrid.IntegerCell.extend({ orderSeparator: '' });
			 }*/
		}, this);
		if (pcin.length) tbl.parseCol = pcin;
		if (pcout.length) tbl.syncCol = pcout;
	}
});

var RadioFormatter       = function () {
};
RadioFormatter.prototype = new Backgrid.SelectFormatter();
_.extend(RadioFormatter.prototype, {
	toRaw: function (formattedData, model) {
		if (!_.isArray(formattedData)) return formattedData;
		return formattedData[0];
	}
});

var CheckFormatter       = function () {
};
CheckFormatter.prototype = new Backgrid.SelectFormatter();
_.extend(CheckFormatter.prototype, {
	toRaw: function (d, model) {
		return _.isArray(d) ? _.reduce(d, function (memo, num) {
			return memo + Number(num);
		}, 0) : (_.isNull(d) ? 0 : d);
	}
});

var specialTableSchema = [];

/*var specialTableSchema = [{
	id:     "Pay",
	fields: [
		"id", {
			name: "Param", type: "checkbox-multiple", cell: "integer"
		},
		"Name",
		"MaxSum"
	]
},
	{
		id:     "Flg",
		fields: [
			"id", {
				name: "PrintOff", type: "checkbox-multiple", cell: "integer"
			},
			{
				name: "Flg1", type: "checkbox-multiple", cell: "integer"
			},
			"Feed",
			{
				name: "Flg3", type: "checkbox-multiple", cell: "integer"
			}
		]
	},
	{
		id:     "TCP",
		fields: [
			"id", "Addr", "Gate", "Mask", "DNS", "MAC",
			{
				name: "AdptFlg", type: "checkbox-multiple", cell: "integer"
			},
			"AuthType"
		]
	}
];*/