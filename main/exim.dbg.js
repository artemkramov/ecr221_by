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

var ImportReport = Backbone.View.extend({
    template:      _.template($("#import-report").html()),
    events:        {
        "click .spoiler-trigger": "toggleSpoiler"
    },
    render:        function () {
        this.$el.html(this.template({
            models: this.model
        }));
        this.delegateEvents();
        return this;
    },
    toggleSpoiler: function (e) {
        $(e.target).parent().next().collapse('toggle');
    }
});

var ImportProgress = Backbone.View.extend({

    /**
     * Template of the view
     */
    template: _.template($("#progress-bar-block").html()),

    /**
     * Modal view
     */
    modal: {},

    /**
     * Initialize all listeners
     * @param options
     */
    initialize:        function (options) {
        this.listenTo(events, ImportModel.errorLabel, this.stop);
        this.listenTo(events, 'clickDlg', this.stop);
        this.listenTo(this.model, 'change', this.render);
        this.modal = options.modal;
    },
    /**
     * Events of the view
     */
    events:            {
        "click .btn-import-stop": "onImportStop"
    },
    /**
     * Render view
     * @returns {ImportProgress}
     */
    render:            function () {
        this.$el.html(this.template({
            model: this.model
        }));
        this.modal.set({
            body: this.$el
        });
        this.delegateEvents();
        return this;
    },
    /**
     * Stop import process
     * @param e
     */
    stop:              function (e) {
        ImportModel.isRunning = false;
        ImportModel.isError   = true;
    },
    /**
     * Finish method
     */
    finish:            function () {
        this.stop(true, true);
    },
    /**
     * Build import report
     */
    buildImportReport: function () {
        var importReport   = new ImportReport();
        importReport.model = ImportModel.history;
        this.$el.find('.import-report').empty().append(importReport.render().$el);
    },
    /**
     * Events of the force import stop
     * @param e
     */
    onImportStop:      function (e) {
        console.log("stop");
        ImportModel.isRunning = false;
        this.buildImportReport();
    }
});

var ImportDisplay = Backbone.View.extend({
    tagName:      'ul',
    className:    'list-group',
    initialize:   function () {
        this.listenTo(events, 'importError', this.addError);
    },
    errTmpl:      _.template($('#impex-err').html(), 0, {variable: 'd'}),
    addError:     function (err) {
        this.$el.append(this.errTmpl(err));
    },
    fatalButtons: function () {
        return {cancel: ['Close', 'danger', 1]};
    },
    rncButtons:   function () {
        return {
            retry:  'Retry',
            next:   ['Next', 'primary'],
            cancel: ['Close', 'danger']
        };
    },
    ncButtons:    function () {
        return {
            next:   ['Next', 'primary'],
            cancel: ['Close', 'danger']
        };
    },
    rcButtons:    function () {
        return {
            retry:  'Retry',
            cancel: ['Close', 'danger']
        };
    },
    doneButtons:  function () {
        return {cancel: ['Done', 'primary', 1]};
    }
});

