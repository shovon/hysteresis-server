var UI = UI || {}
UI.AltList = {};
UI.Selection = {};

const host = 'http://localhost:3100';

// var socket = io('ws://localhost:3100');
var socket = io();
console.log(d3.layout.circle().center(500,500).radius(133));
function sendJSON(filename, payload) {
	socket.emit('send state', {
		filename: filename,
		payload: payload
	});
}

function getData(id){
	var json_data = { "Foo": { "Bar": "Baz" } };
	json_data['params'] = UI.AltList[id]['params'];
	return json_data;
}

class CADCanvas {
	constructor(modelFile) {
		this.canvas = document.createElement('canvas');
		this.$canvas = $(this.canvas);
		this.renderer = new THREE.WebGLRenderer({  canvas: this.canvas });
		this.renderer.setClearColor( 0xdddddd, 1 );
		this.renderer.setSize(400, 400);

		this.draw = false;

		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
		this.controls = new THREE.OrbitControls( this.camera, this.canvas );

		this.geometry = new THREE.BoxGeometry( 1, 1, 1 );
		this.material = new THREE.MeshLambertMaterial({ color: 0x00FF00 });

		// this.cube = new THREE.Mesh(this.geometry, this.material);
		// this.scene.add(this.cube);

		var loader = new THREE.OBJLoader();
		loader.load(`/files/${modelFile}`, (object) => {

			var cg = new THREE.Vector3(0,0,0);
			var r = 0;
			for (var i = 0; i < object.children.length; i++) {
				object.children[i].geometry.computeBoundingSphere();
				cg.add(object.children[i].geometry.boundingSphere.center);
				r = r + object.children[i].geometry.boundingSphere.radius;
			}

			cg.divideScalar(object.children.length*-1);
			object.position.add(cg);
			this.camera.position.set(object.position.x, object.position.y, object.position.z-100);
			this.camera.lookAt(object.position);
			this.scene.add(object);
		});

		this.ambientLight = new THREE.AmbientLight(0x9c9c9c);
		this.scene.add(this.ambientLight);

		this.directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.5);
		this.directionalLight.position.set(-0.5, 1, -1);
		this.directionalLight2 = new THREE.DirectionalLight(0xFFFFFF, 0.5);
		this.directionalLight2.position.set(0.5, 1, 1);
		this.scene.add(this.directionalLight);
		this.scene.add(this.directionalLight2);
	}

	get$Canvas() {
		return this.$canvas;
	}

	render() {
		this.controls.update();

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
		async.each(data, function (datum, callback) {
			$.getJSON(hostFiles + '/' + datum + '.json', function (obj) {
				var alt = new UI.Alternative(obj);
				UI.AltList[alt.uid] = alt;
				callback();
			});
		}, function () {
				Object.keys(UI.AltList).forEach(key => {
					UI.AltList[key].setAbsolute(true);
				});
				console.log('Good');
		});
	});

	socket.on('file created', function (msg) {
		console.log("file created");
		$.getJSON(hostFiles + '/' + msg + '.json', function (data) {
				var alt = new UI.Alternative(data);
				alt.setAbsolute();
				UI.AltList[alt.uid] = alt;
		});
	});

	socket.on('file deleted', function (msg) {
		// TODO: actually go ahead and delete the alternative.
		console.log('file deleted');
	});

	$('#send-to-program').click(function () {
		sendJSON('kernel', UI.Selection);
	});

	$('#btn-layout').click(function(){
		var boundingRect = {
			"x": [],
			"y":[],
			"width": [],
			"height":[]
		};
		var checked = [];
		$("input:checked").each(function(){
			var altDiv = $(this).parent().parent();
			checked.push(altDiv)
			var bounds = altDiv[0].getBoundingClientRect();
			boundingRect["x"].push(bounds.left);
			boundingRect["y"].push(bounds.top);
			boundingRect["width"].push(bounds.left+bounds.width);
			boundingRect["height"].push(bounds.top+bounds.height);
		});

		boundingRect["x"].sort(function(a, b){return a-b});
		boundingRect["y"].sort(function(a, b){return a-b});
		boundingRect["width"].sort(function(a, b){return b-a});
		boundingRect["height"].sort(function(a, b){return b-a});

		var centerX = (boundingRect["x"][0] + boundingRect["width"][0])/2;
		var centerY = (boundingRect["y"][0] + boundingRect["height"][0])/2;
		var radius = (Math.sqrt(Math.pow(boundingRect["width"][0] - boundingRect["x"][0],2) + Math.pow(boundingRect["height"][0] - boundingRect["y"][0],2)))/3;

		var data = d3.range(checked.length).map(function(d,i){ return {};});
		var layoutfn = d3.layout.circle().center(centerX,centerY).radius(radius);
		var pts = layoutfn(data);
		console.log(pts);
		for(var i=0; i<checked.length;i++){
			$(checked[i]).css({
				position : "absolute",
				top : pts[i].y,
				left : pts[i].x				
			});
		}
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

UI.Alternative.prototype.setAbsolute = function (wait) {
	if (wait) {
		setTimeout(() => {
			const position = this.$container.position();
			setTimeout(() => {
				this.$container.css({
					position: 'absolute',
					top: position.top,
					left: position.left
				});
			}, 16);
		}, 500);
	} else {
		const alts = Object.keys(UI.AltList).map(key => UI.AltList[key]);
		const width = alts.reduce((prev, curr) => {
			const newWidth = curr.getLeft() + curr.getWidth()
			if (prev < newWidth) {
				return newWidth;
			}
			return prev;
		}, alts[0].getWidth() + alts[0].getLeft());
		const height = alts.reduce((prev, curr) => {
			const newHeight = curr.getTop() + curr.getHeight();
			if (prev < newHeight) {
				return newHeight;
			}
			return prev;
		}, alts[0].getHeight() + alts[0].getTop());
		if (width + alts[0].getWidth() > $(window).width()) {
			this.$container.css({
				position: 'absolute',
				top: (height).toString() + 'px',
				left: 0
			})
		} else {
			console.log(width, $(window).width() + alts[0].getWidth());
			console.log('Not too narrow');
			this.$container.css({
				position: 'absolute',
				top: 0,
				left: (width).toString() + 'px'
			})
		}
	}
};

UI.Alternative.prototype.getTop = function () {
	return this.$container.position().top;
}

UI.Alternative.prototype.getLeft = function () {
	return this.$container.position().left;
}

UI.Alternative.prototype.getWidth = function () {
	return this.$container.outerWidth(true);
};

UI.Alternative.prototype.getHeight = function () {
	return this.$container.outerHeight(true);
}

UI.Alternative.prototype.initSelf = function () {

	var isImage = true;

	var container = document.createElement('div');
	var $container = $(container);
	this.$container = $container;
	$container.attr('id', `alt-${this.uid}`);
	$container.addClass('alt ui-widget-content');

	$('#workspace').append($container);

	// position = {
	// 	"top": Math.random()*$(window).innerHeight(),
	// 	"left": Math.random()*$(window).innerWidth()
	// 	}
	// $container.css("top", position.top);
	// $container.css("left", position.left);
	// // position = $container.position()
	// // $container.css("position","absolute");
	// // $container.css("top",position.top);
	// // $container.css("left",position.left);

	var canvas = document.createElement('canvas');
	var $canvas = $(canvas);

	var cadCanvas = new CADCanvas(this.cad_file);

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
		var li = $('<ul class="params">Input</ul>');
		li.attr({'id':this.uid});
		var list = $container.append(li).find('ul');
		Object.keys(this.params).forEach(key => {
			var str = '<li name='+key+'>' + '\t'+key+" \t:" + this.params[key].toString() + '</li>';
			list.append(str);
			UI.Selection[key]=[];
		})
		var li2 = $('<ul class="output">Output</ul>');
		var list2 = $container.append(li2).find('ul.output');
		if (this.Output) {
			Object.keys(this.Output).forEach(key => {
				var str = '<li name='+key+'>' + '\t'+key+" \t:" + this.Output[key].toString() + '</li>';
				list2.append(str);
			});
		}
		$container.find('ul.params').selectable({
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
			},
		});
		$container.draggable({
			cursor:'move', stack:".alt", containment: "window",
			cancel: 'canvas'
		});
		var selector = document.createElement('div');
		$selector = $(selector);
		$selector.append('<input type="checkbox" name="myCheckbox" />');
		$selector.attr("class","selector");
		$container.append($selector);

		// $selector.selectable({
		// 	filter: "div",
		// 	cancel: "ul, li, canvas",
		// 	stop : function(e,ui){
		// 		$(this).css("background-color", "#7CADAD");
		// 	},
		// 	tolerance: "touch"
		// });
		// $container.selectable({
		// 	filter: "canvas",
		// 	appendTo: "body",
		// 	cancel : "ul, li",
		// 	stop : function(e,ui){
		// 		$('.ui-selected', this).each(function(){
		// 			$(this).parent().css("background-color","#7CADAD");
		// 		});
		// 	}
		// });
	}.bind(this);
	img.src = '/files/' + this.image;

}

UI.Alternative.prototype.loadImage = function(uid, source) {}
