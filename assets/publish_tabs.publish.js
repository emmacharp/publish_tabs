/*-----------------------------------------------------------------------------
	Language strings
-----------------------------------------------------------------------------*/

Symphony.Language.add({
	'Untitled Tab': false
});

/*-----------------------------------------------------------------------------
	PublishTabs
-----------------------------------------------------------------------------*/
(function ($, undefined) {

	'use strict';


	var options = {
	  root: $('.primary').this,
	  rootMargin: '0px',
	  threshold: 1.0
	};

	function callback(entries, observer) {
		$(entries).each(function() {
			if (this.intersectionRatio >= 1) {
				// console.log("Fully visible!");
				var selector = this.target.getAttribute('id');
				console.log(selector);
				$('.publishtabs').find('[href="#' + selector + '"]').click();
			} else {
			// console.log("Not fully visible!");
			}
			
		});
	}

	var observer = new IntersectionObserver(callback, options);

	var localStorage = window.localStorage || {};

	window.PublishTabs = {

		tab_controls: null,
		new_entry: false,
		sectionHandle: 'not-found',

		init: function() {
			var self = this;
			var context = $('#context');

			// thy shalt not pass if no Publish Tab fields used
			var tab_fields = $('.field-publish_tabs');
			if (!tab_fields.length) return;

			var body = $('body');

			// isolate the section handle: this is use as a key for local storage
			this.sectionHandle = body.attr('data-section-handle');

			body.addClass('publish-tabs');

			// are we creating a new entry or editing an existing one?
			var env = Symphony.Context.get('env');
			this.new_entry = (env.page === 'new');

			var has_invalid_tabs = false;
			this.tab_controls = $('<ul class="tabs publishtabs"></ul>');

			var publish_tabs = Symphony.Context.get('publish-tabs');

			for(var i in publish_tabs) {

				var main_fields = '';
				var sidebar_fields = '';

				for(var field in publish_tabs[i].main) main_fields += '#' + publish_tabs[i].main[field] + ', ';
				for(var field in publish_tabs[i].sidebar) sidebar_fields += '#' + publish_tabs[i].sidebar[field] + ', ';

				main_fields = main_fields.replace(/, $/,'');
				sidebar_fields = sidebar_fields.replace(/, $/,'');

				var $main_fields = $(main_fields);
				var $sidebar_fields = $(sidebar_fields);

				$main_fields.wrapAll('<div id="tab-group-' + publish_tabs[i]['tab_id'] + '" class="tab-group tab-group-' + publish_tabs[i]['tab_id'] + '"></div>');
				$sidebar_fields.wrapAll('<div id="tab-group-' + publish_tabs[i]['tab_id'] + '" class="tab-group tab-group-' + publish_tabs[i]['tab_id'] + '"></div>');

				var tab_field = $('#field-' + publish_tabs[i]['tab_id']).remove();
				var tab_text = (tab_field.text() != '') ? tab_field.text() : Symphony.Language.get('Untitled Tab');
				var tab_item = $('<li></li>');
				var tab_button = $('<a class="tab-'+publish_tabs[i]['tab_id']+'" data-id="'+publish_tabs[i]['tab_id']+'" href="#tab-group-' + publish_tabs[i]['tab_id'] + '">' + tab_text + '</a>');
				tab_item.append(tab_button);
				this.tab_controls.append(tab_item);

				// add click event to tab
				tab_button.on('click', function (e) {
					var t = $(this);
					var id = t.attr('data-id');
					if (t.hasClass('active')) return;
					if (!!id) {
						self.showTab(id);
						// if it's a real user click
						if (!!e.originalEvent) {
							self.saveLocalTab('publish-tab', id);
						}
					}

					window.location.hash = '#' + t.attr('href').split('#')[1];
				});

				// find invalid fields
				if (!!$main_fields.add($sidebar_fields).find('.invalid').length) {
					has_invalid_tabs = true;
					tab_button.addClass('invalid').append('<span class="icon">!</span>');
				}

			}

			// prepend tags controls
			context.prepend(this.tab_controls);

			// activate the right tab
			if (has_invalid_tabs) {
				this.tab_controls.find('.invalid').first().click();
			} else {
				var initial_tab = self.getURLParameter('publish-tab');
				var local_tab = self.getLocalTab('publish-tab');

				var selector = !!initial_tab ? '.' + initial_tab : (!!local_tab ? local_tab : 'li:first a');
				this.tab_controls.find(selector).click();
			}

			// Start IntersectionObserver on groups
			var tab_groups = $('.tab-group');
			tab_groups.each(function(){
				observer.observe(this);
			});
		},

		showTab: function(tab) {
			var w = $('#contents').width();

			// de-select current tab and select the new tab
			this.tab_controls.find('li.active').removeClass('active');
			this.tab_controls.find('a.tab-' + tab).parent('li').addClass('active');

			// hide current tab group and select new group
			$('.tab-group-active').removeClass('tab-group-active');
			$('.tab-group-' + tab).addClass('tab-group-active');

			var invalid_field = $('.tab-group-' + tab + ' .invalid');
			// focus first invalid element
			if (invalid_field.length) {
				invalid_field.eq(0).find('*[name*="fields["]').focus();
			}

			// focus first field in tab when creating a new entry
			else if (this.new_entry) {
				$('.tab-group-' + tab + ' .field:first *[name*="fields["]').focus();
			}
			
			return true;
		},

		getURLParameter: function(name) {
			return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
		},

		generateLocalKey: function (name) {
			if (!name) {
				throw new Exception('A name must be given');
			}
			return 'symphony.' + name + '.' + this.sectionHandle;
		},

		getLocalTab: function (name) {
			return localStorage[this.generateLocalKey(name)];
		},

		saveLocalTab: function (name, tab) {
			localStorage[this.generateLocalKey(name)] = '.tab-' + tab;
		}
	};

	$(function() {
		PublishTabs.init();
		$('.drawer.vertical-left, .drawer.vertical-right').trigger('update.drawer');
	});

})(jQuery);
