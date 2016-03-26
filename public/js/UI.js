var UI = UI || {}
UI.AltList = {};
UI.Selection = {};

const host = 'http://localhost:3100';

// var socket = io('ws://localhost:3100');
var socket = io();

function sendJSON(filename, payload) {
	socket.emit('send state', {
		filename: filename,
		payload: payload
	});
}

function getData(id){
	var json_data = {"Foo":{"Bar":"Baz"}};
	json_data['params'] = UI.AltList[id]['params'];
	return json_data;
}

class CADCanvas {
	constructor() {
		this.canvas = document.createElement('canvas');
		this.$canvas = $(this.canvas);
		this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
		this.renderer.setSize(400, 400);

		this.draw = false;

		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);

		this.geometry = new THREE.BoxGeometry( 1, 1, 1 );
		this.material = new THREE.MeshBasicMaterial({ color: 0x00FF00 });
		this.cube = new THREE.Mesh(this.geometry, this.material);
		this.scene.add(this.cube);
		this.camera.position.z = 5;
	}

	get$Canvas() {
		return this.$canvas;
	}

	render() {
		this.cube.rotation.x += 0.1;
		this.cube.rotation.y += 0.1;
		this.renderer.render(this.scene, this.camera);
	}

	startDrawing() {
		this.draw = true;
		var render = () => {
			if (this.draw) {
				requestAnimationFrame(render)
			}
			this.render();
		}
		render();
	}

	stopDrawing() {
		this.draw = false;
	}
}

UI.init = function() {
	const hostFiles = '/files';
	$.getJSON(hostFiles, function (data) {
		data.forEach(function (datum) {
			$.getJSON(hostFiles + '/' + datum + '.json', function (obj) {
				var alt = new UI.Alternative(obj);
				UI.AltList[alt.uid]=alt;
			});
		});
	});

	socket.on('file created', function (msg) {
		console.log("file created");
		$.getJSON(hostFiles + '/' + msg + '.json', function (data) {
				var alt = new UI.Alternative(data);
				UI.AltList[alt.uid] = alt;
		});
	});

	$('#send-to-program').click(function () {
		sendJSON('kernel', UI.Selection);
	});
}

const MIN_STATE = 'min';
const MAX_STATE = 'max';

UI.Alternative = function(alt){
	this.uid = alt.uid;
	this.cad_file = alt.cad_file;
	this.image = alt.image;
	this.params = alt.params;
	this.Output = alt.Output;

	this.state = MAX_STATE;

	this.initSelf();
}

UI.Alternative.prototype.initSelf = function () {

	var isImage = true;

	var container = document.createElement('div');
	var $container = $(container);
	$container.attr('id', `alt-${this.uid}`);
	$container.addClass('alt ui-widget-content');

	$('body').append(container);

	var canvas = document.createElement('canvas');
	var $canvas = $(canvas);

	var cadCanvas = new CADCanvas();

	var a = this.uid;
	$container.dblclick(function(){
		var data = getData(a);
		sendJSON('restore',data);
	});

	var $minButton = $('<button type="button" class="alt-button"><span class="ui-icon ui-icon-arrow-2-se-nw"></span></button>');
	$minButton.state = 'max'; // TODO: let this be its own variable.
	$container.append($minButton);
	$minButton.click(function() {
		// this : DOMElement
		if ($minButton.state === 'max') {
			// console.log('Minimizing.');
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

	var $cadButton = $('<button type="button" class="alt-button"><span class="ui-icon ui-icon-lightbulb"></span></button><br>');
	$container.append($cadButton);
	$cadButton.click(function () {
		if (isImage) {
			$canvas.replaceWith(cadCanvas.get$Canvas());
			cadCanvas.startDrawing();
		} else {
			cadCanvas.stopDrawing();
			cadCanvas.get$Canvas().replaceWith(canvas);
		}

		isImage = !isImage;
	});

	var img = new Image();
	img.onload = function () {
		this.img = img;
		$canvas.attr({ width: 400, height: 400 });
		var ctx = $canvas.get(0).getContext('2d');
		ctx.drawImage(img,0,0,img.width,img.height,0,0,400,400);
		$container.append($canvas);
		var li = $('<ul class="params style="margin:0px; padding:0px;">Input</ul>');
		li.attr({'id':this.uid});
		var list = $container.append(li).find('ul');
		Object.keys(this.params).forEach(key => {
			var str = '<li name='+key+'>' + '\t'+key+" \t:" + this.params[key].toString() + '</li>';
			list.append(str);
			UI.Selection[key]=[];
		})
		var li2 = $('<ul class="output style="margin:0px; padding:0px;">Output</ul>');
		var list2 = $container.append(li2).find('ul');
		if (this.Output) {
			Object.keys(this.Output).forEach(key => {
				var str = '<li name='+key+'>' + '\t'+key+" \t:" + this.Output[key].toString() + '</li>';
				list2.append(str);
			});
		}
		$container.find('ul').selectable({
			filter:'li',
			stop : function(e,ui){
				$('.ui-selected', this).each(function(){
					var altId = $($(this).parent()).attr('id');
					var paramName = $(this).attr('name');
					UI.Selection[paramName].push(UI.AltList[altId]['params'][paramName]);
				});
			},
			unselected : function(e,ui){
				var altId = ($(ui.unselected).parent()).attr('id');
				var paramName = $(ui.unselected).attr('name');
				var index = UI.Selection[paramName].indexOf(UI.AltList[altId]['params'][paramName]);
				UI.Selection[paramName].splice(index, 1);
			}
		});
		$container.draggable({cursor:'move', stack:".alt", containment: "window"});
	}.bind(this);
	img.src = '/files/' + this.image;
}

UI.Alternative.prototype.loadImage = function(uid, source) {}