var ExportModel = function () {
    return {
        /**
         * The counter of the popup window
         */
        counter: 0,

        /**
         * Flag which shows if the export is in progress
         */
        isRunning: false,

        /**
         * Modal window
         */
        modal: false,

        /**
         * Model for the progress bar
         */
        modelPercentage: {},

        /**
         * Progress bar view
         */
        viewProgressBar: false,

        /**
         * Return
         */
        isReturn: false,

        /**
         * Export delimiter for CSV files
         */
        exportDelimiter: ";",

        /**
         * Reset percentage
         */
        resetPercentage: function () {
            this.modelPercentage.set('id', this.getId());
            this.modelPercentage.set('name', t("Fetching data..."));
            this.modelPercentage.set('percentage', 0);
        },

        /**
         * Start the export
         * @param models
         * @returns {*}
         */
        run:             function (models) {
            this.isRunning       = true;
            var self             = this;
            var deferred         = new jQuery.Deferred();
            /**
             * Write the fetching of the all models to the promises
             * @type {Array|*}
             */
            var promises         = _.map(models, function (model) {
                return schema.tableFetchIgnoreCache(model.get('id'));
            });
            this.modal           = new Modal();
            if (_.isEmpty(this.modelPercentage)) {
                this.modelPercentage = new PercentageModel();
            }
            delete this.viewProgressBar;
            this.resetPercentage();
            this.counter++;
            this.modal.set({
                header: t("Export"),
            });
            self.viewProgressBar = new ImportProgress({
                model: self.modelPercentage,
                modal: self.modal
            });
            self.viewProgressBar.render();
            this.modal.show();
            /**
             * Wait until the promises will be finished
             */
            $.when.apply($, promises).done(function () {
                var zip = new JSZip();
                self.setProgressData(0);
                _.each(models, function (model) {
                    /**
                     * If the flag is running than export all related records of the model
                     */
                    if (self.isRunning) {
                        self.setProgressData(0);
                        self.modelPercentage.set("name", model.get('name'));
                        var data      = [];
                        var modelData = schema.tableIgnoreCache(model.get('id'));
                        if (modelData.models) {
                            var length = modelData.models.length;
                            modelData.models.forEach(function (item, index) {
                                /**
                                 * Update the progress bar and push data
                                 * @type {number}
                                 */
                                var percentage = Math.round(100 * index / length);
                                self.setProgressData(percentage);
                                data.push(item.attributes);
                            });
                        }
                        else {
                            data.push(modelData.attributes);
                        }

                        self.setProgressData(100);
                        var csv       = Papa.unparse(data, {
                            delimiter: self.exportDelimiter
                        });
                        zip.file(model.get('id') + ".csv", '\uFEFF' + csv);
                    }
                });
                if (self.isRunning) {
                    if (self.isReturn) {
                        deferred.resolve(zip);
                    }
                    else {
                        zip.generateAsync({type: "blob"})
                            .then(function (content) {
                                // see FileSaver.js
                                self.stop();
                                self.saveAs(content, t("Export") + ".zip");
                            });
                    }
                }
                deferred.resolve();
            }).fail(function () {
                deferred.reject();
            });
            return deferred.promise();
        },
        /**
         * Stop export mechanism
         */
        stop:            function () {
            ExportModel.isRunning = false;
            ExportModel.modal.hide();
        },
        /**
         * Save the zip file
         * @param blob
         * @param fileName
         */
        saveAs:          function (blob, fileName) {
            saveAs(blob, fileName);
        },
        /**
         * Get the ID of the export item
         * @returns {string}
         */
        getId:           function () {
            return "export-" + this.counter.toString();
        },
        /**
         * Set the progress data
         * @param data
         */
        setProgressData: function (data) {
            this.modelPercentage.set("percentage", data);
        }
    };
}();

