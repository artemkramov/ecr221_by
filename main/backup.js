/**
 * The layout view for the backup page
 */
var BackupScreenView = Backbone.View.extend({
	template: _.template($("#backup-block").html()),
	render:   function () {
		var self       = this;
		this.$el.empty();
		/**
		 * Load export and import view and append them
		 * to the current view
		 */
		var exportView = new ExportView();
		var importView = new ImportView();
		var leftColumn = new LeftColumn({
			model: {
				models: []
			}
		});
		this.$el.append(this.template());
		this.$el.find("#export").append(exportView.render().$el);
		this.$el.find("#import").append(importView.render().$el);
		this.$el.find("#sidebar-left").append(leftColumn.render().$el);
		this.delegateEvents();
		return this;
	}
});

/**
 * Parent subview for export and import blocks
 * in which we define the common properties and functions
 */
var BackupSubView = Backbone.View.extend({

	/**
	 * Bind the method to the error event firing
	 */
	initialize:        function () {
		this.listenTo(events, this.errorTag, this.onErrorEvent);
	},
	/**
	 * Show alert error message
	 * @param message
	 */
	onErrorEvent:      function (message) {
		var alert = new Alert({
			model: {
				type:    "danger",
				message: message
			}
		});
		this.clearMessageBlock().append(alert.render().$el);
	},
	/**
	 * Clear error block
	 * @returns {*}
	 */
	clearMessageBlock: function () {
		return this.$el.find(".error-block").empty();
	},
	/**
	 * Toggle all checkboxes in the row
	 * when clicking on the checkbox in the table header
	 * Binding between them is done via attributes data-type and data-toggle
	 * @param e
	 */
	onToggleClick:     function (e) {
		var checkbox = $(e.target);
		var group    = checkbox.data('toggle').toString();
		checkbox.closest('table').find('[data-type=' + group + ']').prop('checked', checkbox.prop('checked'));
	},
});

/**
 * Export view implementation
 */
