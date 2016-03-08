var UI = UI || {}
UI.AltList = {};

const host = 'http://localhost:3100';

// var socket = io('ws://localhost:3100');
var socket = io('ws://localhost:3100');

function sendJSON(filename, payload) {
	socket.emit('send state', {
		filename: filename,
		payload: payload
	});
}

UI.init = function() {
	const hostFiles = host + '/files';
	$.getJSON(hostFiles, function (data) {
		data.forEach(function (datum) {
			$.getJSON(hostFiles + '/' + datum + '.json', function (obj) {
				new UI.Alternative(obj);
			});
		});
	});

	socket.on('file created', function (msg) {
		console.log("file created");
		$.getJSON(hostFiles + '/' + msg + '.json', function (data) {
			new UI.Alternative(data);
		});
	});

	$('#send-to-program').click(function () {
		sendJSON('foo', {
			"hello":{"hello":[1,2,3,4]}
		})
	});
}

const MIN_STATE = 'min';
const MAX_STATE = 'max';

UI.Alternative = function(alt){
	this.uid = alt.uid;
	this.cad_file = alt.cad_file;
	this.image = alt.image;
	this.params = alt.params;

	this.state = MAX_STATE;

	this.initSelf();
}

UI.Alternative.prototype.initSelf = function () {

	var container = document.createElement('div');
	var $container = $(container);
	$container.attr('id', `alt-${this.uid}`);
	$container.addClass('alt ui-widget-content');

	$('body').append(container);

	var canvas = document.createElement('canvas');
	var $canvas = $(canvas);

	$container.addClass('ui-widget-content');
	var $minButton = $('<button type="button" class="alt-button"><span class="ui-icon ui-icon-arrow-2-se-nw"></span></button><br>');
	$minButton.state = 'max'; // TODO: let this be its own variable.
	$container.append($minButton);
	$minButton.click(function() {
		// this : DOMElement
		if ($minButton.state === 'max') {
			console.log('Minimizing.');
			$container.find('ul').slideUp(100, function() {
				$canvas.animate({'height': 150, 'width': 150});
			});
			$minButton.state = 'min';
		} else {
			console.log('Maximizing');
			$canvas.animate({'height':400, 'width':400}, 10, 'swing', function () {
				$container.find('ul').show(100);
			});
			$minButton.state = 'max';
		}
	});
	var img = new Image();
	img.onload = function () {
		this.img = img;
		$canvas.attr({ width: 400, height: 400 });
		var ctx = $canvas.get(0).getContext('2d');
		ctx.drawImage(img,0,0,img.width,img.height,0,0,400,400);
		$container.append($canvas);
		var li = $('<ul class="params style="margin:0px; padding:0px;"></ul>');
		li.attr({'id':'li-'+this.uid});
		var list = $container.append(li).find('ul');
		Object.keys(this.params).forEach(key => {
			var str = '<li>' + 'Parameter--'+key+":----Value----" + this.params[key].toString() + '</li>';
			list.append(str);
		})
		$container.find('.params').selectable({filter:'li'});
		$container.draggable({cursor:'move', stack:".alt", containment: "window"});
	}.bind(this);
	img.src = '/files/' + this.image;
}

UI.Alternative.prototype.loadImage = function(uid, source) {}
