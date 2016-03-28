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
	var json_data = {"Foo":{"Bar":"Baz"}};
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
			for (var i=0;i<object.children.length;i++) {
				object.children[i].geometry.computeBoundingSphere();
				cg.add(object.children[i].geometry.boundingSphere.center);
				r=r+object.children[i].geometry.boundingSphere.radius;
			};

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
	$('#layout').click(function(){
		d3.selectAll(".alt").style("color", function(){
  			return "hsl(" + Math.random() * 360 + ",100%,50%)";
		});
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
		$selector.attr("class","selector");
		$container.append($selector);

		$selector.selectable();
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