var ExportView = BackupSubView.extend({
	/**
	 * Template for the view
	 */
	template: _.template($("#backup-export-block").html()),

	/**
	 * Html with the list of the all available models to export
	 */
	backupList: "",

	/**
	 * Models which are not allowed to export
	 */
	excludeModels: [
		'Logo', 'Time', 'SysLog'
	],

	/**
	 * All events related to this view
	 */
	events: {
		"click .btn-export":       "onButtonExportClick",
		"click .toggle-all":       "onToggleClick",
		"click .btn-run-export":   "onButtonRunExportClick",
		"keyup #export-filename":  "onFilenameChange",
		"keyup #export-delimiter": "onDelimiterChange"
	},

	/**
	 * Error tag for the event triggering
	 */
	errorTag: "exportError",

	/**
	 * Default zip archive filename
	 */
	backupFilename: "",

	/**
	 * Default export delimiter
	 */
	backupDelimiter: ";",

	/**
	 * Path for the logo upload
	 */
	urlLogo: "/cgi/logo.bmp",

	/**
	 * Render content
	 * @returns {ExportView}
	 */
	render:                 function () {
		var self = this;
		this.delegateEvents();
		this.$el.empty();
		this.$el.append(this.template({
			backupList:      self.backupList,
			filename:        self.backupFilename,
			exportDelimiter: self.backupDelimiter
		}));
		return this;
	},
	/**
	 * Get all available models and build the export table
	 * @param e
	 */
	onButtonExportClick:    function (e) {
		var self        = this;
		var models      = _.filter(schema.models, function (model) {
			return (!_.isUndefined(model.syncCol)) && (_.indexOf(self.excludeModels, model.get('id')) == -1);
		});
		var logoItem    = new Backbone.Model();
		logoItem.set('id', 'Logo');
		logoItem.set('name', t('Logo'));
		models.unshift(logoItem);
		var compiled    = _.template($("#backup-export-list").html());
		this.backupList = compiled({
			models: models
		});
		this.render();
		$(".btn-run-export").removeAttr("disabled");
	},
	/**
	 * Go through all models and make the ZIP archive report
	 * @param e
	 */
	onButtonRunExportClick: function (e) {
		var models         = [];
		var self           = this;
		var isLogoExported = false;
		$(".table-backup-list").find(".model-checkbox").each(function () {
			if ($(this).prop('checked')) {
				if ($(this).data('id') == 'Logo') {
					isLogoExported = true;
				}
				else {
					models.push(schema.get($(this).data('id')));
				}
			}
		});
		if (!_.isEmpty(models) || isLogoExported) {
			this.clearMessageBlock();
			ExportModel.isReturn = true;
			if (!_.isEmpty(self.backupDelimiter)) {
				ExportModel.exportDelimiter = self.backupDelimiter;
			}
			ExportModel.run(models).done(function (zip) {
				self.exportLogo().done(function (response) {
					if (isLogoExported) {
						zip.file("logo.bmp", response, {binary: true});
					}
					zip.generateAsync({type: "blob"})
						.then(function (content) {
							ExportModel.stop();
							if (_.isEmpty(self.backupFilename)) {
								self.backupFilename = t("Backup");
							}
							ExportModel.saveAs(content, self.backupFilename + ".zip");
						});
				});

			});
		}
		else {
			events.trigger(this.errorTag, t("Choose at least 1 item"));
		}
	},
	/**
	 * Export the logo image
	 * @returns {*}
	 */
	exportLogo:             function () {
		var self         = this;
		var deferred     = $.Deferred();
		var xhr          = new XMLHttpRequest();
		xhr.responseType = 'blob';
		xhr.onload       = function () {
			var reader       = new FileReader();
			reader.onloadend = function () {
				deferred.resolve(reader.result);
			}
			reader.readAsBinaryString(xhr.response);
		};
		xhr.open('GET', self.urlLogo);
		xhr.send();

		return deferred.promise();
	},
	/**
	 * Update the current backup filename
	 * @param e
	 */
	onFilenameChange:       function (e) {
		this.backupFilename = $(e.target).val();
	},
	/**
	 * Update the current delimiter
	 * @param e
	 */
	onDelimiterChange:      function (e) {
		this.backupDelimiter = $(e.target).val();
	}
});


/**
 * Import view implementation
 */
