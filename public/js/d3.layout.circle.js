d3.layout.circle = function(){

  "use strict";

	var exports = {};
	var d3 = window.d3;

	var pts = [];
	var center = [0, 0],
		radius = 100;

	function circle(data) {
		return circle.points(data);
	}

	circle.points = function(data) {
		if (!arguments.length) return pts;
		var qty = data.length;
		var deg = d3.scale.linear().domain([0, qty]).range([0.0, 360.0]);
		var rad = d3.scale.linear().domain([0, qty]).range([0.0, 6.283185307179586]);
		var i = -1;
		while (++i < qty) {
			var d = data[i]; // if not object, make it so
			d.x = (Math.sin(rad(i)) * radius) + center[0];
			d.y = (Math.cos(rad(i)) * radius) + center[1];
			d.r = -deg(i);
			d.transform = "translate(" + d.x + " " + d.y + ") rotate(" + d.r + ")";
			data[i] = d;
		}
		return data;
	};

	circle.center = function(x,y) {
		if (!arguments.length) return center;
		center = [x,y];
		return circle;
	};

	circle.radius = function(r) {
		if (!arguments.length) return radius;
		radius = r;
		return circle;
	};


	// ---------------------
	//  Public Interface
	// ---------------------
	return circle;

};