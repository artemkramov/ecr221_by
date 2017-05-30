/**
 * Api object for the speaking with the device
 * @type {{getInfo, uploadFirmwareInfo, uploadHexFile, burnProcessor, checkResponseForError, checkResponseArray}}
 */
var Api = (function () {

	/**
	 * Constant which shows that there's no error on response
	 * @type {number}
	 */
	const STATUS_NO_ERROR = "0";

	/**
	 * Site url for firmwares fetching
	 * @type {string}
	 */
	const SITE_URL = "http://help-micro.com.ua";

	return {
		/**
		 * Get current firmware info about the device
		 * @returns {{}}
		 */
		getInfo:               function () {
			var status = {};
			var xhr    = $.ajax({
				url:     '/cgi/fw_version',
				type:    'get',
				async:   false,
				success: function (response) {
					status = {
						version:      response.fw_version,
						description:  response.fw_descr,
						fwGuid:       response.fw_guid,
						hwGuid:       response.hw_guid,
						uploadLength: response.fw_upload_len
					};
				}
			});
			return status;
		},
		/**
		 * Get current dwl info about the device
		 * @returns {{}}
		 */
		getInfoDwl:               function () {
			var status = {};
			var xhr    = $.ajax({
				url:     '/cgi/dwlinf',
				type:    'get',
				async:   false,
				success: function (response) {
					response = response[0];
					status = {
						version:      "" + (response.dwl_ver >> 24) + "." + ((response.dwl_ver >> 16) & 0xFF) + "." + (response.dwl_ver & 0xFFFF),
						description:  response.dwl_descr,
						date:         new Date(response.dwl_dat * 1000).toLocaleString(),
					};
				}
			});
			return status;
		},
		/**
		 * Get info data async
		 * @returns {*}
		 */
		getInfoData: function () {
			var deferred = $.Deferred();
			$.ajax({
				url:     '/cgi/fw_version',
				type:    'get',
				async:   true,
				error: function () {
					return deferred.reject();
				},
				success: function (response) {
					return deferred.resolve({
						version:      response.fw_version,
						description:  response.fw_descr,
						fwGuid:       response.fw_guid,
						hwGuid:       response.hw_guid,
						uploadLength: response.fw_upload_len
					});
				}
			});

			return deferred.promise();
		},
		/**
		 * Update firmware information
		 * @param status
		 * @returns {*}
		 */
		uploadFirmwareInfo:    function (status) {
			if (!_.isEmpty(status)) {
				var data = {
					fw_guid:    status.guid,
					fw_version: status.version,
					fw_descr:   status.description
				};
				return $.ajax({
					url:         '/cgi/fw_version',
					type:        'post',
					contentType: 'application/json; charset=utf-8',
					dataType:    'json',
					data:        JSON.stringify(data),
					success:     function (response) {

					}
				})
			}
			return false;
		},
		/**
		 * Upload binary data (converted HEX-file) to the device
		 * @param binaryData
		 * @returns {*}
		 */
		uploadHexFile:         function (binaryData) {
			var self = this;
			if (!_.isEmpty(binaryData)) {
				return $.ajax({
					xhr:         function () {
						var xhr = new window.XMLHttpRequest();
						xhr.upload.addEventListener("progress", function (evt) {
							if (evt.lengthComputable) {
								var percentComplete = Math.round(evt.loaded * 100 / evt.total);
								self.updateProgressBar(percentComplete);
							}
						}, false);

						return xhr;
					},
					url:         '/cgi/fw_upload/',
					data:        binaryData,
					type:        'post',
					processData: false,
					contentType: 'application/octet-stream',
				});
			}
			return false;
		},
		/**
		 * Burn hex data from the device to the processor
		 * @param callback
		 */
		burnProcessor:         function (callback) {
			$.ajax({
				url:     '/cgi/fw_burn',
				type:    'post',
				success: function (ajaxResponse) {
					callback(ajaxResponse);
				}
			});
		},
		/**
		 * Check if the response contains any error
		 * @param response
		 * @returns {Object}
		 */
		checkResponseForError: function (response) {
			var errorFields = ['fw_info_error', 'fw_upload_error', 'fw_burn_error'];
			var result      = {
				success: true,
				error:   false,
			};
			errorFields.forEach(function (property, i, arr) {
				/**
				 * If the field is in response fields
				 * then check it. If the response isn't OK
				 * then save the error to display
				 */
				if (_.has(response, property)) {
					if (response[property] !== STATUS_NO_ERROR) {
						result.success = false;
						result.error   = response[property];
					}
				}
			});
			return result;
		},
		/**
		 * Check the array of response for any error
		 * @param responses
		 * @returns {{success: boolean, error: boolean}}
		 */
		checkResponseArray:    function (responses) {
			var result = {
				success: true,
				error:   false
			};
			var errors = [];
			var self   = this;
			responses.forEach(function (response) {
				var currentResult = self.checkResponseForError(response);
				if (currentResult.success == false) {
					errors.push(currentResult.error);
				}
			});
			/**
			 * If we have any error then join it via <br/> tag
			 */
			if (!_.isEmpty(errors)) {
				result.success = false;
				result.error   = errors.join("<br/>");
			}
			return result;
		},
		/**
		 * Update progress bar value
		 * @param value
		 * @param name
		 */
		updateProgressBar:     function (value, name) {
			var progressBar = $(".progress-bar");
			var percentage  = value + '%';
			$(progressBar).css({
				width: percentage
			});
			$(progressBar).text(percentage);
			if (!_.isUndefined(name)) {
				$("#progress-title").text(name);
			}
		},
		/**
		 * Logout the current user
		 */
		logout:                function () {
			$.ajax('/cgi/state', {username: 'logout'}).always(function () {
				$.get('/cgi/state');
			});
		},
		/**
		 * Return the promise with current firmware ID
		 * @returns {*}
		 */
		getCurrentFirmwareID:  function () {
			var deferred = $.Deferred();
			$.ajax({
				url: '/cgi/fw_version',
				dataType: 'json',
				success: function (response) {
					if (response['hw_guid'] == 'x22809AEBC7C140008EE38A4336B443C4') {
						$.ajax({
							url: '/cgi/dwlid',
							success: function (responseState) {
								deferred.resolve(responseState);
							}
						});
					}
					else {
						var responseState = {};
						responseState[response['hw_guid']] = 1;
						return deferred.resolve(responseState);
					}
				}
			});
			return deferred.promise();
		},
		/**
		 * Get the firmwares from the server
		 * @returns {*}
		 */
		getFirmwares:          function () {
			var deferred = $.Deferred();
			this.getCurrentFirmwareID().done(function (response) {
				if (_.isObject(response) && !_.isEmpty(response)) {
					var keys              = _.keys(response);
					var currentFirmwareID = keys[0];
					$.ajax({
						url:     SITE_URL + '/hexget.php',
						data:    {
							id: currentFirmwareID
						},
						dataType: 'json',
						error: function () {
							console.log(arguments);
						},
						success: function (response) {
							return deferred.resolve(response);
						}
					})
				}
			});
			return deferred.promise();
		},
		/**
		 * Upload the file from the server
		 * @param path
		 * @returns {XMLHttpRequest}
		 */
		getFirmwareFromServer: function (path) {
			var self = this;
			this.updateProgressBar(0, "Load from server...");
			var filePath = SITE_URL + path;
			var request = new XMLHttpRequest();
			request.open("GET", filePath, true);
			request.send();
			request.onprogress = function (event) {
				var percentage = 100;
				if (event.lengthComputable) {
					percentage = Math.round(100 *  event.loaded / event.total);
				}
				self.updateProgressBar(percentage);
			};
			return request;
		}
	};
})();