var ImportView = BackupSubView.extend({
	/**
	 * Template for the view
	 */
	template: _.template($("#backup-import-block").html()),

	/**
	 * All selected CSV files for the import
	 */
	files: [],

	/**
	 * All selected certificated for the import
	 */
	certificates: [],

	/**
	 * Logo bmp file
	 */
	logo: undefined,

	/**
	 * Allowed extensions for the tables
	 */
	fileExtensions: ['csv'],

	/**
	 * Allowed extensions for the certificates
	 */
	certificateExtensions: ['p12', 'crt'],

	/**
	 * Allowed image extensions for the logo
	 */
	imageExtensions: ['bmp'],

	/**
	 * The list of the parsed files in the ZIP
	 */
	parsedFiles: [],

	/**
	 * Error message tag
	 */
	errorTag: "importError",

	/**
	 * Import model for the importing process
	 */
	importModel: false,

	/**
	 * Default import delimiter
	 */
	backupDelimiter: ";",

	/**
	 * Describe events
	 */
	events:               {
		"change #file-import":     "onFileChange",
		"click #file-import":      "onFileClick",
		"click .toggle-all":       "onToggleClick",
		"click .btn-import-run":   "onImportRunClick",
		"keyup #import-delimiter": "onDelimiterChange"
	},
	/**
	 * Render content
	 * @returns {ImportView}
	 */
	render:               function () {
		var self = this;
		this.delegateEvents();
		this.$el.empty().append(this.template({
			importDelimiter: self.backupDelimiter
		}));
		return this;
	},
	/**
	 * On the file change method
	 * @param e
	 */
	onFileChange:         function (e) {
		/**
		 * Clear all properties
		 */
		var self          = this;
		this.files        = [];
		this.certificates = [];
		this.parsedFiles  = [];
		this.logo         = undefined;
		this.clearFileList();
		var fileList      = e.target.files;
		this.getImportButton().attr("disabled", true);
		if (!fileList) {
			return;
		}
		/**
		 * Wait until the ZIP file will be loaded
		 */
		ImportModel.loadFile(fileList).done(function (zipFile) {
			/**
			 * Go through each file and parse it
			 * @type {Array}
			 */
			var promises = [];
			_.each(zipFile.files, function (file) {
				if (!file.dir) {
					promises.push(self.parseFile(file));
				}
			});
			/**
			 * Wait until the all files are build
			 * Than render the listview with the parsed data
			 */
			$.when.apply($, promises).then(function () {
				var listView = new ImportViewList({
					model: {
						parsedFiles: self.parsedFiles
					}
				});
				self.clearFileList().append(listView.render().$el);
				self.getImportButton().removeAttr("disabled");
			});
		});
	},
	/**
	 * Clear the file value on the click
	 * @param e
	 */
	onFileClick:          function (e) {
		e.target.value = "";
		this.clearFileList();
		this.getImportButton().attr("disabled", true);
		this.clearMessageBlock();
	},
	onImportError:        function (message) {
	},
	/**
	 * Get the import button DOM-element
	 * @returns {*}
	 */
	getImportButton:      function () {
		return this.$el.find(".btn-import-run");
	},
	/**
	 * Clear parsed file list
	 * @returns {*}
	 */
	clearFileList:        function () {
		return this.$el.find("#parsed-files-list").empty();
	},
	/**
	 * Parse the given file
	 * In the end of the method the object must be added to the parsed files array
	 * @param file
	 * @returns {*}
	 */
	parseFile:            function (file) {
		var tableName = file.name.match(/^.*?([^\\/.]*)[^\\/]*$/)[1];
		var extension = file.name.split('.').pop();
		var self      = this;
		var deferred  = $.Deferred();
		/**
		 * If the file is the database file
		 */
		if (_.indexOf(this.fileExtensions, extension) > -1) {
			/**
			 * If the name of the file doesn't match any table
			 * than push error
			 */
			if (_.isUndefined(schema.get(tableName))) {
				self.parsedFiles.push({
					file:  file,
					error: t("Table was not found")
				});
				return deferred.resolve();
			}
			else {
				file.async("string").then(function (csvText) {
					/**
					 * Try to parse the CSV file
					 * if the parsing isn't successfully done
					 * than push errors
					 */
					window.csvText      = csvText;
					csvText             = csvText.replace(/^\s+|\s+$/g, '');
					var parsedData      = Papa.parse(csvText, {
						header:         true,
						delimiter:      self.backupDelimiter,
						skipEmptyLines: true,
						encoding:       "windows-1251"
					});
					var errorMessage    = false;
					var maxErrorLength  = 5;
					var errorCollection = [];
					if (!_.isEmpty(parsedData.errors)) {
						_.each(parsedData.errors, function (item) {
							if (maxErrorLength > errorCollection.length) {
								var message = t(item.message);
								if (typeof item.row != 'undefined') {
									message += " - " + t("row") + " " + item.row;
								}
								errorCollection.push(message);
							}
						});
						//errorMessage = errorCollection.join("<br />");
					}
					self.parsedFiles.push({
						file:      file,
						error:     errorMessage,
						tableName: tableName
					});
					return deferred.resolve();
				});
			}
		}
		else {
			/**
			 * Check if the file extensions is supported by the import mechanism
			 * @type {boolean}
			 */
			var error = false;
			if (_.indexOf(_.union(this.certificateExtensions, this.fileExtensions, this.imageExtensions), extension) == -1) {
				error = t("Not correct file format.");
			}
			self.parsedFiles.push({
				file:  file,
				error: error
			});
			return deferred.resolve();
		}

		return deferred.promise();
	},
	/**
	 * Implementation of the import process
	 */
	onImportRunClick:     function () {
		var self          = this;
		this.files        = [];
		this.certificates = [];
		this.clearMessageBlock();
		this.$el.find(".model-checkbox").each(function () {
			if ($(this).prop("checked")) {
				var fileName  = $(this).data('id');
				var extension = self.getFileExtension(fileName);
				if (_.indexOf(self.fileExtensions, extension) > -1) {
					self.files.push(fileName);
				}
				if (_.indexOf(self.certificateExtensions, extension) > -1) {
					self.certificates.push(fileName);
				}
				if (_.indexOf(self.imageExtensions, extension) > -1) {
					self.logo = fileName;
				}
			}
		});
		if (_.isEmpty(_.union(self.files, self.certificates)) && _.isUndefined(self.logo)) {
			events.trigger(self.errorTag, t("Choose at least 1 item"));
		}
		else {
			ImportModel.initModel();
			if (!_.isEmpty(self.backupDelimiter)) {
				ImportModel.importDelimiter = self.backupDelimiter;
			}
			var files = [];
			_.each(self.parsedFiles, function (fileData) {
				if (_.indexOf(self.files, fileData.file.name) > -1) {
					files.push(fileData.file);
				}
			});
			ImportModel.start();
			self.importLogo().done(function () {
				ImportModel.processZipRecursive(files, 0, Object.keys(files));
			});
		}
	},
	/**
	 * Import logo from bmp file
	 * @returns {*}
	 */
	importLogo:           function () {
		var deferred = $.Deferred();
		var self     = this;
		if (!_.isUndefined(self.logo) && ImportModel.isRunning) {
			_.each(self.parsedFiles, function (fileData) {
				if (fileData.file.name == self.logo) {
					fileData.file.async("arraybuffer").then(function (bmpData) {
						var bytes     = new Uint8Array(bmpData);
						ImportModel.setProgressData(0);
						ImportModel.modelPercentage.set('name', t("Logo"));
						var modelData = {
							id:     t("Logo"),
							error:  false,
							result: t("Finished")
						};
						$.ajax({
							xhr:         function () {
								var xhr = new window.XMLHttpRequest();
								xhr.upload.addEventListener("progress", function (evt) {
									if (evt.lengthComputable) {
										var percentComplete = Math.round(evt.loaded * 100 / evt.total);
										ImportModel.setProgressData(percentComplete);
									}
								}, false);
								return xhr;
							},
							url:         "/cgi/logo.bmp",
							data:        bytes,
							type:        'post',
							processData: false,
							contentType: 'application/octet-stream',
						}).success(function () {
							ImportModel.history.push(modelData);
							return deferred.resolve();
						}).error(function () {
							var errorMessage      = t("Logo wasn't imported");
							modelData.error       = true;
							modelData.result      = errorMessage;
							ImportModel.history.push(modelData);
							ImportModel.isRunning = false;
							events.trigger(self.errorTag, errorMessage);
							return deferred.resolve();
						});
					});
				}
			})
		}
		else {
			return deferred.resolve();
		}
		return deferred.promise();
	},
	/**
	 * Import the certificates if they are available in the ZIP
	 * @returns {*}
	 */
	importCertificates:   function () {
		var self            = this;
		var deferred        = $.Deferred();
		var certificatesP12 = _.filter(self.certificates, function (fileName) {
			var extension = self.getFileExtension(fileName);
			return (extension == 'p12');
		});
		var certificatesCRT = _.filter(self.certificates, function (fileName) {
			var extension = self.getFileExtension(fileName);
			return (extension == 'crt');
		});
		this.importCertificateP12(certificatesP12).done(function () {
			self.importCertificateCRT(certificatesCRT).done(function () {
				return deferred.resolve();
			});
		});
		return deferred.promise();
	},
	/**
	 * Import SSL certificate
	 * @param certificatesCRT
	 * @returns {*}
	 */
	importCertificateCRT: function (certificatesCRT) {
		var self             = this;
		var deferred         = $.Deferred();
		var certificatesView = new CertificateBlock();
		/**
		 * If the certificate is available than import it
		 * Else skip it and go to the next stage of the import
		 */
		if (!_.isEmpty(certificatesCRT)) {
			var fileDataCRT = _.filter(self.parsedFiles, function (fileData) {
				return (fileData.file.name == certificatesCRT[0]);
			})[0];
			/**
			 * Read the file content and upload it to the server
			 */
			fileDataCRT.file.async("arraybuffer").then(function (contents) {
				var bytes     = new Uint8Array(contents);
				var modelData = {
					id:     fileDataCRT.file.name,
					error:  false,
					result: t("Finished")
				};
				certificatesView.uploadFileToServer("", certificatesView.urlSslCertificate, bytes).done(function (response) {
					if (parseInt(response.verify)) {
						ImportModel.history.push(modelData);
						return deferred.resolve();
					}
					else {
						events.trigger(self.errorTag, t("Certificate wasn't imported"));
						return deferred.fail();
					}
				}).fail(function () {
					events.trigger(self.errorTag, t("Uncaught error"));
					return deferred.fail();
				});
			});
		}
		else {
			return deferred.resolve();
		}
		return deferred.promise();
	},
	/**
	 * Import the p12 certificate from the ZIP
	 * @param certificatesP12
	 * @returns {*}
	 */
	importCertificateP12: function (certificatesP12) {
		var self     = this;
		var deferred = $.Deferred();
		/**
		 * If the certificate is available inside the zip than import it
		 * Else just resolve the method to continue the import process
		 */
		if (!_.isEmpty(certificatesP12)) {
			var fileDataP12 = _.filter(self.parsedFiles, function (fileData) {
				return (fileData.file.name == certificatesP12[0]);
			})[0];
			fileDataP12.file.async("binarystring").then(function (contents) {
				var modelData = {
					id:     fileDataP12.file.name,
					error:  false,
					result: t("Finished")
				};
				/**
				 * Try to parse the p12 file
				 */
				try {
					var p12Asn1          = forge.asn1.fromDer(contents);
					var password         = prompt(t("Enter your password", ""));
					var p12              = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
					var certificatesView = new CertificateBlock();
					certificatesView.p12 = p12;
					/**
					 * Wait until the private key and certificate are uploading
					 * @type {*|*[]}
					 */
					var promises         = certificatesView.getPromisesForUpload();
					$.when.apply($, promises).then(function (responseKey, responseCert) {
						var responses = [responseKey, responseCert];
						if (certificatesView.isResponseSuccess(responses)) {
							self.pushDataToHistory(modelData);
							return deferred.resolve();
						}
						else {
							var message = t("Certificate wasn't imported");
							events.trigger(self.errorTag, message);
							return deferred.fail();
						}
					});
				}
				catch (exception) {
					events.trigger(self.errorTag, t("Incorrect password"));
					return deferred.fail();
				}
			});
		}
		else {
			return deferred.resolve();
		}
		return deferred.promise();
	},
	/**
	 * Get the file extension
	 * @param fileName
	 * @returns {T}
	 */
	getFileExtension:     function (fileName) {
		return fileName.split('.').pop();
	},
	pushDataToHistory:    function (modelData) {
		ImportModel.history.push(modelData);
	},
	/**
	 * Update the current delimiter
	 * @param e
	 */
	onDelimiterChange:    function (e) {
		this.backupDelimiter = $(e.target).val();
	}

});

/**
 * The view for the parsed files from ZIP archive
 */
var ImportViewList = Backbone.View.extend({
	tagName:  'div',
	template: _.template($("#backup-import-list").html()),
	render:   function () {
		var self = this;
		this.delegateEvents();
		this.$el.empty();
		this.$el.append(this.template({
			files: self.model.parsedFiles
		}));
		return this;
	}
});

