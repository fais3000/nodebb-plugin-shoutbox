"use strict";

var	NodeBB = require('./lib/nodebb'),
	Config = require('./lib/config'),
	Sockets = require('./lib/sockets'),

	app,

	Shoutbox = {};

Shoutbox.init = {};
Shoutbox.widget = {};
Shoutbox.settings = {};

Shoutbox.init.load = function(params, callback) {
	function renderGlobal(req, res, next) {
		Config.getTemplateData(function(data) {
			res.render(Config.plugin.id, data);
		});
	}

	function renderAdmin(req, res, next) {
		Config.getTemplateData(function(data) {
			res.render('admin/plugins/' + Config.plugin.id, data);
		});
	}

	var router = params.router;
	router.get('/' + Config.plugin.id, params.middleware.buildHeader, renderGlobal);
	router.get('/api/' + Config.plugin.id, renderGlobal);

	router.get('/admin/plugins/' + Config.plugin.id, params.middleware.admin.buildHeader, renderAdmin);
	router.get('/api/admin/plugins/' + Config.plugin.id, renderAdmin);

	NodeBB.SocketPlugins[Config.plugin.id] = Sockets.events;
	NodeBB.SocketAdmin[Config.plugin.id] = Config.adminSockets;

	app = params.app;

	Config.init(callback);
};

Shoutbox.init.addGlobalNavigation = function(menu, callback) {
	menu = menu.concat([
        {
            route: '/' + Config.plugin.id,
            title: Config.plugin.name,
            iconClass: 'fa fa-fw ' + Config.plugin.icon,
            textClass: "visible-xs-inline",
            text: Config.plugin.name
        }
    ]);

    callback(null, menu);
};

Shoutbox.init.addAdminNavigation = function(header, callback) {
	header.plugins.push({
		route: '/plugins/' + Config.plugin.id,
		icon: Config.plugin.icon,
		name: Config.plugin.name
	});

	callback(null, header);
};

Shoutbox.widget.define = function(widgets, callback) {
	widgets.push({
		name: Config.plugin.name,
		widget: Config.plugin.id,
		description: Config.plugin.description,
		content: ''
	});

	callback(null, widgets);
};

Shoutbox.widget.render = function(widget, callback) {
	widget.data.container = '';

	Config.user.get({ uid: widget.uid, settings: {} }, function(err, result) {
		Config.getTemplateData(function(data) {

			data.hiddenStyle = '';
			if (!err && result && result.settings && parseInt(result.settings['shoutbox:toggles:hide'], 10) == 1) {
				data.hiddenStyle = 'display: none;';
			}
			app.render('shoutbox/panel', data, function(err, html) {
				widget.html = html;
				callback(err, widget);
			});
		});
	});
};

Shoutbox.settings.addUserSettings = function(settings, callback) {
	app.render('shoutbox/user/settings', { settings: settings.settings }, function(err, html) {
		settings.customSettings.push({
			title: Config.plugin.name,
			content: html
		});

		callback(null, settings);
	});
};

Shoutbox.settings.addUserFieldWhitelist = function (data, callback) {
	data.whitelist.push('shoutbox:toggles:sound');
	data.whitelist.push('shoutbox:toggles:notification');
	data.whitelist.push('shoutbox:toggles:hide');

	data.whitelist.push('shoutbox:muted');

	callback(null, data);
};

Shoutbox.settings.getUserSettings = function(data, callback) {
	Config.user.get(data, callback);
};

Shoutbox.settings.saveUserSettings = function(data) {
	Config.user.save(data);
};

module.exports = Shoutbox;
