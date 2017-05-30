var Firmware = (function () {

	/**
	 * Form for uploading of the hex file
	 * @type {string}
	 */
	var formHexUpload = "#form-hex-upload";

	/**
	 * Form for burning of the HEX file
	 * @type {string}
	 */
	var formHexBurn = "#form-firmware-upload";

	/**
	 * Panel with available software
	 * @type {string}
	 */
	var panelSoftware = ".panel-available-software";

	/**
	 * Row with the hex file
	 * @type {string}
	 */
	var rowSoftware = ".firmware-software-row";

	/**
	 * ID of the file
	 * @type {string}
	 */
	var fileHexUploadID = "file-hex";

	/**
	 * Content of the read file
	 * @type {string}
	 */
	var fileContent = "";

	/**
	 * Compressed byte array
	 * @type {Object}
	 */
	var currentBinaryData = {};

	/**
	 * Current status from HEX file
	 * @type {{}}
	 */
	var currentHexStatus = {};

	/**
	 * Templates for the status in the HEX file
	 * @type {{VERS: string, GUID: string, DESCR: string}}
	 */
	var templates = {
		"VERS":  "version",
		"GUID":  "guid",
		"DESCR": "description"
	};

	/**
	 * Device state (if online or offline)
	 * @type {boolean}
	 */
	var currentDeviceState = false;

	/**
	 * Check if the device is flashing now
	 * @type {boolean}
	 */
	var isFlashing = false;

	/**
	 * Block with flash controls
	 * @type {string}
	 */
	var blockFlash = ".block-flash";

	/**
	 * Check if the user is authorized
	 * @type {boolean}
	 */
	var isAuthorized = true;

	return {
		/**
		 * Init events
		 */
		init:                    function () {
			this.event();
		},
		/**
		 * Register events
		 */
		event:                   function () {

			var self = this;

			$(document).ready(function () {

				App.initDictionary();

				setInterval(function () {
					self.updateDeviceState();
				}, 2500);

				$(document).on("change", "#file-hex", function () {
					var promises      = [];
					fileContent       = "";
					currentBinaryData = {};
					currentHexStatus  = {};
					var deferred      = $.Deferred();
					promises.push(deferred);
					self.readFileData(deferred);
					$.when.apply($, promises).then(function () {
						self.parseHexFile(fileContent);
					});
				});

				$(document).on("submit", formHexUpload, function () {
					self.uploadHexFile(fileContent, currentHexStatus, currentBinaryData);
					return false;
				});

				$(document).on("submit", formHexBurn, function () {
					$("body").addClass("loading");
					Api.burnProcessor(function (response) {
						var result = Api.checkResponseArray([response]);
						App.pushResponse(result, App.getTranslation("Device programming is started...", "panel"));
						isFlashing = true;
						//$(blockFlash).addClass('active');
						$("body").removeClass("loading");
					});
					return false;
				});

				$(document).on("click", ".btn-flash-stop", function () {
					$(blockFlash).removeClass('active');
					self.updateDeviceState();
				});

				$(document).on("click", "#btn-logout", function () {
					Api.logout();
				});

				$(document).on("click", "#btn-upgrade", function () {
					var firmwareView = new FirmwareView();
					firmwareView.onFirmwareUpdateClick();
				});

				$(document).on("click", rowSoftware, function () {
					var path    = $(this).data('path') + '?v=' + (new Date()).getTime();
					var version = $(this).data('version');
					var message = App.getTranslation("Are you sure you want to upload version:") + " " + version + "?";
					if (confirm(message)) {
						$("body").addClass("uploading");
						var request                = Api.getFirmwareFromServer(path);
						request.onreadystatechange = function () {
							if (request.readyState == 4) {
								$("body").removeClass("uploading");
								if (request.status == 200) {
									var data = self.parseHexFile(request.responseText, true, true);
									if (data.isValid) {
										self.uploadHexFile(request.responseText, data.status, data.binaryData);
									}
								}
								else {
									App.pushMessage(App.getTranslation('Cannot upload the firmware'), 'error');
								}
							}
						}
					}
				});

				$(document).on("change", "#firmware-view-all", function () {
					var items = $(".firmware-software-row");
					if ($(this).prop('checked')) {
						$(items).addClass('visible');
					}
					else {
						$(items).removeClass('visible');
					}
				});

			});
		},
		/**
		 * Upload hex file to the server
		 * @param fileContent
		 * @param currentHexStatus
		 * @param currentBinaryData
		 */
		uploadHexFile:           function (fileContent, currentHexStatus, currentBinaryData) {
			$("body").addClass("loading");
			var self = this;
			_.defer(function () {
				var isValid            = self.parseHexFile(fileContent, true);
				if (!isValid) {
					$("body").removeClass("loading");
					return false;
				}
				$("body").removeClass("loading");
				var ajaxUpdateFirmware = Api.uploadFirmwareInfo(currentHexStatus);
				Api.updateProgressBar(0, App.getTranslation("Uploading the firmware..."));
				$("body").addClass("uploading");
				if (_.isObject(ajaxUpdateFirmware)) {
					$.when(ajaxUpdateFirmware).then(function (responseFirmware) {
						var result = Api.checkResponseArray([responseFirmware]);
						if (result.success) {
							var ajaxUploadHex = Api.uploadHexFile(currentBinaryData.data);
							$.when(ajaxUploadHex).then(function (responseHex) {
								result = Api.checkResponseArray([responseHex]);
								App.pushResponse(result, App.getTranslation("HEX file was uploaded successfully!", "panel"));
								self.updateCurrentStatus();
								$("body").removeClass("uploading");
							});
						}
						else {
							$("body").removeClass("loading");
							$("body").removeClass("uploading");
							App.pushMessage(App.getTranslation(result.error, "err"), "error");
						}
					});
				}
			});
		},
		/**
		 * Read data from the file input to string
		 * @param deferred
		 */
		readFileData:            function (deferred) {
			var input = document.getElementById(fileHexUploadID);
			var file  = input.files[0];
			var fr    = new FileReader();
			fr.onload = function (event) {
				fileContent = event.target.result;
				deferred.resolve();
			};
			if (file) {
				fr.readAsText(file);
			}
			else {
				var status = this.getEmptyHexStatus();
				this.updateUploadStatus(status);
			}
		},
		/**
		 * Parse HEX files
		 * @param isStatusUpdate
		 * @param fileData
		 * @param isResponse
		 */
		parseHexFile:            function (fileData, isStatusUpdate, isResponse) {
			var response       = {};
			var isHeaderParsed = false;
			var status         = {};
			/**
			 * Split data by the end symbol
			 * @type {Array}
			 */
			var lines          = fileData.split("\r\n");

			if (lines.length > 6) {
				/**
				 * Go through lines and check if the line is the status line
				 */
				for (var i = 0; i < lines.length; i++) {
					if (Object.keys(status).length == Object.keys(templates).length) {
						isHeaderParsed = true;
						break;
					}
					var line = lines[i];
					/**
					 * If the line begins from ";#"
					 */
					if (line[0] == ';' && line[1] == '#') {
						line = line.substring(2, line.length);
						/**
						 * Go through each property in template and search
						 */
						for (var property in templates) {
							if (line.indexOf(property) == 0) {
								line                        = line.replace(property, "").trim();
								status[templates[property]] = line;
							}

						}
					}
				}
			}
			var isFileVaild = false;
			if (!isHeaderParsed) {
				status = this.getEmptyHexStatus();
			}
			else {
				/**
				 * Remove the header lines and the prelast checksum
				 */
				lines.splice(0, 3);
				lines = _.compact(lines);
				lines.splice(lines.length - 2, 1);
				try {
					var tmpBinaryData = IntelHex.parseIntelHex(lines.join("\r\n"));
					var tmpHexStatus  = status;
					if (isResponse) {
						response.binaryData = tmpBinaryData;
						response.status     = tmpHexStatus;
						response.isValid    = true;
					}
					else {
						currentBinaryData = tmpBinaryData;
						currentHexStatus  = tmpHexStatus;
					}
					isFileVaild = true;
					App.clearMessage();
				}
				catch (e) {
				}
			}
			if (!isFileVaild) {
				App.pushMessage(App.getTranslation("HEX file is not valid!"), "error");
			}
			if (isStatusUpdate != 10) {
				this.updateUploadStatus(status);
			}
			return isResponse ? response : isFileVaild;
		},
		/**
		 * Returns empty state object
		 * @returns {{}}
		 */
		getEmptyHexStatus:       function () {
			var status = {};
			for (var property in templates) {
				status[templates[property]] = '-';
			}
			return status;
		},
		/**
		 * Get the current firmware state of the device
		 * @returns {*|{}}
		 */
		getCurrentStatus:        function () {
			return Api.getInfo();
		},
		/**
		 * Update the current status
		 * @param state
		 */
		updateCurrentStatus:     function () {
			var state    = this.getCurrentStatus();
			var blockTag = "firmware-current-state";
			var template = _.template($("[data-type=" + blockTag + "]").html());
			var block    = "." + blockTag;
			$(block).html(template({
				dictionary:   App.getDictionaryPanel(),
				currentState: state
			}));
		},
		/**
		 * Update status parsed from the hex file
		 * @param state
		 */
		updateUploadStatus:      function (state) {
			if (typeof state == 'undefined') {
				state = {};
			}
			var blockTag = "firmware-upload-hex-status";
			var template = _.template($("[data-type=" + blockTag + "]").html());
			var block    = "." + blockTag;
			$(block).html(template({
				dictionary:    App.getDictionaryPanel(),
				uploadedState: state,
				App:           App,
			}));
			$(block).slideDown();

		},
		/**
		 * Callback for the rendering of the current state view
		 * @param compiled
		 * @returns {*}
		 */
		firmwareCurrentState:    function (compiled) {
			var currentState = this.getCurrentStatus();
			return compiled({
				dictionary:   App.getDictionaryPanel(),
				currentState: currentState,
				App:          App,
			});
		},
		/**
		 * Callback for the rendering of the current dwl state view
		 * @param compiled
		 * @returns {*}
		 */
		dwlCurrentState: function (compiled) {
			var currentState = Api.getInfoDwl();
			return compiled({
				dictionary:   App.getDictionaryPanel(),
				currentState: currentState,
				App:          App,
			});
		},
		/**
		 * Callback for the rendering of the default state
		 * for the uploaded file
		 * @param compiled
		 * @returns {*}
		 */
		firmwareUploadHexStatus: function (compiled) {
			return compiled({
				dictionary:    App.getDictionaryPanel(),
				uploadedState: this.getEmptyHexStatus(),
				App:           App,
			});
		},
		/**
		 * Update the current device state
		 */
		updateDeviceState:       function () {
			var self  = this;
			var state = $("#device-state");
			$.ajax({
				url:     '/cgi/fw_version',
				async:   true,
				timeout: 1000,
				error:   function (x, t, m) {
					if (t === "timeout") {
						isAuthorized       = true;
						$(state).text(App.getTranslation('Offline'));
						currentDeviceState = false;
					}
				},
				success: function (response) {
					isAuthorized = true;
					$(state).text(App.getTranslation('Online'));
					if ($(blockFlash).hasClass('active') && currentDeviceState == false) {
						isFlashing = false;
						App.pushMessage(App.getTranslation("Device was programmed successfully!"), "success");
						$(blockFlash).removeClass('active');
					}
					currentDeviceState = true;
				}
			})
		},
		/**
		 * Load all available software
		 */
		getAvailableFirmwares:   function () {
			var self = this;
			Api.getFirmwares().done(function (items) {
				Api.getInfoData().done(function (currentState) {
					var compiled     = _.template($("#firmware-available-table").html());
					var table        = compiled({
						items:          items,
						currentVersion: currentState.version
					});
					$(panelSoftware).empty().append(table);
					console.log('items', items);
				});

			});
		}
	};


})();
Firmware.init();