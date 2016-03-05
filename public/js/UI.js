var UI = UI || {}
UI.AltList = {}

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
	this.uid = alt.uid;
	this.cad_file = alt.cad_file;
	this.image = alt.image;
	this.param_indices = alt.param_indices;
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
	container.id = 'alt-'+this.uid;
	container.className = 'alt';
	$('body').append(container);
	$('#'+container.id).addClass('ui-widget-content');
	var minButton = $('<button type="button" class="alt-button"><span class="ui-icon ui-icon-arrow-2-se-nw"></span></button><br>');
	minButton.state = 'max';
	minButton.attr({'id':'min-'+this.uid});
	// console.log(minButton);
	$('#'+container.id).append(minButton);
	$('#min-'+this.uid).click(function(){
		if(this.state === 'max'){
			console.log(this);
			var str = this.id;
			new_str = str.replace('min-','');
			$('#li-'+new_str).slideUp(100,function(){
				var str = this.id;
				var new_str = str.replace('li-','');
				console.log(new_str);
				$('#cnv-'+new_str).animate({'height':150, 'width':150});
			});
			this.state = 'min';
		}else{
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

	img = new Image();
	var withoutExt = this.image.split('.').slice(0, -1).join('.');
	var extname = this.image.split('.').slice(-1)[0];
	if (!/(jpg|png)/.test(extname)) {
		extname = 'jpg';
	}
	var newfilename = [withoutExt, extname].join('.');
	img.onload = function () {
		// img.width = img.height = 300;
		this.img = img;
		// var canvas = $('<canvas/>',{'id': 'blablab'}).width(300).height(300);
		var canvas = document.createElement('canvas');
		canvas.width = 400;
		canvas.height = 400;
		canvas.id = 'cnv-'+this.uid;
		var ctx = canvas.getContext('2d');
		ctx.drawImage(img,0,0,img.width,img.height,0,0,400,400);
		// ctx.drawImage(img,0,0);

		// var img_obj = {src : img.src, id: 'img-'+this.uid};
		// $('#'+container.id).prepend($('<img/>', img_obj));
		$('#'+container.id).append(canvas);
		var li = $('<ul class="params style="margin:0px; padding:0px;"></ul>');
		li.attr({'id':'li-'+this.uid});
		var list = $('#'+container.id).append(li).find('ul');
		for (val in this.param_indices){
			str = '<li>' + 'Parameter--'+val+":----Value----" + this.param_indices[val].toString() + '</li>';
			list.append(str);
		}
		$('.params').selectable({filter:'li'});
		$('#'+container.id).draggable({cursor:'move', stack:".alt", containment: "window"});
		// var closeBtn =
		// $('#'+container.id).prepend(closeBtn);
		$('<span class="ui-icon ui-icon-arrowthick-1-n"></span>').insertBefore(canvas.id);
		// img.onLoad = this.loadImage(this.uid, img.src);
	}.bind(this);
	img.src = newfilename;

}

UI.Alternative.prototype.loadImage = function(uid, source){

}