var ImportModel = (function () {

    return {
        /**
         * The counter of the popup window
         */
        counter: 0,

        /**
         * Modal window
         */
        modal: false,

        /**
         * Check if the import is running
         */
        isRunning: false,

        /**
         * Allowed extensions of file to upload
         */
        allowedExtensions: ['zip'],

        /**
         * Related view
         */
        view: false,

        /**
         * Error label for the import
         */
        errorLabel: "importError",

        /**
         * History of the import process
         */
        history: [],

        /**
         * Model for the progress bar
         */
        modelPercentage: {},

        /**
         * Progress bar view
         */
        viewProgressBar: false,

        /**
         * Check if error was during the import
         */
        isError: false,

        /**
         * Default import delimiter for CSV parsing
         */
        importDelimiter: ";",

        /**
         * Reset percentage
         */
        resetPercentage:            function () {
            this.modelPercentage.set('id', this.getId());
            this.modelPercentage.set('name', t("Fetching data..."));
            this.modelPercentage.set('percentage', 0);
        },
        /**
         * Initialize basic parameters
         */
        initModel:                  function () {
            if (!this.view) {
                this.view = new ImportDisplay();
            }
            if (_.isEmpty(this.modelPercentage)) {
                this.modelPercentage = new PercentageModel();
            }
            delete this.viewProgressBar;
            this.resetPercentage();
            this.history = [];
            this.isError = false;
        },
        /**
         * Start the import
         * @param files
         */
        start:                      function () {
            var self             = this;
            self.modal           = new Modal();
            self.counter++;
            self.modal.set({
                header: t("Import")
            });
            self.viewProgressBar = new ImportProgress({
                model: self.modelPercentage,
                modal: self.modal
            });
            self.viewProgressBar.render();
            self.modal.show();
            self.isRunning       = true;
        },
        /**
         * Parse the input file
         * @param fileList
         */
        parseFile:                  function (fileList) {
            var self = this;
            this.initModel();
            self.loadFile(fileList).done(function (zipFileLoaded) {
                self.start();
                self.processZipRecursive(zipFileLoaded.files, 0, Object.keys(zipFileLoaded.files));
            });
        },
        /**
         * Send the collection data to the server continuously
         * @param collections
         * @param modelData
         * @param index
         * @param deferred
         */
        processCollectionRecursive: function (collections, modelData, index, deferred) {
            var self       = this;
            var collection = collections[index];
            var result     = collection.syncSaveSynchronize();
            if (_.isObject(result)) {
                result.done(function () {
                    /**
                     * Update progress bar with current percentage
                     * @type {number}
                     */
                    var percentage = Math.round(100 * (index + 1) / collections.length);
                    self.setProgressData(percentage);
                    if (collections.length > index + 1) {
                        return self.processCollectionRecursive(collections, modelData, ++index, deferred);
                    }
                    else {
                        if (!modelData.error) {
                            modelData.result = t("Finished");
                            self.history.push(modelData);
                        }
                        return deferred.resolve();
                    }
                }).fail(function (response) {
                    if (!_.isEmpty(response.err) && self.isRunning) {
                        var message = schema.error(response.err.e);
                        if (!_.isUndefined(response.err.f)) {
                            message += ' - ' + response.err.f;
                        }
                        if (!_.isUndefined(response[response.key])) {
                            message += ', ' + response.key + ' ' + response[response.key];
                        }
                        modelData.result = message;
                        modelData.error  = true;
                        self.history.push(modelData);
                        events.trigger(self.errorLabel, message);
                        return deferred.resolve();
                    }
                });
            }
        },
        /**
         * Process the all files continuously
         * @param files
         * @param fileCounter
         * @param fileKeys
         */
        processZipRecursive:        function (files, fileCounter, fileKeys) {
            var self = this;
            self.processTable(files[fileKeys[fileCounter]]).then(function () {
                fileCounter++;
                if (self.isRunning && fileCounter < fileKeys.length) {
                    self.processZipRecursive(files, fileCounter, fileKeys);
                }
                else {
                    self.viewProgressBar.buildImportReport();
                    var progressBar      = self.viewProgressBar.$el.find('.progress-bar');
                    var progressBarClass = 'progress-bar-' + (!self.isError ? 'success' : 'danger');
                    $(progressBar).removeClass('active').addClass(progressBarClass);
                    console.log("finish");
                }
            });
        },
        /**
         * Process the data of the file in archive
         * @param backupFile
         * @returns {*}
         */
        processTable:               function (backupFile) {
            var deferred = $.Deferred();
            if (_.isUndefined(backupFile)) {
                return deferred.resolve();
            }
            var tableName = backupFile.name.match(/^.*?([^\\/.]*)[^\\/]*$/)[1];
            var self      = this;

            /**
             * Init schema data
             */
            var modelData = schema.get(tableName);
            if (self.isRunning && modelData) {
                backupFile.async("uint8array").then(function (csvBuffer) {
                    window.csvBuffer = csvBuffer;
                    var bb = new Blob([csvBuffer]);
                    var f = new FileReader();
                    f.onload = function(e) {
                        var csvText = e.target.result;
                        /**
                         * Parse CSV data
                         */
                        self.parseCSV(csvText, backupFile.name).done(function (parsedData) {
                            /**
                             * Wait until we fetch all records from the table
                             * @type {*[]}
                             */
                            var promises = [
                                schema.tableFetchIgnoreCache(tableName)
                            ];
                            $.when.apply($, promises).done(function () {
                                /**
                                 * Reset the progress bar and set the current import model
                                 */
                                self.setProgressData(0);
                                self.modelPercentage.set("name", schema.get(tableName).get("name"));
                                var options   = {
                                    schema: modelData,
                                    urlAdd: schema.url + '/' + tableName
                                };
                                options.model = TableModel.extend(options);
                                var tableData = schema.tableIgnoreCache(tableName);

                                self.processData(parsedData, modelData, tableData, options).done(function () {
                                    return deferred.resolve();
                                });
                            });
                        }).fail(function () {
                            return deferred.resolve();
                        });
                    };

                    f.readAsText(bb, "windows-1251");

                });
            }
            else {
                return deferred.resolve();
            }
            return deferred.promise();
        },
        /**
         * Import the data of the given model
         * @param parsedData
         * @param modelData
         * @param tableData
         * @param options
         * @returns {*}
         */
        processData:                function (parsedData, modelData, tableData, options) {
            var deferred    = $.Deferred();
            var self        = this;
            var modelDataHistory = {
                id:    modelData.get("name"),
                error: false
            };
            modelData.error = false;
            /**
             * If the model data - table data
             */
            if (modelData && modelData.attributes.tbl) {
                var idAttribute = modelData.attributes.key ? modelData.attributes.key : 'id';
                /**
                 * Split the data to chunks
                 * @type {number}
                 */
                var n           = 30;
                var lists       = _.groupBy(parsedData, function (element, index) {
                    return Math.floor(index / n);
                });
                lists           = _.toArray(lists);
                options.mode    = "";
                var collections = [];
                _.each(lists, function (list, index) {
                    var collection = new TableCollection(false, options);
                    _.each(list, function (item) {
                        if (self.isRunning) {
                            /**
                             * Check if the item is in the current collection
                             */
                            collection.url = options.urlAdd;
                            var model      = new Backbone.Model(item);
                            var row        = self.findRowInCollection(model, tableData.models, idAttribute);
                            model.isNew    = function () {
                                return (typeof row == 'undefined');
                            };
                            if (row && _.isObject(row) && !_.isEqual(row.attributes, model.attributes)) {
                                model.hasChanged        = function () {
                                    return true;
                                };
                                model.changedAttributes = function () {
                                    return model.attributes;
                                };
                            }
                            collection.push(model);
                        }

                    });
                    collections.push(collection);
                });
                self.processCollectionRecursive(collections, modelDataHistory, 0, deferred);
            }
            /**
             * If the model - form
             */
            else {
                options.urlRoot = '/cgi/tbl';
                if (modelData && modelData.attributes.key) {
                    options.idAttribute = modelData.attributes.key;
                }
                var model = new TableModel({id: modelData.get('id')}, options);
                var data  = !_.isEmpty(parsedData) ? parsedData[0] : false;
                if (_.isObject(data)) {
                    delete data['id'];
                    var promise = model.save(data, {
                        patch: true, silent: true, wait: true, parse: false,
                        error: function (model, response) {
                            modelDataHistory.error = true;
                            events.trigger(self.errorLabel, t("Uncaught error"));
                            return deferred.resolve();
                        }
                    });
                    $.when(promise).then(function () {
                        self.setProgressData(100);
                        var response = $.parseJSON(promise.responseText);
                        if (_.isObject(response) && response.err) {
                            var errorMessage = schema.error(response.err.e);
                            if (!_.isUndefined(response.err.f)) {
                                errorMessage += " - " + response.err.f;
                            }
                            modelDataHistory.result = errorMessage;
                            modelDataHistory.error  = true;
                            self.history.push(modelDataHistory);
                            events.trigger(self.errorLabel, errorMessage);
                        }
                        else {
                            modelDataHistory.result = t("Finished");
                            self.history.push(modelDataHistory);
                        }
                        return deferred.resolve();
                    });
                }
            }
            return deferred.promise();
        },
        /**
         * Load zip file and get its content
         * @param fileList
         * @returns {*}
         */
        loadFile:                   function (fileList) {
            var deferred   = $.Deferred();
            var file       = fileList[0];
            var fileReader = new FileReader();
            var extension  = file.name.substring(file.name.lastIndexOf('.') + 1);
            if (_.indexOf(this.allowedExtensions, extension) >= 0) {
                var zipFileLoaded = new JSZip();
                fileReader.onload = function (fileLoadedEvent) {
                    /**
                     * Read the zip file
                     */
                    zipFileLoaded.loadAsync(fileLoadedEvent.target.result).then(function (zip) {
                        return deferred.resolve(zipFileLoaded);
                    });
                };
                fileReader.readAsArrayBuffer(file);
            }
            else {
                noty({
                    text: t("Not correct file format."),
                    type: 'error'
                });
                events.trigger(this.errorLabel, t("Not correct file format."));
                return deferred.reject();
            }
            return deferred.promise();
        },
        /**
         * Parse CSV text to
         * @param csvText
         * @param fileName
         * @returns {*}
         */
        parseCSV:                   function (csvText, fileName) {

            var deferred = $.Deferred();
            csvText      = csvText.replace(/^\s+|\s+$/g, '');

            var parsedData = Papa.parse(csvText, {
                header:         true,
                delimiter:      this.importDelimiter,
                skipEmptyLines: true,
                encoding:       "windows-1251"
            });

            if (!_.isEmpty(parsedData.errors)) {
                var errorCollection = [
                    fileName + ":"
                ];
                var maxErrorLength  = 3;
                /**
                 * Collect all errors (max lines - maxErrorLength) to the string
                 */
                _.each(parsedData.errors, function (item) {
                    if (maxErrorLength > errorCollection.length) {
                        var message = t(item.message);
                        if (typeof item.row != 'undefined') {
                            message += " - " + t("row") + " " + item.row;
                        }
                        errorCollection.push(message);
                    }
                });
                var errorMessage    = errorCollection.join("<br />");
                var modelData       = {
                    id:     fileName,
                    result: errorMessage,
                    error:  true
                };
                this.history.push(modelData);
                events.trigger(this.errorLabel, errorMessage);
                return deferred.reject();
            }
            else {
                return deferred.resolve(parsedData.data);
            }
            return deferred.promise();
        },
        /**
         * Get the ID of the popup
         * @returns {string}
         */
        getId:                      function () {
            return "import-" + this.counter.toString();
        },
        /**
         * Get the progress block
         * @returns {*|jQuery|HTMLElement}
         */
        getProgressBlock:           function () {
            var id = ImportModel.getId();
            return $("#" + id.toString());
        },
        /**
         * Set the progress data
         * @param data
         */
        setProgressData:            function (data) {
            this.modelPercentage.set("percentage", data);
        },
        /**
         * Find the row on the collection
         * @param row
         * @param models
         * @param idAttribute
         * @returns {*|{}}
         */
        findRowInCollection:        function (row, models, idAttribute) {
            var condition          = {};
            condition[idAttribute] = row[idAttribute];
            return _.find(models, function (model) {
                return model.attributes[idAttribute] == row.attributes[idAttribute];
            });
        },
        /**
         * Stop import mechanism
         */
        stop:                       function () {
            ImportModel.isRunning = false;
        }
    };

})();

var PercentageModel = Backbone.Model.extend({
    defaults: {
        id:         ImportModel.getId(),
        name:       "",
        percentage: 0
    }
});