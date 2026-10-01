// SPDX-License-Identifier: Apache-2.0

'use strict';
'require form';
'require network';
'require uci';
'require view';

function validateIfname(sectionId, value) {
	if (!/^[A-Za-z0-9_.:-]{1,15}$/.test(value || ''))
		return _('Use a Linux network device name containing at most 15 characters.');

	return true;
}

function selectablePorts(devices) {
	var primary = [], fallback = [];

	(devices || []).forEach(function(device) {
		var name = device.getName();

		if (/^lan\d+$/.test(name)) {
			if (primary.indexOf(name) < 0)
				primary.push(name);
		}
		else if (/^(eth|swp)\d+$/.test(name)) {
			if (fallback.indexOf(name) < 0)
				fallback.push(name);
		}
	});

	/* Boards without switch ports named lanN fall back to physical NICs. */
	return (primary.length ? primary : fallback).sort();
}

function distinctValidator(field) {
	return function(sectionId, value) {
		if (value && value === this.section.formvalue(sectionId, field))
			return _('The two IPTV ports must be different.');

		return true;
	};
}

return view.extend({
	load: function() {
		return network.getDevices();
	},

	render: function(devices) {
		var m, s, o, lanPorts;

		m = new form.Map('iptv', _('IPTV'),
			_('Bind up to two LAN ports to the operator IPTV VLAN. Applying the configuration removes the selected ports from br-lan.'));

		s = m.section(form.NamedSection, 'config', 'iptv');
		s.anonymous = true;
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', _('Enable'));
		o.default = '0';
		o.rmempty = false;

		lanPorts = selectablePorts(devices);
		[ 'lan_port', 'lan_port2' ].forEach(function(opt) {
			var current = uci.get('iptv', 'config', opt);

			if (current && lanPorts.indexOf(current) < 0)
				lanPorts.push(current);
		});
		lanPorts.sort();

		o = s.option(form.ListValue, 'lan_port', _('First IPTV LAN port'),
			_('The first port dedicated to the set-top box.'));
		o.rmempty = false;
		lanPorts.forEach(function(name) {
			o.value(name);
		});
		o.depends('enabled', '1');
		o.validate = distinctValidator('lan_port2');

		o = s.option(form.ListValue, 'lan_port2', _('Second IPTV LAN port'),
			_('Optional. Leave empty to use a single IPTV port.'));
		o.rmempty = true;
		lanPorts.forEach(function(name) {
			o.value(name);
		});
		o.depends('enabled', '1');
		o.validate = distinctValidator('lan_port');

		o = s.option(form.Value, 'uplink', _('Uplink device'),
			_('Network device carrying the operator VLANs, normally pon0.'));
		o.default = 'pon0';
		o.rmempty = false;
		o.validate = validateIfname;
		o.depends('enabled', '1');

		o = s.option(form.Value, 'service_vlan', _('Service VLAN'),
			_('Carries DHCP, authentication, video on demand and, when no separate multicast VLAN is set, multicast traffic.'));
		o.placeholder = '43';
		o.datatype = 'range(1,4094)';
		o.rmempty = false;
		o.depends('enabled', '1');

		o = s.option(form.Value, 'multicast_vlan', _('Multicast VLAN'),
			_('Optional. In separate multicast VLAN mode, IPv4 multicast flows downstream and IGMP is allowed upstream.'));
		o.placeholder = '40';
		o.datatype = 'range(1,4094)';
		o.rmempty = true;
		o.depends('enabled', '1');
		o.validate = function(sectionId, value) {
			var serviceVlan = this.section.formvalue(sectionId, 'service_vlan');

			if (value && value === serviceVlan)
				return _('Leave the multicast VLAN empty when both services use the same VLAN.');

			return true;
		};

		o = s.option(form.Value, 'igmp_vlan', _('IGMP upstream VLAN'),
			_('Optional. Leave empty to use the multicast VLAN, or the service VLAN when no separate multicast VLAN is configured.'));
		o.placeholder = _('Same as multicast traffic');
		o.datatype = 'range(1,4094)';
		o.rmempty = true;
		o.depends('enabled', '1');

		return m.render();
	}
});
