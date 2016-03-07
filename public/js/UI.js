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

	// var thumbnail = document.createElement('div');
	// thumbnail.id = 'thm-'+this.uid;
	// thumbnail.className = 'thumbnail';
	// $('#workspace').append(thumbnail);
	// $('#'+thumbnail.id).addClass('ui-widget-content');
	// var maxButton = $('<button type="button" class="alt-button"><span class="ui-icon-newwin"></span></button>');
	// maxButton.attr({'id':'max-'+this.uid});
	// $('#'+thumbnail.id).append(maxButton);
	// $('#max-'+this.uid).click(function(){
	// 	var str = this.id;
	// 	new_str = str.replace('max-','');
	// 	alert('clicked');
	// 	// $('#alt-'+new_str).hide(400);
	// });

	// var container = $('<div></div>').html('<ul><li>ONE</li><li>TWO</li></ul>');
	var container = document.createElement('div');
	var $container = $(container);
	$container.attr('id', `alt-${this.uid}`);
	$container.addClass('alt ui-widget-content');

	var $minButton = $(document.createElement('button'));
	$minButton.attr({
		id: `min-${this.uid}`,
		type: 'button',
		class: 'alt-button'
	});
	$minButton.html(`
		<span class="ui-icon ui-icon-arrow-2-se-nw"></span>
	`);
	$minButton.appendTo($container);

	const self = this;
	$minButton.click(function () {
		// if (self.state === MAX_STATE) {
		//
		// }
	});

	$('body').append(container);
	// minButton.state = 'max';
	// minButton.attr({'id':'min-'+this.uid});
	// $('#'+container.id).append(minButton);
	// $('#min-'+this.uid).click(function(){
	// 	if(this.state === 'max'){
	// 		console.log(this);
	// 		var str = this.id;
	// 		new_str = str.replace('min-','');
	// 		$('#li-'+new_str).slideUp(100,function(){
	// 			var str = this.id;
	// 			var new_str = str.replace('li-','');
	// 			console.log(new_str);
	// 			$('#cnv-'+new_str).animate({'height':150, 'width':150});
	// 		});
	// 		this.state = 'min';
	// 	}else{
	// 	var str = this.id;
	// 		new_str = str.replace('min-','');
	// 		$('#cnv-'+new_str).animate({'height':400, 'width':400}, 10, 'swing', function () {
	// 			// body...
	// 			var str = this.id;
	// 			var new_str = str.replace('cnv-','');
	// 			$('#li-'+new_str).show(100);
	// 		});
	// 		this.state = 'max';
	// 	}
	// });

	img = new Image();
	img.onload = function () {
		this.img = img;
		var canvas = document.createElement('canvas');
		canvas.width = 400;
		canvas.height = 400;
		var ctx = canvas.getContext('2d');
		ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, 400, 400);

		$container.append(canvas);
		var li = $('<ul class="params style="margin:0px; padding:0px;"></ul>');
		li.attr({ id: 'li-' + this.uid });
		var list = $container.append(li).find('ul');
		this.param.forEach(param => {
			const str = '<li>' + 'Parameter--'+key+":----Value----" + this.param[key].toString() + '</li>';
			list.append(str);
		});
		$$container.find('.params').selectable({filter:'li'});
		$container.draggable({ cursor:'move', stack:".alt", containment: "window" });
		$('<span class="ui-icon ui-icon-arrowthick-1-n"></span>').insertBefore(canvas.id);
	}.bind(this);
	img.src = this.image;
}

UI.Alternative.prototype.loadImage = function(uid, source) {}
