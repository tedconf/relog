var fs = require('fs');

var log = fs.readFileSync('../cleaned/rp13-obj.json', 'utf8');
log = JSON.parse(log);

var accesspoints = fs.readFileSync('../cleaned/accesspoints.json', 'utf8');
accesspoints = JSON.parse(accesspoints);

var ap = new Lookup();
Object.keys(accesspoints).forEach(function (name) {
	var point = accesspoints[name];
	var name = Math.round(point.x*100)+'_'+Math.round(point.y*50);
	point.name = name;
	ap.add(name);
});

var condensedAccesspoints = [];
Object.keys(accesspoints).forEach(function (name) {
	var point = accesspoints[name];
	point.index = ap.getId(point.name);
	condensedAccesspoints[point.index] = {
		x: point.x,
		y: point.y,
		room: point.group
	};
});

var macs = new Lookup();
var times = new Lookup();

log.forEach(function (entry) {
	if (accesspoints[entry.access_point] === undefined) return;

	entry.time = ((new Date(entry.date)).getTime()-1367712000000)/60000+120;
	times.add(entry.time);

	macs.add(entry.mac_hash);
});

times.sort(function (a,b) { return a-b });

var newEntries = [];
var csv = [['Zeit','Accesspoint','Raum','x (ungefähr)','y (ungefähr)','fortlaufende Gerätenummer'].join(',')];
log.forEach(function (entry) {
	if (accesspoints[entry.access_point] === undefined) return;

	var mac = macs.getId(entry.mac_hash);
	var time = times.getId(entry.time);
	var point = accesspoints[entry.access_point].index;

	if (newEntries[mac] === undefined) newEntries[mac] = [];
	newEntries[mac][time] = point;
	csv.push([
		entry.date,
		entry.access_point,
		condensedAccesspoints[point].room,
		condensedAccesspoints[point].x*2,
		condensedAccesspoints[point].y,
		mac
	].join(','));
});

var result = {
	/*macs: macs.getJSON(),*/
	times: times.getJSON(),
	points: condensedAccesspoints,
	matrix: newEntries
};

var json = JSON.stringify(result /*, null, '\t'*/);
json = json.replace(/null/g, '');

fs.writeFileSync('../clients/anim/data.js', 'var data = '+json, 'utf8');
fs.writeFileSync('../clients/anim/republica13-wlan-data.csv', csv.join('\n'), 'utf8');




function Lookup() {
	var me = this;
	var entry2index = {};
	var index2entry = [];

	me.add = function (entry) {
		if (entry2index[entry] === undefined) {
			var index = index2entry.length;
			entry2index[entry] = index;
			index2entry[index] = entry;
		}
	}

	me.sort = function (callback) {
		entry2index = {};
		index2entry = index2entry.sort(callback);
		index2entry.forEach(function (entry, index) {
			entry2index[entry] = index;
		})
	}

	me.getId = function (entry) {
		return entry2index[entry];
	}

	me.getJSON = function () {
		return index2entry.slice(0);
	}

	return me;
}
