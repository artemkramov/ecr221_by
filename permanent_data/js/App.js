var App = (function () {

	/**
	 * Dictionary array
	 * @type {Array}
	 */
	var dictionary = [];

	/**
	 * Current language of the system
	 * @type {string}
	 */
	var currentLanguage = 'ru';

	/**
	 * Class of each template for underscore handling
	 * @type {string}
	 */
	var translatedBlock = '.language-template';

	return {
		/**
		 * Init all translations and views
		 */
		initDictionary:     function () {
			var self = this;
			$.getJSON("desc?" + (new Date().getTime()))
				.done(function (response) {
					if (_.has(response, currentLanguage)) {
						dictionary = response[currentLanguage];
						self.initTranslations();
						Firmware.updateDeviceState();
						//Firmware.getAvailableFirmwares();
					}
					else {
						console.log("Can't init language");
					}
				});
		},
		/**
		 * Init all views due to the current language
		 */
		initTranslations:   function () {
			var self = this;
			$(translatedBlock).each(function () {
				var compiled = _.template($(this).html());
				var callback = self.camelize($(this).data('type'));
				var template = "";
				if (typeof Firmware[callback] != 'undefined') {
					template = Firmware[callback](compiled);
				}
				else {
					template = compiled({
						dictionary: dictionary.panel
					});
				}
				$("." + $(this).data('type')).html(template);
			});
		},
		/**
		 * Get translation from the dictionary
		 * @param key
		 * @param group
		 * @returns {*}
		 */
		getTranslation:     function (key, group) {
			if (typeof group == 'undefined') {
				group = 'panel';
			}
			var message = "";
			if (dictionary[group]) {
				message = dictionary[group][key];
			}
			if (message) {
				return message;
			}
			return key;
		},
		/**
		 * Get all translations from the panel group
		 * @returns {*}
		 */
		getDictionaryPanel: function () {
			return dictionary.panel;
		},
		/**
		 * Camelize the string
		 * @param input
		 * @returns {string}
		 */
		camelize:           function (input) {
			return input.toLowerCase().replace(/-(.)/g, function (match, group1) {
				return group1.toUpperCase();
			});
		},
		/**
		 * Push alert message
		 * @param message
		 * @param type
		 * @param timeout
		 */
		pushMessage:        function (message, type, timeout) {
			this.clearMessage();
			var params = {
				text: message,
				type: type
			};
			if (!_.isUndefined(timeout)) {
				params.timeout = timeout;
			}
			var n = noty(params);
		},
		/**
		 * Clear alert message
		 */
		clearMessage:       function () {
			$.noty.closeAll();
		},
		/**
		 * Push request result
		 * @param response
		 * @param successMessage
		 * @param timeout
		 */
		pushResponse:       function (response, successMessage, timeout) {
			var message = successMessage;
			var type    = "success";
			if (!response.success) {
				type    = "error";
				message = this.getTranslation(response.error, "err");
			}
			this.pushMessage(message, type, timeout);
		},
		/**
		 * Compare firmware versions
		 * @param left
		 * @param right
		 * @returns {*}
		 */
		versionCompare:     function (left, right) {
			left = left.split(' ')[0];
			right = right.split(' ')[0];
			if (typeof left + typeof right != 'stringstring')
				return false;

			var a   = left.split('.')
				, b = right.split('.')
				, i = 0, len = Math.max(a.length, b.length);

			for (; i < len; i++) {
				if ((a[i] && !b[i] && parseInt(a[i]) > 0) || (parseInt(a[i]) > parseInt(b[i]))) {
					return 1;
				} else if ((b[i] && !a[i] && parseInt(b[i]) > 0) || (parseInt(a[i]) < parseInt(b[i]))) {
					return -1;
				}
			}

			return 0;
		}
	};

})();