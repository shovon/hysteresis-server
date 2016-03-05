var UI = UI || {}
UI.AltList = {};

const host = 'http://localhost:3100';

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

UI.Alternative = function(alt){
	console.log("trololol");
	this.uid = alt.uid;
	this.cad_file = alt.cad_file;
	this.image = alt.image;
	this.param_indices = alt.param_indices;

	this.initSelf();
}

UI.Alternative.prototype.initSelf = function () {
	var container = document.createElement('div');
	container.className = 'alt';

	var $container = $(container);

	// TODO: avoid this.
	$('body').append(container);

	var canvas = document.createElement('canvas');

	$container.addClass('ui-widget-content');
	var $minButton = $('<button type="button" class="alt-button"><span class="ui-icon ui-icon-arrow-2-se-nw"></span></button><br>');
	$minButton.state = 'max';
	$minButton.attr({'id':'min-'+this.uid});
	$container.append($minButton);
	$minButton.click(function() {
		// this : DOMElement

		if(this.state === 'max'){
			var str = this.id;
			new_str = str.replace('min-','');
			$('#li-'+new_str).slideUp(100,function(){
				var str = this.id;
				var new_str = str.replace('li-','');
				$('#cnv-'+new_str).animate({'height':150, 'width':150});
			});
			this.state = 'min';
		} else {
			var str = this.id;
			new_str = str.replace('min-','');
			$('#cnv-'+new_str).animate({'height':400, 'width':400}, 10, 'swing', function () {
				// body...
				var str = this.id;
				var new_str = str.replace('cnv-','');
				$('#li-'+new_str).show(100);
			});
			this.state = 'max';
		}
	});
	var img = new Image();
	img.onload = function () {
		this.img = img;

		canvas.width = 400;
		canvas.height = 400;

		canvas.id = 'cnv-'+this.uid;
		var ctx = canvas.getContext('2d');
		ctx.drawImage(img,0,0,img.width,img.height,0,0,400,400);
		$(container).append(canvas);
		var li = $('<ul class="params style="margin:0px; padding:0px;"></ul>');
		li.attr({'id':'li-'+this.uid});
		var list = $(container).append(li).find('ul');
		for (val in this.param_indices){
			str = '<li>' + 'Parameter--'+val+":----Value----" + this.param_indices[val].toString() + '</li>';
			list.append(str);
		}
		$(container).find('.params').selectable({filter:'li'});
		$(container).draggable({cursor:'move', stack:".alt", containment: "window"});
		$('<span class="ui-icon ui-icon-arrowthick-1-n"></span>').insertBefore(canvas.id);
	}.bind(this);
	img.src = this.image;
}

UI.Alternative.prototype.loadImage = function(uid, source){

}
